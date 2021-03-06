require({cache:{
'url:Sage/MainView/EntityMgr/AddEditEntityDetail/templates/DistinctDetailsView.html':"[\r\n'<div>',\r\n    '<table class=\"detailTableContainer formtable HundredPercentWidth\">',\r\n        '<tr data-dojo-attach-point=\"_filterDetailsSection\">',\r\n            '<td class=\"FManagerDialogFieldLabel\">',\r\n\t\t\t\t'<div style=\"padding:0 !important;\" class=\"lbl alignright\">',\r\n                    '<label style=\"line-height:32px !important;\" data-dojo-attach-point=\"lblEntityFiltersDetailsContains\">',\r\n                    '</label>',\r\n\t\t\t    '</div>',\r\n                '<div class=\"fld dijitInline\" data-dojo-attach-point=\"txtEntityFiltersDetailsContains\"></div>',\r\n            '</td>',\r\n        '</tr>',\r\n    '</table>',\r\n'</div>'\r\n ]"}});
/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define("Sage/MainView/EntityMgr/AddEditEntityDetail/DistinctDetailsView", [
    'dojo/_base/declare',
    'dojo/_base/event',
    'dojo/text!./templates/DistinctDetailsView.html',
    'Sage/Utility',
    'Sage/MainView/EntityMgr/AddEditEntityDetail/_DetailsAddEditDialogBase',
    'Sage/UI/Controls/TextBox'
],
function (
    declare,
    dojoEvent,
    template,
    utility,
    _DetailsAddEditDialogBase,
    crmTextBox
) {
    var widget = declare('Sage.MainView.EntityMgr.AddEditEntityDetail.DistinctDetailsView', [_DetailsAddEditDialogBase], {

        widgetTemplate: new Simplate(eval(template)),
        widgetsInTemplate: true,

        charactersTextBox: false,

        constructor: function () {
            this.hasProperties = true;
            this.isMetric = false;
        },
        postCreate: function () {

            this._createCharacterController();
            this.startup();
        },
        _createCharacterController: function () {
            this.lblEntityFiltersDetailsContains.innerHTML = this._nlsResources.lblCharacter;

            var self = this;
            //insert a characters text box
            this.charactersTextBox = new crmTextBox({
                shouldPublishMarkDirty: false,
                regExp: '^[0-9]+$',//allow numbers 0-99.
                validator: function (value, constraints) {
                    var oRegExp = new RegExp('^0+', "g"); //leading zeroes
                    value = value.replace(oRegExp, "");
                    if (value.length === 0) {
                        value = 0;
                    }
                    if (value > 99) {
                        value = 99;
                    }
                    if (value < 0) {
                        value = 0;
                    }
                    var str = self.DojoString.substitute("${0}", [value]);
                    var matches = str.match(this.regExp, 'g');
                    if (matches !== null) {
                        this.textbox.value = value;
                        return true;
                    }
                    return false;
                },
                invalidMessage: this._nlsResources.FieldMustBeANumber,
                required: true
            });
            this.DomConstruct.place(this.charactersTextBox.domNode, this.txtEntityFiltersDetailsContains, 'only');

            this.charactersTextBox.textbox.value = 0; //default to zero

            if (typeof (this.details.distinctFilter) !== 'undefined') { // if we have a distinct filter use the character value
                this.charactersTextBox.textbox.value = this.details.distinctFilter.characters;
            }
            if (typeof (this.details.rangeFilter) !== 'undefined') { // if we have a range filter use the character value
                this.charactersTextBox.textbox.value = this.details.rangeFilter.characters;
            }

            this.DojoConnect.connect(this.charactersTextBox, 'onKeyPress', this._onKeyPress, true);

        },

        _onKeyPress: function (e) {
            if (!utility.restrictToNumberOnKeyPress(e, 'number')) {
                dojoEvent.stopEvent(e);
            }
        },

        /**
        * This is a last method in the initialization process. 
        * It is called after all the child widgets are rendered so it's good for a container widget to finish it's post rendering here. 
        * This is where the container widgets could for example set sizes of their children relative to it's own size.
        */
        startup: function () {
            this.inherited(arguments);
        },

        /*
        * This method is used to populate the details section of the sdata feeds when creating and editing the template's values.
        *
        * Currently Distinct filters only have one attribute in the detail's section which is characters. 
        */
        getDetails: function (justValue) {
            if (justValue) {

                return this.charactersTextBox.textbox.value;
            }
            var distinctFilter = { distinctFilter: { characters: this.charactersTextBox.textbox.value } };
            return distinctFilter;
        },
        isValid: function () {
            var val = this.charactersTextBox.isValid(true);
            this.charactersTextBox.onChanged();
            return val;
        }
    });
    return widget;
});