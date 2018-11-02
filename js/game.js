// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.game = function(display, control, world, tile_sheet, get_color, secrets) {
const game = {
	can_start: false,
};

//dependencies
const TileSheet = tile_sheet.TileSheet;
const gc = get_color.get;
const cn = control.control_names;

//game data
game.tileset_params = null
game.game_params = null
game.tiles = null

//game state
game.dudes = {};
game.flags = new Set();

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
	if(communication) {
		game.send_move = communication.send_move;
		game.can_start = true;
	}
};
//applies links saved in local storage
game.remember_flags = async function () {
	const good_names = await secrets.get_flags('links');
	game.flags = new Set(good_names);
	good_names.forEach( (name) => game.apply_link(name) );
}

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
		game.tiles.draw_tile(context, tile, dest_x, dest_y, color, true);
	}
};

game.start = function() {
	if(game.can_start) {
		control.initialize();
		game.render();
	}
	else {
		//todo: something?
	}
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
	//const t = performance.now();
	display.clear();
	// draw the game world
	// for(let y = 0; y < world.height; y++) {
	// 	for(let x = 0; x < world.width; x++) {
	const [offset_x, offset_y] = camera_offset(game.dudes[game.myid].x, game.dudes[game.myid].y);
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
	// draw the dudes
	for(let id in game.dudes) {
		const dude = game.dudes[id];
		const dest_x = (dude.x - offset_x) * game.tiles.tile_width;
		const dest_y = (dude.y - offset_y) * game.tiles.tile_height;

		const loc = world.xy_to_loc(dude.x, dude.y);
		const tile_type = world.type_names[ world.types[loc] ];
		if(tile_type === 'switch') {
			const tile = world.visuals[loc] + 1;
			const color = gc( world.color_names[ world.colors[loc] ] )
			game.tiles.draw_tile(display.context, tile, dest_x, dest_y, color, true);
		}

		const tile = game.tileset_params.dude_tile_x + game.tileset_params.dude_tile_y * game.tiles.tile_width;
		const color = id === String(game.myid) ? gc('red') : gc('gray');
		game.tiles.draw_tile(display.context, tile, dest_x, dest_y, color);
	}

	//console.log( performance.now() - t );
};

// this is what happens when you press a direction
on_button = function(dir) {
	move(dir)
	game.render();
};
control.effects.push(on_button);

game.apply_link = function(name) {
	game.flags.add(name);
	const context = game.visual_layer.getContext("2d");
	world.name_to_linkloc[name].forEach( function(loc) {
		world.types[loc] = 0; //empty

		const dest_x = (loc % world.width) * game.tiles.tile_width;
		const dest_y = Math.floor(loc / world.width) * game.tiles.tile_height;
		const tile = world.visuals[loc] + 1;
		const color = gc( world.color_names[ world.colors[loc] ] )

		game.tiles.draw_tile(context, tile, dest_x, dest_y, color, true);
	});
};

const is_solid = function(x, y) {
	const loc = world.xy_to_loc(x, y);
	const tile_type = world.type_names[ world.types[loc] ];
	if(tile_type === 'solid') {
		return true;
	}
	if(tile_type === 'gate') {
		return true;
	}
	for(let id in game.dudes) {
		const dude = game.dudes[id];
		if( dude.x === x && dude.y === y ) {
			return true;
		}
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

const fall = function(dude) {
	while(!is_solid(dude.x, dude.y + 1) ) {
		dude.y += 1;
	}
};

const apply_gravity = function() {	
	Object.keys(game.dudes).sort( (a, b) => game.dudes[b].y - game.dudes[a].y ).forEach( function(id) {
		const dude = game.dudes[id];
		fall(dude);
	});
};

const move = function(dir) {
	const old_dudes = {};
	for(let id in game.dudes) {
		old_dudes[id] = {
			x: game.dudes[id].x,
			y: game.dudes[id].y,
		}
	}

	let dude = game.dudes[game.myid];
	let [x, y] = [dude.x, dude.y];
	const find_dude = function(x, y) {
		for(let id in game.dudes) {
			const other_dude = game.dudes[id];
			if( other_dude.x === x && other_dude.y === y) {
				return other_dude;
			}
		}
		return null;
	}

	if( move_dude(dude, dir) ) {
		const [dx, dy] = [dude.x - x, dude.y - y];
		y--;
		dude = find_dude(x, y);
		while(dude) {
			if( !is_solid(dude.x + dx, dude.y + dy) ) {
				[dude.x, dude.y] = [dude.x + dx, dude.y + dy];
			}
			else {
				break;
			}
			y--;
			dude = find_dude(x, y);
		}
	}
	else {
		return;
	}

	let new_flags = true;
	const flags = [];

	while(new_flags) {

		new_flags = false;

		apply_gravity();

		const button_presses = {};
		for(let id in game.dudes) {
			dude = game.dudes[id];
			const loc = world.xy_to_loc(dude.x, dude.y);
			const tile_type = world.type_names[ world.types[loc] ];
			if(tile_type === 'switch') {
				const name = world.linkloc_to_name[loc];
				if( name in button_presses ) {
					button_presses[name] += 1;
				}
				else {
					button_presses[name] = 1;
				}
			}
		}
		for(let name in world.name_to_linkloc) {
			if(button_presses[name] === world.name_to_switches[name].length
			   && !game.flags.has(name) ) {
				flags.push(name);
				game.apply_link(name);
				secrets.save_flag('links', name);
				new_flags = true;
			}
		}
	}

	// calculate state change
	const state_delta = {
		k: 'm', //this is a move
		t: (new Date()).getTime(), //time
		i: dir, //input
		d: {}, //dudes
		f: flags, //flags
	}
	for(let id in game.dudes) {
		const old_dude = old_dudes[id];
		const new_dude = game.dudes[id];
		if(old_dude.x !== new_dude.x || old_dude.y !== new_dude.y) {
			state_delta.d[id] = new_dude;
		}
	}

	game.send_move(state_delta);
}

const move_dude = function(dude, dir) {
	const x = dude.x;
	const y = dude.y;

	const [horz_x, horz_y] = horz_dest(x, y, dir);
	if( !is_solid(horz_x, horz_y) ) {
		[dude.x, dude.y] = [horz_x, horz_y];
	}
	else {
		const [climb_x, climb_y] = climb_dest(x, y, dir);
		if( !is_solid(climb_x, climb_y) ) {
			[dude.x, dude.y] = [climb_x, climb_y];
		}
	}

	return (x !== dude.x || y !== dude.y);
};

game.recieive_move = function(id, move_data) {
	if(move_data.k === 'm') {
		for(let id in move_data.d) {
			game.dudes[id] = move_data.d[id];
		}
		move_data.f.forEach( (name) => game.apply_link(name) );
	}
	game.render();
};

game.start_dude = function(id) {
	for(let y = world.start.y + world.start.h - 1; y >= world.start.y; y--) {		
		for(let x = world.start.x; x < world.start.x + world.start.w; x++) {
			if(!is_solid(x, y) ) {
				const dude = { x: x, y: y };
				game.dudes[game.myid] = dude;
				return dude;
			}
		}
	}
	return null;
};

game.add_dude = function(id, dude) {
	game.dudes[id] = dude;
	apply_gravity();
	game.render();
};

game.remove_dude = function(id) {
	delete game.dudes[id];
	apply_gravity();
	game.render();
};

return game;
};