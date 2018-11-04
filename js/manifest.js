// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

let dd = {};
dd.scripts = {};

dd.default_palette = 'default';
dd.default_color = '#000000';

//lists the scripts and data that needs to be loaded
//details when to load them, and the type of file it is
//processing lists a script, a file, and a process that script runs on the file
dd.manifest = [

	{name: 'colors',         type: 'json',    url: 'data/colors.json' },

	{name: 'tileset_params', type: 'json',    url: 'data/tileset_params.json' },
	{name: 'game_params',    type: 'json',    url: 'data/game_params.json' },
	{name: 'world_data',     type: 'json',    url: 'data/world.json'},

	{name: 'tileset',     type: 'image_data', url: 'image/tileset.png'},

	{name: 'data_lookup', dependencies: [],   type: 'script', url: 'js/data_lookup.js' },

	{name: 'get_color',    
	 dependencies: ['colors', 'data_lookup'],
	 type: 'process',
	 process: function(colors, make_lookup) { return make_lookup(colors, dd.default_palette, dd.default_color); }
	},

	{name: 'util',        dependencies: [],                     type: 'script', url: 'js/util.js' },
	{name: 'display',     dependencies: ['game_params'],        type: 'script', url: 'js/display.js' },
	{name: 'control',     dependencies: [],                     type: 'script', url: 'js/control.js' },
	{name: 'tile_sheet',  dependencies: ['util'],               type: 'script', url: 'js/tile_sheet.js' },

	{name: 'locking',     dependencies: [],                     type: 'script', url: 'js/locking.js' },
	{name: 'secrets',     dependencies: ['locking'],            type: 'script', url: 'js/secrets.js' },

	{name: 'world',       dependencies: ['world_data'],         type: 'script', url: 'js/world.js' },
	{name: 'game',        dependencies: ['display', 'control', 'world', 'tile_sheet', 'get_color', 'secrets', 'locking'], type: 'script', url: 'js/game.js' },

	{name: 'communication', dependencies: ['game', 'secrets', 'locking'],  type: 'script', url: 'js/communication.js' },


	{name: 'set_game_params',
	 dependencies: ['game_params', 'game'],
	 type: 'process',
	 process: function(game_params, game) { game.set_game_params(game_params); }
	},
	{name: 'set_tileset_params',
	 dependencies: ['tileset_params', 'game'],
	 type: 'process',
	 process: function(tileset_params, game) { game.set_tileset_params(tileset_params); }
	},
	{name: 'initialize_tileset',
	 dependencies: ['tileset', 'game', 'set_tileset_params'],
	 type: 'process',
	 process: function(tileset_image, game) { game.initialize_tileset(tileset_image); }
	},
	{name: 'hook_communication',
	 dependencies: ['communication', 'game'],
	 type: 'process',
	 process: function(communication, game) { game.hook_communication(communication); }
	},
	{name: 'remember_flags',
	 dependencies: ['game', 'initialize_tileset'],
	 type: 'process',
	 process: async function(game) { await game.remember_flags(); }
	},


	{name: 'init_display',
	 dependencies: ['display', 'dom'],
	 type: 'process',
	 process: function(display) { display.initialize(); }
	},
	{name: 'start',
	 dependencies: ['game', 'init_display', 'hook_communication', 'remember_flags'],
	 type: 'process',
	 process: function(game) { game.start(); }
	},
];

let ddl = new pl.Loader(dd, dd.manifest, { fast_fail: true } );
ddl.load().then(
	function(val) {
		dd = undefined;
		ddl = undefined;
	},
	((err) => console.error(err))
);