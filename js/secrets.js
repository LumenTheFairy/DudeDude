dd.scripts.secrets = async function() {
secrets = {};

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

return secrets;
};