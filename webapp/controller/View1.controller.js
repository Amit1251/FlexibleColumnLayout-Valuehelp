sap.ui.define([
    "sap/ui/core/mvc/Controller",
	"sap/ui/model/Sorter",
	"sap/m/MessageBox",
	"sap/ui/core/BusyIndicator",
    'sap/ui/comp/library',
    'sap/ui/model/type/String',
	'sap/m/ColumnListItem',
    'sap/m/Label',
	'sap/m/SearchField',
	'sap/m/Token',
	'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',
	'sap/ui/model/odata/v2/ODataModel',
	'sap/ui/table/Column',
	'sap/m/Column',
	'sap/m/Text'
    
    
], (Controller, Sorter, MessageBox, BusyIndicator ,compLibrary,TypeString, ColumnListItem,Label, SearchField, Token, Filter, FilterOperator, ODataModel, UIColumn, MColumn,Text) => {
    "use strict";

    return Controller.extend("project3.controller.View1", {
        onInit() {

            //-----------------------------------------------------------------------
            var oMultiInput, oMultiInputWithSuggestions;
			// Value Help Dialog standard use case with filter bar without filter suggestions
			oMultiInput = this.byId("multiInput");
			this._oMultiInput1 = this.byId("multiInput2");
			oMultiInput.addValidator(this._onMultiInputValidate);
			// oMultiInput.setTokens(this._getDefaultTokens());
			this._oMultiInput = oMultiInput;

            //------------------------------------------------------------------------

            BusyIndicator.show();
            var overviewcmodel = this.getOwnerComponent().getModel("overviewcmodel");
            var oModel = this.getOwnerComponent().getModel();
            oModel.read("/Employees", {
                success: function (data) {

                    overviewcmodel.setData(data);
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
        onListItemPress: function (oEvent) {
            var oItem = oEvent.getSource();
            var oBindingContext = oItem.getBindingContext("overviewcmodel");
            if (!oBindingContext) {
                return;
            }

            var oSelectedData = oBindingContext.getObject();
            var empid = oSelectedData.EmployeeID;
           
          
            var oApp = this.getOwnerComponent().getRootControl().byId("fapp");
            if (oApp && oApp.setLayout) {
                oApp.setLayout("TwoColumnsBeginExpanded");
                this.getOwnerComponent().getRouter().navTo("View2",{
                    empid : empid
                })
            }
        },

        //--------------------------------------------------------------------------------

        // #region Value Help Dialog standard use case with filter bar without filter suggestions
		onValueHelpRequested: function() {
			this._oBasicSearchField = new SearchField();
			this.loadFragment({
				name: "project3.View.ValueHelpDialog"
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar(), oColumnProductCode, oColumnProductName;
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);
				oFilterBar.setBasicSearch(this._oBasicSearchField);

				// Trigger filter bar search when the basic search is fired
				this._oBasicSearchField.attachSearch(function() {
					oFilterBar.search();
				});

				oDialog.getTableAsync().then(function (oTable) {

					oTable.setModel(this.oProductsModel);

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/Employees",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oColumnProductCode = new UIColumn({label: new Label({text: "Title of Job"}), template: new Text({wrapping: false, text: "{Title}"})});
						oColumnProductCode.data({
							fieldName: "Title"
						});
						oColumnProductName = new UIColumn({label: new Label({text: "FirstName"}), template: new Text({wrapping: false, text: "{FirstName}"})});
						oColumnProductName.data({
							fieldName: "FirstName"
						});
						oTable.addColumn(oColumnProductCode);
						oTable.addColumn(oColumnProductName);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/Employees",
							template: new ColumnListItem({
								cells: [new Label({text: "{Title}"}), new Label({text: "{FirstName}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "Title of Job"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "FirstName"})}));
					}
					oDialog.update();
				}.bind(this));

				// oDialog.setTokens(this._oMultiInput.getTokens());
				 oDialog.open();
			}.bind(this));
		},

		onValueHelpOkPress: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
            if (aTokens && aTokens.length > 0) {
                // Get the text or key from the first token
                var sText = aTokens[0].getKey(); // or .getKey() if you want the key
                this._oMultiInput.setValue(sText);
            } else {
                this._oMultiInput.setValue(""); // Clear if nothing selected
            }
			this._oVHD.close();
		},

		onValueHelpCancelPress: function () {
			this._oVHD.close();
		},

		onValueHelpAfterClose: function () {
			this._oVHD.destroy();
		},

        //---------------------------------------------------------------------------------------------------
		//** FilterBarSearch */

		onFilterBarSearch: function (oEvent) {
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");

			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			aFilters.push(new Filter({
				filters: [
					 new Filter({ path: "Title", operator: FilterOperator.Contains, value1: sSearchQuery }),
					 new Filter({ path: "FirstName", operator: FilterOperator.Contains, value1: sSearchQuery })
				],
				and: false
			}));

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},



		//--------------------------------------------------------------------------------------


		_filterTable: function (oFilter) {
			var oVHD = this._oVHD;

			oVHD.getTableAsync().then(function (oTable) {
				if (oTable.bindRows) {
					oTable.getBinding("rows").filter(oFilter);
				}
				if (oTable.bindItems) {
					oTable.getBinding("items").filter(oFilter);
				}

				// This method must be called after binding update of the table.
				oVHD.update();
			});
		},




		//-------------------------------------------------------------------------------------------
		//** Second Value Help */

		onValueHelpRequested1: function() {
			this._oBasicSearchField = new SearchField();
			this.loadFragment({
				name: "project3.View.SupplierF4Dialog"
			}).then(function(oDialog) {
				var oFilterBar = oDialog.getFilterBar(), oColumnProductCode, oColumnProductName;
				this._oVHD = oDialog;

				this.getView().addDependent(oDialog);

				// Set Basic Search for FilterBar
				oFilterBar.setFilterBarExpanded(false);
				oFilterBar.setBasicSearch(this._oBasicSearchField);

				// Trigger filter bar search when the basic search is fired
				this._oBasicSearchField.attachSearch(function() {
					oFilterBar.search();
				});

				oDialog.getTableAsync().then(function (oTable) {

					oTable.setModel(this.oProductsModel);

					// For Desktop and tabled the default table is sap.ui.table.Table
					if (oTable.bindRows) {
						// Bind rows to the ODataModel and add columns
						oTable.bindAggregation("rows", {
							path: "/Products",
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oColumnProductCode = new UIColumn({label: new Label({text: "ProductName"}), template: new Text({wrapping: false, text: "{ProductName}"})});
						oColumnProductCode.data({
							fieldName: "ProductName"
						});
						// oColumnProductName = new UIColumn({label: new Label({text: "FirstName"}), template: new Text({wrapping: false, text: "{FirstName}"})});
						// oColumnProductName.data({
						// 	fieldName: "FirstName"
						// });
						oTable.addColumn(oColumnProductCode);
						// oTable.addColumn(oColumnProductName);
					}

					// For Mobile the default table is sap.m.Table
					if (oTable.bindItems) {
						// Bind items to the ODataModel and add columns
						oTable.bindAggregation("items", {
							path: "/Products",
							template: new ColumnListItem({
								cells: [new Label({text: "{ProductName}"}), new Label({text: "{ProductName}"})]
							}),
							events: {
								dataReceived: function() {
									oDialog.update();
								}
							}
						});
						oTable.addColumn(new MColumn({header: new Label({text: "ProductName"})}));
						oTable.addColumn(new MColumn({header: new Label({text: "ProductName"})}));
					}
					oDialog.update();
				}.bind(this));

				// oDialog.setTokens(this._oMultiInput.getTokens());
				 oDialog.open();
			}.bind(this));
		},


		onValueHelpOkPress1: function (oEvent) {
			var aTokens = oEvent.getParameter("tokens");
            if (aTokens && aTokens.length > 0) {
                // Get the text or key from the first token
                var sText = aTokens[0].getKey(); // or .getKey() if you want the key
                this._oMultiInput1.setValue(sText);
            } else {
                this._oMultiInput1.setValue(""); // Clear if nothing selected
            }
			this._oVHD.close();
		},

		onValueHelpCancelPress1: function () {
			this._oVHD.close();
		},

		onValueHelpAfterClose1: function () {
			this._oVHD.destroy();
		},





		//----------------------------------------------------------------------------------------

		//** FilterBarSearch */

		onFilterBarSearch1: function (oEvent) {
			var sSearchQuery = this._oBasicSearchField.getValue(),
				aSelectionSet = oEvent.getParameter("selectionSet");

			var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
				if (oControl.getValue()) {
					aResult.push(new Filter({
						path: oControl.getName(),
						operator: FilterOperator.Contains,
						value1: oControl.getValue()
					}));
				}

				return aResult;
			}, []);

			aFilters.push(new Filter({
				filters: [
					 new Filter({ path: "ProductName", operator: FilterOperator.Contains, value1: sSearchQuery }),
					//  new Filter({ path: "FirstName", operator: FilterOperator.Contains, value1: sSearchQuery })
				],
				and: false
			}));

			this._filterTable(new Filter({
				filters: aFilters,
				and: true
			}));
		},






		//------------------------------------------------------------------------------

       
    });
});