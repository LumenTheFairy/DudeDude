// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.communication = async function(game, secrets, locking) {
const communication = {};

// TIMING
const now = ( () => (new Date()).getTime() );
const JOIN_TIMEOUT = 1200;
const LOCK_TIMEOUT = 50;


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
	//console.log('onmessage:');
	//console.log(ev.data);
	//todo: sanitize input
	const message_type = ev.data.t;
	const sender = ev.data.i;
	const time = ev.data.n;
	const data = ev.data.d;

	if(message_type === 'move') {
		game.recieive_move(sender, data);
	}

	if(message_type === 'get_state') {
		communication.send_state( game.dudes );
	}

	if(message_type === 'join') {
		game.add_dude(sender, data);
	}

	if(message_type === 'close') {

		if(data === game.myid) {
			game.end("Disconnected");
		}
		else {
			game.remove_dude(data);
		}
		communication.close_connection(data);
	}
	if(message_type === 'send_state') {

		if(!join_data.connection_resolvers[sender]) {
			return;
		}

		join_data.connection_resolvers[sender](data, time);
	}
};
window.onbeforeunload = function(e) {
	//small hack to clean up the connections when the last connection is closed
	//it isn't locked because nothing async can reliably finish in the unload callback
	if(communication.get_connections().length === 1) {
		write_connections([]);
	}
	communication.send_close(game.myid);
	game.end('');
	return null;
};

//ignore all following messages
communication.end = function() {
	bc.onmessage = function() {};
	window.onbeforeunload = function() {};
};


// CONNECTIONS

// these two functions, if used in combination, should be wrapped in a locked critical call,
// using 'c' as the key
communication.get_connections = function() {
	let connections = localStorage.getItem('c');
	if(connections) {
		return JSON.parse(connections);
	}
	else {
		return [];
	}
};
const write_connections = function(connections) {
	localStorage.setItem('c', JSON.stringify(connections) );
};

const join_connection = async function(dude) {

	const critical = async function() {
		const connections = communication.get_connections();
		connections.push(game.myid);
		write_connections(connections);
		//console.log("added connection: " + game.myid);
	};
	//console.log("try connection: " + game.myid);
	await locking.run_critical(game.myid, 'c', critical, LOCK_TIMEOUT);
	//console.log("done connection: " + game.myid);
	await game.update_stats(communication);
	communication.send_join(dude);
};

communication.close_connection = async function(id) {

	const critical = async function() {
		const connections = communication.get_connections();
		write_connections( connections.filter( (cid) => cid !== id ) );
	};

	await locking.run_critical(game.myid, 'c', critical, LOCK_TIMEOUT);
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

		const timeout_id = setTimeout( function() {
			//console.log('join timeout: ' + id);
			communication.send_close(id);
			communication.close_connection(id).then( resolve );
		}, JOIN_TIMEOUT);

		resolver = function(state, time) {
			//console.log('join recived: ' + id);
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
const connections = communication.get_connections();
const connection_time = now();

connections.forEach( function(id) {
	// update maxid
	join_data.maxid = Math.max(join_data.maxid, id);

	// construct promise
	//console.log('join start: ' + id);
	const [ promise, resolver ] = waitForState(id);
	join_data.connection_promises.push(promise);
	join_data.connection_resolvers[id] = resolver;
});
game.myid = join_data.maxid + 1;

//console.log('me: ' + game.myid);

//console.log('waiting all');
await Promise.all(join_data.connection_promises);
//console.log('all done');

game.dudes = join_data.best_state;
const dude = await game.start_dude();
if(dude) {
	await join_connection(dude);
}
else {
	game.end('No space! (Try moving dudes away from the start.)')
	return null;
}

return communication;
};