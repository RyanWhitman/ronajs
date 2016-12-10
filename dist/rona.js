/**
 * RonaJS is a JavaScript micro framework / router.
 *
 * @package RonaJS
 * @copyright Copyright (c) 2016 Ryan Whitman (https://ryanwhitman.com)
 * @license https://opensource.org/licenses/MIT MIT
 * @version .5.1.0
 * @see https://github.com/RyanWhitman/ronajs
 * @since .5.0.0
 */

var Rona = function() {

	/**
	 * Establish several private properties.
	 */
	var
		config = {
			system_path: '',
		},
		routes = {},
		route_requested = '',
		handlers_disabled = false;

	/**
	 * Establish the initial previous URI.
	 * 
	 * @type {String}
	 */
	this.previous_uri = '';

	/**
	 * Establish the initial router variables.
	 * 
	 * @type {Object}
	 */
	this.route_vars = {};

	/**
	 * A method that alters the default configuration.
	 * 
	 * @return {void}
	 */
	this.config = function() {

		// Grab the instance.
		var instance = this;
	};

	/**
	 * Run RonaJS.
	 * 
	 * @return {void}
	 */
	this.run = function() {

		// Grab the instance.
		var instance = this;

		document.addEventListener('click', function(e) {

			if (typeof e.target.dataset.rona === 'string' && typeof e.target.href === 'string') {
				e.preventDefault();
				instance.change_route(e.target.href);
			}
		});

		window.addEventListener('popstate', function() {
			instance.execute_route();
		});

		instance.execute_route();
	};

	/**
	 * Execute the route.
	 * 
	 * @param  {bool | null}   disable_handlers   Whether or not to disable the handlers. If null, the handlers_disabled property will be referenced.
	 * @return {void}
	 */
	this.execute_route = function(disable_handlers) {

		// Grab the instance.
		var instance = this;

		// Set a default for "disable_handlers."
		disable_handlers = typeof disable_handlers == 'boolean' ? disable_handlers : null;

		route_requested = location.pathname.replace(config.system_path, '');

		if (route_requested == '/')
			route_requested = '';

		// Turn the requested route into an array & get the count
		var
			route_requested_arr = route_requested.split('/');
			route_requested_count = route_requested_arr.length;
			
		// Establish an empty $route_found variable
		var route_found = '';
			
		// First attempt to find a direct match. If that fails, try matching a route with a variable in it.
		var direct_match = typeof routes.regular === 'undefined' || typeof routes.regular[route_requested] === 'undefined' ? null : routes.regular[route_requested];
		if (direct_match !== null)
			route_found = direct_match;
		else {

			var variable_matches = routes.variable;

			for (var path in variable_matches) {

				if (!variable_matches.hasOwnProperty(path))
					continue;

				var handlers = variable_matches[path];

				// Reset route_var object
				instance.route_vars = {};

				// Explode the route being examined into an array
				var route_examining_arr = path.split('/');

				// Ensure the arrays are the same size
				if (route_requested_count == route_examining_arr.length) {

					// Iterate thru each of the array elements. The requested route and the route being examined either need to match exactly or the route being examined needs to have a variable.
					var
						matches_needed = route_requested_count,
						matches_found = 0;

					for (var i = 0; i < matches_needed; i++) {

						if (route_requested_arr[i] == route_examining_arr[i]) {
						
							// An exact match was found, so we'll continue to the next array item.
							matches_found++;
								
						} else if (route_examining_arr[i].match(/^{.+}$/)) {
						
							// The route being examined has a route variable, so it's a match. Set route_var array for use later on.
							instance.route_vars[route_examining_arr[i].replace('{', '').replace('}', '')] = route_requested_arr[i];
							matches_found++;
								
						} else {
						
							// A match was not found, so the route being examined isn't a match.
							break;
						}
					}

					if (matches_found == matches_needed) {
						route_found = handlers;
						break;
					}
				}
			}
		}

		if (disable_handlers === false || (disable_handlers === null && handlers_disabled))
			return;

		// If a route was found, run it
		if (typeof route_found === 'object') {

			if (typeof instance.route_vars !== 'object')
				instance.route_vars = {};

			for (var idx in route_found) {

				var handler = route_found[idx];

				if (typeof handler === 'function')
					handler(instance.route_vars);
				else
					window[handler](instance.route_vars);
			}
		}
	}

	/**
	 * Add a route.
	 * 
	 * @param  {string}                   path       The path or URI.
	 * @param  {string|array|function}    handlers   The handlers.
	 * @return {void}
	 */
	this.route = function(path, handlers) {

		// Grab the instance.
		var instance = this;
	
		// Format path
		path = path.toString().toLowerCase();
		if (path == '/')
			path = '';

		// Format handlers
		if (typeof handlers === 'undefined')
			return false;
		else if (Object.prototype.toString.call(handlers) !== '[object Array]')
			handlers = [handlers];
			
		// Determine route type
		var type;
		if (path.match(/[*]/i))
			type = 'wildcard';
		else if (path.match(/\/{.+(}$|}\/)/))
			type = 'variable';
		else
			type = 'regular';

		// Turn the path into an array & get the count
		var
			path_arr = path.split('/'),
			path_count = path_arr.length;
			
		// Merge these handlers with those previously created for this route
		var combined_handlers;
		if (typeof routes[type] === 'object' && typeof routes[type][path] === 'object')
			combined_handlers = routes[type][path].concat(handlers);
		else
			combined_handlers = handlers;

		// Destroy the former handlers variable
		handlers = null;
	
		// Find and attach wildcard handlers
		if (type != 'wildcard' && typeof routes.wildcard !== 'undefined') {

			// Grab the wildcard routes
			var wc_routes = routes.wildcard;

			var wc_handlers_all = [];

			for (var wc_path in wc_routes) {

				if (!wc_routes.hasOwnProperty(wc_path))
					continue;

				var wc_handlers = wc_routes[wc_path];
				
				var path_examining_arr = wc_path.split('/');
				
				var is_match = false;
				for (i = 0; i < path_count; i++) {
					
					if (path_examining_arr[i] == path_arr[i] || path_examining_arr[i] == '*') {
					
						// Get the count, which is the current iteration (array index) plus 1
						var count = i + 1;
						
						if (count == path_examining_arr.length && (count == path_count || path_examining_arr[i] == '*')) {
							
							is_match = true;
							break;
						}
					
					} else
						break;
				}
				
				if (is_match)
					Array.prototype.push.apply(wc_handlers_all, wc_handlers);
			}
		
			// Add the wildcard array
			var combined_handlers = wc_handlers_all.concat(combined_handlers);
		}

		// Set the route
		if (typeof routes[type] === 'undefined')
			routes[type] = {};
		routes[type][path] = combined_handlers;
	};

	/**
	 * Return all of the routes.
	 * 
	 * @return {object} The routes.
	 */
	this.get_routes = function() {
		return routes;
	};

	/**
	 * Chang the current route.
	 * 
	 * @param  {void}         uri                The new route to take the user to.
	 * @param  {bool|null}    disable_handlers   Whether or not to disable the handlers. If null, the handlers_disabled property will be referenced.
	 * @return {void}
	 */
	this.change_route = function(uri, disable_handlers) {

		// Grab the instance.
		var instance = this;

		// Set a default for "disable_handlers."
		disable_handlers = typeof disable_handlers == 'boolean' ? disable_handlers : null;

		instance.previous_uri = route_requested;

		window.history.pushState('', '', uri);
		instance.execute_route(disable_handlers);
	};

	/**
	 * Refresh the current route.
	 * 
	 * @return {void}
	 */
	this.refresh = function() {

		// Grab the instance.
		var instance = this;

		instance.change_route(route_requested);
	}

	/**
	 * Disable the execution of handlers.
	 * 
	 * @return {void}
	 */
	this.disable_handlers = function() {
		handlers_disabled = true;
	}

	/**
	 * Enable the execution of handlers.
	 * 
	 * @return {void}
	 */
	this.enable_handlers = function() {
		handlers_disabled = false;
	}

	/**
	 * Parses the query string and returns the query parameters as an object. If a param_name is passed in, that specific value will be returned.
	 * 
	 * @param    {string|int}   param_name    If passed in, the value for that specific query parameter will be returned.
	 * @return {object|string}                The query parameters as an object. If a param_name is passed in, that specific value will be returned.
	 */
	this.query_params = function(param_name) {

		var
			match,
			pl = /\+/g,  // Regex for replacing addition symbol with a space
			search = /([^&=]+)=?([^&]*)/g,
			decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			query  = window.location.search.substring(1),
			query_params = {};

		while (match = search.exec(query))
			query_params[decode(match[1])] = decode(match[2]);

		return typeof param_name != 'undefined' ? query_params[param_name] : query_params;
	}
};