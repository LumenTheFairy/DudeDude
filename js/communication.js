dd.scripts.communication = async function(game, secrets) {
communication = {};

// TIMING
const now = ( () => (new Date()).getTime() );
const HEARTBEAT_TIME = 2400;
const HEARTBEATS = 2;
const JOIN_TIMEOUT = 5000;
const LOCK_TIMEOUT = 50;


// LOCKING MECHANISMS

// returns a pair containing:
// -a promise that waits for the named key to change in localstorage
// -a function that can be called to cancel that waiting promise
const waitForKeyChange = function(keyname) {
	let resolver = null;
	const promise = new Promise( function(resolve, reject) {
		resolver = function() {
			window.removeEventListener('storage', test_event);
			resolve();
		};
		const test_event = function(ev) {
			if(ev.key == keyname) {
				resolver();
			}
		};
		window.addEventListener('storage', test_event);      
	});
	return [promise, resolver];
};

//https://balpha.de/2012/03/javascript-concurrency-and-locking-the-html5-localstorage/
//https://www.microsoft.com/en-us/research/uploads/prod/2016/12/A-Fast-Mutual-Exclusion-Algorithm.pdf
//
// runs the critical function with exclusive access to the localstorage indexed by keyname
// if timeout is positive, run the critical code after timeout regardless of safety
// (this is helpful if a process closed while in control of the lock)
communication.run_critical = async function(keyname, critical, timeout) {
	const xkey = "__x__" + keyname;
	const ykey = "__y__" + keyname;
	const my_id = String(game.myid);

	let cur_promise = null;
	let cur_resolver = function() {};

	console.log(localStorage.getItem(ykey));

	let locked = true;
	if( timeout > 0 ) {
		console.log('set timeout: ' + timeout);
		setTimeout( function() {
			if(locked) {
				console.log('__hijack__');
				//hijack the lock
				localStorage.setItem(ykey, my_id);
				//free up any waits
				cur_resolver();
				//leave the lock loop
				locked = false;
			}
		}, timeout);
	}

	console.log(localStorage.getItem(ykey));
	while(locked) {
		// try to get permission to set the lock
		console.log("__x__");
		localStorage.setItem(xkey, my_id);
		console.log(localStorage.getItem(ykey));
		if( localStorage.getItem(ykey) ){
			[cur_promise, cur_resolver] = waitForKeyChange(ykey);
			console.log("__x_lock__");
			await cur_promise;
			continue;
		}
		// try to set the lock
		console.log("__y__");
		localStorage.setItem(ykey, my_id);
		if( localStorage.getItem(xkey) !== my_id ) {
			// wait till either key changes
			let [xchange, cur_resolver] = waitForKeyChange(xkey);
			let [ychange, _] = waitForKeyChange(ykey);
			cur_promise = Promise.race([xchange, ychange]);
			console.log("__y_lock__");
			await cur_promise;
		}
		// see if we actually got the lock
		console.log("__z__");
		if( localStorage.getItem(ykey) !== my_id ){
			[cur_promise, cur_resolver] = waitForKeyChange(ykey);
			console.log("__z_lock__");
			await cur_promise;
			continue;
		}
		locked = false;
	}

	// run critical code
	console.log("__crit__");
	await critical();

	// release lock
	localStorage.setItem(ykey, "");
	console.log("__out__");
};


// COMMUNICATION
const bc = new BroadcastChannel(secrets.channel_name);

// send a message
communication.send = function(message_type, data) {
	bc.postMessage( {
		t: message_type,
		d: data,
		i: game.myid,
		n: now(),
	});
};
communication.send_move =  ( (move) => communication.send('move', move) );
communication.get_state =  ( () => communication.send('get_state', null) );
communication.send_state = ( (state) => communication.send('send_state', state) );
communication.send_join =  ( (start) => communication.send('join', start) );
communication.send_close = ( (id) => communication.send('close', id) );

// what to do on recieive
bc.onmessage = function (ev) {
	console.log('onmessage:');
	console.log(ev.data);
	//todo: sanitize input
	const message_type = ev.data.t;
	const sender = ev.data.i;
	const time = ev.data.n;
	const data = ev.data.d;

	if(message_type === 'move') {
		game.recieive_move(sender, data);
	}

	if(message_type === 'get_state') {
		communication.send_state( game.state );
	}

	if(message_type === 'join') {
		game.add_dude(sender, data);
	}

	if(message_type === 'close') {
		game.remove_dude(data);
		if(data === game.myid) {
			// TODO: kill input and stuff
			console.error("another client disconnected you.");
		}
		close_connection(data);
	}
	if(message_type === 'send_state') {

		if(!join_data.connection_resolvers[sender]) {
			return;
		}

		join_data.connection_resolvers[sender](data, time);
	}
};
window.onbeforeunload = function(e) {
	communication.send_close(game.myid);
	return null;
};


// CONNECTIONS

// these two functions, if used in combination, should be wrapped in a locked critical call,
// using 'c' as the key
const get_connections = function() {
	let connections = localStorage.getItem('c');
	if(connections) {
		return JSON.parse(connections);
	}
	else {
		return {};
	}
};
const write_connections = function(connections) {
	localStorage.setItem('c', JSON.stringify(connections) );
};

const join_connection = async function() {

	const critical = async function() {
		const connections = get_connections();
		connections[game.myid] = now();
		write_connections(connections);
		console.log("added connection: " + game.myid);
	};
	console.log("try connection: " + game.myid);
	await communication.run_critical('c', critical, LOCK_TIMEOUT);
	console.log("done connection: " + game.myid);

	//TODO: ????
	//game.get_Start...?
	communication.send_join(null);

	//setInterval(heartbeat, CONNECTION_TIMEOUT / 3);
};

const close_connection = async function(id) {

	id = String(id);

	const critical = async function() {
		const connections = get_connections();
		if(id in connections) {
			const new_connections = {};
			for(let cid in connections) {
				if(cid !== id) {
					new_connections[cid] = connections[cid];
				}
			}
			write_connections(new_connections);
		}
	};

	await communication.run_critical('c', critical, LOCK_TIMEOUT);
};

const join_data = {
	connection_promises: [],
	connection_resolvers: {},
	latest_time: 0,
	best_state: {},
	maxid: 0,
};

// waits for the get state from the given id
// returns a pair
// -a promise that resolves on its own if no state is given in time
// -a function that should be called if the state is actually recived
const waitForState = function(id) {

	let resolver = null;

	const promise = new Promise( function(resolve, reject) {

		// TODO: ?????
		const timeout_id = setTimeout( function() {
			console.log('join timeout: ' + id);
			communication.send_close(id);
			close_connection(id).then( resolve );
		}, JOIN_TIMEOUT);

		resolver = function(state, time) {
			console.log('join recived: ' + id);
			clearTimeout( timeout_id );

			if(time > join_data.latest_time) {
				join_data.latest_time = time;
				join_data.best_state = state;
			}

			resolve();
		};
	});

  	return [promise, resolver];
};

// actually start the process of trying to join
communication.get_state();
const connections = get_connections();
const connection_time = now();

for(let id in connections) {
	const timestamp = connections[id];

	// check if this connection is valid anymore
	if(connection_time - timestamp < HEARTBEATS * HEARTBEAT_TIME) {
		// update maxid
		join_data.maxid = Math.max(join_data.maxid, id);

		// construct promise
		console.log('join start: ' + id);
		const [ promise, resolver ] = waitForState(id);
		join_data.connection_promises.push(promise);
		join_data.connection_resolvers[id] = resolver;
	}
	else {
		//TODO: ????
		console.log('hearbeat timeout: ' + id);
		communication.send_close(id);
        await close_connection(id);
	}
}
game.myid = join_data.maxid + 1;

console.log('me: ' + game.myid);

console.log('waiting all');
await Promise.all(join_data.connection_promises);
console.log('all done');

//todo: set best state
await join_connection();

return communication;
};