// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.control = function() {
const control = {};

//control names
control.control_keys = {
	0: [39, 68, 76, 102],
	1: [37, 65, 74, 100],
};
control.control_names = {
	0: 'R',
	1: 'L',
}

// whatever is using the controls should add a function to this list
control.effects = [];

const keydown_event = function(ev) {
	for(let dir in control.control_keys) {
		if(control.control_keys[dir].includes(ev.keyCode)) {
			control.effects.forEach( f => f(parseInt(dir)) );
		}
	}
};

//attach all of the control handlers
control.initialize = function() {
	window.addEventListener('keydown', keydown_event);
};

return control;
};