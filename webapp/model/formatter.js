sap.ui.define([
	], function () {
		"use strict";

		return {
			/**
			 * Rounds the currency value to 2 digits
			 *
			 * @public
			 * @param {string} sValue value to be formatted
			 * @returns {string} formatted currency value with 2 digits
			 */
			currencyValue : function (sValue) {
				if (!sValue) {
					return "";
				}

				return parseFloat(sValue).toFixed(2);
			},

	formatTime	: function(oTime) { 
		if(oTime){
			var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({pattern: "HH:mm:ss"});
			var TZOffsetMs = new Date(0).getTimezoneOffset()*60*1000;                             
			var timeStr = oTimeFormat.format(new Date(oTime.ms + TZOffsetMs));                      
			return timeStr;}
			else{
				return oTime;
			}
},
	formatDate: function(sDate){
		var sYear = sDate.substring(0,4);
		var sMonth = sDate.substring(4,6);
		var sDay = sDate.substring(6,8);
  // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
  var oDate= new Date(sYear, sMonth - 1, sDay); 
 oDate.setDate(oDate.getDate() + 1);
			if(oDate){
				var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance();
				return oDateFormat.format(oDate, 1);
			}else{
				return oDate;
			}
		}
		};

	}
);