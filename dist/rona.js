/**
 * RonaJS is a JavaScript framework that allows for the creation of any number of routes. Each route consists of a URI and 1 or more handlers. URIs can be straight-forward and literal or they can consist of variables and regular expressions. Upon execution, RonaJS finds the matching route and executes the handlers. RonaJS is built in vanilla JavaScript and does not require jQuery.
 *
 * @copyright Copyright (c) 2018 Ryan Whitman (https://ryanwhitman.com)
 * @license https://opensource.org/licenses/MIT MIT
 * @version .7.5.0
 * @see https://github.com/RyanWhitman/ronajs
 */

'use strict';

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
	instance.config = {
		base_uri: '',
		requested_uri: location.pathname
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
			var anchor = false;
			if (e.target.tagName.toLowerCase() == 'a')
				anchor = e.target;
			else if (typeof e.path === 'object') {
				for (var i = 0; i < e.path.length; i++) {
					if (typeof e.path[i].tagName === 'string' && e.path[i].tagName.toLowerCase() == 'a') {
						anchor = e.path[i];
						break;
					}
				}
			}

			// When an anchor element that contains the "data-rona" attribute is clicked, use RonaJS to execute the route.
			if (anchor && typeof anchor.href === 'string' && typeof anchor.dataset.rona === 'string') {
				e.preventDefault();
				instance.location(anchor.href);
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
	 * @param  {string}                   uri       The URI to attach a handler(s) to. The URI should include both starting and ending slashes, as necessary. The URI can be straight-forward and literal but can also contain variables and regular expressions. Variables are denoted with starting and closing curly braces. For example, `/my-page/{var1}`. By default, RonaJS interprets variables with a regular expression that matches anything but a forward slash. A custom regular expression can be passed in, as such: `/my-page/{var1([\\d]+)}`. In this example, RonaJS will now only accept digits for `var1`. Custom regular expressions that are tied to a route variable must be both parenthetically enclosed and escaped. Regular expressions do not necessarily need to be tied to a variable. They can be scattered throughout and RonaJS will match them against the requested URI. All URIs have a case-insensitive match.
	 * @param  {string|Array|function}    handlers   A function(s) that will be executed for the provided URI. This argument may contain an anonymous function, a named function, a string containing the name of a function, or an array containing any combination of 3. Each handler will receive an object containing the route variables or an empty object when no variables exist. Handlers may return false to prevent additional handlers from executing (the event "rona_handlers_executed" still gets triggered).
	 * @return {void}
	 */
	instance.route = function(uri, handlers) {

		// Convert the uri to an array.
		if (typeof uri === 'string')
			uri = [uri];

		uri.forEach(function(u) {

			// Format the URI.
			u = u.toString().toLowerCase();
			if (u == '/')
				u = '';

			// Validate & format the handlers.
			if (typeof handlers === 'undefined')
				return false;
			else if (Object.prototype.toString.call(handlers) !== '[object Array]')
				handlers = [handlers];

			// Add this route to the routes property. Currently, RonaJS does not attempt to merge handlers. That will need to be implemented.
			routes[u] = handlers;
		});
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
		var disable_handlers = typeof disable_handlers === 'boolean' ? disable_handlers : null;

		// Grab the requested URI and strip the base URI from it.
		var config_requested_uri = instance.config.requested_uri;
		if (typeof config_requested_uri === 'function')
			config_requested_uri = config_requested_uri();
		current_requested_uri = decodeURIComponent(config_requested_uri).replace(instance.config.base_uri, '');

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
				return typeof p2 === 'string' ? p2 : '([^/]+)';
			}) + '$', 'i');

			// Validate the requested URI against the regular expression.
			var current_requested_uri_matched = current_requested_uri.match(regex);
			if (current_requested_uri_matched != null) {

				// Reset route_var object
				route_vars = {};

				// Store the matching route's handlers in a variable.
				var handlers_to_execute = handlers;

				// Collect the route variables.
				if (typeof current_requested_uri_matched.length === 'number') {
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

			// Trigger an event and proceed if true is returned.
			if (trigger_event('rona_execute_handlers', true, {
				route_vars: route_vars,
				handlers: handlers_to_execute
			})) {

				// Loop thru the handlers.
				for (var idx in handlers_to_execute) {

					// Ensure the property exists.
					if (!handlers_to_execute.hasOwnProperty(idx))
						continue;

					// Grab the handler.
					var handler = handlers_to_execute[idx];

					// Execute the handler.
					var handler_response;
					if (typeof handler === 'function')
						handler_response = handler(instance.route_vars());
					else
						handler_response = window[handler](instance.route_vars());

					// If the handler responded with false, do not execute additional handlers.
					if (handler_response === false)
						break;
				}

				// Trigger an event.
				trigger_event('rona_handlers_executed');
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
		disable_handlers = typeof disable_handlers === 'boolean' ? disable_handlers : null;

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
	 * Get the current requested URI.
	 *
	 * @public
	 * @return   {string}   The current requested URI.
	 */
	instance.current_requested_uri = function() {
		return current_requested_uri;
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

	/**
	 * Create and dispatch a custom event.
	 *
	 * @param  {string}   type          The name of the event.
	 * @param  {Boolean}  cancelable    Whether or not Event.preventDefault() can prevent the event from moving forward.
	 * @param  {Object}   customData    Custom data that gets attached to the event detail property.
	 * @private
	 * @return {Boolean}                The return value is false if the event is cancelable and at least one of the event handlers which handled this event called Event.preventDefault(). Otherwise, it returns true.
	 *
	 * The "rona_" namespace is being used instead of ".rona" because ".rona" does not trigger the jQuery .on method.
	 */
	function trigger_event(type, cancelable, customData) {

		// Defaults
		var
			cancelable = typeof cancelable === 'boolean' ? cancelable : false,
			customData = typeof customData === 'object' ? customData : {};

		// For non-IE browsers:
		if (typeof CustomEvent === 'function') {
			var e = new CustomEvent(type, {
				cancelable: cancelable,
				detail: customData
			});
		}

		// While a window.CustomEvent object exists in IE 9-11, it cannot be called as a constructor. Instead of new CustomEvent(...), document.createEvent('CustomEvent') and e.initCustomEvent(...) must be used.
		else {
			var e = document.createEvent('CustomEvent');
			e.initCustomEvent(type, false, cancelable, customData);
		}

		// Dispatch the event and return the result.
		return document.dispatchEvent(e);
	}
};