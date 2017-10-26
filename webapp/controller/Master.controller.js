/*global history */
sap.ui.define([
	"zetms/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/ui/Device",
	"zetms/model/formatter"
], function(BaseController, JSONModel, History, Filter, FilterOperator, GroupHeaderListItem, Device, formatter) {
	"use strict";
	var sAdmin;
	var count, countFilter1, countFilter2, countFilter3;

	return BaseController.extend("zetms.controller.Master", {

		formatter: formatter,

		//MP: filtri per stato delle richieste	
		_mFilters: {
			pending: [new sap.ui.model.Filter("ZreqStatus", "EQ", 'I')],
			approved: [new sap.ui.model.Filter("ZreqStatus", "EQ", 'A')],
			rejected: [new sap.ui.model.Filter("ZreqStatus", "EQ", 'R')]
		},

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the master list controller is instantiated. It sets up the event handling for the master/detail communication and other lifecycle tasks.
		 * @public
		 */
		onInit: function() {
			// Control state model
			var oList = this.byId("list"),
				oViewModel = this._createViewModel(),
				// Put down master list's original value for busy indicator delay,
				// so it can be restored later on. Busy handling on the master list is
				// taken care of by the master list itself.
				iOriginalBusyDelay = oList.getBusyIndicatorDelay();

			this._oList = oList;
			// keeps the filter and search state
			this._oListFilterState = {
				aFilter: [],
				aSearch: []
			};
			this.setModel(oViewModel, "masterView");
			// Make sure, busy indication is showing immediately so there is no
			// break after the busy indication for loading the view's meta data is
			// ended (see promise 'oWhenMetadataIsLoaded' in AppController)
			oList.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for the list
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			});

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
				}.bind(this)
			});

			this.getRouter().getRoute("master").attachPatternMatched(this._onMasterMatched, this);
			this.getRouter().attachBypassed(this.onBypassed, this);

			/// MP refresh tabella richieste
			setInterval(function() {
				oList.getBinding("items").refresh();
				var msg = "Updating...";
				sap.m.MessageToast.show(msg, {
					duration: 3000,
					autoClose: true,
					closeOnBrowserNavigation: true
				});
			}, 300000);

			// MP: per differenziare comportamento pagina per accesso Admin o Team Leader
			// logica per l'abilitazione dei bottoni se l'utente che entra è un admin.
			var oModel = this.getOwnerComponent().getModel();

			var sPath = "/UserLoggedSet";
			oModel.read(sPath, {

				success: fnReadS,

				error: fnReadE
			});

			function fnReadS(oData, response) {
				// mi salvo il valore del flag admin nella vista, così da poterlo riutilizzare.
				sAdmin = oData.results[0].Admin;
				console.log(oData);
			}

			function fnReadE(oError) {

			}

		},

		// MP: workaround per fare in modo che il tab che viene selezionato per primo 
		// nell'iconTabBar sia quello delle richieste da approvare e che le richieste
		// siano filtrate in base a questo.
		onAfterRendering: function() {
			this._oList.getBinding("items").filter(this._mFilters["pending"]);
		},
			//pulisco il contatore dell'auto refresh
			onExit:function() {
			   // You should stop the interval on exit. 
			   // You should also stop the interval if you navigate out of your view and start it again when you navigate back. 
			   if (this.intervalHandle) 
			      clearInterval(this.intervalHandle);
			},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * After list data is available, this handler method updates the
		 * master list counter and hides the pull to refresh control, if
		 * necessary.
		 * @param {sap.ui.base.Event} oEvent the update finished event
		 * @public
		 */

		//MP: Quick filter per filtrare tra gli stati delle richieste

		onQuickFilter: function(oEvent, sTabKey, oList, oView) {
            
            
            
             var oFilter;
             
			if (oEvent) {
				var sKey = oEvent.getParameter("selectedKey");
                oFilter = this._mFilters[sKey];
			} else {
				if (sTabKey == "A"){
					sKey = "approved";
				}else{
					sKey = "rejected";
				}
				oFilter = new sap.ui.model.Filter("ZreqStatus", "EQ", sTabKey);
			}
			
			var oBinding, oItem;
			
			if(oList){
				oBinding = oList.getBinding("items");
			}else{
				oBinding = this._oList.getBinding("items");
				this._oList.removeSelections();
				this.getRouter().getTargets().display("select");
			}
			
			if (oFilter) {
				oBinding.filter(oFilter);
			} else {
				oBinding.filter([]);
			}

			// MP: Codice per disabilitare i bottoni approva e rifiuta nel caso in cui ci si trovi nel tab 
			// delle richieste approvate o di quelle rifiutate. Nel caso in cui l'utente loggato è amministratore,
			// allora tutti i bottoni rimangono in stato enabled.
			var sOwnerId;
			if(oView){
				sOwnerId = oView._sOwnerId;
			}else{
			sOwnerId = this.getView()._sOwnerId;
			}
			var sId1 = sOwnerId + "---detail" + "--btn1";
			var sId2 = sOwnerId + "---detail" + "--btn2";
			

			var oButton1 = sap.ui.getCore().byId(sId1);
			var oButton2 = sap.ui.getCore().byId(sId2);
			if (sAdmin !== 'X') {
				if (sKey == "approved") {
					oButton1.setEnabled(false);
					oButton2.setEnabled(true);
				} else if (sKey == "rejected") {
					oButton1.setEnabled(false);
					oButton2.setEnabled(false);
				} else {
					oButton1.setEnabled(true);
					oButton2.setEnabled(true);
				}

			} else {
				if (sKey == "approved") {
					oButton1.setEnabled(false);
					oButton2.setEnabled(true);
				} else if (sKey == "rejected") {
					oButton1.setEnabled(true);
					oButton2.setEnabled(false);
				} else {
					oButton1.setEnabled(true);
					oButton2.setEnabled(true);
				}

			}
             
            
		},

		// MP: per il refresh del binding della lista delle richieste
		onClickRefresh: function() {

			var oView = this.getView();
			var oList = oView.byId("list");

			this._oList.getBinding("items").refresh();

			// MP: per aggiorare il contatore delle richieste
			this._updateTotal();

			var msg = "Updated";
			sap.m.MessageToast.show(msg, {
				duration: 1500, // default
				animationTimingFunction: "ease", // default
				animationDuration: 1000, // default
				closeOnBrowserNavigation: true // default
			});

		},

		onUpdateFinished: function(oEvent) {

			var oModel = this.getModel(),
				oViewModel = this.getModel("masterView");

			// update the master list object counter after new data is loaded

			// hide pull to refresh if necessary
			this.byId("pullToRefresh").hide();

			jQuery.each(this._mFilters, function(sFilterKey, oFilter) {
				oModel.read("/LeaveRequestAppSet/$count", {
					filters: oFilter,
					success: function(oData) {
						var sPath = "/" + sFilterKey;
						oViewModel.setProperty(sPath, oData);
					}
				});
			});

			// MP: Logica per aggiornare il numero totale delle richieste
			// man mano che queste vengono inserite
			if (count == undefined || isNaN(count)) {
				this._oList.getBinding("items").refresh();
				this._updateTotal();
				this._updateListItemCount(count);
			}
			if (!isNaN(count)) {
				this._oList.getBinding("items").refresh();
				this._updateTotal();
				this._updateListItemCount(count);
			}
			
			

		},

		/**
		 * Event handler for the master search field. Applies current
		 * filter value and triggers a new search. If the search field's
		 * 'refresh' button has been pressed, no new search is triggered
		 * and the list binding is refresh instead.
		 * @param {sap.ui.base.Event} oEvent the search event
		 * @public
		 */
		onSearch: function(oEvent) {
			if (oEvent.getParameters().refreshButtonPressed) {
				// Search field's 'refresh' button has been pressed.
				// This is visible if you select any master list item.
				// In this case no new search is triggered, we only
				// refresh the list binding.
				this.onRefresh();
				return;
			}

			var sQuery = oEvent.getParameter("query");

			if (sQuery) {
				this._oListFilterState.aSearch = [new Filter("ZrequestId", FilterOperator.Contains, sQuery)];
			} else {
				this._oListFilterState.aSearch = [];
			}
			this._applyFilterSearch();

		},

		/**
		 * Event handler for refresh event. Keeps filter, sort
		 * and group settings and refreshes the list binding.
		 * @public
		 */
		onRefresh: function() {
			this._oList.getBinding("items").refresh();
		},

		/**
		 * Event handler for the list selection event
		 * @param {sap.ui.base.Event} oEvent the list selectionChange event
		 * @public
		 */
		onSelectionChange: function(oEvent) {
		
			// get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
			this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
		    // MP: per navigare alla pagina di dettaglio cliccando sull'item precedentemente selezionato
			this.getRouter().getTargets().display("object");

		},

		/**
		 * Event handler for the bypassed event, which is fired when no routing pattern matched.
		 * If there was an object selected in the master list, that selection is removed.
		 * @public
		 */
		onBypassed: function() {
			this._oList.removeSelections(true);

		},

		/**
		 * Used to create GroupHeaders with non-capitalized caption.
		 * These headers are inserted into the master list to
		 * group the master list's items.
		 * @param {Object} oGroup group whose text is to be displayed
		 * @public
		 * @returns {sap.m.GroupHeaderListItem} group header with non-capitalized caption.
		 */
		createGroupHeader: function(oGroup) {
			return new GroupHeaderListItem({
				title: oGroup.text,
				upperCase: false
			});
		},

		/**
		 * Event handler for navigating back.
		 * It there is a history entry or an previous app-to-app navigation we go one step back in the browser history
		 * If not, it will navigate to the shell home
		 * @public
		 */
		onNavBack: function() {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "#Shell-home"
				}
			});
			  if (this.intervalHandle) {
			      clearInterval(this.intervalHandle);
}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		_createViewModel: function() {
			return new JSONModel({
				isFilterBarVisible: false,
				filterBarLabel: "",
				delay: 0,
				title: this.getResourceBundle().getText("masterTitleCount", [0]),
				noDataText: this.getResourceBundle().getText("masterListNoDataText"),
				sortBy: "ZrequestId",
				groupBy: "None"
			});
		},

		/**
		 * If the master route was hit (empty hash) we have to set
		 * the hash to to the first item in the list as soon as the
		 * listLoading is done and the first item in the list is known
		 * @private
		 */
		_onMasterMatched: function() {
			this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(
				function(mParams) {
					if (mParams.list.getMode() === "None") {
						return;
					}
					var sObjectId = mParams.firstListitem.getBindingContext().getProperty("ZrequestId");
					this.getRouter().navTo("object", {
						objectId: sObjectId
					}, true);
				}.bind(this),
				function(mParams) {
					if (mParams.error) {
						return;
					}
					if (sap.ui.Device.system.phone) {
						this.getRouter().getTargets().display("master");
					} else {
						this.getRouter().getTargets().display("detailNoObjectsAvailable");
					}
				}.bind(this)
			);

		},

		/**
		 * Shows the selected item on the detail page
		 * On phones a additional history entry is created
		 * @param {sap.m.ObjectListItem} oItem selected Item
		 * @private
		 */
		_showDetail: function(oItem) {
			var bReplace = !Device.system.phone;
			this.getRouter().navTo("object", {
				objectId: oItem.getBindingContext().getProperty("ZrequestId")
			}, bReplace);
		},

		/**
		 * Sets the item count on the master list header
		 * @param {integer} iTotalItems the total number of items in the list
		 * @private
		 */
		_updateListItemCount: function(iTotalItems) {
			var sTitle;
			sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
			this.getModel("masterView").setProperty("/title", sTitle);
			// only update the counter if the length is final

			// MP: parte commentata per far si che il contatore delle richieste
			// totali non venga modificato sulla base di quello che è mostrato
			// nella lista per ciascun filtro.

			if (this._oList.getBinding("items").isLengthFinal()) {
				sTitle = this.getResourceBundle().getText("masterTitleCount", [iTotalItems]);
				this.getModel("masterView").setProperty("/title", sTitle);
			}

		},

		/**
		 * Internal helper method to apply both filter and search state together on the list binding
		 * @private
		 */
		_applyFilterSearch: function() {
			var aFilters = this._oListFilterState.aSearch.concat(this._oListFilterState.aFilter),
				oViewModel = this.getModel("masterView");
			this._oList.getBinding("items").filter(aFilters, "Application");
			// changes the noDataText of the list in case there are no filter results
			if (aFilters.length !== 0) {
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataWithFilterOrSearchText"));
			} else if (this._oListFilterState.aSearch.length > 0) {
				// only reset the no data text to default when no new search was triggered
				oViewModel.setProperty("/noDataText", this.getResourceBundle().getText("masterListNoDataText"));
			}
		},

		/**
		 * Internal helper method to apply both group and sort state together on the list binding
		 * @param {sap.ui.model.Sorter[]} aSorters an array of sorters
		 * @private
		 */
		_applyGroupSort: function(aSorters) {
			this._oList.getBinding("items").sort(aSorters);
		},

		/**
		 * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
		 * @param {string} sFilterBarText the selected filter value
		 * @private
		 */
		_updateFilterBar: function(sFilterBarText) {
			var oViewModel = this.getModel("masterView");
			oViewModel.setProperty("/isFilterBarVisible", (this._oListFilterState.aFilter.length > 0));
			oViewModel.setProperty("/filterBarLabel", this.getResourceBundle().getText("masterFilterBarText", [sFilterBarText]));
		},

		_updateTotal: function() {

			countFilter1 = parseInt(this.getView().byId("filter1").getCount(), 10);
			countFilter2 = parseInt(this.getView().byId("filter2").getCount(), 10);
			countFilter3 = parseInt(this.getView().byId("filter3").getCount(), 10);
			count = countFilter1 + countFilter2 + countFilter3;

		}

	});

});