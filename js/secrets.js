// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.secrets = async function(locking) {
const secrets = {};

const LOCK_TIMEOUT = 50;

let mine = localStorage.getItem('mine');
if(!mine) {
	mine = String(Math.floor(Math.random() * 10000000000000000));
	localStorage.setItem('mine', mine);
}
let hi = localStorage.getItem('___hi');
if(!hi) {
	localStorage.setItem('___hi', "Hi! Welcome to the localStorage for Dude Dude -A Short Puzzle Adventure-! If you're here because you think it's part of the puzzle, you can rest assured that it is not, and you can go back to the game proper. If you're here to change your scores or something, I'm not going to try to stop you; however, the data is slightly obfuscated, so it won't be entirely simple (but honestly not that hard either). Do be aware that tampering with the data here very well may cause issues in the game, and we aren't going to pretend that that isn't your own problem. So good luck with that.");
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
//https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt
const encryptText = async (plainText, password) => {
	const ptUtf8 = new TextEncoder().encode(plainText);

	const pwUtf8 = new TextEncoder().encode(password);
	const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8); 

	const iv = crypto.getRandomValues(new Uint8Array(12));
	const alg = { name: 'AES-GCM', iv: iv };
	const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['encrypt']);

	const enc_buf = await crypto.subtle.encrypt(alg, key, ptUtf8);
	const enc_str = String.fromCharCode.apply(null, new Uint8Array(enc_buf));
	const iv_str = String.fromCharCode.apply(null, iv);

	return JSON.stringify( { i: iv_str, e: enc_str } );
};
//https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/decrypt
const decryptText = async (enc, password) => {
	const enc_obj = JSON.parse( enc );

	//https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
	const ctBuffer = new ArrayBuffer(enc_obj.e.length);
	const bufView = new Uint8Array(ctBuffer);
	for (let i=0, strLen=enc_obj.e.length; i < strLen; i++) {
		bufView[i] = enc_obj.e.charCodeAt(i);
	}
	const iv = new Uint8Array(enc_obj.i.length);
	for (let i=0, strLen=enc_obj.i.length; i < strLen; i++) {
		iv[i] = enc_obj.i.charCodeAt(i);
	}

	const pwUtf8 = new TextEncoder().encode(password);
	const pwHash = await crypto.subtle.digest('SHA-256', pwUtf8);

	const alg = { name: 'AES-GCM', iv: iv };
	const key = await crypto.subtle.importKey('raw', pwHash, alg, false, ['decrypt']);

	const ptBuffer = await crypto.subtle.decrypt(alg, key, ctBuffer);

	const plaintext = new TextDecoder().decode(ptBuffer);

	return plaintext;
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

secrets.save_flag = async function(id, key, name) {
	const critical = async function() {
		const pw = await flag_secret(key, name);
		const key_map = get_key_map(key);
		key_map[name] = pw;
		write_key_map(key, key_map);
	};

	await locking.run_critical(id, key, critical, LOCK_TIMEOUT);
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

//this should technically be locked, but it will probably hurt the performance,
//and this is run quite a bit for the moving tab
secrets.save_value = async function(key, name, value) {
	pw = await flag_secret(key, name);
	const key_map = get_key_map(key);
	key_map[name] = await encryptText(value, pw);
	write_key_map(key, key_map);
};

secrets.get_value = async function(key, name) {
	const key_map = get_key_map(key);
	pw = await flag_secret(key, name);
	if(name in key_map) {
		return await decryptText(key_map[name], pw);
	}
	return undefined;
};

return secrets;
};