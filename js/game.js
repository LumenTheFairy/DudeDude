// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.game = function(display, control, world, tile_sheet, get_color) {
const game = {};

//dependencies
const TileSheet = tile_sheet.TileSheet;
const gc = get_color.get;
const cn = control.control_names;

//game data
game.tileset_params = null
game.game_params = null
game.tiles = null

//game state
game.state = {
	dude: {
		x: 4,
		y: 3,
	},
};

game.visual_layer = document.createElement("canvas");

//sets the tileset params pointer to the loaded tileset parameters resource
game.set_tileset_params = function(tileset_params) {
	game.tileset_params = tileset_params;
};
//sets the game params pointer to the loaded game parameters resource
game.set_game_params = function(game_params) {
	game.game_params = game_params;
};
//sets the game params pointer to the loaded game parameters resource
game.hook_communication = function(communication) {
	game.send = communication.send;
};

//set up the tileset
game.initialize_tileset = function(image_data) {
	//process the tile sheet image data
	game.tiles = new TileSheet(image_data, game.tileset_params.transparent_colors, game.tileset_params.tile_width, game.tileset_params.tile_height);

	//draw background layer
	game.visual_layer.width = world.width * game.tiles.tile_width;
	game.visual_layer.height = world.height * game.tiles.tile_height;
	const context = game.visual_layer.getContext("2d");
	for(let loc = 0; loc < world.width * world.height; loc++) {
		const dest_x = (loc % world.width) * game.tiles.tile_width;
		const dest_y = Math.floor(loc / world.width) * game.tiles.tile_height;
		const tile = world.visuals[loc];
		const color = gc( world.color_names[ world.colors[loc] ] )
		game.tiles.draw_tile(context, tile, dest_x, dest_y, color);
	}

	game.render();
};

const camera_offset = function(x, y) {
	//find which room the dude is in
	let r = 0;
	let room = null;
	for( ; r < world.rooms.length; r++) {
		const cur_room = world.rooms[r];
		if( cur_room.x <= x && x < cur_room.x + cur_room.w &&
			cur_room.y <= y && y < cur_room.y + cur_room.h) {
			room = cur_room;
			break;
		}
	}

	//center the camera on the dude
	offset_x = x - Math.floor( game.game_params.camera_width / 2 );
	offset_y = y - Math.floor( game.game_params.camera_height / 2 );
	//clamp offset into the room
	if(room) {
		offset_x = Math.max( room.x, Math.min(offset_x, room.x + room.w - game.game_params.camera_width) );
		offset_y = Math.max( room.y, Math.min(offset_y, room.y + room.h - game.game_params.camera_height) );
	}
	return [offset_x, offset_y];
};

game.render = function() {
	const t = performance.now();
	display.clear();
	// draw the game world
	// for(let y = 0; y < world.height; y++) {
	// 	for(let x = 0; x < world.width; x++) {
	const [offset_x, offset_y] = camera_offset(game.state.dude.x, game.state.dude.y);
	// for(let y = 0; y < game.game_params.camera_height; y++) {
	// 	for(let x = 0; x < game.game_params.camera_width; x++) {
	// 		const dest_x = x * game.tiles.tile_width;
	// 		const dest_y = y * game.tiles.tile_height;
	// 		const loc = world.xy_to_loc(x + offset_x, y + offset_y);
	// 		const tile = world.visuals[loc];
	// 		const color = gc( world.color_names[ world.colors[loc] ] )
	// 		game.tiles.draw_tile(display.context, tile, dest_x, dest_y, color);
	// 	}
	// }
	display.context.drawImage(game.visual_layer,
		offset_x * game.tiles.tile_width, offset_y * game.tiles.tile_height,
		game.game_params.camera_width * game.tiles.tile_width, game.game_params.camera_height * game.tiles.tile_height,
		0, 0,
		game.game_params.camera_width * game.tiles.tile_width, game.game_params.camera_height * game.tiles.tile_height);
	// draw the dude
	const dest_x = (game.state.dude.x - offset_x) * game.tiles.tile_width;
	const dest_y = (game.state.dude.y - offset_y) * game.tiles.tile_height;
	const tile = game.tileset_params.dude_tile_x + game.tileset_params.dude_tile_y * game.tiles.tile_width;
	game.tiles.draw_tile(display.context, tile, dest_x, dest_y, gc('dude'));

	console.log( performance.now() - t );
};

// this is what happens when you press a direction
on_button = function(dir) {
	move(dir)
	game.render();
};
control.effects.push(on_button);

const is_solid = function(x, y) {
	const loc = world.xy_to_loc(x, y);
	const tile_type = world.type_names[ world.types[loc] ];
	if(tile_type === 'solid') {
		return true;
	}
	if(tile_type === 'gate') {
		return true;
	}
	return false;
};

const horz_dest = function(x, y, dir) {
	if(cn[dir] === 'R') {
		return [x + 1, y];
	}
	if(cn[dir] === 'L') {
		return [x - 1, y];
	}
};

const climb_dest = function(x, y, dir) {
	if(cn[dir] === 'R') {
		return [x + 1, y - 1];
	}
	if(cn[dir] === 'L') {
		return [x - 1, y - 1];
	}
};

const fall = function() {
	while(!is_solid(game.state.dude.x, game.state.dude.y + 1) ) {
		game.state.dude.y += 1;
	}
};

const move = function(dir) {
	const x = game.state.dude.x;
	const y = game.state.dude.y;

	const [horz_x, horz_y] = horz_dest(x, y, dir);
	if( !is_solid(horz_x, horz_y) ) {
		[game.state.dude.x, game.state.dude.y] = [horz_x, horz_y];
	}
	else {
		const [climb_x, climb_y] = climb_dest(x, y, dir);
		if( !is_solid(climb_x, climb_y) ) {
			[game.state.dude.x, game.state.dude.y] = [climb_x, climb_y];
		}
	}

	fall();
};

game.recieive_move = function(id, move_data) {
	console.log('move! ' + id);
	console.log(move_data);
};

game.add_dude = function(id, start) {
	console.log('dude! ' + id);
	console.log(start);
};

game.remove_dude = function(id) {
	console.log('gone! ' + id);
};

return game;
};