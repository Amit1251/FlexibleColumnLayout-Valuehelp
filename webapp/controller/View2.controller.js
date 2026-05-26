sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox",
    "sap/ui/core/BusyIndicator",
    
], (Controller, Filter, FilterOperator, Sorter, MessageBox, BusyIndicator) => {
    "use strict";

    return Controller.extend("project3.controller.View2", {
        onInit() {
            this.getOwnerComponent().getRouter().getRoute("View2").attachPatternMatched(this.onPatternMatched, this)
            
          
        },
        onPatternMatched: function (oEvent) {
            BusyIndicator.show();
            this.EmployeeId = oEvent.getParameter("arguments").empid;
            var objectPageModel = this.getOwnerComponent().getModel("objectPageModel");
            var oModel = this.getOwnerComponent().getModel();

            var pEmployeeId = new sap.ui.model.Filter("EmployeeID", sap.ui.model.FilterOperator.EQ, this.EmployeeId);
            var oFilterFreChecktyCheckout = new sap.ui.model.Filter([pEmployeeId], true);
            oModel.read("/Employees", {
                filters: [oFilterFreChecktyCheckout],

                success: function (oData) {
                    objectPageModel.setData(oData);
                     BusyIndicator.hide();
                    }.bind(this),
                    error: function (error) {
                        var errormsg = error.responseText;
                        var sContentType = error.headers['Content-Type'];
                        if (sContentType.includes("application/json")) {
                            // Parse JSON error response
                            var oErrorResponse = JSON.parse(errormsg);
                            errorMessage = oErrorResponse.error.message.value;
                        } else if (sContentType.includes("application/xml")) {
                            // Parse XML error response
                            var xmldoc = new DOMParser();
                            var xmdec = xmldoc.parseFromString(errormsg, "application/xml");
                            var errorMessage = xmdec.getElementsByTagName("message")[0].textContent;
                        }
    
                        MessageBox.error(errorMessage);
                        BusyIndicator.hide();
                    }   
                
            });
        },
        onEditToggleButtonPress: function() {
			var oObjectPage = this.getView().byId("ObjectPageLayout"),
				bCurrentShowFooterState = oObjectPage.getShowFooter();

			oObjectPage.setShowFooter(!bCurrentShowFooterState);
		},
        handleClose: function () {
			// var sNextLayout = this.oModel.getProperty("/actionButtonsInfo/midColumn/closeColumn");
			// this.oRouter.navTo("master", {layout: sNextLayout});

            var oApp = this.getOwnerComponent().getRootControl().byId("fapp");
            if (oApp && oApp.setLayout) {
                oApp.setLayout("OneColumn");
                this.getOwnerComponent().getRouter().navTo("View1")
            }
		},

        handleFullScreen: function () {
            var oApp = this.getOwnerComponent().getRootControl().byId("fapp");
            if (oApp && oApp.setLayout) {
                oApp.setLayout("MidColumnFullScreen");

            }
		},
        handleExitFullScreen:function(){
            var oApp = this.getOwnerComponent().getRootControl().byId("fapp");
            if (oApp && oApp.setLayout) {
                oApp.setLayout("TwoColumnsBeginExpanded");

            }
        }
        
       
    });
});