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

//returns a string representing the given r, g, b, a values
//the alpha component can be left out
// util.rgba_to_string = function(r, g, b, a=null) {
// 	let retval = '#';
// 	let format_component = function(component) {
// 		return ('00' + component.toString(16)).substr(-2)
// 	}
// 	retval += format_component(r);
// 	retval += format_component(g);
// 	retval += format_component(b);
// 	if(a != null) {
// 		retval += format_component(a);
// 	}
// 	return retval;
// };

// //convert hsv to rgb
// //https://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately
// util.hsv_to_rgb = function(h, s, v) {
//     let r, g, b, i, f, p, q, t;
//     i = Math.floor(h * 6);
//     f = h * 6 - i;
//     p = v * (1 - s);
//     q = v * (1 - f * s);
//     t = v * (1 - (1 - f) * s);
//     switch (i % 6) {
//         case 0: r = v, g = t, b = p; break;
//         case 1: r = q, g = v, b = p; break;
//         case 2: r = p, g = v, b = t; break;
//         case 3: r = p, g = q, b = v; break;
//         case 4: r = t, g = p, b = v; break;
//         case 5: r = v, g = p, b = q; break;
//     }
//     return {
//         r: Math.round(r * 255),
//         g: Math.round(g * 255),
//         b: Math.round(b * 255)
//     };
// }

// //linear interpolation
// util.interp_linear = function(a, b, t) {
// 	return a * (1.0 - t) + b * t;
// }

// //smooth
// util.interp_smooth = function(a, b, t) {
// 	t = t * t * (3 - 2 * t);
// 	return a * (1.0 - t) + b * t;
// }

// //interpolates two color strings, componentwise
// //uses the given interpolation function
// util.interp_colors = function(c1, c2, t, interp=interp_linear) {
// 	//convert color strings to rgba objects
// 	let c1_rgba = util.string_to_rgba(c1);
// 	let c2_rgba = util.string_to_rgba(c2);
// 	//interpolate each component
// 	let result = {};
// 	['r', 'g', 'b', 'a'].forEach( function(component) {
// 		result[component] = Math.round(interp(c1_rgba[component], c2_rgba[component], t));
// 	});
// 	//convert color back to string
// 	if(result.a === 255) {
// 		return util.rgba_to_string(result.r, result.g, result.b);
// 	}
// 	return util.rgba_to_string(result.r, result.g, result.b, result.a);
// }

// //dumb constructers for easier to read code
// util.Point = function(x, y) {
// 	return {x:x, y:y};
// };
// util.Rect = function(x, y, w, h) {
// 	return {x:x, y:y, w:w, h:h};
// }

// //general point/shape interaction code
// //a point has an x and y property
// //a rect has an x, y, w, and h property

// //check if a rect contains a point
// //returns true if it does, false otherwise
// util.point_in_rect = function(point, rect) {
// 	return rect.x <= point.x && point.x < rect.x + rect.w &&
// 	       rect.y <= point.y && point.y < rect.y + rect.h;
// }


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