// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

let dd = {};
dd.scripts = {};

dd.manifest = [

	{name: 'broadcast', type: 'external_script', url: 'js/broadcast.js' },
  {name: 'namedstore', dependencies: [], type: 'script', url: 'js/namedstore.js' },
  {name: 'start_store',
   dependencies: ['namedstore'],
   type: 'process',
   process: function() { namedstore.setName('dd'); }
  },

	{name: 'locking', dependencies: ['start_store'], type: 'script', url: 'js/locking.js' },
	{name: 'secrets', dependencies: ['locking', 'start_store'], type: 'script', url: 'js/secrets.js' },

	{name: 'home', dependencies: ['secrets', 'broadcast', 'start_store', 'dom'], type: 'script', url: 'js/home.js' },

];

let ddl = new pl.Loader(dd, dd.manifest, { fast_fail: true } );
ddl.load().then(
	function(val) {
		dd = undefined;
		ddl = undefined;
	},
	((err) => console.error(err))
);
