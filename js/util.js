// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.util = function() {
let util = {};

//these two functions are used to work with color strings
//colors are expected to be strings with length 7 or 9,
//where the first character is a '#',
//the next 2 characters are the hex value of the red component,
//the next 2 characters are the hex value of the green component,
//and the next 2 characters are the hex value of the blue component.
//The last optional characters are the hex value of the alpha component,
//which, if missing, represents fully opaque (value FF).

//returns an object with (r, g, b, a) values corresponding to the given string
//if the color string is malformed, returns (0, 0, 0, 0)
util.string_to_rgba = function(color) {
	let unknown = {r: 0, g: 0, b: 0, a: 0};
	if(!(typeof color === 'string') || !color) {
		return unknown;
	}
	if((color.length != 7) && (color.length != 9)) {
		return unknown;
	}
	if(color[0] != '#') {
		return unknown;
	}
	let get_component = function(start, end) {
		return parseInt(color.slice(start, end), 16);
	}
	let r = get_component(1,3);
	let g = get_component(3,5);
	let b = get_component(5,7);
	let a = 255;
	if(color.length === 9) {
		a = get_component(7,9);
	}
	return {r: r, g: g, b: b, a: a};
};

//sets the values of a given object using the given parameters,
//or uses the default parameters if none are provided
util.set_parameters = function(obj, parameters, defaults) {
	Object.keys(defaults).forEach( function(p) {
		if(parameters.hasOwnProperty(p)) {
			obj[p] = parameters[p];
		} else {
			obj[p] = defaults[p];
		}
	});
};

return util;
};