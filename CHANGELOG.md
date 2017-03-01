---------- v. .7.2.0 ----------

- The default regular expression for route variables is now "([^/]+)". This matches anything but a forward slash and is applied to variables that do not define a regular expression.
- RonaJS now decodes the URI.
- URIs are now properly matched case-insensitive.

---------- v. .7.1.0 ----------

- Replaced "previous_requested_uri" and "route_vars" properties with methods of the same name.
- Updated README.md.

---------- v. .7.0.1 ----------

- Fixed bug - The constructor was referencing "this" incorrectly.

---------- v. .7.0.0 ----------

- Added documentation. Added commenting. Renamed and resorted properties and methods.

---------- v. .6.0.0 ----------

- Rewrote the routing engine to allow for regular expressions.

---------- v. .5.1.0 ----------

- Added query_params() method.