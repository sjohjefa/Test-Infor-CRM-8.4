/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define("Sage/MainView/EntityManager", [
    'Sage/UI/SDataMainViewConfigurationProvider',
    'Sage/MainView/EntityMgr/EntityManagerGroupContextService',
    'Sage/MainView/EntityMgr/EntityFilterConfigurationProvider',
    'dojo/_base/declare',
    'dojo/_base/lang'
],
function (
    SDataMainViewConfigurationProvider,
    EntityManagerGroupContextService,
    EntityFilterConfigurationProvider,
    declare,
    lang
) {
    var entityManager = declare('Sage.MainView.EntityManager', SDataMainViewConfigurationProvider, {
        _currentTabId: false,
        _currentTabDescription: false,
        _mainViewName: 'EntityManager',
        store: false,
        constructor: function (options) {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (!grpContextSvc || grpContextSvc.declaredClass !== 'Sage.MainView.EntityMgr.EntityManagerGroupContextService') {
                grpContextSvc = new EntityManagerGroupContextService();
                Sage.Services.removeService('ClientGroupContext');
                Sage.Services.addService('ClientGroupContext', grpContextSvc);
            }
            var ctx = grpContextSvc.getContext();
            this._currentTabId = ctx.CurrentGroupID;
            this._currentTabDescription = ctx.CurrentName;

            this.titlePaneConfiguration = {
                tabs: this._getTabsConfig(),
                menu: this._getMenuConfig(),
                titleFmtString: '${0}'
            };
            //dojo.subscribe('/group/context/changed', this, '_onCurrentGroupChanged');
        },
        _getListPanelConfig: function () {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (grpContextSvc) {
                this.listPanelConfiguration = grpContextSvc.getCurrentListConfig();
                this.store = this.listPanelConfiguration.list.store;
                this.service = this.listPanelConfiguration.list.store.service;
            }
            return this.listPanelConfiguration;
        },
        requestConfiguration: function (options) {
            if (options.success) {
                options.success.call(options.scope || this, this._getListPanelConfig(), this);
            }
        },
        requestTitlePaneConfiguration: function (options) {
            if (options.success) {
                options.success.call(options.scope || this, this.titlePaneConfiguration, this);
            }
        },
        _getTabsConfig: function () {
            var tabsConfig = {
                store: false,
                selectedTabId: this._currentTabId,
                tabKeyProperty: 'key',
                tabNameProperty: 'descriptor',
                fetchParams: {},
                staticTabs: this._getStaticTabs(),
                onTabSelect: lang.hitch(this, '_onTabSelected'),
                onTabClose: false,
                showTabContextMenus: false
            };
            return tabsConfig;
        },
        //Returns the list of tabs used by the entity manager (note they are all static)
        _getStaticTabs: function () {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            return grpContextSvc.getStaticTabs();
        },
        //Handles the onTabSelect event configured in _getTabsConfig
        _onTabSelected: function (tab) {
            var grpContextSvc = Sage.Services.getService('ClientGroupContext');
            if (grpContextSvc) {
                var ctx = grpContextSvc.getContext();
                var id = tab.id || tab;
                if (ctx.CurrentGroupID === id) {
                    return;
                }
                grpContextSvc._currentListConfiguration = null;
                grpContextSvc.setCurrentGroup(id, tab.title); //This triggers the '/group/context/changed' event
            }
        },
        //Required to handle '/group/context/changed' event
        _onCurrentGroupChanged: function (args) {
            var context = args.current;
            this._currentTabId = context.CurrentGroupID;
            this._currentTabDescription = context.CurrentName;

            if (dijit.byId('GroupTabs').selectedChildWidget.id !== context.CurrentGroupID) {
                dijit.byId('GroupTabs').selectChild(context.CurrentGroupID);
            }
        },
        //Do not remove
        _getMenuConfig: function () {
            return false;
        }
    });
    return entityManager;
});