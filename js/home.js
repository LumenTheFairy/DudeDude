// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.home = async function(secrets) {

const reset_progress = function(e) {
	e.preventDefault();
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
	secrets.reset_ls().then( () => location.replace('') );

	return false;
};

document.getElementById('reset-progress').onclick = reset_progress;

//fill in stats
const isteps = parseInt(await secrets.get_value('gs', 'isteps'));
const tsteps = parseInt(await secrets.get_value('gs', 'tsteps'));
const cdude = parseInt(await secrets.get_value('gs', 'cdude'));
const maxd = parseInt(await secrets.get_value('gs', 'maxd'));
const cswap = parseInt(await secrets.get_value('gs', 'cswap'));

//console.log(isteps, tsteps, maxd);

document.getElementById('isteps').innerText = isteps || '?';
document.getElementById('tsteps').innerText = tsteps || '?';
document.getElementById('cdude').innerText = cdude || '?';
document.getElementById('maxd').innerText = maxd || '?';
document.getElementById('cswap').innerText = cswap || '?';

//get cheevos
const cheevos = await secrets.get_flags('cheevos');

//build cheevo list
const cheevo_data = [
	{ key: 'You Won', name: 'You Won!', desc: 'Beat the game', gap: true},

	{ key: 'gateA', name: 'Missing Link', desc: 'Beat the game with at least one unopened gate', gap: false},
	{ key: 'gateB', name: 'Low Percent', desc: 'Beat the game with three unopened gates', gap: true},

	{ key: 'cdudeA', name: 'HexaDude', desc: 'Beat the game creating at most 6 Dudes', gap: false},
	{ key: 'cdudeB', name: 'PentaDude', desc: 'Beat the game creating only 5 Dudes', gap: true},

	{ key: 'maxdA', name: 'Medium Max', desc: 'Beat the game with at most 4 Dudes at a time', gap: false},
	{ key: 'maxdB', name: 'Minimum Max', desc: 'Beat the game with at most 3 Dudes at a time', gap: true},

	{ key: 'cswapA', name: 'Bronze Swaps', desc: 'Beat the game with at most 60 "Control Swaps"', gap: false},
	{ key: 'cswapB', name: 'Silver Swaps', desc: 'Beat the game with at most 45 "Control Swaps"', gap: false},
	{ key: 'cswapC', name: 'Gold Swaps', desc: 'Beat the game with at most 35 "Control Swaps"', gap: false},
	{ key: 'cswapD', name: 'Platinum Swaps', desc: 'Beat the game with at most 30 "Control Swaps"', gap: true},

	{ key: 'istepsA', name: 'Bronze Individual', desc: 'Beat the game with at most 1250 "Individual Steps"', gap: false},
	{ key: 'istepsB', name: 'Silver Individual', desc: 'Beat the game with at most 800 "Individual Steps"', gap: false},
	{ key: 'istepsC', name: 'Gold Individual', desc: 'Beat the game with at most 500 "Individual Steps"', gap: false},
	{ key: 'istepsD', name: 'Platinum Individual', desc: 'Beat the game with at most 450 "Individual Steps"', gap: true},

	{ key: 'tstepsA', name: 'Bronze Total', desc: 'Beat the game with at most 2500 "Total Steps"', gap: false},
	{ key: 'tstepsB', name: 'Silver Total', desc: 'Beat the game with at most 1900 "Total Steps"', gap: false},
	{ key: 'tstepsC', name: 'Gold Total', desc: 'Beat the game with at most 1450 "Total Steps"', gap: false},
	{ key: 'tstepsD', name: 'Platinum Total', desc: 'Beat the game with at most 1250 "Total Steps"', gap: true},

	{ key: 'cswapE', name: 'Rainbow Swaps', desc: 'Beat the game with at most 27 "Control Swaps"', gap: false},
	{ key: 'istepsE', name: 'Rainbow Individual', desc: 'Beat the game with at most 400 "Individual Steps"', gap: false},
	{ key: 'tstepsE', name: 'Rainbow Total', desc: 'Beat the game with at most 1150 "Total Steps"', gap: false},
];

const cheevo_list = cheevo_data.map( (data) => 
`<span class='cheevo-item${data.gap ? " cheevo-item-gap" : ""}'>
	<span class='cheevo-check-box'>${cheevos.includes(data.key) ? '☑' : '☐'}</span>
	<span class='cheevo-text' id='cheevo-${data.key}'>
		<span class='cheevo-name'>${data.name}</span>
		<span class='cheevo-desc'>${data.desc}</span>
	</span>
</span>
`).join('');
document.getElementById('cheevo-list').innerHTML = cheevo_list;



const build_selections = async function(selection_data, select_id, preview_id, folder_name, opt_type, opt_name) {
	//build the pallet selections
	const selection_map = {};
	selection_data.forEach( (data, index) => (selection_map[data.value] = index) );

	const selection_html = selection_data.map( (data) => 
	`									<option value=${data.value}${(data.locked && !cheevos.includes(data.cheevo)) ? ' disabled' : ''}>${data.name}</option>
	`).join('');
	const selection_elem = document.getElementById(select_id);
	selection_elem.innerHTML = selection_html;
	//recall the saved pallet
	const set_image = function(opt) {
		document.getElementById(preview_id).src = 'image/' + folder_name + '/' + opt + '.png';
	}
	const saved_opt = await secrets.get_value('opt', opt_name);
	if(saved_opt !== null) {
		selection_elem.value = saved_opt;
		set_image(saved_opt);
	}
	else {
		selection_elem.value = 'default';
	}
	//make pallet selection save the chosen pallet 
	selection_elem.onchange = function() {
		const value = this.value;
		//make sure it's a valid
		if( selection_map[value] === undefined ) {
			return;
		}
		const data = selection_data[ selection_map[value] ];
		//make sure it's allowed
		if( data.locked && !cheevos.includes(data.cheevo) ) {
			return;
		}
		//save the value
		set_image(data.value);
		secrets.save_value('opt', opt_name, data.value);
	};
	//add unlock text to cheevo
	selection_data.forEach( function(data) {
		if(data.locked) {
			const unlock_text = document.createElement("SPAN");
			unlock_text.classList.add('cheevo-desc');
			unlock_text.innerText = '(Unlocks "' + data.name + '" ' + opt_type + ')';
			document.getElementById('cheevo-' + data.cheevo).appendChild(unlock_text);
		}
	});
};


const character_data = [
	{ name: 'Dude Dude', value: 'default', locked: false, cheevo: ''},
	{ name: 'Wide Dude', value: 'wide', locked: true, cheevo: 'maxdA'},
	{ name: 'Lifty Dude', value: 'lift', locked: true, cheevo: 'cdudeA'},
	{ name: 'Upside-down Dude', value: 'upside', locked: true, cheevo: 'gateB'},
	{ name: 'Dude Block', value: 'block', locked: true, cheevo: 'maxdB'},
	{ name: 'Bunny Dude', value: 'bunny', locked: true, cheevo: 'istepsC'},
	{ name: 'Snail Dude', value: 'snail', locked: true, cheevo: 'cswapA'},
	{ name: 'Jellyfish Dude', value: 'jelly', locked: true, cheevo: 'tstepsA'},
	{ name: 'Star Dude', value: 'star', locked: true, cheevo: 'cswapC'},
];
const pallet_data = [
	{ name: 'Default', value: 'default', locked: false, cheevo: ''},
	{ name: 'Day', value: 'light', locked: true, cheevo: 'You Won'},
	{ name: 'Night', value: 'dark', locked: true, cheevo: 'gateA'},
	{ name: 'Sunset', value: 'sunset', locked: true, cheevo: 'istepsA'},
	{ name: 'Rainbow', value: 'rainbow', locked: true, cheevo: 'tstepsC'},
	{ name: 'Inverted', value: 'inverted', locked: true, cheevo: 'cswapB'},
	{ name: 'TI Calculator', value: 'TI', locked: true, cheevo: 'cdudeB'},
	{ name: 'Black on black', value: 'black', locked: true, cheevo: 'istepsB'},
	{ name: 'White on white', value: 'white', locked: true, cheevo: 'tstepsB'},
];

await build_selections(character_data, 'character-select', 'character-preview', 'dudes', 'Character','character');
await build_selections(pallet_data, 'pallet-select', 'pallet-preview', 'pallets', 'Pallet', 'pallet');

//show hidden stuff if the game has been beaten
if(cheevos.includes('You Won')) {
	document.body.className = 'show-hidden';
}

};