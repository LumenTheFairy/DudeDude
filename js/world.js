// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.world = function(world_data) {
const world = {};

// give names to data values in the non-visual layers
world.type_names = {
	0: 'empty',
	1: 'solid',
	2: 'switch',
	3: 'gate',
}
world.color_names = {
	0: 'white',
	1: 'red',
	2: 'green',
}
// get the width and height
world.width = world_data.width;
world.height = world_data.height;
const tilewidth = world_data.tilewidth;
const tileheight = world_data.tileheight;
// build the ranges for the tileset data values
const tile_ranges = world_data.tilesets.map( (d) => d.firstgid ).sort();
const get_range_base = function(n) {
	let base = 0;
	for(let i = 0; i < tile_ranges.length; i++) {
		if(tile_ranges[i] > n) {
			break;
		}
		base = tile_ranges[i];
	}
	return base;
};
// add the tile layers to the world
world_data.layers.forEach( function(layer) {
	if( ['visuals', 'types', 'colors'].includes(layer.name) ) {
		world[layer.name] = layer.data.map( (n) => n - get_range_base(n) );
	}
	if( layer.name === 'rooms' ) {
		world.rooms = layer.objects.map( (r) => ({
			x: Math.floor( r.x / tilewidth ),
			w: Math.floor( r.width / tilewidth ),
			y: Math.floor( r.y / tileheight ),
			h: Math.floor( r.height / tileheight ),
		}));
	}
});

// convert between 2d array index and 1d array index
world.xy_to_loc = function(x, y) {
	return x + y * world.width;
};
world.loc_to_xy = function(loc) {
	return [loc % world.width, Math.floor(loc / world.width)];
};

return world;
};