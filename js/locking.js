dd.scripts.locking = async function() {
const locking = {};

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
locking.run_critical = async function(myid, keyname, critical, timeout) {
	const xkey = "__x__" + keyname;
	const ykey = "__y__" + keyname;
	const my_id = String(myid);

	let cur_promise = null;
	let cur_resolver = function() {};

	//console.log(localStorage.getItem(ykey));

	let locked = true;
	if( timeout > 0 ) {
		//console.log('set timeout: ' + timeout);
		setTimeout( function() {
			if(locked) {
				//console.log('__hijack__');
				//hijack the lock
				localStorage.setItem(ykey, my_id);
				//free up any waits
				cur_resolver();
				//leave the lock loop
				locked = false;
			}
		}, timeout);
	}

	//console.log(localStorage.getItem(ykey));
	while(locked) {
		// try to get permission to set the lock
		//console.log("__x__");
		localStorage.setItem(xkey, my_id);
		//console.log(localStorage.getItem(ykey));
		if( localStorage.getItem(ykey) ){
			[cur_promise, cur_resolver] = waitForKeyChange(ykey);
			//console.log("__x_lock__");
			await cur_promise;
			continue;
		}
		// try to set the lock
		//console.log("__y__");
		localStorage.setItem(ykey, my_id);
		if( localStorage.getItem(xkey) !== my_id ) {
			// wait till either key changes
			let [xchange, cur_resolver] = waitForKeyChange(xkey);
			let [ychange, _] = waitForKeyChange(ykey);
			cur_promise = Promise.race([xchange, ychange]);
			//console.log("__y_lock__");
			await cur_promise;
		}
		// see if we actually got the lock
		//console.log("__z__");
		if( localStorage.getItem(ykey) !== my_id ){
			[cur_promise, cur_resolver] = waitForKeyChange(ykey);
			//console.log("__z_lock__");
			await cur_promise;
			continue;
		}
		locked = false;
	}

	// run critical code
	//console.log("__crit__");
	await critical();

	// release lock
	localStorage.setItem(ykey, "");
	//console.log("__out__");
};


return locking;
};