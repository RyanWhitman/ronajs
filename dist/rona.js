/**
 * RonaJS is a JavaScript micro framework / router.
 *
 * @package RonaJS
 * @copyright Copyright (c) 2017 Ryan Whitman (https://ryanwhitman.com)
 * @license https://opensource.org/licenses/MIT MIT
 * @version .6.0.0
 * @see https://github.com/RyanWhitman/ronajs
 */
var Rona = function() {

	/**
	 * A property that houses Rona configuration.
	 * 
	 * @type {Object}
	 */
	var config = {system_path: ''};

	/**
	 * A property that holds the routes.
	 * 
	 * @type {Object}
	 */
	var routes = {};

	/**
	 * A property that holds the route that has been requested.
	 * 
	 * @type {String}
	 */
	var route_requested = '';

	/**
	 * A property that is used to turn on/off the handlers.
	 * 
	 * @type {Boolean}
	 */
	var handlers_disabled = false;

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
	 * A method that alters the default configuration. This is a forthcoming method.
	 * 
	 * @return {void}
	 */
	this.config = function() {

		// Grab the instance.
		var instance = this;
	};

	/**
	 * Add a route.
	 * 
	 * @param  {string}                   path       The path / URI.
	 * @param  {string|array|function}    handlers   The handlers.
	 * @return {void}
	 */
	this.route = function(path, handlers) {

		// Grab the instance.
		var instance = this;
	
		// Format the path.
		path = path.toString().toLowerCase();
		if (path == '/')
			path = '';

		// Validate & format the handlers.
		if (typeof handlers === 'undefined')
			return false;
		else if (Object.prototype.toString.call(handlers) !== '[object Array]')
			handlers = [handlers];

		// Add this route to the global routes variable. Currently, the script does not attempt to merge handlers. That will need to be implemented.
		routes[path] = handlers;
	};

	/**
	 * Run RonaJS.
	 * 
	 * @return {void}
	 */
	this.run = function(execute_route) {

		// Grab the instance.
		var instance = this;

		// Set default for execute_route variable.
		var execute_route = typeof execute_route == 'boolean' ? execute_route : true;

		// Add a listener to the click event.
		document.addEventListener('click', function(e) {

			// When an anchor element that contains the "data-rona" attribute is clicked, use Rona to execute the route.
			if (typeof e.target.dataset.rona === 'string' && typeof e.target.href === 'string') {
				e.preventDefault();
				instance.change_route(e.target.href);
			}
		});

		// Add a listener to the popstate event.
		window.addEventListener('popstate', function() {

			// On popstate, use Rona to execute the route.
			instance.execute_route();
		});

		// If the execute_route variable is set to true, run the execute_route method.
		if (execute_route)
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
		var disable_handlers = typeof disable_handlers == 'boolean' ? disable_handlers : null;

		// Determine & format the request route.
		route_requested = location.pathname.replace(config.system_path, '');
		if (route_requested == '/')
			route_requested = '';

		// Loop thru each route.
		for (var path in routes) {

			if (!routes.hasOwnProperty(path))
				continue;

			// Grab the handlers.
			var handlers = routes[path];

			// Set a variable to house the path variables.
			var path_vars_matched = [];

			// Create a regular expression to match the path.
			var regex = new RegExp('^' + path.replace(/{([\da-z_]*[\da-z]+[\da-z_]*)(\([\S ]+?\))?}/gi, function(match, p1, p2) {
				path_vars_matched.push(p1);
				return typeof p2 == 'string' ? p2 : '([\\w-]+)';
			}) + '$');

			// Validate the requested path against the regular expression. 
			var route_requested_matched = route_requested.match(regex);
			if (route_requested_matched != null) {

				// Reset route_var object
				instance.route_vars = {};

				route_found = handlers;

				if (typeof route_requested_matched.length == 'number') {
					for (var i = 1; i < route_requested_matched.length; i++)
						instance.route_vars[path_vars_matched[i - 1]] = route_requested_matched[i];
				}
			}
		}

		// Proceed with executing the handlers only if the handlers are enabled.
		if (disable_handlers === false || (disable_handlers === null && handlers_disabled))
			return;

		// If a route was found, run it.
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