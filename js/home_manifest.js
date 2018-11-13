// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

let dd = {};
dd.scripts = {};

dd.manifest = [

	{name: 'broadcast', type: 'external_script', url: 'js/broadcast.js' },

	{name: 'locking', dependencies: [], type: 'script', url: 'js/locking.js' },
	{name: 'secrets', dependencies: ['locking'], type: 'script', url: 'js/secrets.js' },

	{name: 'home', dependencies: ['secrets', 'broadcast', 'dom'], type: 'script', url: 'js/home.js' },

];

let ddl = new pl.Loader(dd, dd.manifest, { fast_fail: true } );
ddl.load().then(
	function(val) {
		dd = undefined;
		ddl = undefined;
	},
	((err) => console.error(err))
);