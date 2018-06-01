# RonaJS

RonaJS is a JavaScript framework built in vanilla JavaScript.

## Current Version

.7.6.0

## Installation

RonaJS is contained within a single JavaScript file. Both a regular and compressed version can be found in the `/dist` directory. Upon download, place the file in the directory-of-choice within your project and include the source file.

**Example:**

``` HTML
<script src="/assets/js/rona.min.js"></script>
```

## Get Started

RonaJS is a single class file and will typically be instantiated into an object once. Typically, the first step is to store the RonaJS object in a JavaScript variable, as such: `var router = new Rona();`. The RonaJS object exposes of a number of methods for the developer to utilize. Of most importance is the `route()` method as this is how a developer creates a route - A path that executes any number of controllers. Below is a simple example in which we instantiate RonaJS, add a single route, and execute RonaJS. For the sake of the example, the user lands at `https://example.com/my-page`.

``` javascript
// Instantiate RonaJS.
var router = new rona();

// Add a route.
router.route('/my-page', function() {

	// Welcome the user.
	alert('Hi, welcome to your page!');
});

// Execute RonaJS.
router.execute();
```
The example above is obviously very simple but, essentially, those are the only steps necessary to run RonaJS.

## Methods

RonaJS exposes a number of methods, some being simple and straightforward, others being more complex with more options. Below, we attempt to sufficiently cover all methods exposed by RonaJS. This list should be considered to be all-inclusive.

### route

Add a route.

**Parameters**

-   `path` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The path to attach a controller(s) to. The path should include both starting and ending slashes, as necessary. The path can be straight-forward and literal but can also contain variables and regular expressions. Variables are denoted with starting and closing curly braces. For example, `/my-page/{var1}`. By default, RonaJS interprets variables with a regular expression that matches anything but a forward slash. A custom regular expression can be passed in, as such: `/my-page/{var1([\\d]+)}`. In this example, RonaJS will now only accept digits for `var1`. Custom regular expressions that are tied to a route variable must be both parenthetically enclosed and escaped. Regular expressions do not necessarily need to be tied to a variable. They can be scattered throughout and RonaJS will match them against the request path. All paths have a case-insensitive match.
-   `controllers` **([string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) \| [Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) \| [function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function))** A function(s) that will be executed for the provided path. This argument may contain an anonymous function, a named function, a string containing the name of a function, or an array containing any combination of 3. Each controller will receive an object containing the path variables or an empty object when no variables exist. Controllers may return false to prevent additional controllers from executing (the event "rona_controllers_executed" still gets triggered).

Returns **void**

**Example 1:** A path containing 1 literal match and a regular expression match.

``` javascript
router.route('/my-page/[\d]+', function() {});
```
Example of a matching request: `https://example.com/my-page/123`

**Example 2:** A path containing a variable match.

``` javascript
router.route('{var1}', function(path_vars) {});
```
Example of a matching request: `https://example.com/my-page` (`var1` will equal `my-page`)

**Example 3:** A path containing both a literal match and variable matches.
``` javascript
router.route('/my-page/{section}/{page_num}', function(path_vars) {});
```
Example of a matching request: `https://example.com/my-page/about/page1` (`section` will equal `about`; `page_num` will equal `page1`)

**Example 4:** A path containing a literal match, a variable match, and a variable match that utilizes a regular expression.
``` javascript
router.route('/my-page/{section}/{page_num([\d]+)}', function(path_vars) {});
```
Example of a matching request: `https://example.com/my-page/about/1` (`section` will equal `about`; `page_num` will equal `1`)

**Example 5:** A path containing a literal match, a variable match, and a variable match that utilizes a regular expression. Additionally, an array of named functions is passed in for the controllers.
``` javascript
function controller1(path_vars) {}

function controller2(path_vars) {}

router.route('/my-page/{section}/{page_num([\d]+)}', [controller1, controller2]);
```
Example of a matching request: `https://example.com/my-page/about/10` (`section` will equal `about`; `page_num` will equal `10`)

---

### execute

Attempt to match the request path with a route and then execute the controllers, if enabled.

**Parameters**

-   `disable_controllers` **([boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | null)?** Whether or not to disable the controllers. If null, RonaJS defers to the controllers_disabled property. (optional, default `null`)

Returns **void**

---

### get_routes

Get all routes.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The routes.

---

### location

Change the current route.

**Parameters**

-   `path` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The new path to take the user to.
-   `disable_controllers` **([boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean) | null)?** Whether or not to disable the controllers. If null, RonaJS defers to the controllers_disabled property. (optional, default `null`)

Returns **void**

---

### reload

Reload the current route.

Returns **void**

---

### disable_controllers

Disable the execution of controllers.

Returns **void**

---

### enable_controllers

Enable the execution of controllers.

Returns **void**

---

### query_params

Parse the query string and get the query parameters as an object.

**Parameters**

-   `param_name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** If passed in, the value for that specific query parameter will be returned. (optional, default `null`)

Returns **([Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) \| [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String))** The query parameters as an object. If a param_name is passed in, that specific value will be returned.

---

### request_path

Get the request path.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The request path.

---

### previous_request_path

Get the previous request path.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** The previous request path.

---

### path_vars

Get the path variables for the matching path.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** The path variables for the matching path.

## Events

RonaJS dispatches several events that can be hooked into.

### rona_execute_controllers

Gets triggered prior to the execution of controllers. The route vars and controllers are passed into the event detail property. The event is cancelable with e.preventDefault(). If canceled, the controllers will not be executed.

**Example:**
```javascript
document.addEventListener('rona_execute_controllers', function(e) {

	// The route vars and controllers are passed into the e.detail property.
	console.log(e.detail);

	// The execution of controllers can be canceled.
	e.preventDefault();
});
```

---

### rona_controllers_executed

Gets triggered after the execution of controllers. No data gets passed into the event and canceling the event is inconsequential.

## Other

RonaJS will automatically execute when an anchor element with `data-rona` is clicked.

**Example:**

``` HTML
<a href="/my-page" data-rona>My Page</a>
```