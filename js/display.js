// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.display = function(game_params) {
//display settings for whatever is being drawn
//a canvas is the window into the display
const display = {
	width: game_params.camera_width * 8,
	height: game_params.camera_height * 8,
	horz_scale: 8,
	vert_scale: 8,
	container: null,
	canvas: null,
	context: null,
};

//these names must match the ids of the dom elements in the html
const DISPLAY_ID = 'display';
const DISPLAY_CONTAINER_ID = 'display-bg';

//sets the canvas and its context
//only call this after the page has loaded
display.update_dom_pointers = function() {
	display.container = document.getElementById(DISPLAY_CONTAINER_ID);
	display.canvas = document.getElementById(DISPLAY_ID);
	display.context = display.canvas.getContext('2d');
};

//update properties and css for html elements to match the display data
display.update_dom_properties = function() {
	//canvas absolute size
	display.canvas.width = display.width;
	display.canvas.height = display.height;
	//use css to scale TODO: will not look good in many browsers
	display.canvas.style['width'] = (display.width * display.horz_scale) + 'px';
	display.canvas.style['height'] = (display.height * display.vert_scale) + 'px';
	//container should be the same size
	display.container.style['width'] = (display.width * display.horz_scale) + 'px';
	display.container.style['height'] = (display.height * display.vert_scale) + 'px';
	//change the grid size for the background
	//https://stackoverflow.com/questions/3540194/how-to-make-a-grid-like-graph-paper-grid-with-just-css
	display.container.style['background-size'] = display.horz_scale + 'px ' + display.vert_scale + 'px';
};

//clears the canvas
display.clear = function() {
	display.context.clearRect(0, 0, display.width, display.height);
};

//sets appropriate properties of relevant dom elements
//
//notice that since these calls interact with dom elements, these dom elements must already exit,
//so make sure to call this after the page has loaded
display.initialize = function() {
	display.update_dom_pointers();
	display.update_dom_properties();
};


return display;
};