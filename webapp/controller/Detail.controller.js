/*global location */
sap.ui.define([
	"zetms/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"zetms/model/formatter",
	"sap/m/MessageBox"
], function(BaseController, JSONModel, formatter, MessageBox, MessageToast, Dialog, Button, Label, TextArea) {
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
			var sOwnerId = this.getView()._sOwnerId;

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
								var msg = "Richiesta " + sAction + " con successo.\nID: " + formatter.formatRequestId(sObjId) + "";
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

						// MP: refresh al modello e ritorno indietro alla vista Master
						oView.getModel().refresh(true);
						var oSplitApp = oView.getParent().getParent();
						var oMaster = oSplitApp.getMasterPages()[0];
						oSplitApp.toMaster(oMaster, "slide");
						var sOwnerId = oView._sOwnerId;
						var sId = sOwnerId + "---master" + "--iconTabBar1";
						var sId2 = sOwnerId + "---master" + "--list";
						var oIconTabBar = sap.ui.getCore().byId(sId);
						var oList = sap.ui.getCore().byId(sId2);
						var oFilter, oBinding, oMasterView;
						oMasterView = sap.ui.getCore().byId(sOwnerId + "---master");

						/*if (oEntry.ZreqStatus == "A") {
							oIconTabBar.setSelectedKey("approved");
							sap.ui.controller("zetms.controller.Master").onQuickFilter(undefined, "A", oList, oMasterView);
						} else if (oEntry.ZreqStatus == "R") {
							oIconTabBar.setSelectedKey("rejected");
							sap.ui.controller("zetms.controller.Master").onQuickFilter(undefined, "R", oList, oMasterView);
						}*/
						
						///////////////////////////////////AGGIUNTO 08/03/2018///////PROVA///////
							oIconTabBar.setSelectedKey("pending");
							sap.ui.controller("zetms.controller.Master").onQuickFilter(undefined, "I", oList, oMasterView);
						/////////////////////////////////////////////////////////////////////////
						

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

		},

		handleResponsivePopoverPress: function(oEvent) {
			var oVbox;
			if (!this._oPopoverHelp) {
				this._oPopoverHelp = sap.ui.xmlfragment("zetms.view.PopoverHelp", this, "zetms.controller.Detail");
				this.getView().addDependent(this._oPopoverHelp);
			}
			oVbox = sap.ui.getCore().byId("Vbox");
			oVbox.destroyItems();

			var oAccessParams = sap.ui.controller("zetms.controller.Master").getAccesParameters();
			var sAdmin = oAccessParams.Admin;
			var sNotifica = oAccessParams.Notifica;
			var sNotificaFI_ICT = oAccessParams.NotificaFI_ICT;
			var oHTML, oHTML_Footer;

			if (sAdmin == 'X') {
				oHTML = new sap.ui.core.HTML({
					content: '<strong>Linee guida per l\'utilizzo dell\'applicazione (Admin)</strong>' +
						'<ul>' +

						'In qualità di <strong>amministratore</strong> puoi visualizzare, approvare o rifiutare le richieste inserite da tutti gli utenti di tua competenza.' +
						' Inoltre, puoi modificare lo stato delle richieste precedentemente approvate da un TL o sbloccare (attraverso il tasto "Sblocca") le richieste per gli utenti che' +
						' intendono modificare i dati della richiesta.' +
						' Selezionando il Tab "Calendario Team" è possibile visualizzare il calendario delle assenze per ciascun team. Il team è selezionabile tramite l\'apposito menù a tendina.' +
						'</ul>',
					sanitizeContent: true
				});
			}else if(sNotifica == 'X' || sNotificaFI_ICT == 'X'){
				oHTML = new sap.ui.core.HTML({
					content: '<strong>Linee guida per l\'utilizzo dell\'applicazione</strong>' +
						'<ul>' +

						' L\'applicazione permette di visualizzare le richieste inserite dai componenti del proprio team.' +
						' Selezionando il Tab "Calendario Team" è possibile visualizzare il calendario delle assenze per il team di cui fai parte.' +
						'</ul>',
					sanitizeContent: true
				});
			}else{
					oHTML = new sap.ui.core.HTML({
					content: '<strong>Linee guida per l\'utilizzo dell\'applicazione (Approvatore/TL)</strong>' +
						'<ul>' +

						'In qualità di <strong>approvatore</strong> puoi visualizzare, approvare o rifiutare le richieste inserite da tutti gli utenti afferenti alla tua' +
						' area di competenza. Inoltre, se necessario, puoi modificare lo stato di una richiesta da "approvata" a "rifiutata".' +
						' Selezionando il Tab "Calendario Team" è possibile visualizzare il calendario delle assenze per il team di cui sei TL.' +
						'</ul>',
					sanitizeContent: true
				});
			}

			oHTML_Footer = new sap.ui.core.HTML({
				content: '<strong>Struttura dell\'applicazione</strong>' +
					'<ul>' +

					' L\'applicazione si divide in due sezioni:' +
					' <li>la prima presenta una lista delle richieste, suddivise secondo lo stato (Pending, Approvate, Non Approvate).' +
					' Selezionando una delle richieste, verrà visualizzato il dettaglio di questa;</li>' +
					' <li>la seconda sezione mostra il dettaglio della richiesta selezionata (numero di giorni per la richiesta, tipo...)' +
					' oltre che dei tab per visualizzare eventuali commenti inseriti dagli utenti, dai TL o dagli amministratori. </li>' +

					'</ul>',
				sanitizeContent: true
			});

			oVbox.addItem(oHTML_Footer);
			oVbox.addItem(oHTML);

			this._oPopoverHelp.openBy(oEvent.getSource());
		},

		// chiude help
		handleCloseButton: function(oEvent) {
			this._oPopoverHelp.close();
		},

		onElaboratePress: function(oEvent) {
			var oModel = this.getView().getModel();
			var oEntry = {};
			var oView = this.getView();
			var oObject = oView.getBindingContext().getObject();
			var sObjId = oObject.ZrequestId;
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			var sClicked = oEvent.getSource().getId();
			var oView = this.getView();
			var sOwnerId = this.getView()._sOwnerId;
			var that = this;

			//MP: Dialog di conferma con all'interno la logica per l'accettazione o il rifiuto di una richiesta
			var dialog = new sap.m.Dialog({
				title: 'Confermare?',
				type: 'Message',
				content: [
					new sap.m.Label({
						text: 'Sei sicuro di voler sbloccare la richiesta?',
						labelFor: 'approveDialogTextarea'
					})
				],
				//MP: logica per l'approvazione o il rifiuto di una richiesta	
				beginButton: new sap.m.Button({
					text: 'Conferma',
					press: function() {
						var sAction;
						// MP: Logica per fare l'update sullo stato ed eventualmente sulle note		
						oEntry.ZreqStatus = 'I';
						sAction = "Sbloccata";
						oEntry.Zunlocked = 'X';
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

						// MP: refresh al modello e ritorno indietro alla vista Master
						oView.getModel().refresh(true);
						var oSplitApp = oView.getParent().getParent();
						var oMaster = oSplitApp.getMasterPages()[0];
						oSplitApp.toMaster(oMaster, "slide");
						var sOwnerId = oView._sOwnerId;
						var sId = sOwnerId + "---master" + "--iconTabBar1";
						var sId2 = sOwnerId + "---master" + "--list";
						var oIconTabBar = sap.ui.getCore().byId(sId);
						var oList = sap.ui.getCore().byId(sId2);
						var oFilter, oBinding, oMasterView;
						oMasterView = sap.ui.getCore().byId(sOwnerId + "---master");
 
						//******NEW******//
						// Aggiunto per tornare alle richieste pending una volta che ho eseguito l'azione
						oIconTabBar.setSelectedKey("pending");
						sap.ui.controller("zetms.controller.Master").onQuickFilter(undefined, "I", oList, oMasterView);
                        ////////////////////////////////////////////////////////
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
			
			// resetto calendario team
				var oCal1 = oView.byId("PC1");
				oCal1.destroyRows();
				oView.byId("SLCT_TEAMS").setSelectedKey("");
				

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
		
		
			_onCalendarHandle: function() {

				var oView = this.getView();
				var oModel = this.getView().getModel();
				sap.ui.getCore().setModel(oModel);
				
				var oCal1 = oView.byId("PC1");
				var that = this;
			//	var oRefDate = new Date();
						
			//	oCal1.startDate(oRefDate);
				oCal1.destroyRows();
				
		/*		
			 oCal1.addView(
						new sap.m.PlanningCalendarView({
							key: "customView11",
							intervalType: sap.ui.unified.CalendarIntervalType.Day,
							description: "Week4",
							intervalsS: 31,
							intervalsM: 31,
							intervalsL:31,
							showSubIntervals: false
						})
					);    
                   oCal1.setViewKey(oCal1.getViews()[0].getKey());
			
	
                          oCal1.addView(
						new sap.m.PlanningCalendarView({
							key: "customView0",
							intervalType: sap.ui.unified.CalendarIntervalType.Hour,
							description: "Day",
							intervalsS: 8,
							intervalsM: 8,
							intervalsL:8,
							showSubIntervals: true
						})
					);    
                   oCal1.setViewKey(oCal1.getViews()[0].getKey());
                 
                 	 oCal1.addView(
						new sap.m.PlanningCalendarView({
							key: "customView1",
							intervalType: sap.ui.unified.CalendarIntervalType.Day,
							description: "Week",
							intervalsS: 7,
							intervalsM: 7,
							intervalsL:7,
							showSubIntervals: true
						})
					);    
                   oCal1.setViewKey(oCal1.getViews()[0].getKey());
                   
                   
                   
                   
                   
                   
                   	 oCal1.addView(
						new sap.m.PlanningCalendarView({
							key: "customView2",
							intervalType: sap.ui.unified.CalendarIntervalType.Month,
							description: "Month",
							intervalsS: 1,
							intervalsM: 1,
							intervalsL: 1,
							showSubIntervals: true
						})
					);    
                   oCal1.setViewKey(oCal1.getViews()[0].getKey());
                   
                   oCal1.addView(
						new sap.m.PlanningCalendarView({
							key: "customView3",
							intervalType: sap.ui.unified.CalendarIntervalType.Month,
							description: "2 Months",
							intervalsS: 2,
							intervalsM: 2,
							intervalsL: 2,
							showSubIntervals: true
						})
					);    
                   oCal1.setViewKey(oCal1.getViews()[0].getKey());*/
	                     
                var zarea = oView.byId("SLCT_TEAMS").getSelectedKey();
              
                 
	         	var sRead = "/LeaveRequestPosTeamSet";

				oModel.read(sRead, {
					
					filters: [new sap.ui.model.Filter({

						filters: [new sap.ui.model.Filter({
							path: "Area",
							operator: sap.ui.model.FilterOperator.EQ,
							value1: zarea

						})],

						and: true

					})],

					success: fnReadS,

					error: fnReadE
				});

				function fnReadS(oData, response) {
				//	console.log(oData);
				//	console.log(response);

					// controllo che la funzione è andata a buon fine 
					if (response.statusCode == "200") {
						////////////////////////////////				

						var oFormatYYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
							pattern: "yyyyMMdd",
							calendarType: sap.ui.core.CalendarType.Gregorian
						});

				

						var oDateRange;
						var person;
						var abs_type_title;
						var abs_type_type;
						var abs_type_icon;
						var abs_tooltip;
						var abs_text;
						
						var abs_hour;
						var abs_min;
						
						
						 var viewKey = oView.byId("PC1").getViewKey();
		               

						if (oData.results.length > 0) {
							for (var i = 0; i < oData.results.length; i++) {
								//escludo richieste rifiutate
                            //	if (oData.results[i].ZreqStatus === 'A' || oData.results[i].ZreqStatus === 'I') {
								//						var res = oData.results[i].Zdate.substring(8);
								
									if (oData.results[i].Name + " " + oData.results[i].Surname != person) {
									
									person = oData.results[i].Name + " " + oData.results[i].Surname;
	                               
	           
	                           
	                              
	                                var oRow = new sap.m.PlanningCalendarRow({
										icon: "sap-icon://employee",
										title: person      
									});
									oCal1.addRow(oRow);
								}
								
								
								
									var res = oData.results[i].Zdate;
								
									if (res != '') {
									
									var abs_date_start = oFormatYYyyymmdd.parse(res);
									 var abs_date_end = oFormatYYyyymmdd.parse(res);
										var abs_hour_start = oData.results[i].Ztimestart.substring(0,2);
										
										/*if (abs_hour_start != '') {
									//	if (1 == 2) {
											
										var abs_min_start = oData.results[i].Ztimestart.substring(3);
										var abs_hour_end = oData.results[i].Ztimeend.substring(0,2);
										var abs_min_end = oData.results[i].Ztimeend.substring(3);
										
	                                    abs_date_start.setHours(abs_hour_start,abs_min_start );
	                                    
	                                    abs_date_end.setHours(abs_hour_end,abs_min_end );
	                                    
	                                   
				
				
										} else {*/
										if(oData.results[i].Ztimestart == '' || oData.results[i].Ztimeend == ''){
											abs_text = "Giornata intera";
											abs_tooltip = " per giornata intera"
										}else{
										 abs_text = oData.results[i].Ztimestart + "-" + oData.results[i].Ztimeend;
										 abs_tooltip = " dalle ore "  + oData.results[i].Ztimestart + " alle ore " + oData.results[i].Ztimeend;
										}
	
	                                    abs_date_end.setHours('23','59');
	                                     //		abs_date_end.setDate(abs_date_end.getDate()+1);
	                                     
	    
				
									//	}
					//		
					
					that.sAppointmentTitle = '';
					
	                switch (oData.results[i].ZabsType){
	                		case "0001":
	                	abs_type_title = "Permesso";
	                	that.sAppointmentTitle = "Permesso ID: " + formatter.formatRequestId(oData.results[i].ZrequestId) + " \nStato: " + formatter.formatStatus(oData.results[i].ZreqStatus) + " \nGiorno: " + formatter.formatDate(oData.results[i].Zdate);
				//		abs_type_type = sap.ui.unified.CalendarDayType.Type08;
						abs_tooltip = "Permesso" + abs_tooltip;
					
						
						abs_type_icon = "sap-icon://customer-history";
	                
	                	break;
	                	case "0002":
	                	abs_type_title= "Ferie";
	                	that.sAppointmentTitle = "Ferie ID: " + formatter.formatRequestId(oData.results[i].ZrequestId) + " \nStato: " + formatter.formatStatus(oData.results[i].ZreqStatus) + " \nGiorno: " + formatter.formatDate(oData.results[i].Zdate);
				//		abs_type_type = sap.ui.unified.CalendarDayType.Type07;
						abs_tooltip ="Ferie" + abs_tooltip;
					
					
						abs_type_icon = "sap-icon://general-leave-request";
						break;
							case "0003":
	                	abs_type_title = "Recupero";	
	                	that.sAppointmentTitle = "Recupero ID: " + formatter.formatRequestId(oData.results[i].ZrequestId) + " \nStato: " + formatter.formatStatus(oData.results[i].ZreqStatus) + " \nGiorno: " + formatter.formatDate(oData.results[i].Zdate);
				//		abs_type_type = sap.ui.unified.CalendarDayType.Type06;
						
						abs_tooltip = "Recupero" + abs_tooltip;
				
					
						abs_type_icon = "sap-icon://cause";
						break;
							case "0004":
	                	abs_type_title = "ROL";	
	                	that.sAppointmentTitle = "ROL ID: " + formatter.formatRequestId(oData.results[i].ZrequestId) + " \nStato: " + formatter.formatStatus(oData.results[i].ZreqStatus) + " \nGiorno: " + formatter.formatDate(oData.results[i].Zdate);
				//		abs_type_type = sap.ui.unified.CalendarDayType.Type05;
						abs_tooltip = "ROL" + abs_tooltip;
					
						abs_type_icon = "sap-icon://customer-history";
						
								
	                }
	                
	                if (oData.results[i].ZreqStatus == "A"){
						abs_type_type = sap.ui.unified.CalendarDayType.Type08;
								
				         }else	{
			              abs_type_type = sap.ui.unified.CalendarDayType.Type05;
			                	
			               }	
			                		
			                		
	                var oAppointment = new sap.ui.unified.CalendarAppointment({
					startDate: abs_date_start,
				//	 nowP.setDate(nowP.getDate()-365);
				//	endDate: oFormatYYyyymmdd.parse(res),
					endDate: abs_date_end,
					type: abs_type_type,
					title: abs_type_title,
					tooltip: abs_tooltip,
					text: abs_text,
					icon: abs_type_icon,
				});
				 oRow.addAppointment(oAppointment);
	
				 
				 
			/*	 	 var oHeaders1 = new sap.ui.unified.CalendarAppointment({
					startDate: abs_date_start,
				//	 nowP.setDate(nowP.getDate()-365);
				//	endDate: oFormatYYyyymmdd.parse(res),
					endDate: abs_date_end,
					type: abs_type_type,
					title: abs_type_title,
					tooltip: abs_tooltip,
					text: abs_text,
					icon: abs_type_icon
				
				});
				 oRow.addIntervalHeader(oHeaders1);
				 */
				 
	
							/*			oCal1.addSpecialDate(new DateTypeRange({
											startDate: oFormatYYyyymmdd.parse(res),
											type: "Type01",
											tooltip: "Permesso Id: " + formatter.formatRequestId(oData.results[i].ZrequestId) + " Stato: " + oData.results[i].ZreqStatus 
	                                           
										}));
									*/
							}
							}

							

						}

					} else {

						//jQuery.sap.require("sap.m.MessageBox");
						sap.m.MessageBox.show(
							"Error: Nessun record recuperato", {
								icon: sap.m.MessageBox.Icon.WARNING,
								title: "Error",
								actions: [sap.m.MessageBox.Action.CLOSE]

							});

					}

				} // END FUNCTION SUCCESS

				function fnReadE(oError) {
				//	console.log(oError);

					alert("Error in read: " + oError.message);
				}

			
	      /*   var oRow = new sap.m.PlanningCalendarRow({
				icon: "sap-icon://employee",
				title: "Sandro Elmo"
			});
			oCal1.addRow(oRow);
	                     
	                     
	                     var oAppointment = new sap.ui.unified.CalendarAppointment({
					startDate: new Date("2018", "5", "01", "00", "00"),
					endDate: new Date("2018", "5", "01", "24", "00"),
					type: sap.ui.unified.CalendarDayType.Type08,
					title: "F",
					tooltip: "Test",
			//		text: "Test",
					icon: "sap-icon://sap-ui5"
				});
				 oRow.addAppointment(oAppointment);
				 
				          var oAppointment2 = new sap.ui.unified.CalendarAppointment({
						startDate: new Date("2018", "5", "02", "00", "00"),
					endDate: new Date("2018", "5", "02", "24", "00"),
					type: sap.ui.unified.CalendarDayType.Type08,
					title: "F",
					tooltip: "Test",
			//		text: "Test",
					icon: "sap-icon://sap-ui5"
				});
				 oRow.addAppointment(oAppointment2);
				 
				          var oAppointment3 = new sap.ui.unified.CalendarAppointment({
						startDate: new Date("2018", "5", "03", "00", "00"),
					endDate: new Date("2018", "5", "03", "24", "00"),
					type: sap.ui.unified.CalendarDayType.Type08,
					title: "F",
					tooltip: "Test",
				//	text: "Test",
					icon: "sap-icon://sap-ui5"
				});
				 oRow.addAppointment(oAppointment3);*/
				 
				 
				 
				/* var oHeaders1 = new sap.ui.unified.CalendarAppointment({
					startDate: new Date("2018", "5", "01", "00", "00"),
					endDate: new Date("2018", "5", "01", "24", "00"),
					type: sap.ui.unified.CalendarDayType.Type05,
					title: "New Appointment Sandro H"
				
				});
				 oRow.addIntervalHeader(oHeaders1);
				 */

			},
			
			
			handleViewChange: function (oEvent) {
					this._onBindingChange();
			},
			
				handleTeamsSelect: function(oEvent) {
				var oTeams = oEvent.getSource();
				var aTeamsKey = oTeams.getSelectedKey();
				
					this._onCalendarHandle();
				
			},
			
			

			handleAppointmentSelect: function (oEvent) {
					var oAppointment = oEvent.getParameter("appointment");
				if (oAppointment) {
					MessageBox.show(this.sAppointmentTitle + " \nDettaglio ore: " +
				oAppointment.getText());
				} else {
					var aAppointments = oEvent.getParameter("appointments");
					var sValue = aAppointments.length + " eventi selezionati, scegliere un intervallo di date minore per visualizzare il dettaglio.";
					MessageBox.show(sValue);
				}
			},
			
			handleSelectionFinish: function(oEvent) {
				var aSelectedKeys = oEvent.getSource().getSelectedKeys();

				this.getView().byId("PC1").setBuiltInViews(aSelectedKeys);
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