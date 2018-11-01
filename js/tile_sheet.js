// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.tile_sheet = function(util) {
const tile_sheet = {};

//dependencies, note that we are picking specific functions
const string_to_rgba = util.string_to_rgba;

//constructor for a TileSheet
//this constructor changes the pixels of the image data that match a color in transparent_colors to be actually transparent
//  image_data: ImageData object containing the raw loaded tile sheet. This function will mutate this object
//  transparent_colors: array of color strings that should be treated as transparent
//  tile_width: width of each tile
//  tile_height: height of each tile
//throws a TypeError if:
//  image_data is not actually an ImageData object
//  transparent_colors is not actually an Array
//  tile_width or tile_height are non-positive
tile_sheet.TileSheet = function(image_data, transparent_colors, tile_width, tile_height) {

	//check parameters
	if(! (image_data instanceof ImageData) )  {
		throw TypeError('Cannot construct TileSheet: image_data must be an instance of ImageData');
	}
	if(! (transparent_colors instanceof Array) )  {
		throw TypeError('Cannot construct TileSheet: transparent_colors must be an instance of Array');
	}
	if(typeof(tile_width) != 'number' || tile_width <= 0)  {
		throw TypeError('Cannot construct TileSheet: tile_width must be a positive number');
	}
	if(typeof(tile_height) != 'number' || tile_height <= 0)  {
		throw TypeError('Cannot construct TileSheet: tile_height must be a positive number');
	}


	//copy in a pointer to the image data
	this.image_data = image_data;
	//will hold ImageData objects for each color the tiles have been drawn in
	this.color_cache = new Map();


	//determine and store widths and heights

	//full dimensions of the image itself in pixels
	this.width_in_pixels = image_data.width;
	this.height_in_pixels = image_data.height;
	//dimensions of a single tile in pixels
	this.tile_width = tile_width;
	this.tile_height = tile_height;
	//dimensions of the tilesheet in tiles
	this.width_in_tiles = Math.trunc(this.width_in_pixels / this.tile_width);
	this.height_in_tiles = Math.trunc(this.height_in_pixels / this.tile_height);


	//filter the image to make the pixels we want transparent actually transparent
	//note that ideally, this would be done to the image once before even uploading it so the image data would be good as loaded
	//but this gives us an example of a filter over image data, and gives an excuse to run a process on the data after it's loaded

	//get the data pointer
	const data = image_data.data;

	//remove grid lines and background, replacing them with transparent pixels
	const transparent_rgba = transparent_colors.map(string_to_rgba);
	let pixel = 0;
	for ( ; pixel < image_data.width * image_data.height; pixel++) {
		const offset = pixel * 4;
		const r = data[offset + 0];
		const g = data[offset + 1];
		const b = data[offset + 2];
		//make pixels matching the grid or background color transparent
		if(transparent_rgba.some( function(c) {
			return r === c.r && g === c.g && b === c.b;
		}) ){
			data[offset + 0] = 0;
			data[offset + 1] = 0;
			data[offset + 2] = 0;
			data[offset + 3] = 0;
		}
	};
};

//creates and adds a transformed copy of the image data into the color_cache for the given color
//the transformed copy will have all non-transparent pixels be the given color
//  context: a RenderingContext that can copy the image data
//  color: a color string indicating which color to change the non-transparent pixels to
//Note that this function will be called any time a new color is attempted to be drawn,
// so the any color will always be available before it's needed (perhaps immediately before it is needed).
// However, it may be a good idea to call this function during startup for all possible colors that may be used
// in order to get the computation out of the way.
//Also note that this method of recoloring tiles is pretty horribly space consumptive,
// so it is really only viable for a planned small set of colors.
// Doing dynamic recoloring would seem to require a webgl context, but for the sake of simplicity, we're running with this.
tile_sheet.TileSheet.prototype.add_color = function(context, color) {
	//get color components
	const c = string_to_rgba(color);
	//create new image data
	const new_color = context.createImageData(this.image_data);
	//loop through the pixels and set each filled pixel in the original to a colored pixel in the new image
	const data = new_color.data;
	let pixel = 0;
	for ( ; pixel < this.width_in_pixels * this.height_in_pixels; pixel++) {
		offset = pixel * 4;
		//check if it is not transparent
		if(this.image_data.data[4*pixel + 3] !== 0) {
			//set the color
			data[offset + 0] = c.r;
			data[offset + 1] = c.g;
			data[offset + 2] = c.b;
			data[offset + 3] = c.a;
		}
	};
	//add this color to the cache
	this.color_cache.set(color, new_color);
};

//draws a single tile from the tilesheet
//  context: a RenderingContext that can draw image data
//  color: a color string indicating which color to use to draw the tile
//  tile_loc: the (1d) location of the tile in the tilesheet
//  dest_x: the x coordinate (in pixels) of the location to draw the tile
//  dest_y: the y coordinate (in pixels) of the location to draw the tile
//  should_replace: true to replace the current tile, false or undefined to draw over it
//throws a TypeError if tile_x or tile_y are not in bounds
tile_sheet.TileSheet.prototype.draw_tile = function(context, tile_loc, dest_x, dest_y, color, should_replace) {

	const tile_x = tile_loc % this.width_in_tiles;
	const tile_y = Math.floor(tile_loc / this.width_in_tiles);

	//check that the requested tile is in bounds
	if(tile_x < 0 || tile_x >= this.width_in_pixels) {
		throw TypeError('Cannot draw tile: tile_x = ' + tile_x + ' is out of the bounds of the TileSheet.')
	}
	if(tile_y < 0 || tile_y >= this.height_in_pixels) {
		throw TypeError('Cannot draw tile: tile_y = ' + tile_y + ' is out of the bounds of the TileSheet.')
	}

	//determine tile clip bounds
	const clip_x = tile_x * this.tile_width;
	const clip_y = tile_y * this.tile_height;
	const clip_w = this.tile_width;
	const clip_h = this.tile_height;
	//if the color does not exist, compute it
	if(!this.color_cache.has(color)) {
		this.add_color(context, color);
	}

	if(should_replace) {
		context.putImageData(this.color_cache.get(color), dest_x-clip_x, dest_y-clip_y, clip_x, clip_y, clip_w, clip_h);
	}
	else {
		//draw the tile on a new mini canvas
		const tile = document.createElement("canvas");
		tile.width = clip_w;
		tile.height = clip_h;
		tile.getContext("2d").putImageData(this.color_cache.get(color), -clip_x, -clip_y, clip_x, clip_y, clip_w, clip_h);
		//copy to the given context
		context.drawImage(tile, dest_x, dest_y);
	}

};

return tile_sheet;
};