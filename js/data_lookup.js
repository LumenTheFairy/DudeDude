// Written by TheOnlyOne aka LumenTheFairy aka @modest_ralts

dd.scripts.data_lookup = function() {

dd.create_data_lookup_namespace = function(data, default_option, default_value) {
	let new_namespace = {};

	new_namespace.data = data;

	new_namespace.set_option = function(option) {	
		new_namespace.option = option;
		if(option in new_namespace.data) {
			new_namespace.lookup_table = new_namespace.data[option];
		}
		else {
			new_namespace.lookup_table = null;
		}
	};

	new_namespace.set_option(default_option);

	new_namespace.get = function(key) {
		if(new_namespace.lookup_table !== null && key in new_namespace.lookup_table) {
			return new_namespace.lookup_table[key];
		}
		return default_value;
	};
	
	return new_namespace;
}

return dd.create_data_lookup_namespace;
};