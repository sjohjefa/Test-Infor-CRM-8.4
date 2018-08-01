/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define("Sage/MainView/FormManager", [
    'dojo/string',
    'dojo/_base/declare',
    'dojo/_base/lang',
    'dojo/_base/array',
    'dojo/dom-construct',
    'dojo/topic',
    'dojo/i18n',
    'dijit/registry',
    'Sage/Services/_ServiceMixin',
    'Sage/UI/Controls/GridParts/Columns/SlxLink',
    'Sage/UI/SDataMainViewConfigurationProvider',
    'Sage/QuickForms/Design/DesignPanel',
    'Sage/Store/SData',
    'dojo/i18n!./nls/FormManager'
], function (
    string,
    declare,
    lang,
    array,
    domConstruct,
    topic,
    i18n,
    registry,
    _ServiceMixin,
    SlxLink,
    SDataMainViewConfigurationProvider,
    DesignPanel,
    SDataStore,
    nlsStrings
) {
    return declare('Sage.MainView.FormManager', [SDataMainViewConfigurationProvider, _ServiceMixin], {
        serviceMap: {
            'dataService': { type: 'sdata', name: 'metadata' }
        },
        constructor: function () {
            lang.mixin(this, nlsStrings);
            this._designGroupTopics = [
                topic.subscribe('/quickforms/design/default/load', lang.hitch(this, this._onQuickFormLoad))
            ];
        },
        _onQuickFormLoad: function (entry, panel) {
            var titlePane = dijit.byId('titlePane');
            if (titlePane) {
                titlePane.set('title', lang.getObject('entity.Name', false, entry));
            }
            document.title = this.pageTitle;
        },
        requestConfiguration: function (options) {
            if (options.success) options.success.call(options.scope || this, this._createListConfiguration(), this);
        },
        _createListConfiguration: function () {
            var store = new SDataStore({
                service: this.dataService,
                resourceKind: 'forms'
            }),
                structure = [{
                    field: 'name',
                    label: this.nameText,
                    width: 200,
                    get: function (item) {
                        if (item && item.entity && item.entity.Name) {
                            return item.entity.Name;
                        }
                    },
                    idField: 'entity.Name',
                    type: SlxLink,
                    sortable: true,
                    customSort: { attribute: 'name', descending: false }
                }];

            this.listPanelConfiguration = {
                list: {
                    structure: structure,
                    store: store,
                    queryOptions: { sort: 'name' }, // takes care of first queries sort.
                    id: 'formManagerListConfig'
                },
                _sort: [{ attribute: 'name', descending: false }], //takes care of config's instance of sort
                detail: false,
                summary: false,
                toolBar: {}
            };

            return this.listPanelConfiguration;
        },
        requestTitlePaneConfiguration: function (options) {
            if (options.success) options.success.call(options.scope || this, this._createTitlePaneConfiguration(), this);
        },
        _createTitlePaneConfiguration: function () {
            this.titlePaneConfiguration = {
                tabs: false,
                menu: false,
                titleFmtString: this.titleFmtString
            };

            return this.titlePaneConfiguration;
        },
        requestDetailModeConfiguration: function (options) {
            if (options.success) options.success.call(options.scope || this, this._createDetailModeConfiguration(), this);

            if (this.designPanel) this.designPanel.read(this._getQueryStringParam('entityid'));
        },
        _createDetailModeConfiguration: function () {
            var designPanel = this.designPanel = new DesignPanel();

            return {
                content: designPanel,
                toolBar: false
            };
        },
        _getQueryStringParam: function (param) {
            var query = document.location.href.split('?')[1];
            if (typeof query === 'undefined') {
                return false;
            }
            var params = query.split('&');
            for (var i = 0; i < params.length; i++) {
                var parts = params[i].split('=');
                if (parts[0].toLowerCase() === param.toLowerCase()) {
                    return parts[1];
                }
            }
            return false;
        }
    });
});