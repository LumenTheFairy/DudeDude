dd.scripts.secrets = async function() {
secrets = {};

let mine = localStorage.getItem('mine');
if(!mine) {
	mine = String(Math.floor(Math.random() * 10000000000000000));
	localStorage.setItem('mine', mine);
}

//https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
const sha256 = async function (message) {

    // encode as UTF-8
    const msgBuffer = new TextEncoder('utf-8').encode(message);

    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    
    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // convert bytes to hex string
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
};
secrets.channel_name = "dudedude_" + await sha256(navigator.userAgent);

const flag_secret = ( async (key, name) => await sha256("saltedtunaicecream::" + key + "::" + name + "::" + mine) );

const get_key_map = function(key) {
	let key_map = localStorage.getItem(key);
	if(key_map) {
		return JSON.parse(key_map);
	}
	else {
		return {};
	}
};
const write_key_map = function(key, data) {
	localStorage.setItem(key, JSON.stringify(data) );
};

secrets.save_flag = function(key, name) {
	flag_secret(key, name).then( function (pw) {
		const key_map = get_key_map(key);
		key_map[name] = pw;
		write_key_map(key, key_map);
	});
};

secrets.get_flags = async function(key) {
	const key_map = get_key_map(key);
	const good_names = [];

	for(let name in key_map) {
		pw = await flag_secret(key, name);
		if(key_map[name] === pw) {
			good_names.push(name);
		}
	}

	return good_names;
};

return secrets;
};