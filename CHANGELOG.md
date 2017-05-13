### v. .7.4.0

- Handlers may now return false to prevent additional handlers from executing. The event "rona_handlers_executed" still gets triggered.

---

### v. .7.3.0

- Added private trigger_event() method for triggering custom events. The method accounts for IE 9-11 compatibility.
- Added event "rona_execute_handlers" that gets triggered prior to the execution of handlers. The route vars and handlers are passed into the event detail property. The event is cancelable with e.preventDefault(). If canceled, the handlers will not be executed.
- Added event "rona_handlers_executed" that gets triggered after the execution of handlers. No data gets passed into the event and canceling the event is inconsequential.

---

### v. .7.2.0

- The default regular expression for route variables is now "([^/]+)". This matches anything but a forward slash and is applied to variables that do not define a regular expression.
- RonaJS now decodes the URI.
- URIs are now properly matched case-insensitive.

---

### v. .7.1.0

- Replaced "previous_requested_uri" and "route_vars" properties with methods of the same name.
- Updated README.md.

---

### v. .7.0.1

- Fixed bug - The constructor was referencing "this" incorrectly.

---

### v. .7.0.0

- Added documentation. Added commenting. Renamed and resorted properties and methods.

---

### v. .6.0.0

- Rewrote the routing engine to allow for regular expressions.

---

### v. .5.1.0

- Added query_params() method.