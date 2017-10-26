/*global location */
sap.ui.define([
	"zetms/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"zetms/model/formatter"
], function(BaseController, JSONModel, formatter, MessageToast, MessageBox, Dialog, Button, Label, TextArea) {
	"use strict";
	return BaseController.extend("zetms.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */

		// MP: per andare indietro alla vista master da smartphone. 
		onNavBack: function(oEvent) {
			var sOwnerId = this.getView()._sOwnerId;
			var sId = sOwnerId + "---master" + "--list";

			var oList = sap.ui.getCore().byId(sId);
			var oSelectedItem = oList.getSelectedItem();
			// MP: per deselezionare l'item selezionato 
			if (oSelectedItem) {
				oList.setSelectedItem(oSelectedItem, false);
			}
			var oSplitApp = this.getView().getParent().getParent();
			var oMaster = oSplitApp.getMasterPages()[0];
			oSplitApp.toMaster(oMaster, "slide");
			oList.removeSelections();
		},

		//Funzione per gestire l'approvazione o il rifiuto di una richiesta
		onButtonPress: function(oEvent) {
			var oModel = this.getView().getModel();
			var oEntry = {};
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			var sObjId = oObject.ZrequestId;
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var sClicked = oEvent.getSource().getId();
			var oView = this.getView();

			//MP: Dialog di conferma con all'interno la logica per l'accettazione o il rifiuto di una richiesta
			var dialog = new sap.m.Dialog({
				title: 'Confermare?',
				type: 'Message',
				content: [
					new sap.m.Label({
						text: 'Sei sicuro di voler continuare?',
						labelFor: 'approveDialogTextarea'
					}),
					new sap.m.TextArea('approveDialogTextarea', {
						width: '100%',
						placeholder: 'Aggiungi note (opzionale)'
					})
				],
				//MP: logica per l'approvazione o il rifiuto di una richiesta	
				beginButton: new sap.m.Button({
					text: 'Conferma',
					press: function() {
						var sText = sap.ui.getCore().byId('approveDialogTextarea').getValue();
						var sAction;
						// MP: Logica per fare l'update sullo stato ed eventualmente sulle note		
						if (sClicked == oView.byId("btn1").getId()) {
							oEntry.ZreqStatus = 'A';
							sAction = "approvata";
						} else {
							oEntry.ZreqStatus = 'R';
							sAction = "rifiutata";
						}

						oEntry.ZnoteAPP = sText;

						oModel.update("/LeaveRequestAppSet(" + "'" + sObjId + "'" + ")", oEntry, {
							method: "PUT",
							success: function() {
								var msg = "Operazione eseguita con successo";
								var msg = "Richiesta " + sAction + " con successo.\nID: " + sObjId + "";
								sap.m.MessageToast.show(msg, {
									duration: 5000,
									autoClose: true,
									closeOnBrowserNavigation: false
								});
							},

							error: function(oData) {
								var msg2 = "Error";
								sap.m.MessageToast.show(msg2, {
									duration: 5000,
									autoClose: true,
									closeOnBrowserNavigation: false

								});
							}
						});
						dialog.close();

					}
				}),

				endButton: new sap.m.Button({
					text: 'Annulla',
					press: function() {
						dialog.close();
					}
				}),
				afterClose: function() {
					dialog.destroy();
				}
			});

			dialog.open();
			
			
			var sOwnerId = this.getView()._sOwnerId;
			var sId = sOwnerId + "---master" + "--list";
			var oList = sap.ui.getCore().byId(sId);
		    var oItem = oList.getSelectedItems();
		    // MP: Logica per riselezionare l'item e avere i campi aggiornati (note approvatore ad esempio)
		    //deselezione
		    oList.setSelectedItem(oItem, false);
		    //riselezione
		    oList.setSelectedItem(oItem, true);

		},

		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function(oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
			var oView = this.getView();
			var oHeader = oView.byId("objectHeader");
			var oTable = oView.byId("lineItemsList");
			var oBinding = oTable.getBinding("items");

			oHeader.setNumber(oBinding.getLength());

			// MP: controllo che ci siano i commenti.
			// Se non ci sono commenti non mostro nulla.

			var oListItem = this.getView().byId("commentList");
			var oItem = oListItem.getItems();
			var sComment = oItem["0"].getText();
			var oListItemApp = this.getView().byId("commentListApp");
			var oItemApp = oListItemApp.getItems();
			var sCommentApp = oItemApp["0"].getText();

			if (sComment == "") {
				oListItem.setVisible(false);
			} else {
				oListItem.setVisible(true);
			}

			if (sCommentApp == "") {
				oListItemApp.setVisible(false);
			} else {
				oListItemApp.setVisible(true);
			}

		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("LeaveRequestAppSet", {
					ZrequestId: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				//this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.ZrequestId,
				sObjectName = oObject.ZrequestId,
				oViewModel = this.getModel("detailView");

			oView.byId("elab_text").setVisible(true);
			oView.byId("elab_text").rerender();

			//nascondo riga di testo ELaborata: in caso di richiesta pending
			if (oObject.ZreqStatus === "I") {
				oView.byId("elab_text").setVisible(false);
				oView.byId("elab_text").rerender();
			}

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function() {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});