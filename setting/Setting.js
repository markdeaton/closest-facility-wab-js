///////////////////////////////////////////////////////////////////////////
// Copyright © 2014 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'jimu/BaseWidgetSetting'
],
function(declare, BaseWidgetSetting) {

  return declare([BaseWidgetSetting], {
    baseClass: 'jimu-widget-demo-setting',

    postCreate: function(){
      //the config object is passed in
      this.setConfig(this.config);
    },

    setConfig: function(config){
      this.svcCF.value = config.closestFacilitySvc.url;
      this.svcFacilities.value = config.facilities.url;
      this.attrAccumulator.value = config.routeRequestAccumulateAttributes.attrName;
      this.attrRank.value = config.symbology.routeZOrderAttrName;
      this.attrUVRender.value = config.symbology.routeRenderer.field1;
      this.durationRouteAnim.value = config.symbology.animateRoutesDuration;
    },

    getConfig: function(){
        //WAB will get config object through this method
        this.config.closestFacilitySvc.url = this.svcCF.value;
        this.config.facilities.url = this.svcFacilities.value;
        this.config.routeRequestAccumulateAttributes.attrName = this.attrAccumulator.value;
        this.config.symbology.routeZOrderAttrName = this.attrRank.value;
        this.config.symbology.routeRenderer.field1 = this.attrUVRender.value;
        this.config.symbology.animateRoutesDuration = this.durationRouteAnim.value;
      
        return this.config;
    }
  });
});