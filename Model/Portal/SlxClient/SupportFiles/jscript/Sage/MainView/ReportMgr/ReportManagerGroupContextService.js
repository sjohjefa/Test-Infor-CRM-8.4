/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define("Sage/MainView/ReportMgr/ReportManagerGroupContextService", [
    'Sage/Groups/BaseGroupContextService',
    'dojo/string',
    'Sage/Data/SDataServiceRegistry',
    'dojo/_base/lang',
    'Sage/MainView/ReportMgr/ReportsListPanelConfig',
    'Sage/MainView/ReportMgr/SchedulesListPanelConfig',
    'Sage/MainView/ReportMgr/HistoryListPanelConfig',
    'dojo/_base/declare',
    'dojo/i18n!./nls/ReportManagerGroupContextService'
],
function (
    BaseGroupContextService,
    dojoString,
    SDataServiceRegistry,
    lang,
    ReportsListPanelConfig,
    SchedulesListPanelConfig,
    HistoryListPanelConfig,
    declare,
    nlsResources
) {
    var reportManagerGroupContextService = declare('Sage.MainView.ReportMgr.ReportManagerGroupContextService', BaseGroupContextService, {
        _currentContext: null,
        _currentTabId: false,
        _currentTabDescription: false,
        _currentListConfiguration: false,
        defaultTabId: 'reports',
        staticTabsConfiguration: [
            {
                key: 'reports',
                descriptor: nlsResources.reportsTabDisplayName,
                keyField: "$key",
                configProviderType: ReportsListPanelConfig,
                entityName: 'Reports',
                isNonEntityBased: true
            },
            {
                key: 'schedules',
                descriptor: nlsResources.schedulesTabDisplayName,
                keyField: "$key",
                configProviderType: SchedulesListPanelConfig,
                entityName: false,
                isNonEntityBased: true
            },
            {
                key: 'history',
                descriptor: nlsResources.historyTabDisplayName,
                keyField: "$key",
                configProviderType: HistoryListPanelConfig,
                entityName: 'ReportHistory',
                isNonEntityBased: false
            }
        ],
        _configsHash: false,
        _LOCALSTORE_NAMESPACE: 'ReportManagerView',
        _STORE_KEY_LASTAB: '_LASTTAB',
        _REPORT_FILTERS_KEY: '_REPORTFILTERS',
        _tabNameCache: {},
        constructor: function () {
            this.inherited(arguments);
            this._currentContext = {};
            dojo.mixin(this._currentContext, this._emptyContext);
            this._currentContext.CurrentTableKeyField = "$key";
            this._currentContext.AppliedFilterInfo = {};
            this._currentContext.CurrentFamily = null;
            this._currentContext.notGroupBased = true;
            this.setContext(this._getDefaultTabId(), 'default');
            this.unsubscribeConnects();
            this._subscribes = [];
            this._subscribes.push(
                dojo.subscribe("/ui/filters/default/refresh", this, this._onDefaultFilterRefresh)
            );
            this._onDefaultFilterLoad();
        },
        getStaticTabs: function () {
            return this.staticTabsConfiguration;
        },
        setCurrentGroup: function (id, name, keyField) {
            if (this._currentContext.CurrentGroupID === id) {
                return;
            }
            this._currentContext.CurrentTableKeyField = keyField ? keyField : this.getKeyField(id);
            this.setContext(id, name ? name : this.getGroupName(id));
            this.onCurrentGroupChanged({ current: this._currentContext });
        },
        getContext: function () {
            return this._currentContext;
        },
        _ensureConfigsHash: function () {
            if (!this._configsHash) {
                var hash = {};
                for (var i = 0; i < this.staticTabsConfiguration.length; i++) {
                    var cfg = this.staticTabsConfiguration[i];
                    hash[cfg.key] = lang.mixin(cfg, (!cfg.instance) ? { instance: false } : null);
                }
                this.configsHash = hash;
            }
        },
        _setListConfig: function () {
            this._ensureConfigsHash();
            var tabId = this._currentContext.CurrentGroupID;
            var currConfig = (this.configsHash.hasOwnProperty(tabId)) ? this.configsHash[tabId] : this.configsHash['groups'];
            if (!currConfig.instance) {
                currConfig.instance = new currConfig.configProviderType();
            } else {
                currConfig.instance.rebuild();
            }
            this._currentListConfiguration = currConfig.instance;
            this._currentListConfiguration.isNonEntityBased = currConfig.isNonEntityBased;
            this._currentListConfiguration.entityName = currConfig.entityName;
        },
        getCurrentListConfig: function () {
            this._setListConfig();
            return this._currentListConfiguration;
        },
        getKeyField: function (tabid) {
            this._ensureConfigsHash();
            var keyField = '$key';
            if (this.configsHash[tabid]) {
                keyField = this.configsHash[tabid]['keyField'] || '$key';
            }
            return keyField;
        },
        getGroupName: function (tabid) {
            this._ensureConfigsHash();
            var name = 'default';
            if (this.configsHash[tabid]) {
                name = this.configsHash[tabid]['descriptor'] || 'default';
            }
            return name;
        },
        onCurrentGroupChanged: function (options) {
            //We need to clear out the filter manager
            this._clearFilterManager();
            var self = this;
            this._onDefaultFilterLoad(function () {
                dojo.publish('/group/context/changed', [options, self]);
                self._saveToLocalStorage(self._STORE_KEY_LASTAB, self.getContext().CurrentGroupID);
            });
        },
        _clearFilterManager: function () {
            dojo.publish('/ui/filters/default/apply', [{}, {}, this]);
        },
        setContext: function (id, name) {
            this._currentContext.CurrentGroupID = id;
            this._currentContext.CurrentName = name;
            this._currentContext.AppliedFilterInfo = {};
            this._currentContext.filtersForEntity = "";
            this._setListConfig();
            this._currentContext.CurrentEntity = this._currentListConfiguration.entityName;
            this._currentContext.isNonEntityBased = this._currentListConfiguration.isNonEntityBased;
            this._isRetrievingContext = false;
            this.onContextSet(this._currentContext);
        },
        isContextRequired: function () {
            return !(Sage && Sage.Groups && Sage.Groups._groupContext);
        },
        //loads any currently applied filters
        _onDefaultFilterLoad: function (onSuccessCallBack) {
            if (this._currentContext.CurrentGroupID === "schedules") {
                // currently don't support filters for schedules, so publish to just the tasks
                dojo.publish('/group/context/changedTask', [this]);
                this._saveToLocalStorage(this._STORE_KEY_LASTAB, this.getContext().CurrentGroupID);
                // clear the filter panel
                dojo.publish('/ui/filters/default/destroyFilters', [this]);
            } else if (this._currentContext.CurrentGroupID === "history") {
                this._requestFilters(onSuccessCallBack);
            } else {
                this._requestReportFilters(onSuccessCallBack);
            }
        },
        //first we request the report filters, which is cached then added to the getEntityFilters feed so that it can be properly parsed for applied filters
        _requestReportFilters: function (onSuccessCallBack) {
            var context = this.getContext();
            var self = this;
            var service = SDataServiceRegistry.getSDataService('system');
            var request = new Sage.SData.Client.SDataResourcePropertyRequest(service);
            request.setResourceKind('reports');
            request.setResourceProperty('$queries/filters');
            request.readFeed({
                success: function(filters) {
                    if (filters) {
                        context.filtersForEntity = dojo.toJson(filters.$resources);
                        self._requestFilters(onSuccessCallBack);
                    }
                },
                error: function(error) {
                    if (error) {
                    }
                },
                scope: this,
                async: false
            });
        },
        _requestFilters: function (onSuccessCallBack) {
            var context = this.getContext();
            var service = SDataServiceRegistry.getSDataService('system');
            var entry = {
                '$name': 'getEntityFilters',
                'request': {
                    'entityName': context.CurrentEntity,
                    'key': context.CurrentGroupID,
                    'isNonEntityBased': context.isNonEntityBased,
                    'filtersForEntity': context.filtersForEntity
                }
            };
            var request = new Sage.SData.Client.SDataServiceOperationRequest(service);
            request.setOperationName('getEntityFilters');
            request.execute(entry, {
                success: lang.hitch(this, function (result) {
                    try {
                        if (result.response.appliedFilterInfo) {
                            this._currentContext.AppliedFilterInfo.applied = result.response.appliedFilterInfo.applied;
                            this._currentContext.AppliedFilterInfo.definitionSet = result.response.appliedFilterInfo.definitionSet;
                        }
                        if (onSuccessCallBack) {
                            onSuccessCallBack();
                        }
                    } catch (err) {
                        console.error(err);
                    }
                }),
                failure: function (result) {
                    console.error(result);
                },
                async: false
            });
        },
        _onDefaultFilterRefresh: function (applied, definitionSet, filterManager) {
            var context = this.getContext();
            var service = SDataServiceRegistry.getSDataService('system'),
            entry = {
                '$name': 'applyFilterToEntity',
                'request': {
                    'entityName': context.CurrentEntity,
                    'filter': dojo.toJson(filterManager.createValueSet()),
                    'key': context.CurrentGroupID,
                    'isNonEntityBased': context.isNonEntityBased,
                    'filtersForEntity': context.filtersForEntity
                }
            },
            request = new Sage.SData.Client.SDataServiceOperationRequest(service).setOperationName('applyFilterToEntity');
            request.execute(entry, {});
        },
        _saveToLocalStorage: function (key, value, namespace) {
            this._saveToSessionStorage(key, value, namespace);
        },
        _getFromLocalStorage: function (key, namespace) {
            return this._getFromSessionStorage(key, namespace);
        },
        _getFromSessionStorage: function (key, namespace) {
            if (!namespace) {
                namespace = this._LOCALSTORE_NAMESPACE;
            }
            var storeKey = namespace + "_" + key;
            return sessionStorage.getItem(storeKey);
        },
        _saveToSessionStorage: function (key, value, namespace) {
            if (!namespace) {
                namespace = this._LOCALSTORE_NAMESPACE;
            }
            var storeKey = namespace + "_" + key;
            sessionStorage.setItem(storeKey, value);
        },
        _getDefaultTabId: function () {
            var urlTab = this._getUrlTabId();
            if (urlTab) {
                urlTab = this._validateTabId(urlTab);
                if (urlTab) {
                    return urlTab;
                }
            }
            var lastTab = this._getFromLocalStorage(this._STORE_KEY_LASTAB);
            if (lastTab) {
                this.defaultTabId = lastTab;
            } else {
            }
            //double check to make sure we really do have a config for this tab...
            if (!this._configsHash) {
                for (var i = 0; i < this.staticTabsConfiguration; i++) {
                    if (this.defaultTabId === this.staticTabsConfiguration[i]['key']) {
                        return this.defaultTabId;
                    }
                }
            }
            return this.defaultTabId;
        },
        _getUrlTabId: function () {
            var tabId = false,
                regexS = "[\\?&]tabId=([^%#]*)",
                regex = new RegExp(regexS),
                results = regex.exec(window.location.href);

            if (results !== null) {
                tabId = results[1];
            }
            return tabId;
        },
        _validateTabId: function (tabId) {
            if (tabId) {
                for (var i = 0; i < this.staticTabsConfiguration.length; i++) {
                    var cfg = this.staticTabsConfiguration[i];
                    if (cfg.key.toUpperCase() === tabId.toUpperCase()) {
                        return cfg.key;
                    }
                }
            }
            return null;
        }
    });
    if (!Sage.Services.hasService('ClientGroupContext')) {
        Sage.Services.addService('ClientGroupContext', new reportManagerGroupContextService());
    } else {
        var clientGroupContextService = Sage.Services.getService('ClientGroupContext');
        if (clientGroupContextService.declaredClass !== 'Sage.MainView.ReportMgr.ReportManagerGroupContextService') {
            clientGroupContextService.unsubscribeConnects();
            Sage.Services.removeService('ClientGroupContext');
            Sage.Services.addService('ClientGroupContext', new reportManagerGroupContextService());
        }
    }
    return reportManagerGroupContextService;
});