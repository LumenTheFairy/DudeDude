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
	1: 'gray',
	2: 'green',
	3: 'brown',
	4: 'red',
	5: 'tan',
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

// convert between 2d array index and 1d array index
world.xy_to_loc = function(x, y) {
	return x + y * world.width;
};
world.loc_to_xy = function(loc) {
	return [loc % world.width, Math.floor(loc / world.width)];
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
			name: r.name,
		}));
	}
	if( layer.name === 'events' ) {
		world.linkloc_to_name = {};
		world.name_to_linkloc = {};
		world.link_names = new Set();
		world.exits = new Set();
		layer.objects.forEach( function(ev) {
			if(ev.type === 'Start') {
				world.start = {
					x: Math.floor( ev.x / tilewidth ),
					w: Math.floor( ev.width / tilewidth ),
					y: Math.floor( ev.y / tileheight ),
					h: Math.floor( ev.height / tileheight ),
				};
			}
			else if(ev.type === 'Link') {
				const loc = world.xy_to_loc(Math.floor( ev.x / tilewidth ), Math.floor( ev.y / tileheight ));
				const name = ev.name;
				world.link_names.add(name);
				world.linkloc_to_name[loc] = name;
				if(name in world.name_to_linkloc) {
					world.name_to_linkloc[name].push( loc );
				}
				else {
					world.name_to_linkloc[name] = [loc];
				}
			}
			else if(ev.type === 'Exit') {
				const loc = world.xy_to_loc(Math.floor( ev.x / tilewidth ), Math.floor( ev.y / tileheight ));
				world.exits.add(loc);
			}
		} );
	}
});

world.name_to_switches = {};
world.name_to_gates = {};
for(let name in world.name_to_linkloc) {
	world.name_to_switches[name] = world.name_to_linkloc[name].filter( (loc) => world.type_names[ world.types[loc] ] === 'switch' );
	world.name_to_gates[name] = world.name_to_linkloc[name].filter( (loc) => world.type_names[ world.types[loc] ] === 'gate' );
}

return world;
};