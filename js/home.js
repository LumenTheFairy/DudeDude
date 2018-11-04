// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.home = async function(secrets) {

const reset_progress = function() {
	//close all connections
	const bc = new BroadcastChannel(secrets.channel_name);
	let connections = localStorage.getItem('c');
	if(connections) {
		JSON.parse(connections).forEach( function(id) {
			bc.postMessage( {
				t: 'close',
				d: id,
				i: -1,
				n: 0,
			});
		});
	}
	//whipe stored links
	localStorage.setItem('links', JSON.stringify({}));
	//whipe stored stats
	localStorage.setItem('ls', JSON.stringify({}));
};

document.getElementById('reset-progress').onclick = reset_progress;

//fill in stats
const isteps = parseInt(await secrets.get_value('gs', 'isteps'));
const tsteps = parseInt(await secrets.get_value('gs', 'tsteps'));
const maxd = parseInt(await secrets.get_value('gs', 'maxd'));

//console.log(isteps, tsteps, maxd);

document.getElementById('isteps').innerText = isteps || '?';
document.getElementById('tsteps').innerText = tsteps || '?';
document.getElementById('maxd').innerText = maxd || '?';

//get cheevos
const cheevos = await secrets.get_flags('cheevos');

//build cheevo list
const cheevo_data = [
	{ key: 'You Won', name: 'You Won!', desc: 'Beat the game' },
	{ key: 'istepsA', name: 'Bronze Individual', desc: 'Beat the game with at most 1250 "Individual Steps"' },
	{ key: 'istepsB', name: 'Silver Individual', desc: 'Beat the game with at most 800 "Individual Steps"' },
	{ key: 'istepsC', name: 'Gold Individual', desc: 'Beat the game with at most 500 "Individual Steps"' },
	{ key: 'tstepsA', name: 'Bronze Total', desc: 'Beat the game with at most 2500 "Total Steps"' },
	{ key: 'tstepsB', name: 'Silver Total', desc: 'Beat the game with at most 1900 "Total Steps"' },
	{ key: 'tstepsC', name: 'Gold Total', desc: 'Beat the game with at most 1450 "Total Steps"' },
	{ key: 'maxdA', name: 'Good Dudes', desc: 'Beat the game with at most 4 Dudes at a time' },
	{ key: 'maxdB', name: 'Great Dudes', desc: 'Beat the game with at most 3 Dudes at a time' },
	{ key: 'gateA', name: 'Missing Link', desc: 'Beat the game with at least one unopened gate' },
	{ key: 'gateB', name: 'Low Percent', desc: 'Beat the game with two unopened gates' },
];

const cheevo_list = cheevo_data.map( (data) => 
`<span class='cheevo-item'>
	<span class='cheevo-check-box'>${cheevos.includes(data.key) ? '☑' : '☐'}</span>
	<span class='cheevo-text'>
		<span class='cheevo-name'>${data.name}</span>
		<span class='cheevo-desc'>${data.desc}</span>
	</span>
</span>
`).join('');
document.getElementById('cheevo-list').innerHTML = cheevo_list;

//show hidden stuff if the game has been beaten
if(cheevos.includes('You Won')) {
	document.body.className = 'show-hidden';
}

};