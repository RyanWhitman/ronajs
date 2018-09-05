/**
 * RonaJS is a JavaScript framework built in vanilla JavaScript.
 *
 * @copyright Copyright (c) 2018 Ryan Whitman (https://ryanwhitman.com)
 * @license https://opensource.org/licenses/MIT MIT
 * @version .7.8.0
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
		base_path: '',
		request_path: location.pathname
	};

	/**
	 * The routes.
	 *
	 * @private
	 * @type {Object}
	 */
	var routes = {};

	/**
	 * The request path.
	 *
	 * @private
	 * @type {string}
	 */
	var request_path = '';

	/**
	 * The previous request path.
	 *
	 * @private
	 * @type {string}
	 */
	var previous_request_path = '';

	/**
	 * The path variables for the matching route.
	 *
	 * @private
	 * @type {Object}
	 */
	var path_vars = {};

	/**
	 * Determines whether or not the execution of controllers is disabled.
	 *
	 * @private
	 * @type {boolean}
	 */
	var controllers_disabled = false;

	/**
	 * The scope object, which gets passed to each controller.
	 *
	 * @type {Object}
	 */
	var scope = {};

	/**
	 * The constructor.
	 */
	(function() {

		// Attach an event listener to the document to capture all click events.
		document.addEventListener('click', function(e) {

			// Determine whether or not the click occurred on an anchor element. The click can occur directly on the anchor or on a child element of the anchor. For the latter, utilize the event path for Chrome, composedPath for FF, and the parentNode for Edge and IE.
			var anchor = false;
			if (e.target.tagName.toLowerCase() == 'a')
				anchor = e.target;
			else {
				var path = e.path || (e.composedPath && e.composedPath());
				if (typeof path === 'object') {
					for (var i = 0; i < path.length; i++) {
						if (typeof path[i].tagName === 'string' && path[i].tagName.toLowerCase() == 'a') {
							anchor = path[i];
							break;
						}
					}
				} else if (typeof e.target.parentNode === 'object') {
					var node = e.target.parentNode;
					while (1) {
						if (typeof node.tagName === 'string' && node.tagName.toLowerCase() == 'a') {
							anchor = node;
							break;
						}
						if (typeof node.parentNode === 'object' && node.parentNode !== null)
							node = node.parentNode;
						else
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
	 * @param  {string}                   path         The path to attach a controller(s) to. The path should include both starting and ending slashes, as necessary. The path can be straight-forward and literal but can also contain variables and regular expressions. Variables are denoted with starting and closing curly braces. For example, `/my-page/{var1}`. By default, RonaJS interprets variables with a regular expression that matches anything but a forward slash. A custom regular expression can be passed in, as such: `/my-page/{var1([\\d]+)}`. In this example, RonaJS will now only accept digits for `var1`. Custom regular expressions that are tied to a route variable must be both parenthetically enclosed and escaped. Regular expressions do not necessarily need to be tied to a variable. They can be scattered throughout and RonaJS will match them against the request path. All paths have a case-insensitive match.
	 * @param  {string|Array|function}    controllers   A function(s) that will be executed for the provided path. This argument may contain an anonymous function, a named function, a string containing the name of a function, or an array containing any combination of 3. Each controller will receive an object containing the path variables or an empty object when no variables exist. Controllers may return false to prevent additional controllers from executing (the event "rona_controllers_executed" still gets triggered).
	 * @return {void}
	 */
	instance.route = function(path, controllers) {

		// Convert the path to an array.
		if (typeof path === 'string')
			path = [path];

		path.forEach(function(u) {

			// Format the path.
			u = u.toString().toLowerCase();
			if (u == '/')
				u = '';

			// Validate & format the controllers.
			if (typeof controllers === 'undefined')
				return false;
			else if (Object.prototype.toString.call(controllers) !== '[object Array]')
				controllers = [controllers];

			// Add this route to the routes property. Currently, RonaJS does not attempt to merge controllers. That will need to be implemented.
			routes[u] = controllers;
		});
	};

	/**
	 * Attempt to match the request path with a route and then execute the controllers, if enabled.
	 *
	 * @public
	 * @param  {boolean|null}   [disable_controllers=null]   Whether or not to disable the controllers. If null, RonaJS defers to the controllers_disabled property.
	 * @return {void}
	 */
	instance.execute = function(disable_controllers) {

		// Set default(s).
		var disable_controllers = typeof disable_controllers === 'boolean' ? disable_controllers : null;

		// Grab the request path and strip the base path from it.
		var config_request_path = instance.config.request_path;
		if (typeof config_request_path === 'function')
			config_request_path = config_request_path();
		request_path = decodeURIComponent(config_request_path).replace(instance.config.base_path, '');

		// When the request path is just essentially the domain, strip the slash from it.
		if (request_path == '/')
			request_path = '';

		// Loop thru each route.
		for (var route in routes) {

			// Ensure the property exists.
			if (!routes.hasOwnProperty(route))
				continue;

			// Grab the controllers.
			var controllers = routes[route];

			// Set a variable to hold the path variables.
			var path_vars_matched = [];

			// Create a regular expression to match the route.
			var regex = new RegExp('^' + route.replace(/{([\da-z_]*[\da-z]+[\da-z_]*)(\([\S ]+?\))?}/gi, function(match, p1, p2) {
				path_vars_matched.push(p1);
				return typeof p2 === 'string' ? p2 : '([^/]+)';
			}) + '$', 'i');

			// Validate the request path against the regular expression.
			var request_path_matched = request_path.match(regex);
			if (request_path_matched != null) {

				// Reset route_var object
				path_vars = {};

				// Store the matching route's controllers in a variable.
				var controllers_to_execute = controllers;

				// Collect the path variables.
				if (typeof request_path_matched.length === 'number') {
					for (var i = 1; i < request_path_matched.length; i++)
						path_vars[path_vars_matched[i - 1]] = request_path_matched[i];
				}
			}
		}

		// Proceed with executing the controllers only if the controllers are enabled.
		if (disable_controllers === false || (disable_controllers === null && controllers_disabled))
			return;

		// If controllers were found, execute them.
		if (typeof controllers_to_execute === 'object') {

			// Ensure the path_vars format is correct.
			if (typeof path_vars !== 'object')
				path_vars = {};

			// Trigger an event and proceed if true is returned.
			if (trigger_event('rona_execute_controllers', true, {
				path_vars: path_vars,
				controllers: controllers_to_execute
			})) {

				// Loop thru the controllers.
				for (var idx in controllers_to_execute) {

					// Ensure the property exists.
					if (!controllers_to_execute.hasOwnProperty(idx))
						continue;

					// Grab the controller.
					var controller = controllers_to_execute[idx];

					// Execute the controller.
					var controller_response;
					if (typeof controller === 'function')
						controller_response = controller(instance.path_vars(), scope);
					else
						controller_response = window[controller](instance.path_vars(), scope);

					// If the controller responded with false, do not execute additional controllers.
					if (controller_response === false)
						break;
				}

				// Trigger an event.
				trigger_event('rona_controllers_executed');
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
	 * @param  {string}               path                               The new path to take the user to.
	 * @param  {boolean|null}         [disable_controllers=null]   Whether or not to disable the controllers. If null, RonaJS defers to the controllers_disabled property.
	 * @return {void}
	 */
	instance.location = function(path, disable_controllers) {

		// Set default(s).
		disable_controllers = typeof disable_controllers === 'boolean' ? disable_controllers : null;

		// The previous path is now the request path.
		previous_request_path = request_path;

		// Use push state to change the address in the browser's address bar.
		window.history.pushState('', '', path);

		// Execute the new route.
		instance.execute(disable_controllers);
	};

	/**
	 * Reload the current route and scroll to the top of the page.
	 *
	 * @public
	 * @return {void}
	 */
	instance.reload = function() {
		instance.execute();
		window.scrollTo(0, 0);
	};

	/**
	 * Disable the execution of controllers.
	 *
	 * @public
	 * @return {void}
	 */
	instance.disable_controllers = function() {
		controllers_disabled = true;
	};

	/**
	 * Enable the execution of controllers.
	 *
	 * @public
	 * @return {void}
	 */
	instance.enable_controllers = function() {
		controllers_disabled = false;
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
	 * Get the request path.
	 *
	 * @public
	 * @return   {string}   The request path.
	 */
	instance.request_path = function() {
		return request_path;
	};

	/**
	 * Get the previous request path.
	 *
	 * @public
	 * @return   {string}   The previous request path.
	 */
	instance.previous_request_path = function() {
		return previous_request_path;
	};

	/**
	 * Get the path variables for the matching route.
	 *
	 * @public
	 * @return   {Object}   The path variables for the matching route.
	 */
	instance.path_vars = function() {
		return path_vars;
	};

	/**
	 * Create and dispatch a custom event.
	 *
	 * @param  {string}   type          The name of the event.
	 * @param  {Boolean}  cancelable    Whether or not Event.preventDefault() can prevent the event from moving forward.
	 * @param  {Object}   customData    Custom data that gets attached to the event detail property.
	 * @private
	 * @return {Boolean}                The return value is false if the event is cancelable and at least one of the event controllers which handled this event called Event.preventDefault(). Otherwise, it returns true.
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