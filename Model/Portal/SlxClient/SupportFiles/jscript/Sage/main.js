/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define */
define("Sage/main", [
    //// Root Sage modules ////
    "Sage/_ActionMixin",
    "Sage/Utility",
    "Sage/LanguageList",
    "Sage/Link",
    "Sage/Array",
    "Sage/_ConfigurationProvider",
    "Sage/_Templated",
    "Sage/Format",
    //// Sub Sage modules ////
    "Sage/Data/main",
    "Sage/Store/main",
    // GroupBuilder only required in the Manage Groups dialog.
    //"Sage/GroupBuilder/main",
    "Sage/Groups/main",
    "Sage/Layout/main",
    "Sage/Library/main",
    "Sage/MailMerge/main",
    "Sage/Services/main",
    "Sage/MainView/main",
    "Sage/ProximitySearch/main",
    "Sage/QuickForms/Design/main",
    "Sage/TaskPane/main",
    "Sage/UI/main",
    "Sage/Utility/main",
    "Sage/Workspaces/main",
    "Sage/Mingle/main",
    'dojo/i18n!dijit/nls/common'  //for multiple files in our modules
], function() {
	// module:
	//		Sage/main
	// summary:
	//		The Sage/main module provides loading of all sub Sage modules.
});
