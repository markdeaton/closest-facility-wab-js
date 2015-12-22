# closest-facility-wab-js
Closest Facility widget for Esri JavaScript Web Application Builder

Description:
This widget uses the Network Analyst Closest Facility service to find routes from given events to facilities or locations of interest. The user supplies event locations, an optional barrier, the number of closest facilities to find, and a maximum travel time.
The resulting route symbology is fully configurable, and is drawn by a custom animation.

Configuration:
This can be configured inside the Web Application Builder. Here are the configurable parameters:
* Closest Facility service - the closest facility network analyst solver service
* Facilities feature service - a feature service with any route facilities you want to use with the solver
* Attribute accumulation attribute - the name of the network analyst attribute you want the solver to use as an accumulator; for more information look for "accumulateAttributeNames" <a href="http://resources.arcgis.com/en/help/arcgis-rest-api/#/Solve_Closest_Facility/02r3000000t2000000/">here</a>.
* Route result order-by attribute - the name of the route attribute that contains the result rank assigned by the solver
* Route renderer attribute - the attribute the unique-value renderer should use when drawing the results
* Route animation duration - how long (in thousands of a second) the route-line-drawing animation should last

