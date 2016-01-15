define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/on', 
  'dojo/dom',
  'dijit/registry',
  'dojo/dom-construct',
  'dojo/query',
  'dojox/widget/Standby',
  'jimu/BaseWidget',
  'esri/config',
  'esri/Color',
  'esri/layers/GraphicsLayer',
  'esri/layers/FeatureLayer',
  'esri/renderers/UniqueValueRenderer',
  'esri/graphicsUtils',
  'esri/toolbars/draw',
  'esri/graphic',
  'esri/symbols/SimpleMarkerSymbol',
  'esri/symbols/SimpleLineSymbol',
  'esri/tasks/FeatureSet',
  'esri/tasks/ClosestFacilityTask',
  'esri/tasks/ClosestFacilityParameters',
  'esri/tasks/ClosestFacilitySolveResult',
  'esri/tasks/NATypes',
  './widgets/ClosestFacility/PolylineAnimation.js'
  ],
  function(declare, lang, on, dom, registry, domConstruct, query, 
            Standby,
            BaseWidget, 
            esriConfig,
            Color,
            GraphicsLayer, FeatureLayer, 
            UniqueValueRenderer,
            graphicsUtils, Draw,
            Graphic,
            SimpleMarkerSymbol, SimpleLineSymbol,
            FeatureSet,
            ClosestFacilityTask, ClosestFacilityParameters, ClosestFacilitySolveResult, NATypes,
            PolylineAnimation) {
               
/*     require(["/WAB_CF/widgets/ClosestFacility/PolylineAnimation.js"], function() {
        console.log("Load animation class");
    }); */
    var m_lyrResultRoutes, m_lyrAllFacilities, m_lyrEvents, m_lyrBarriers;
    var m_drawToolbar;
    
    var m_aryResultSymbolInfos; // Symbols for ranked results
    
    // Event handlers needing later removal
    var m_zoomToFacilities, m_clickDrawEvent, m_clickDrawBarrier, 
        m_clickSolve, m_clickClear, m_changeFacilitiesCount, 
        m_chkLimitTravelTime, m_numMaxTravelTime;
    // Closest Facility solver objects
    var m_closestFacilityTask;
    // Busy indicator handle
    var m_busyIndicator;
    
    //To create a widget, you need to derive from BaseWidget.
    return declare([BaseWidget], {
      // Custom widget code goes here

      baseClass: 'jimu-widget-customwidget'

      //this property is set by the framework when widget is loaded.
      ,name: 'ClosestFacilityWidget'

      //methods to facilitate communication with app container:

      ,postCreate: function() {
        this.inherited(arguments);
        console.log('postCreate');

        m_lyrAllFacilities = new FeatureLayer(
            this.config.facilities.url, {"mode":FeatureLayer.MODE_SNAPSHOT, "outFields":["*"]});
        m_zoomToFacilities = m_lyrAllFacilities.on('update-end', this.zoomToFacilities);
        
        m_lyrResultRoutes = new GraphicsLayer();
        m_lyrEvents = new GraphicsLayer();
        m_lyrBarriers = new GraphicsLayer();
        
        var slsDefault = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([32, 32, 32]), 2);
        var resultRenderer = new UniqueValueRenderer(slsDefault, this.config.symbology.routeRenderer.field1);
        for (var i = 0; i < this.config.symbology.routeRenderer.uniqueValueInfos.length; i++) {
            var info = this.config.symbology.routeRenderer.uniqueValueInfos[i];
            var sls = new SimpleLineSymbol(info.style, info.sym.color, info.sym.width);
            resultRenderer.addValue(info.value, sls);
        }
        m_lyrResultRoutes.setRenderer(resultRenderer);
        
        m_drawToolbar = new Draw(this.map);
        var sms = new SimpleMarkerSymbol(this.config.symbology.eventSymbol);
        m_drawToolbar.setMarkerSymbol(sms);
        var sls = new SimpleLineSymbol(this.config.symbology.barrierSymbol);
        m_drawToolbar.setLineSymbol(sls);
        m_drawToolbar.on("draw-complete", lang.hitch(this, this.onDrawEvent));
        
        m_closestFacilityTask = new ClosestFacilityTask(this.config.closestFacilitySvc.url);
      }

      ,startup: function() {
        this.inherited(arguments);
        console.log('startup');
        
        // Add ranks and colors from config
        var rankNumbers = dom.byId("trRankNumbers");
        var rankColors = dom.byId("trRankColors");
        for (var i = 0; i < this.config.symbology.routeRenderer.uniqueValueInfos.length; i++) {
            var info = this.config.symbology.routeRenderer.uniqueValueInfos[i];
            var className = this.getRankSymbolDomClassName(info.value);
            var aryColor = info.sym.color;
            
            var tdRankNumber = '<td class="' + className + '" '
                + 'style="text-align:center;">' + info.value + '</td>';
            domConstruct.place(tdRankNumber, rankNumbers);
            
            var tdRankColor = '<td class="' + className + '" ' +
                'style="background-color:rgba(' +
                    aryColor[0] + ',' + aryColor[1] + ',' + aryColor[2] + ',' + aryColor[3] + ')' +
                ';width:15px;height:15px;">&nbsp;</td>'
            domConstruct.place(tdRankColor, rankColors);
        }
        
        // Create busy indicator
        m_busyIndicator = new Standby({target: "busyIndicator"}); 
        document.body.appendChild(m_busyIndicator.domNode);
        m_busyIndicator.startup();
     }

      ,onOpen: function(){
        console.log('onOpen');

        this.map.addLayer(m_lyrAllFacilities);
        this.map.addLayer(m_lyrResultRoutes);
        this.map.addLayer(m_lyrBarriers);
        this.map.addLayer(m_lyrEvents);
        
        m_clickDrawEvent = on(dom.byId("btnDrawEvent"), "click", this.onClickDrawEvent);
        m_clickDrawBarrier = on(dom.byId("btnDrawBarrier"), "click", this.onClickDrawBarrier);
        m_clickSolve = on(dom.byId("btnSolve"), "click", lang.hitch(this, this.onClickSolve));
        m_clickClear = on(dom.byId("btnClear"), "click", lang.hitch(this, this.onClickClear));
        m_chkLimitTravelTime = on(dom.byId("chkLimitTravelTime"), "change", lang.hitch(this, this.onCheckLimitTravelTime));
        m_numMaxTravelTime = on(dom.byId("numMaxTravelTime"), "change", lang.hitch(this, this.onChangeMaxTravelTime));
        
        var numFacilities = dom.byId("numFacilities");
        m_changeFacilitiesCount = on(numFacilities, "change", lang.hitch(this, this.onChangeFacilitiesCount));
        on.emit(numFacilities, "change", { bubbles: true, cancelable: true });
      }

      ,onClose: function(){
        console.log('onClose');

        this.map.removeLayer(m_lyrBarriers);
        this.map.removeLayer(m_lyrEvents);
        this.map.removeLayer(m_lyrAllFacilities);
        this.map.removeLayer(m_lyrResultRoutes);
        
        m_clickDrawEvent.remove();
        m_clickDrawBarrier.remove();
        m_clickSolve.remove();
        m_clickClear.remove();
        m_changeFacilitiesCount.remove();
        m_chkLimitTravelTime.remove();
        m_numMaxTravelTime.remove();
      }

      // onMinimize: function(){
      //   console.log('onMinimize');
      // },

      // onMaximize: function(){
      //   console.log('onMaximize');
      // },

      // onSignIn: function(credential){
      //   /* jshint unused:false*/
      //   console.log('onSignIn');
      // },

      // onSignOut: function(){
      //   console.log('onSignOut');
      // }

      // onPositionChange: function(){
      //   console.log('onPositionChange');
      // },

      // resize: function(){
      //   console.log('resize');
      // }

      //methods to communication between widgets:

        // Other methods
        ,zoomToFacilities: function(event) {
            var extent = graphicsUtils.graphicsExtent(event.target.graphics);
            event.target.getMap().setExtent(extent);
            m_zoomToFacilities.remove();
        }
/*         ,zoomToResults: function(lyrResults) {
            var extent = graphicsUtils.graphicsExtent(lyrResults.graphics);
            this.map.setExtent(extent);
        } */
        
        ,onClickDrawEvent: function() {
            console.log("Draw Event Click");
            m_drawToolbar.activate(Draw.POINT);
        }
        ,onClickDrawBarrier: function() {
            console.log("Draw Barrier");
            m_drawToolbar.activate(Draw.POLYLINE);
        }
        
        ,onDrawEvent: function(event) {
            console.log("Draw Event Complete");
            m_drawToolbar.deactivate();
            
            var geom = event.geometry;
            if (event.geometry.type === "point") {
                var symbol = event.target.markerSymbol;
                var graphic = new Graphic(geom, symbol);
                m_lyrEvents.add(graphic);
                this.checkSolveEnabledState();
            } else if (event.geometry.type === "polyline") {
                var symbol = event.target.lineSymbol;
                var graphic = new Graphic(geom, symbol);
                m_lyrBarriers.add(graphic);
            }
            
        }
        
        ,onClickSolve: function() {
            console.log("Solve");
            var params = new ClosestFacilityParameters();
            
            var facilities = this.fs4gl(m_lyrAllFacilities);
            params.facilities = facilities;
            
            var events = this.fs4gl(m_lyrEvents);
            params.incidents = events;
            
            var barriers = this.fs4gl(m_lyrBarriers);
            params.polylineBarriers = barriers;
            
            params.defaultCutoff = (dom.byId("chkLimitTravelTime").checked 
                ? dom.byId("numMaxTravelTime").value
                : Number.MAX_VALUE );
            params.defaultTargetFacilityCount = numFacilities.value;
            params.outSpatialReference = this.map.spatialReference;
            params.outputLines = NATypes.OutputLine.TRUE_SHAPE;
            params.returnFacilities = true;
            
            m_busyIndicator.show();
            dom.byId("btnSolve").disabled = "disabled";
            
            m_closestFacilityTask.solve(params, 
                lang.hitch(this, this.onSolveSucceed),
                function(err) {
                    console.log("Solve Error");
                    m_busyIndicator.hide();
                    dom.byId("btnSolve").disabled = "";
                    alert(err.message + ": " + err.details[0]);
                });
        }
        
        ,onSolveSucceed: function(result) {
            console.log("Solve Callback");
            m_busyIndicator.hide();
            dom.byId("btnSolve").disabled = "";

             var routes = result.routes;
            routes.sort(lang.hitch(this, function(g1, g2) {
                var rank1 = g1.attributes[this.config.symbology.routeZOrderAttrName];
                var rank2 = g2.attributes[this.config.symbology.routeZOrderAttrName];
                // Reverse sort
                return rank2 - rank1;
            }));
            m_lyrResultRoutes.clear();
            for (var i = 0; i < routes.length; i++) {
                var g = routes[i];
                 // Set animation here?
				var pla = new PolylineAnimation({
					graphic			: g, 
					graphicsLayer	: m_lyrResultRoutes,
					duration		: this.config.symbology.animateRoutesDuration
				});
				pla.animatePolyline();
             }
             // Zoom to results?
             // graphicsUtil.graphicsExtent() not working properly
/*              if (dom.byId("chkZoomToResults").checked) 
                 this.zoomToResults(m_lyrResultRoutes); */
        }
        
        ,onClickClear: function() {
            console.log("Clear");
            m_lyrEvents.clear();
            m_lyrBarriers.clear();
            m_lyrResultRoutes.clear();
            this.checkSolveEnabledState();
        }
        
        ,onChangeFacilitiesCount: function(event) {
            console.log("Change Facilities Count: " + event.currentTarget.value);
            var count = event.currentTarget.value;
            for (var i = 0; i < this.config.symbology.routeRenderer.uniqueValueInfos.length; i++) {
                var className = this.getRankSymbolDomClassName(i+1);
                if ( i+1 <= count)
                    query("." + className).style("visibility", "visible");
                else
                    query("." + className).style("visibility", "hidden");
            }
        }
        
        ,getRankSymbolDomClassName: function(rank) {
            return "rank" + rank;
        }
        
        ,checkSolveEnabledState: function() {
            dom.byId("btnSolve").disabled = (m_lyrEvents.graphics.length > 0 ? "" : "disabled");
        }
        ,onCheckLimitTravelTime: function(event) {
            dom.byId("numMaxTravelTime").disabled = (event.target.checked ? "" : "disabled");
        }
        ,onChangeMaxTravelTime: function(event) {
            console.log("Change Max Travel Time");
            // Check for valid number
            if (!this.isPositiveInt(event.target.value))
                event.target.value = event.target.oldValue;
            // Update old value
            else
                event.target.oldValue = event.target.value;
        }
        ,isPositiveInt: function(str) {
            // Taken from StackOverflow post, http://stackoverflow.com/questions/10834796/validate-that-a-string-is-a-positive-integer
            var n = ~~Number(str);
            return String(n) === str && n >= 0;
        }
        
        ,fs4gl: function( lyrGraphics ) {
            var fs = new FeatureSet();
            fs.features = lyrGraphics.graphics;
            return fs;
        }
    });
  });