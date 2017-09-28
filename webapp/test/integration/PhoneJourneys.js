jQuery.sap.require("sap.ui.qunit.qunit-css");
jQuery.sap.require("sap.ui.thirdparty.qunit");
jQuery.sap.require("sap.ui.qunit.qunit-junit");
QUnit.config.autostart = false;

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
		"zetms/test/integration/NavigationJourneyPhone",
		"zetms/test/integration/NotFoundJourneyPhone",
		"zetms/test/integration/BusyJourneyPhone"
	], function () {
		QUnit.start();
	});
});