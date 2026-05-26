/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["project3/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
