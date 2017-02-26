/**
 * RonaJS is a JavaScript router / micro framework that allows for the creation of any number of routes. Each route consists of a URI and 1 or more handlers. URIs can be straight-forward and literal or they can consist of variables and regular expressions. Upon execution, RonaJS finds the matching route and executes the handlers. RonaJS is built in vanilla JavaScript and does not require jQuery.
 *
 * @copyright Copyright (c) 2017 Ryan Whitman (https://ryanwhitman.com)
 * @license https://opensource.org/licenses/MIT MIT
 * @version .7.1.0
 * @see https://github.com/RyanWhitman/ronajs
 */

/**
 * The RonaJS class.
 *
 * @class
 */
var Rona = function() {

	/**
	 * This RonaJS instance.
	 *
	 * @type {Object}
	 */
	var instance = this;

	/**
	 * The RonaJS configuration.
	 *
	 * @private
	 * @type {Object}
	 */
	var config = {
		base_uri: ''
	};

	/**
	 * The routes.
	 *
	 * @private
	 * @type {Object}
	 */
	var routes = {};

	/**
	 * The current requested URI.
	 *
	 * @private
	 * @type {string}
	 */
	var current_requested_uri = '';

	/**
	 * Determines whether or not the execution of handlers is disabled.
	 *
	 * @private
	 * @type {boolean}
	 */
	var handlers_disabled = false;

	/**
	 * The previous requested URI.
	 *
	 * @private
	 * @type {string}
	 */
	var previous_requested_uri = '';

	/**
	 * The route variables for the matching URI.
	 *
	 * @private
	 * @type {Object}
	 */
	var route_vars = {};

	/**
	 * The constructor.
	 */
	(function() {

		// Add a listener to the click event.
		document.addEventListener('click', function(e) {

			// When an anchor element that contains the "data-rona" attribute is clicked, use RonaJS to execute the route.
			if (typeof e.target.dataset.rona === 'string' && typeof e.target.href === 'string') {
				e.preventDefault();
				instance.location(e.target.href);
			}
		});

		// Add a listener to the popstate event.
		window.addEventListener('popstate', function() {

			// On popstate, use RonaJS to execute the route.
			instance.execute();
		});
	})();

	/**
	 * Add a route.
	 *
	 * @public
	 * @param  {string}                   uri       The URI to attach a handler(s) to. The URI should include both starting and ending slashes, as necessary. The URI can be straight-forward and literal but can also contain variables and regular expressions. Variables are denoted with starting and closing brackets. For example, `/my-page/{var1}`. By default, RonaJS interprets variables with a regular expression that accepts letters (case-insensitive), digits, and dashes. A custom regular expression can be passed in, as such: `/my-page/{var1([\\d]+)}`. In this example, RonaJS will now only accept digits for `var1`. Custom regular expressions that are tied to a route variable must be both parenthetically enclosed and escaped. Regular expressions do not necessarily need to be tied to a variable. They can be scattered throughout and RonaJS will match them against the requested URI.
	 * @param  {string|Array|function}    handlers   A function(s) that will be executed for the provided URI. This argument may contain an anonymous function, a named function, a string containing the name of a function, or an array containing any combination of 3. Each handler will receive an object containing the route variables or an empty object when no variables exist.
	 * @return {void}
	 */
	instance.route = function(uri, handlers) {
	
		// Format the URI.
		uri = uri.toString().toLowerCase();
		if (uri == '/')
			uri = '';

		// Validate & format the handlers.
		if (typeof handlers === 'undefined')
			return false;
		else if (Object.prototype.toString.call(handlers) !== '[object Array]')
			handlers = [handlers];

		// Add this route to the routes property. Currently, RonaJS does not attempt to merge handlers. That will need to be implemented.
		routes[uri] = handlers;
	};

	/**
	 * Attempt to match the current URI with a route and then execute the handlers, if enabled.
	 *
	 * @public
	 * @param  {boolean|null}   [disable_handlers=null]   Whether or not to disable the handlers. If null, RonaJS defers to the handlers_disabled property.
	 * @return {void}
	 */
	instance.execute = function(disable_handlers) {

		// Set default(s).
		var disable_handlers = typeof disable_handlers == 'boolean' ? disable_handlers : null;

		// Grab the requested URI and strip the base URI from it.
		current_requested_uri = location.pathname.replace(config.base_uri, '');

		// When the requested URI is just essentially the domain, strip the slash from it.
		if (current_requested_uri == '/')
			current_requested_uri = '';

		// Loop thru each route.
		for (var uri in routes) {

			// Ensure the property exists.
			if (!routes.hasOwnProperty(uri))
				continue;

			// Grab the handlers.
			var handlers = routes[uri];

			// Set a variable to hold the route variables.
			var route_vars_matched = [];

			// Create a regular expression to match the URI.
			var regex = new RegExp('^' + uri.replace(/{([\da-z_]*[\da-z]+[\da-z_]*)(\([\S ]+?\))?}/gi, function(match, p1, p2) {
				route_vars_matched.push(p1);
				return typeof p2 == 'string' ? p2 : '([\\w-]+)';
			}) + '$');

			// Validate the requested URI against the regular expression.
			var current_requested_uri_matched = current_requested_uri.match(regex);
			if (current_requested_uri_matched != null) {

				// Reset route_var object
				route_vars = {};

				// Store the matching route's handlers in a variable.
				var handlers_to_execute = handlers;

				// Collect the route variables.
				if (typeof current_requested_uri_matched.length == 'number') {
					for (var i = 1; i < current_requested_uri_matched.length; i++)
						route_vars[route_vars_matched[i - 1]] = current_requested_uri_matched[i];
				}
			}
		}

		// Proceed with executing the handlers only if the handlers are enabled.
		if (disable_handlers === false || (disable_handlers === null && handlers_disabled))
			return;

		// If handlers were found, execute them.
		if (typeof handlers_to_execute === 'object') {

			// Ensure the route_vars format is correct.
			if (typeof route_vars !== 'object')
				route_vars = {};

			// Loop thru the handlers.
			for (var idx in handlers_to_execute) {

				// Ensure the property exists.
				if (!handlers_to_execute.hasOwnProperty(idx))
					continue;

				// Grab the handler.
				var handler = handlers_to_execute[idx];

				// Execute the handler.
				if (typeof handler === 'function')
					handler(instance.route_vars());
				else
					window[handler](instance.route_vars());
			}
		}
	};

	/**
	 * Get all routes.
	 *
	 * @public
	 * @return {Object} The routes.
	 */
	instance.get_routes = function() {
		return routes;
	};

	/**
	 * Change the current route.
	 *
	 * @public
	 * @param  {string}         uri                       The new URI to take the user to.
	 * @param  {boolean|null}      [disable_handlers=null]   Whether or not to disable the handlers. If null, RonaJS defers to the handlers_disabled property.
	 * @return {void}
	 */
	instance.location = function(uri, disable_handlers) {

		// Set default(s).
		disable_handlers = typeof disable_handlers == 'boolean' ? disable_handlers : null;

		// The previous URI is now the current requested URI.
		previous_requested_uri = current_requested_uri;

		// Use push state to change the address in the browser's address bar.
		window.history.pushState('', '', uri);

		// Execute the new route.
		instance.execute(disable_handlers);
	};

	/**
	 * Reload the current route.
	 *
	 * @public
	 * @return {void}
	 */
	instance.reload = function() {
		instance.location(current_requested_uri);
	};

	/**
	 * Disable the execution of handlers.
	 *
	 * @public
	 * @return {void}
	 */
	instance.disable_handlers = function() {
		handlers_disabled = true;
	};

	/**
	 * Enable the execution of handlers.
	 *
	 * @public
	 * @return {void}
	 */
	instance.enable_handlers = function() {
		handlers_disabled = false;
	};

	/**
	 * Parse the query string and get the query parameters as an object.
	 *
	 * @public
	 * @param    {string}           [param_name=null]    If passed in, the value for that specific query parameter will be returned.
	 * @return   {Object|string}                         The query parameters as an object. If a param_name is passed in, that specific value will be returned.
	 */
	instance.query_params = function(param_name) {

		// Set default(s).
		var param_name = typeof param_name != 'undefined' ? param_name : null;

		// Set some variables.
		var
			match,
			pl = /\+/g,  // Regex for replacing addition symbol with a space
			search = /([^&=]+)=?([^&]*)/g,
			decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
			query  = window.location.search.substring(1),
			query_params = {};

		// Collect the query params.
		while (match = search.exec(query))
			query_params[decode(match[1])] = decode(match[2]);

		// Return the query params / query param.
		return param_name == null ? query_params : query_params[param_name];
	};
	
	/**
	 * Get the previous requested URI.
	 *
	 * @public
	 * @return   {string}   The previous requested URI.
	 */
	instance.previous_requested_uri = function() {
		return previous_requested_uri;
	};
	
	/**
	 * Get the route variables for the matching URI.
	 *
	 * @public
	 * @return   {Object}   The route variables for the matching URI.
	 */
	instance.route_vars = function() {
		return route_vars;
	};
};