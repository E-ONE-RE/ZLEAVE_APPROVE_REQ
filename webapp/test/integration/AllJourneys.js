jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

// We cannot provide stable mock data out of the template.
// If you introduce mock data, by adding .json files in your webapp/localService/mockdata folder you have to provide the following minimum data:
// * At least 3 LeaveRequestSet in the list
// * All 3 LeaveRequestSet have at least one ToLeaveReqPos

sap.ui.require([
	"sap/ui/test/Opa5",
	"zetms/test/integration/pages/Common",
	"sap/ui/test/opaQunit",
	"zetms/test/integration/pages/App",
	"zetms/test/integration/pages/Browser",
	"zetms/test/integration/pages/Master",
	"zetms/test/integration/pages/Detail",
	"zetms/test/integration/pages/NotFound"
], function (Opa5, Common) {
	"use strict";
	Opa5.extendConfig({
		arrangements: new Common(),
		viewNamespace: "zetms.view."
	});

	sap.ui.require([
		"zetms/test/integration/MasterJourney",
		"zetms/test/integration/NavigationJourney",
		"zetms/test/integration/NotFoundJourney",
		"zetms/test/integration/BusyJourney",
		"zetms/test/integration/FLPIntegrationJourney"
	], function () {
		QUnit.start();
	});
});