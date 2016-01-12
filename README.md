# closest-facility-wab-js
Closest Facility widget for Esri JavaScript Web Application Builder

Description:
This widget uses the Network Analyst Closest Facility service to find routes from given events to facilities or locations of interest. The user supplies event locations, an optional barrier, the number of closest facilities to find, and a maximum travel time.
The resulting route symbology is fully configurable, and is drawn by a custom animation.

This is a deployable widget for Esri's Web AppBuilder. It demonstrates how to use the Network Analyst Closest Facility solver.

To use it, unzip it to your local disk. Then follow <a href="https://developers.arcgis.com/web-appbuilder/guide/deploy-custom-widget-and-theme.htm">these directions</a>. Once installed as a widget under your stemapp, you'll need to use the Web AppBuilder to create a new web app. When you configure the app's widgets, you should see the Closest Facility Widget appear in the list. It includes a configuration page in case you want to use your own facility dataset, change the result animation duration, etc.

Configuration:
This can be configured inside the Web Application Builder. Here are the configurable parameters:
* Closest Facility service - the closest facility network analyst solver service
* Facilities feature service - a feature service with any route facilities you want to use with the solver
* Route result order-by attribute - the name of the route attribute that contains the result rank assigned by the solver
* Route renderer attribute - the attribute the unique-value renderer should use when drawing the results
* Route animation duration - how long (in thousands of a second) the route-line-drawing animation should last

More parameters are configurable by editing config.json directly.

By the way, if you want to animate polyline features in your own apps or widgets, feel free to grab and use the included PolylineAnimation.js file. I made it modular so it could be used more easily.
