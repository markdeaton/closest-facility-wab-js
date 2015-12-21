/* 
 * 1. Create an instance for each graphic to animate; pass in graphic, graphicsLayer, and duration (ms) to the constructor.
 * 2. Call animatePolyline()
 * Example:
 * 		var pla = new PolylineAnimation({
 *			graphic			: gpcConnector, 	// The polyline graphic you want to animate from 0 - 100%
 *			graphicsLayer	: glCityConnectors, // The graphics layer to display the graphic on (you haven't added the graphic yet)
 *			duration		: 2500				// How long the animation should last, in milliseconds
 *		});
 *		pla.animatePolyline();
 */
define(
	[
	  	"dojo/_base/declare",
	  	"dojo/_base/fx",
	  	"dojo/_base/lang",
	  	"esri/graphic",
	  	"esri/geometry/Point",
	  	"esri/geometry/Polyline"
  	], 
	function(
	  	declare,
	  	fx,
	  	lang,
	  	Graphic,
	  	Point,
	  	Polyline
	) { 
	  	return declare(null, {
	  		graphic			: null,
	  		graphicsLayer	: null,
	  		originalGeometry: null,
	  		duration		: null,
	  		pathInfos 		: null,
			
	  		constructor: function(parameters) {
	  			/**
	  			 * graphic 			: the polyline graphic to animate
	  			 * graphicsLayer	: the graphics layer to add the polyline to before and while animating
	  			 * duration			: the duration of the animation, in milliseconds 
	  			 */
	  			this.graphic = parameters.graphic;
	  			this.originalGeometry = parameters.graphic.geometry;
	  			this.graphicsLayer = parameters.graphicsLayer;
	  			this.duration = parameters.duration;
	  			this.pathInfos = [];
	  		},
	  		
			/* Calculate the geometry for a given (initialized graphic) and a given percentage */
			percentOfPolyline: function( percent ) {
			  var nFraction = percent / 100.0;
			  var plGeom = new Polyline( this.originalGeometry.spatialReference );
			  for ( var iPath = 0; iPath < this.pathInfos.length; iPath++ ) {
			    var oPath = this.pathInfos[ iPath ];
			    var nRequestedPathLen = oPath.pathLength * ( nFraction );
			    var nCurrentPathLen = 0; // Length of path-being-constructed
			    var aryPathPts = [];
			    
			    for ( var iSegment = 0; iSegment < oPath.segmentInfos.length; iSegment++ ) {
			      var oSegment = oPath.segmentInfos[ iSegment ];
			      
			      var ptSegmentStart = oSegment.startPoint; 
			      var ptSegmentEnd = oSegment.endPoint;
			      var nCurrentSegmentLen = oSegment.segmentLength;
			      
			      if ( iSegment == 0 ) aryPathPts.push( oSegment.startPoint );
			
			      // If this segment won't complete the requested percentage of the total path,
			      // add the whole segment
			      if ( nCurrentPathLen + nCurrentSegmentLen < nRequestedPathLen ) {
			        aryPathPts.push( ptSegmentEnd );
			        nCurrentPathLen += nCurrentSegmentLen;
			      }
			      // If this segment will complete or surpass the requested percentage of the total line,
			      // it's the last segment; calculate the proper percentage to add
			      else {
			        var nPathLenStillNeeded =  nRequestedPathLen - nCurrentPathLen;
			        var nPctOfThisPathNeeded = nPathLenStillNeeded / nCurrentSegmentLen;
			        var nDeltaX = (ptSegmentEnd.x - ptSegmentStart.x) * nPctOfThisPathNeeded;
			        var nDeltaY = (ptSegmentEnd.y - ptSegmentStart.y) * nPctOfThisPathNeeded;
			        var ptNewEnd = new Point(ptSegmentStart.x + nDeltaX, ptSegmentStart.y + nDeltaY, this.originalGeometry.spatialReference);
			        aryPathPts.push( ptNewEnd );
			        
			        // And exit the loop
			        break;
			      }
			    }
			    plGeom.addPath( aryPathPts );
			  }
			  return plGeom;
			},
			
	   			// Do necessary, initial calculations about the polyline's paths and segments
			initPolyline: function() {
			  this.graphic.visible = false;
			  this.graphicsLayer.add(this.graphic);
			  // Make a record of the original, full geometry
			  var pln = this.originalGeometry;
			  // Get info about the various paths and their lengths
			  for ( var iPath = 0; iPath < pln.paths.length; iPath++ ) {
			    var aryPath = pln.paths[ iPath ];
			    var arySegmentsForPath = [];
			    var nPathLen = 0;
			    
			    // Store each pair of points in the path, plus the distance between them
			    for ( var iPathPt = 1; iPathPt < aryPath.length; iPathPt++ ) {
			      var ptStart = new Point( aryPath[ iPathPt - 1 ][ 0 ], aryPath[ iPathPt - 1 ][ 1 ], pln.spatialReference );
			      var ptEnd = new Point( aryPath[ iPathPt ][ 0 ], aryPath[ iPathPt ] [ 1 ], pln.spatialReference );
			      
			      // Figure out distance between start/end point using pythagorean theorem (this needs improvement)
			      var nSegmentLen = Math.sqrt( Math.pow( ptEnd.x - ptStart.x, 2 ) + Math.pow( ptEnd.y - ptStart.y, 2 ) );
			                
			      arySegmentsForPath.push( {
			        "startPoint"    : ptStart,
			        "endPoint"      : ptEnd,
			        "segmentLength" : nSegmentLen
			      } );
			      nPathLen += nSegmentLen;
			    }
			    
			    this.pathInfos.push( {
			      "segmentInfos"  : arySegmentsForPath,
			      "pathLength"    : nPathLen
			    } );
			  }
			},
			
	        updatePolyline: function(percent){
	          var geometry = this.percentOfPolyline(percent);
	          this.graphic.setGeometry(geometry);
	        },
	        
	     	animatePolyline: function(){
	          fx.animateProperty({
	            node: dojo.create('div'),
	            properties:{
	             along:{
	                start:0,
	                end:100
	              }
	            },
	            duration: this.duration,
	            beforeBegin: this.initPolyline(),
	            onAnimate: lang.hitch(this, function(values){
	              // values assumes to be in pixels so we need to remove px from the end...
	              var percent = parseFloat(values.along.replace(/px/,''));
	              this.updatePolyline(percent);
	              if (!this.graphic.visible) this.graphic.visible = true;
	            }),
	            onEnd: lang.hitch(this, function() {
	            	this.graphic.setGeometry(this.originalGeometry);
	            })
	          }).play();
	        }

	  	});
	}
);