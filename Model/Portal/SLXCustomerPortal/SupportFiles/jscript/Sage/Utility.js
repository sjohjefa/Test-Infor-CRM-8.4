/*globals Sage, dojo, dojox, dijit, Simplate, window, Sys, define,infor, mingleConfig */
define("Sage/Utility", [
        'dojo/parser',
        'Sage/Data/SDataServiceRegistry',
        'Sage/UI/Dialogs',
        'Sage/Utility/ErrorHandler', // Circular
        'dojox/validate/regexp',
        'dojo/i18n!./Utility/nls/Utility',
        'dojo/has',
        'dojo/ready',
        'dojo/string',
        'dojo/_base/array',
        'dojo/_base/lang',
        'dojo/_base/xhr',
        'dojo/date'
    ],
function (
        parser,
        SDataServiceRegistry,
        Dialogs,
        ErrorHandler,
        regexp,
        resource,
        has,
        ready,
        dString,
        array,
        lang,
        xhr,
        dojoDate
    ) {
    Sage.namespace('Utility');
    dojo.mixin(Sage.Utility, {
        _timeZones: null,
        _ownersCache: null,
        _ownersCacheKey: 'SecCodeCache',
        _userCache: null,
        _userCacheKey: '_userCacheKey',
        isIE: (typeof ActiveXObject !== 'undefined' || has('trident')),
        nameToPathCache: {},
        nlsStrings: resource,
        regexp: {
            // The invalidInput RegExp is designed to provide input validation in order to avoid the
            // "A potentially dangerous Request.Form value was detected from the client..." error.
            // The error is the result of a System.Web.HttpRequestValidationException when form fields,
            // etc., contain character sequences Microsoft considers dangerous. The error will
            // occur under the following conditions if the requestValidationMode has [not] been set to
            // ASP.NET 2.0 in Web.Config, etc.:
            //
            // 1. If the < (less than sign) is followed by a letter, ! (exclamation), / (slash), or
            //    ? (question mark) (i.e. if it looks like a tag or an HTML comment).
            // 2. If the & (ampersand) is followed by a # (pound sign) (e.g. &#169;).
            //
            // The logic that introduced the HttpRequestValidationException began with ASP.NET 4.0 and
            // is the result of a call to System.Web.HttpRequest.ValidateString() (internal method).
            // It is considered a breaking change with ASP.NET 4.0 (see http://www.asp.net/whitepapers/aspnet4/breaking-changes).
            //
            // The invalidInput RegExp is designed to be used with the dijit.form.ValidationTextBox
            // control by setting its regExp property.
            invalidInput: '^((?!(<([!\\/?A-Za-z])|(&#))).)*$',

            // The invalidInputFmt format string is provided so that another RegExp can be combined with
            // the invalidInput RegExp. See example in joinInvalidInputRegExpWith().
            invalidInputFmt: '^((?!(<([!\\/?A-Za-z])|(&#)|(${0}))).)*$',

            // The invalidInputMatch RegExp can be used to return the matches in an invalid input string,
            // as described in the invalidInput RegExp. See example in getInvalidInputMatches().
            invalidInputMatch: '<[!\\/?A-Za-z]|&#'
        },
        /**
         * Takes a string template, slits it, and passes it to new Simplate,
         * filtering out undefined, null, and trimmed empty string values.
         * @param {String} template The string template to split
         * @param {String} split Separator for the split
         */
        makeTemplateFromString: function(template, split) {
            var templateResults, widgetTemplate;
            if (typeof split === 'undefined' || split === null) {
                split = '\r';
            }

            templateResults = array.filter(template.split(split), function(item) {
                return typeof item !== 'undefined' && item !== null && dString.trim(item) !== '';
            });

            widgetTemplate = new Simplate(templateResults);
            return widgetTemplate;
        },
        // Combines the aRegExp with the invalidInput RegExp for use with the dijit.form.ValidationTextBox.
        joinInvalidInputRegExpWith: function (aRegExp) {
            if (aRegExp && dojo.isString(aRegExp) && aRegExp.length > 0) {
                return dString.substitute(this.regexp.invalidInputFmt, [aRegExp]);
            }
            return aRegExp;
        },
        // Gets all matches in the string s that match the RegExp invalidInputMatch.
        getInvalidInputMatches: function (s) {
            if (s && dojo.isString(s) && s.length > 0) {
                var matches = s.match(this.regexp.invalidInputMatch, 'g');
                if (matches && dojo.isArray(matches)) {
                    return matches;
                }
            }
            return [];
        },
        // Returns true if the string s does not contain invalidInput character sequences (or if s is null).
        // Returns false if s is not a string or if s contains invalidInput character sequences.
        // Note: It's ok to POST data that has invalid input characters, as long as they are [not] part of
        // a Request.Form POST (e.g. application/x-www-form-urlencoded). For example, if the invalid characters
        // are in JSON data that is part of an application/json POST, there is no need to call the isSafeForPosting()
        // function against those strings.
        isSafeForPosting: function (s) {
            if (s && dojo.isString(s)) {
                if (s.length === 0) {
                    return true;
                }
                var match = s.match(this.regexp.invalidInputMatch);
                if (match === null) {
                    return true;
                }
                if (dojo.isArray(match) && match.length === 0) {
                    return true;
                }
            }
            if (!s && s === null) {
                return true;
            }
            return false;
        },
        makeSafeForPosting: function (s) {
            var matches = this.getInvalidInputMatches(s);
            if (matches && dojo.isArray(matches) && matches.length > 0) {
                array.forEach(matches, function (match) {
                    var safeValue = match;
                    if (match.length >= 2) {
                        // e.g. replace '<!' with '< !', etc.
                        // e.g. 'Hello<!World Hello</World Hello<?World' becomes 'Hello< !World Hello< /World Hello< ?World'
                        safeValue = match.substr(0, 1) + ' ' + match.substr(1);
                    }
                    if (safeValue !== match) {
                        s = s.replace(match, safeValue);
                    }
                });
            }
            return s;
        },
        nameToPath: function (name) {
            var parts, path, i, match;

            if (typeof name !== 'string') {
                return [];
            }

            if (Sage.Utility.nameToPathCache[name]) {
                return Sage.Utility.nameToPathCache[name];
            }

            parts = name.split('.');
            path = [];
            for (i = 0; i < parts.length; i++) {
                match = parts[i].match(/([a-zA-Z0-9_$]+)\[([^\]]+)\]/);
                if (match) {
                    path.push(match[1]);
                    if (/^\d+$/.test(match[2])) {
                        path.push(parseInt(match[2], 10));
                    } else {
                        path.push(match[2]);
                    }
                }
                else {
                    path.push(parts[i]);
                }
            }

            Sage.Utility.nameToPathCache[name] = path.reverse();
            return Sage.Utility.nameToPathCache[name];
        },
        expand: function (scope, expression) {
            if (typeof expression === 'function') {
                return expression.apply(scope, Array.prototype.slice.call(arguments, 2));
            } else {
                return expression;
            }
        },
        getValue: function (o, name, defaultValue) {
            defaultValue = (typeof defaultValue !== 'undefined' && defaultValue !== null) ? defaultValue : '';
            var path = Sage.Utility.nameToPath(name).slice(0);
            var current = o;
            while (current && path.length > 0) {
                var key = path.pop();
                if (typeof current[key] !== 'undefined' && current[key] !== null) current = current[key]; else return defaultValue;
            }
            return current;
        },
        setValue: function (o, name, val) {
            var current = o;
            var path = Sage.Utility.nameToPath(name).slice(0);
            while ((typeof current !== "undefined") && path.length > 1) {
                var key = path.pop();
                if (path.length > 0) {
                    var next = path[path.length - 1];
                    current = current[key] = (typeof current[key] !== "undefined") ? current[key] : (typeof next === "number") ? [] : {};
                }
            }
            if (current !== null && typeof path[0] !== "undefined")
                current[path[0]] = val;
            return o;
        },
        getPlainText: function (node) {
            // returns formatted innerText similar to IE,
            // but works for all browsers

            var normalize = function (a) {
                // clean up double line breaks and spaces
                if (!a) return "";
                return a.replace(/ +/g, " ")
                        .replace(/[\t]+/gm, "")
                        .replace(/[ ]+$/gm, "")
                        .replace(/^[ ]+/gm, "")
                        .replace(/\n+/g, "\n")
                        .replace(/\n+$/, "")
                        .replace(/^\n+/, "")
                        .replace(/\nNEWLINE\n/g, "\n\n")
                        .replace(/NEWLINE\n/g, "\n\n"); // IE
            };
            var removeWhiteSpace = function (node) {
                // getting rid of empty text nodes
                var isWhite = function (node) {
                    return !(/[^\t\n\r ]/.test(node.nodeValue));
                };
                var ws = [];
                var findWhite = function (node) {
                    for (var i = 0; i < node.childNodes.length; i++) {
                        var n = node.childNodes[i];
                        if (n.nodeType == 3 && isWhite(n)) {
                            ws.push(n);
                        } else if (n.hasChildNodes()) {
                            findWhite(n);
                        }
                    }
                };
                findWhite(node);
                for (var i = 0; i < ws.length; i++) {
                    ws[i].parentNode.removeChild(ws[i]);
                }

            };
            var sty = function (n, prop) {
                // Get the style of the node.
                // Assumptions are made here based on tagName.
                if (n.style[prop]) return n.style[prop];
                var s = n.currentStyle || n.ownerDocument.defaultView.getComputedStyle(n, null);
                if (n.tagName == "SCRIPT") return "none";
                if (!s[prop]) return "LI,P,TR".indexOf(n.tagName) > -1 ? "block" : n.style[prop];
                if (s[prop] == "block" && n.tagName == "TD") return "feaux-inline";
                return s[prop];
            };

            var blockTypeNodes = "table-row,block,list-item";
            var isBlock = function (n) {
                // diaply:block or something else
                var s = sty(n, "display") || "feaux-inline";
                if (blockTypeNodes.indexOf(s) > -1) return true;
                return false;
            };

            var recurse = function (n) {
                // Loop through all the child nodes
                // and collect the text, noting whether
                // spaces or line breaks are needed.
                if (/pre/.test(sty(n, "whiteSpace"))) {
                    t += n.innerHTML
                        .replace(/\t/g, " ")
                        .replace(/\n/g, " "); // to match IE
                    return "";
                }
                var s = sty(n, "display");
                if (s == "none") return "";
                var gap = isBlock(n) ? "\n" : " ";
                t += gap;
                for (var i = 0; i < n.childNodes.length; i++) {
                    var c = n.childNodes[i];
                    if (c.nodeType == 3) t += c.nodeValue;
                    if (c.childNodes.length) recurse(c);
                }
                t += gap;
                return t;
            };
            // Use a copy because stuff gets changed
            node = node.cloneNode(true);
            // Line breaks aren't picked up by textContent
            node.innerHTML = node.innerHTML.replace(/<br>/g, "\n");

            // Double line breaks after P tags are desired, but would get
            // stripped by the final RegExp. Using placeholder text.
            var paras = node.getElementsByTagName("p");
            for (var i = 0; i < paras.length; i++) {
                paras[i].innerHTML += "NEWLINE";
            }

            var t = "";
            removeWhiteSpace(node);

            return normalize(recurse(node));
        },
        /*
        debounce taken from underscore.js.

        Underscore.js 1.3.3
        (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc.
        Underscore is freely distributable under the MIT license.
        Portions of Underscore are inspired or borrowed from Prototype,
        Oliver Steele's Functional, and John Resig's Micro-Templating.
        For all details and documentation:
        http://documentcloud.github.com/underscore
        */
        debounce: function (func, wait, immediate) {
            var timeout;
            return function () {
                var context = this, args = arguments;
                var later = function () {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                if (immediate && !timeout) func.apply(context, args);
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        /*
        * Original version of .extend from...
        * jQuery 1.2.6 - New Wave Javascript
        *
        * Copyright (c) 2008 John Resig (jquery.com)
        * Dual licensed under the MIT (MIT-LICENSE.txt)
        * and GPL (GPL-LICENSE.txt) licenses.
        *
        * $Date: 2008-05-24 14:22:17 -0400 (Sat, 24 May 2008) $
        * $Rev: 5685 $
        */
        extend: function () {
            // copy reference to target object
            var target = arguments[0] || {}, i = 1, length = arguments.length, deep = false, options;

            // Handle a deep copy situation
            if (target.constructor == Boolean) {
                deep = target;
                target = arguments[1] || {};
                // skip the boolean and the target
                i = 2;
            }

            // Handle case when target is a string or something (possible in deep copy)
            if (typeof target != "object" && typeof target != "function")
                target = {};

            // Single parameter extends Sage.Utilities
            if (length == i) {
                target = this;
                --i;
            }

            for (; i < length; i++)
            // Only deal with non-null/undefined values
                if ((options = arguments[i]) != null) // jshint ignore:line
                // Extend the base object
                    for (var name in options) {
                        var src = target[name], copy = options[name];

                        // Prevent never-ending loop
                        if (target === copy)
                            continue;

                        // Recurse if we're merging object values
                        if (deep && copy && typeof copy == "object" && !copy.nodeType)
                            target[name] = Sage.Utility.extend(deep,
                            // Never move original objects, clone them
                            src || (copy.length != null ? [] : {}), copy);// jshint ignore:line

                        // Don't bring in undefined values
                        else if (copy !== undefined)
                            target[name] = copy;

                    }

            // Return the modified object
            return target;
        },
        getCurrentEntityId: function () {
            var contextservice = Sage.Services.getService('ClientEntityContext');
            var eContext = contextservice.getContext();
            return eContext.EntityId;
        },
        getCurrentEntityName: function () {
            var contextservice = Sage.Services.getService('ClientEntityContext');
            var eContext = contextservice.getContext();
            return eContext.DisplayName;
        },
        getClientContextByKey: function (key) {
            var res = '';
            if (Sage.Services) {
                var contextservice = Sage.Services.getService("ClientContextService");
                if ((contextservice) && (contextservice.containsKey(key))) {
                    res = contextservice.getValue(key);
                }
            }
            return res;
        },
        setClientContextByKey: function (key, value) {
            if (Sage.Services) {
                var contextservice = Sage.Services.getService("ClientContextService");
                if (contextservice) {
                    if (contextservice.containsKey(key)) {
                        contextservice.setValue(key, value);
                    } else {
                        contextservice.add(key, value);
                    }
                    return true;
                }
            }
            return false;
        },
        getVirtualDirectoryName: function () {
            // returns the name of the virtual directory from the url to the current page.
            var reg = new RegExp(window.location.host + "/([A-Za-z0-9\\-_]+)/");
            var arr = reg.exec(window.location.href);
            if (arr)
                return arr[1];
            return '';
        },
        getSDataService: function (contract, keepUnique, useJson, cacheResult) {
            console.warn('Deprecated: Sage.Utility.getSDataService(). Use: Sage.Data.SDataServiceRegistry.getSDataService()');
            // returns the instance of the service for the specific contract requested.
            // For example, if the data source needs an SData service for the dynamic or system feeds,
            // the code would pass 'dynamic' or 'system' to this method.
            //the proxy datastore needs to always keep it's own unique instance of the service.
            return Sage.Data.SDataServiceRegistry.getSDataService(contract, keepUnique, useJson, cacheResult);
        },
        // BEGIN Ajax/Dojo Patch.  Notifies dojo to reparse partial postback content.
        appLoadHandler: function (sender, args) {
            Sys.WebForms.PageRequestManager.getInstance().add_pageLoaded(Sage.Utility.pageLoaded);
            Sys.WebForms.PageRequestManager.getInstance().add_pageLoading(Sage.Utility.pageLoading);
            Sys.WebForms.PageRequestManager.getInstance().add_initializeRequest(Sage.Utility.showRequestIndicator);
            Sys.WebForms.PageRequestManager.getInstance().add_endRequest(Sage.Utility.hideRequestIndicator);
            Sys.WebForms.PageRequestManager.getInstance().add_initializeRequest(window.AutoLogout.resetTimer);
        },
        pageLoaded: function (sender, args) {
            var updatedPanels = args.get_panelsUpdated();
            if (typeof (updatedPanels) === "undefined") {
                return;
            }
            //call the dojo parser on the newly loaded html
            //in each panel so the new elements are instantiated
            for (var i = 0; i < updatedPanels.length; i++) {
                dojo.parser.parse(updatedPanels[i]);
            }
        },
        pageLoading: function (sender, args) {
            var updatedPanels = args.get_panelsUpdating();
            if (typeof (updatedPanels) === "undefined") {
                return;
            }
            //remove all the widgets in the outgoing panel
            //so the dojo parser doesn't throw
            //an error when it reloads them.
            for (var i = 0; i < updatedPanels.length; i++) {
                var panel = updatedPanels[i],
                widgets = dijit.findWidgets(panel);
                // can use preserveDom (true) here as the update panel load will destroy the DOM for us.
                // some DOM will be destroyed, regardless.
                dojo.forEach(widgets, function (widget) {
                    widget.destroyRecursive(true);
                });
            }
        },
        destroyWidget: function (widget) {
            var widgetId = dojo.attr(widget, 'widgetId');
            if (dijit.byId(widgetId)) {
                dijit.byId(widgetId).destroyRecursive();
            }
        },
        // END Ajax/Dojo Patch.
        //Begin ajax request indicator handling.
        showRequestIndicator: function () {
            var elem = document.getElementById("asyncpostbackindicator");
            if (elem) { elem.style.visibility = "visible"; }
        },
        // Ajax endRequest handler
        hideRequestIndicator: function (sender, args) {
            var elem = dojo.byId("asyncpostbackindicator");
            if (elem) { elem.style.visibility = "hidden"; }
            ErrorHandler.handleEndRequestError(args);
        },
        //end ajax request indicator handling.
        // BEGIN - common numeric / currency functions
        isAllowedNavigationKey: function (charCode) {
            return (charCode == 8   // backspace
            || charCode == 9    // tab
            || charCode == 46   // delete
            || charCode == 37   // left arrow
            || charCode == 39); // right arrow
        },
        restrictDecimalDigit: function (value, places, decimalSeparator) {
            var retVal = value;
            if (typeof places === 'undefined') {
                places = Sys.CultureInfo.CurrentCulture.numberFormat.NumberDecimalDigits;
            }
            // If the places param has provided a range, find the end of the range and use that
            // as the length to restrict to.
            if (places.length > 1) {
                var range = places.split(',');
                places = parseInt(range[1], 10);
            }
            if (typeof decimalSeparator === 'undefined') {
                decimalSeparator = Sys.CultureInfo.CurrentCulture.numberFormat.NumberDecimalSeparator;
            }
            var restriction = value.indexOf(decimalSeparator) + 1 + places;
            if (places === 0) {
                restriction = restriction - 1;
            }
            //To handle negative
            if (value.indexOf(")") > 0) {
                restriction += 1;
            }
            if (value.lastIndexOf(decimalSeparator) > -1) {
                retVal = value.substr(0, restriction);
            }
            return retVal;

        },
        maximizeDecimalDigit: function (value, decimalDigits, decimalSeparator) {
            var diff;
            var retVal = value;
            if (typeof decimalDigits === 'undefined') {
                decimalDigits = Sys.CultureInfo.CurrentCulture.numberFormat.NumberDecimalDigits;
            }
            if (typeof decimalSeparator === 'undefined') {
                decimalSeparator = Sys.CultureInfo.CurrentCulture.numberFormat.NumberDecimalSeparator;
            }
            //If there isn't a separator but we require a decimal digit position, place the separator before adding digits.
            if (decimalDigits > 0 && value.lastIndexOf(decimalSeparator) == -1 && value.length > 0) {
                retVal = [value, decimalSeparator].join('');
            }

            var restriction = retVal.lastIndexOf(decimalSeparator) + 1 + decimalDigits;
            if (retVal.lastIndexOf(decimalSeparator) > -1) {
                diff = restriction - retVal.length;
                if (diff > 0) {
                    for (var i = 0; i < diff; i++) {
                        retVal += 0;
                    }
                }
            }
            return retVal;
        },
        restrictToNumber: function (e, /*currency, number, percent*/type) {
            var SystemFormat = Sys.CultureInfo.CurrentCulture.numberFormat;
            var code = e.charCode || e.keyCode;
            var keyChar = e.keyChar;

            if (e.keyCode && Sage.Utility.isAllowedNavigationKey(e.keyCode)) return true;
            // 0-9 Keyboard and numberpad.
            if ((code >= 48 && code <= 57 && !e.shiftKey) || (code >= 96 && code <= 105 && !e.shiftKey)) return true;
            // Negative, ".", "-"
            if (keyChar === SystemFormat.NegativeSign || code == 109 || code == 110) return true;
            //Separators
            switch (type) {
                case 'currency':
                    if (keyChar == SystemFormat.CurrencyGroupSeparator || keyChar == SystemFormat.CurrencyDecimalSeparator) return true;
                    break;
                case 'percent':
                    if (keyChar == SystemFormat.PercentGroupSeparator || keyChar == SystemFormat.PercentDecimalSeparator) return true;
                    break;
                default: //number
                    if (keyChar == SystemFormat.NumberGroupSeparator || keyChar == SystemFormat.NumberDecimalSeparator) return true;
                    break;
            }
            return false;
        },
        restrictToNumberOnKeyPress: function (e, type) {
            if (e.keyCode && Sage.Utility.isAllowedNavigationKey(e.keyCode)) return true;

            var SystemFormat = Sys.CultureInfo.CurrentCulture.numberFormat;
            var code = e.charCode || e.keyCode;
            var keyChar = String.fromCharCode(code);
            var validChar = '0123456789' + SystemFormat.NegativeSign;
            switch (type) {
                case 'currency':
                    validChar += SystemFormat.CurrencyGroupSeparator + SystemFormat.CurrencyDecimalSeparator;
                    break;
                case 'percent':
                    validChar += SystemFormat.PercentGroupSeparator + SystemFormat.PercentDecimalSeparator;
                    break;
                default: //number
                    validChar += SystemFormat.NumberGroupSeparator + SystemFormat.NumberDecimalSeparator;
                    break;
            }
            return (validChar.indexOf(keyChar) >= 0);
        },
        // END - common numeric / currency functions
        /* Sage.Utility.Convert methods...  */
        Convert: function () {
            var trueRE = /^(true|T)$/i,
                isoDate = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|(-|\+)(\d{2}):(\d{2}))/,
                isoDateOnly = /^(\d{4})-(\d{2})-(\d{2})$/,
                jsonDate = /\/Date\((-?\d+)(?:(-|\+)(\d{2})(\d{2}))?\)\//,
                pad = function (n) { return n < 10 ? '0' + n : n; },
                unpad = function (str) { return (str[0] === '0') ? str.substring(1) : str; };
            return {
                toBoolean: function (value) {
                    return trueRE.test(value);
                },
                isDateString: function (value) {
                    if (typeof value !== 'string')
                        return false;

                    return isoDate.test(value) || isoDateOnly.test(value) || jsonDate.test(value);
                },
                dateToTimeless: function (d) {
                    var timelessDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 5);
                    return timelessDate;
                },
                toIsoStringFromDate: function (value) {
                    // adapted from: https://developer.mozilla.org/en/JavaScript/Reference/global_objects/date
                    if ((value.getHours() === 0) && (value.getMinutes() === 0) && (value.getSeconds() === 5)) {
                        return value.getFullYear() + '-'
                        + pad(value.getMonth() + 1) + '-'
                        + pad(value.getDate()) + 'T00:00:05Z';
                    }

                    return value.getUTCFullYear() + '-'
                        + pad(value.getUTCMonth() + 1) + '-'
                        + pad(value.getUTCDate()) + 'T'
                        + pad(value.getUTCHours()) + ':'
                        + pad(value.getUTCMinutes()) + ':'
                        + pad(value.getUTCSeconds()) + 'Z';
                },
                toIsoStringFromDateNonUTC: function (value) {
                    return value.getFullYear() + '-'
                        + pad(value.getMonth() + 1) + '-'
                        + pad(value.getDate()) + 'T'
                        + pad(value.getHours()) + ':'
                        + pad(value.getMinutes()) + ':'
                        + pad(value.getSeconds()) + 'Z';
                },
                toJsonStringFromDate: function (value) {
                    return '/Date(' + value.getTime() + ')/';
                },
                toDateFromString: function (value, useOffset) {
                    if (typeof value !== 'string') {
                        return value;
                    }

                    var match,
                        utc,
                        h, m,
                        offset;

                    if ((match = jsonDate.exec(value))) {
                        utc = new Date(parseInt(match[1], 10));
                        if (useOffset === true) {
                            if (match[2]) {
                                h = parseInt(match[3], 10);
                                m = parseInt(match[4], 10);

                                offset = (h * 60) + m;

                                if (match[2] === '-') {
                                    offset = -1 * offset;
                                }
                                utc.setMinutes(utc.getMinutes() + offset);
                            }
                        }
                        value = utc;
                    }
                    else if ((match = isoDate.exec(value))) {
                        utc = new Date(Date.UTC(
                            parseInt(match[1], 10),
                            parseInt(unpad(match[2]), 10) - 1, // zero based
                            parseInt(unpad(match[3]), 10),
                            parseInt(unpad(match[4]), 10),
                            parseInt(unpad(match[5]), 10),
                            parseInt(unpad(match[6]), 10)
                        ));

                        if (match[8] !== 'Z') {
                            h = parseInt(match[10], 10);
                            m = parseInt(match[11], 10);
                            offset = (h * 60) + m;
                            if (match[9] === '-') {
                                offset = -1 * offset;
                            }
                            utc.setMinutes(utc.getMinutes() + offset);
                        }

                        value = utc;
                    }
                    else if ((match = isoDateOnly.exec(value))) {
                        value = new Date();
                        value.setYear(parseInt(match[1], 10));
                        value.setMonth(parseInt(match[2], 10) - 1);
                        value.setDate(parseInt(match[3], 10));
                        value.setHours(0, 0, 0, 0);
                    }

                    return value;
                },
                toArrayFromObject: function (object) {
                    // ensure this isn't already an array first
                    if (object
                        && typeof object.length == 'undefined') {
                        var array = [];
                        array.push(object);
                        return array;
                    }
                    return object;
                }
            };
        } (),
        getModeId: function () {
            //summary:
            //Retrieves the current page mode from the Client Context Service.	Values will be: insert, list or detail
            var ctxSvc = Sage.Services.getService('ClientContextService');
            if ((ctxSvc) && (ctxSvc.containsKey('modeid'))) {
                var mode = ctxSvc.getValue('modeid');
                return mode.toLowerCase();
            }
            // if modeid isn't in the context service, it might be in the url...
            //ToDo: add support to look in the url:
            var u = document.location.href;
            var idx = u.indexOf('?');
            if (idx > 0) {
                var qry = u.substring(idx + 1);
                var parts = qry.split('&');
                for (var i = 0; i < parts.length; i++) {
                    var pair = parts[i].split('=');
                    if (pair.length > 1) {
                        if (pair[0].toLowerCase() === 'modeid') {
                            return pair[1];
                        }
                    }
                }
            }
            return 'None';
        },
        getPageName: function () {
            var url = document.location.href;
            var pagename = url.substring(url.lastIndexOf('/') + 1);
            return pagename;
        },
        openHelp: function (topic, subsystem) {
            var url = Sage.Link.getHelpUrl(topic, subsystem);
            var target = Sage.Link.getHelpUrlTarget();
            window.open(url, target);
        },
        openPdfDoc: function (topic) {
            var helpPath = Sage.Utility.getClientContextByKey('WebHelpUrlFmt');
            helpPath = helpPath.replace(helpPath.substring(helpPath.lastIndexOf('/') + 1), '');
            window.open(helpPath + topic);
        },
        fragger: function (frag, doc) {
            // frag must be a string
            if (typeof frag !== 'string') { return; }
            doc = doc || dojo.doc;
            var outer = doc.createElement('div');
            var inner = dojo._toDom(frag, doc);
            // copy the frag contents into the master
            // only the children of the frag will copy over
            outer.appendChild(inner);
            return outer;
        },
        fragToDijits: function (frag, ns) {
            // if using another dijit's addChild you will want noStart = true
            var parsed = dojo.parser.parse(frag, { noStart: ns || true });
            // parser returns an array of each dijit in document order
            return parsed;
        },
        strToDijits: function (tpl, ns) {
            // tpl must be a string
            if (typeof tpl !== 'string') { return; }
            // convert it into a parse-able document fragment
            var frag = this.toMasterFrag(tpl);
            return this.fragToDijits(frag, ns);
        },
        // perform a depth-first search of a a 'MasterFrag'
        // and execute fn on each node
        fragWalker: function walk(node, fn) {
            fn(node);
            node = node.firstChild;
            while (node) {
                walk(node, fn);
                node = node.nextSibling;
            }
        },
        // used by size, keys and values
        extract: function (obj, what) {
            var count = (what === 2), out = (count) ? 0 : [], i;
            for (i in obj) {
                if (count) {
                    out++;
                } else {
                    if (window.has(obj, i)) {
                        out.push((what) ? obj[i] : i);
                    }
                }
            }
            return out;
        },
        keys: function (obj) {
            return Sage.Utility.extract(obj);
        },
        size: function (obj) {
            return Sage.Utility.extract(obj, 2);
        },
        loadDetailsDialog: function (obj) {
            Sage.ClientLinkHandler.request({
                request: 'ShowDialog', type: obj.entityType, smartPart: obj.smartPart, entityId: obj.entityId, dialogTitle: obj.dialogTitle,
                isCentered: obj.isCentered, dialogTop: obj.dialogTop, dialogLeft: obj.dialogLeft, dialogHeight: obj.dialogHeight, dialogWidth: obj.dialogWidth,
                dialogParameters: obj.dialogParameters, childInsertInfo: obj.childInsertInfo
            });
        },
        values: function (obj) {
            return Sage.Utility.extract(obj, 1);
        },
        // safeMixin still mixes in too much
        mixOwn: function (target, source) {
            for (var p in source) {
                if (source.hasOwnProperty(p)) {
                    target[p] = source[p];
                }
            }
            return target;
        },
        // extract info from item.formatString in listPanel
        getPrecision: function (str) {
            var match = str.match(/\.(\d+)/), precision;
            if (match) {
                precision = parseInt(match[1], 10);
            }
            return precision ? precision : 0;
        },
		// extract currency symbo info from item.formatString in listPanel
         getCurrencySymbol: function (str) {
			var currencySymbol = '';
			if (str) {
				var currencySymbols = window.currencySymbolGlobalObj;
				if (currencySymbols) {
					var symbolItems = currencySymbols.split('|');
					for (var i = 0; i < symbolItems.length; i++) {
						if (str.indexOf(symbolItems[i]) > -1) {
							currencySymbol = symbolItems[i];
							return currencySymbol;
						}
					}
				}
			}
			return currencySymbol;
            },
        // Recursively loop the object and encode it's strings so they are safe for displaying
        encodeObjectStrings: function(object) {
            var dataType = typeof object;
            if (dataType === 'object') {
                for (var key in object) {
                    if (object[key]) {
                        object[key] = this.encodeObjectStrings(object[key]);
                    }
                }
                return object;
            }
            return this.htmlEncode(object);
        },
        htmlEncode: function (str) {
            if (typeof str != "string") { return str; }
            if (!str) { return ''; }

            return str.replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g, "&lt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
        },
        // This is here for speed's sake.
        _hiddenPre: document.createElement("pre"),
        htmlDecode: function (str) {
            if (typeof str != "string") { return str; }
            //This needs to decode standard HTML encoded strings
            // This is how angular.js does it (see sanatize.decodeEntities)
            this._hiddenPre.innerHTML = str.replace(/</g,"&lt;");
            // innerText depends on styling as it doesn't display hidden elements.
            // Therefore, it's better to use textContent not to cause unnecessary reflows.
            return this._hiddenPre.textContent;
        },
        getSelectionInfo: function () {
            var panel = dijit.byId('list');
            if (panel) {
                return panel.getSelectionInfo();
            }
            return false;
        },
getEQLogicalId: function () {
            var eqLogicalId="";
                  this.loadEQLogicalId();
            if(localStorage.getItem('eqLogicalId'))
                eqLogicalId = localStorage.getItem('eqLogicalId');
           return eqLogicalId;
        },
        loadEQLogicalId: function () {
            var eqLogicalId = "";
            var cpqEQ = {
                "$name": "GetEqCustomSetting",
            "request": {
                    "recordName": "CPQ EQ Logical ID"
                    }
                };            
            var request = new Sage.SData.Client.SDataServiceOperationRequest(Sage.Data.SDataServiceRegistry.getSDataService('dynamic'))
                .setResourceKind('Integrations')
                .setOperationName('GetEqCustomSetting');
                request.execute(cpqEQ, {
                async:false,
                success: function (result) {
                    eqLogicalId = result.response.Result;
                    localStorage.setItem('eqLogicalId', eqLogicalId);
                },
                failure: function (result) {
                    Sage.UI.Dialogs.showError(result);
                }
            });
        },
        loadEQEnabled: function () {
            var isEQEnabled = "";
            var cpqEQ = {
                "$name": "GetEqCustomSetting",
            "request": {
                    "recordName": "CPQ EQ Enabled"
                   }
                };            
            var request = new Sage.SData.Client.SDataServiceOperationRequest(Sage.Data.SDataServiceRegistry.getSDataService('dynamic'))
                .setResourceKind('Integrations')
                .setOperationName('GetEqCustomSetting');
                request.execute(cpqEQ, {
                async:false,
                success: function (result) {
                    isEQEnabled = result.response.Result;
                    localStorage.setItem('isEQEnabled', isEQEnabled);
                },
                failure: function (result) {
                    Sage.UI.Dialogs.showError(result);
                }
            });           
        },
        isEQEnabled: function () {
            var service = Sage.Services.getService('IntegrationContractService');
            var isEQEnabled=false;
                this.loadEQEnabled();
                
                if(localStorage.getItem('isEQEnabled'))
                {
                    if(localStorage.getItem('isEQEnabled').toLowerCase() == 'true')
                        isEQEnabled=true;
                }
           return service.isCPQIntegrationEnabled && isEQEnabled;
        },
        isMingleEnabled: function () {            
           return mingleConfig.isMingleEnabled;
        },
        showEQForm: function(ViewId,Id){
        var alternateDocumentId  ="";	
        var LogicalId = this.getEQLogicalId();
        var quote = {
            "$name": "GetQuoteAlternateDocumentId",
            "request": {
                    "quoteId": Id
                }
            };
            var request = new Sage.SData.Client.SDataServiceOperationRequest(Sage.Data.SDataServiceRegistry.getSDataService('dynamic'))
            .setResourceKind(Sage.Utility.pluralize(ViewId))
            .setOperationName('GetQuoteAlternateDocumentId');
            request.execute(quote, {
                async:false,
                success: function (result) {
                    alternateDocumentId = result.response.Result;
                },
                failure: function (result) {
                    Sage.UI.Dialogs.showError(result);
                }
            });
            infor.companyon.client.sendPrepareDrillbackMessage('?LogicalId='+LogicalId+'&EntityType='+ViewId+'&Id1='+alternateDocumentId);
        },
        showDetailForm: function(ViewId,Id){
            if(this.isEQEnabled())
            {
                var alternateDocumentId  ="";    
                var LogicalId = this.getEQLogicalId();
                var quote = {
                    "$name": "GetQuoteAlternateDocumentId",
                    "request": {
                    "quoteId": Id
                    }
                };
                var request = new Sage.SData.Client.SDataServiceOperationRequest(Sage.Data.SDataServiceRegistry.getSDataService('dynamic'))
                .setResourceKind(Sage.Utility.pluralize(ViewId))
                .setOperationName('GetQuoteAlternateDocumentId');
                request.execute(quote, {
                    async:false,
                    success: function (result) {
                        alternateDocumentId = result.response.Result;
                    },
                    failure: function (result) {
                        Sage.UI.Dialogs.showError(result);
                    }
                });
                infor.companyon.client.sendPrepareDrillbackMessage('?LogicalId='+LogicalId+'&EntityType='+ViewId+'&Id1='+alternateDocumentId);
            }
            else
            {
                window.document.location = ViewId+'.aspx?entityId='+Id;
            }    
        },
        Timezone_populatelist: function (controlId, autoPostBack) {
            var sel, selectedKeyname;
            if (controlId === 'TimezoneList') {
                sel = dijit.byId(controlId);
                selectedKeyname = dojo.byId(controlId + '_Selected');
            }
            else {
                // Get the widget markup.
                sel = $("#" + controlId + " #TimezoneList")[0];
                // Get the widget from the markup.
                sel = dijit.getEnclosingWidget(sel);
                selectedKeyname = $("#" + controlId).find('input').filter('[@type=hidden]')[0];
            }
            if (sel && typeof sel !== 'undefined' && sel.options.length == 1) {
                sel.options.length = 0;
                var self = this;
                var addTimeZoneItems = function addTimeZoneItems() {
                    var options = [];
                    var sSelectedKey = null;
                    dojo.forEach(self._timeZones, function (tz) {
                        var option = { label: tz.Displayname, value: tz.Keyname, selected: false };
                        options.push(option);
                        if (tz.Keyname == selectedKeyname.value) {
                            sSelectedKey = tz.Keyname;
                            option.selected = true;
                        }
                    });
                    sel.addOption(options);
                    if (sSelectedKey !== null) {
                        sel.set('value', sSelectedKey);
                    }
                    dojo.connect(sel, 'onBlur', function () {
                        selectedKeyname.value = sel.get('value');
                    });
                    dojo.connect(sel, 'onChange', function () {
                        if (autoPostBack) {
                            selectedKeyname.value = sel.get('value');
                            __doPostBack(sel.id, '');
                        }
                    });
                };

                if (this._timeZones !== null) {
                    addTimeZoneItems();
                }
                else {
                    dojo.xhrGet({
                        url: 'slxdata.ashx/slx/crm/-/timezones/p',
                        handleAs: 'json',
                        load: function (list) {
                            self._timeZones = list;
                            addTimeZoneItems();
                        },
                        error: function (error, ioargs) {
                            ErrorHandler.handleHttpError(error, ioargs);
                            return error;
                        }
                    });
                }
            }
            return true;
        },
        getTimeZones: function (callBack) {
            var timeZones = JSON.parse(sessionStorage.getItem("_timeZones"));
            if (timeZones && timeZones.length > 0) {
                callBack(timeZones);
            } else {
                dojo.xhrGet({
                    url: 'slxdata.ashx/slx/crm/-/timezones/p',
                    handleAs: 'json',
                    load: function (list) {
                        sessionStorage.setItem("_timeZones", JSON.stringify(list));
                        callBack(list);
                    },
                    error: function (error, ioargs) {
                        ErrorHandler.handleHttpError(error, ioargs);
                        callBack(false);
                    }
                });
            }
        },

        //@param coll is either an array of strings or a single string
        //@param num is the max length desired for the string(s)
        //return it/them at max length with '...'
        truncate: function (val, num) {
            var i = 0, len = val.length, res = [];
            //num needs to be an int
            if (typeof num === 'string') {
                num = parseInt(num, 10);
            }
            //we might just be truncating a string, not an array of them
            if (typeof val === 'string') {
                //don't slice and append to strings smaller than num
                return val.length > num ? val.slice(0, num) + '...' : val;
            }
            //good browsers will provide higher-order functions (fast)
            if (val.map && typeof val.map === 'function') {
                //map calls the anon func with val[i], i, and val
                return val.map(function (v, i, c) {
                    return v.length > num ? v.slice(0, num) + '...' : v;
                });
            }
            //fallback for IE
            else {
                for (i; i < len; i++) {
                    res.push(val[i].slice(0, num) + '...');
                }
                return res;
            }
        },
        //end truncate
        // parses xml nodes
        parseXMLNode: function (xmlNode, result) {
            var aTags = ['[', ']'], jsonObj = {}, length = -1, i = -1, name = xmlNode.nodeName;
            if (name === "#text" && xmlNode.nodeValue.trim() === "") {
                return;
            }
            var  existing = result[name], children = xmlNode.childNodes, attributes = xmlNode.attributes;
            try {
                if (existing) {
                    if (!dojo.isArray(existing)) {
                        result[name] = [existing, jsonObj];
                    }
                    else {
                        result[name].push(jsonObj);
                    }
                }
                else {
                    if (aTags && aTags.indexOf(name) != -1) {
                        result[name] = [jsonObj];
                    }
                    else {
                        result[name] = jsonObj;
                    }
                }
                if (attributes) {
                    for (i = 0, length = attributes.length; i < length; i++) {
                        var attribute = attributes[i];
                        jsonObj[attribute.nodeName] = attribute.nodeValue;
                    }
                }
                for (i = 0, length = children.length; i < length; i++) {
                    this.parseXMLNode(children[i], jsonObj);
                }
            } catch (e) {
                console.log(e);
            }
            return jsonObj;
        },
        // end parseXMLNode
        // General Dashboard helper functions
        Dashboard: {
            // An incremental counter used by generateString()
            counter: 1,
            /** So that dynamically generated elements can get a
            unique number appended to their name, ie 'wgt1', 'wgt2'...
            @param str a string passed in to which a number will be appended
            */
            generateString: function (str) {
                return str + Sage.Utility.Dashboard.counter++;
            },
            // A function to return an array object
            //populated with the color items in our palette
            //@param num is the number of colors you want back (in an array)
            getColors: function (num) {

                if (!num) { return; }

                var lookupLg = ['blue 6', 'green 3', 'pink 5', 'orange 2', 'blue 4', 'green 6',
                'pink 2', 'orange 7', 'blue 3', 'green 8', 'pink 4', 'orange 3',
                'blue 7', 'green 5', 'pink 8', 'orange 6', 'blue 2', 'green 7',
                'pink 3', 'orange 8', 'blue 5', 'green 2', 'pink 6', 'orange 5',
                'blue 8', 'green 4', 'pink 7', 'orange 4'],

            lookupSm = ['green 5', 'blue 3', 'green 7', 'blue 6',
                'green 3', 'blue 7'],
            ret = [], i, j;

                //the palette for num <= 6 is different than a larger set.
                if (num <= 6) {
                    for (i = 0; i < num; i++) {
                        ret[i] = Sage.Utility.Dashboard.colorPalette[lookupSm[i]];
                    }
                }
                else {
                    for (j = 0; j < num; j++) {
                        ret[j] = Sage.Utility.Dashboard.colorPalette[lookupLg[j]];
                    }
                }
                return ret;
            },
            //looping template functions need to get a single color at a time
            //by passing in an Int
            //@param idx the index passed in by the looping function
            getColor: function (idx) {
                var lookup = ['blue 6', 'green 3', 'pink 5', 'orange 2', 'blue 4', 'green 6',
                'pink 2', 'orange 7', 'blue 3', 'green 8', 'pink 4', 'orange 3',
                'blue 7', 'green 5', 'pink 8', 'orange 6', 'blue 2', 'green 7',
                'pink 3', 'orange 8', 'blue 5', 'green 2', 'pink 6', 'orange 5',
                'blue 8', 'green 4', 'pink 7', 'orange 4'];
                return Sage.Utility.Dashboard.colorPalette[lookup[idx]];
            },
            //Saleslogix colors
            colorPalette: {
                'blue 0': 'dfe8f6', //widget bg color. will not be returned in getColors()
                'blue 6': '00a1de',
                'green 3': 'c1d59f',
                'pink 5': 'a44e81',
                'orange 2': 'f8d6aa',
                'blue 4': '55c0e9',
                'green 6': '69923a',
                'pink 2': 'e2afcd',
                'orange 7': 'af6200',
                'blue 3': '80d0ef',
                'green 8': '35491d',
                'pink 4': 'c55e9b',
                'orange 3': 'f4c180',
                'blue 7': '0079a7',
                'green 5': '86a85c',
                'pink 8': '421f34',
                'orange 6': 'e98300',
                'blue 2': 'aae0f4',
                'green 7': '4f6e2c',
                'pink 3': 'd486b4',
                'orange 8': '754200',
                'blue 5': '2bb1e4',
                'green 2': 'd6e3bf',
                'pink 6': '833f67',
                'orange 5': 'ed982b',
                'blue 8': '00516f',
                'green 4': 'a4bf7d',
                'pink 7': '632f4e',
                'orange 4': 'f0ac55'
            }
        },
        isBoolean: function (value) {
            return typeof value === "boolean";
        },
        isDefined: function (value) {
            return typeof value !== "undefined";
        },
        isEmptyString: function (value) {
            return (dojo.isString(value) && value === "");
        },
        isStringWithLength: function (value) {
            return (dojo.isString(value) && value !== "");
        },
        isTrue: function (value) {
            return (this.isBoolean(value)) ? (value === true) : false;
        },
        getOwnerName: function(secCodeId) {
            if (!secCodeId) {
                return '';
            }
            var trimmed = secCodeId.replace(/^\s+|\s+$/g, '');
            this.buildOwnersCache(null, null, trimmed);
            var owner = this._ownersCache[trimmed];
            return owner ? owner.name : secCodeId;
        },
        buildOwnersCache: function (count, start, trimmedSecCodeId) {
            if (sessionStorage.getItem(this._ownersCacheKey)) {
                this._ownersCache = JSON.parse(sessionStorage.getItem(this._ownersCacheKey));
                return;
            }
            var self = this;
            if (!this._ownersCache) {
                self._ownersCache = {};
            }
            var defaultPageSize = 100;
            count = count || defaultPageSize;
            start = start || 1;
            var defaultUrl = dString.substitute("slxdata.ashx/slx/dynamic/-/owners?select=Type&orderBy=$key&format=json&count=${0}&startIndex=${1}", [count, start]);
            return xhr('GET', {
                url: trimmedSecCodeId ?
                    defaultUrl + "&where=$key eq '"+trimmedSecCodeId+"'" // we should retrieve one owner by passing the corresponding scecodeid instead of retrieving all the owners to avoid the performance issue
                    :defaultUrl,
                handleAs: "json",
                sync: true  // we have to do a sync call here, because the grid column needs to get HTML.
                // but, most of the time this will be cached, so it should not be a big impact.
            }).then(function (data) {
                var totalResults = data.$totalResults;
                for (var i = 0; i < data.$resources.length; i++) {
                    var u = data.$resources[i];
                    self._ownersCache[u.$key.trim()] = {
                        type: u.Type,
                        name: u.$descriptor
                    };
                }
                if (totalResults > defaultPageSize && totalResults >= (start + count)) {
                    start = start + count;
                    self.buildOwnersCache(count, start);
                }
                sessionStorage.setItem(self._ownersCacheKey, JSON.stringify(self._ownersCache));
            });
        },
        getUserName: function (userid) {
            if (!userid) {
                return "";
            }
            var trimmed = userid.replace(/^\s+|\s+$/g, '');
            this.buildUserCache(null, null,trimmed);
            //var trimmed = userid.replace(/^\s+|\s+$/g, '');
            var u = this._userCache[trimmed];
            return u ? u.name : userid;
        },
        buildUserCache: function (count, start, trimmedUserid) {
            if (sessionStorage.getItem(this._userCacheKey)) {
                this._userCache = JSON.parse(sessionStorage.getItem(this._userCacheKey));
				if(this._userCache[trimmedUserid])
                return;
            }
            var self = this;
            if (!this._userCache) {
                self._userCache = {};
            }
            var defaultPageSize = 100;
            count = count || defaultPageSize;
            start = start || 1;
            var defatultUrl = dString.substitute("slxdata.ashx/slx/dynamic/-/users?select=Enabled&format=json&Count=${0}&StartIndex=${1}", [count, start]);
            return xhr('GET', {
                url: trimmedUserid ?
                     defatultUrl + "&where=$key eq '"+trimmedUserid+"'" // we should retrieve one user by passing the corresponding userid instead of retrieving all the users to avoid the performance issue
                    : defatultUrl,
                handleAs: "json",
                sync: true  // we have to do a sync call here, because the grid column needs to get HTML.
                // but, most of the time this will be cached, so it should not be a big impact.
            }).then(function (data) {
                var totalResults = data.$totalResults;
                for (var i = 0; i < data.$resources.length; i++) {
                    var u = data.$resources[i];
                    self._userCache[u.$key] = {
                        enabled: u.Enabled,
                        name: u.$descriptor
                    };
                }
                if (totalResults > defaultPageSize && totalResults >= (start + count)) {
                    start = start + count;
                    self.buildUserCache(count, start);
                }
                sessionStorage.setItem(self._userCacheKey, JSON.stringify(self._userCache));
            });
        },
        isItemInArray: function include(arr, stringVal) {
            for (var i = 0; i < arr.length; i++) {
                if (lang.trim(arr[i]) == lang.trim(stringVal)) return true;
            }
        },
        pluralize: function (stringVal, revert) {//revert is true if your input is plural and output is singler
            if (revert === undefined) {
                revert = false;
            }
            var plural = {
                '(quiz)$': "$1zes",
                '^(ox)$': "$1en",
                '([m|l])ouse$': "$1ice",
                '(matr|vert|ind)ix|ex$': "$1ices",
                '(x|ch|ss|sh)$': "$1es",
                '([^aeiouy]|qu)y$': "$1ies",
                '(hive)$': "$1s",
                '(?:([^f])fe|([lr])f)$': "$1$2ves",
                '(shea|lea|loa|thie)f$': "$1ves",
                'sis$': "ses",
                '([ti])um$': "$1a",
                '(tomat|potat|ech|her|vet)o$': "$1oes",
                '(bu)s$': "$1ses",
                '(alias)$': "$1es",
                '(octop)us$': "$1i",
                '(ax|test)is$': "$1es",
                '(us)$': "$1es",
                '([^s]+)$': "$1s"
            };

            var singular = {
                '(quiz)zes$': "$1",
                '(matr)ices$': "$1ix",
                '(vert|ind)ices$': "$1ex",
                '^(ox)en$': "$1",
                '(alias)es$': "$1",
                '(octop|vir)i$': "$1us",
                '(cris|ax|test)es$': "$1is",
                '(shoe)s$': "$1",
                '(o)es$': "$1",
                '(bus)es$': "$1",
                '([m|l])ice$': "$1ouse",
                '(x|ch|ss|sh)es$': "$1",
                '(m)ovies$': "$1ovie",
                '(s)eries$': "$1eries",
                '([^aeiouy]|qu)ies$': "$1y",
                '([lr])ves$': "$1f",
                '(tive)s$': "$1",
                '(hive)s$': "$1",
                '(li|wi|kni)ves$': "$1fe",
                '(shea|loa|lea|thie)ves$': "$1f",
                '(^analy)ses$': "$1sis",
                '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$': "$1$2sis",
                '([ti])a$': "$1um",
                '(n)ews$': "$1ews",
                '(h|bl)ouses$': "$1ouse",
                '(corpse)s$': "$1",
                '(us)es$': "$1",
                's$': ""
            };

            var irregular = {
                'move': 'moves',
                'foot': 'feet',
                'goose': 'geese',
                'sex': 'sexes',
                'child': 'children',
                'man': 'men',
                'tooth': 'teeth',
                'person': 'people'
            };

            var uncountable = [
                'sheep',
                'fish',
                'deer',
                'series',
                'species',
                'money',
                'rice',
                'information',
                'equipment'
            ];


            // save some time in the case that singular and plural are the same
            if (uncountable.indexOf(stringVal.toLowerCase()) >= 0)
                return stringVal;
            var pattern, replace, array;
            // check for irregular forms
            for(var word in irregular){

                if(revert){
                    pattern = new RegExp(irregular[word]+'$', 'i');
                    replace = word;
                } else {
                    pattern = new RegExp(word + '$', 'i');
                    replace = irregular[word];
                }
                if (pattern.test(stringVal))
                    return stringVal.replace(pattern, replace);
            }

            if (revert)
                array = singular;
            else
                array = plural;

            // check for matches using regular expressions
            for(var reg in array){

                pattern = new RegExp(reg, 'i');

                if (pattern.test(stringVal))
                    return stringVal.replace(pattern, array[reg]);
            }

            return stringVal;
        },
        getParameterByName: function (name, url) {
            if (!url) url = window.location.href;
            name = name.replace(/[\[\]]/g, "\\$&");
            var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
                results = regex.exec(url);
            if (!results) return null;
            if (!results[2]) return '';
            return decodeURIComponent(results[2].replace(/\+/g, " "));
        },
        specialDates: {
            ':now': function (today) {
                today = new Date();
                return today;
            },
            // today and todaystart are the same
            ':today': function (today) {
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':todaystart': function (today) {
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':todayend': function (today) {
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            // yesterday and yesterdaystart are the same
            ':yesterday': function (today) {
                today.setDate(today.getDate() - 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':yesterdaystart': function (today) {
                today.setDate(today.getDate() - 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':yesterdayend': function (today) {
                today.setDate(today.getDate() - 1);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            // tomorrow and tomorrowstart are the same
            ':tomorrow': function (today) {
                today.setDate(today.getDate() + 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':tomorrowstart': function (today) {
                today.setDate(today.getDate() + 1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':tomorrowend': function (today) {
                today.setDate(today.getDate() + 1);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thisweekstart': function (today) {
                today.setDate(today.getDate() - today.getDay());
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thisweekend': function (today) {
                today.setDate(today.getDate() + (6 - today.getDay()));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thismonthstart': function (today) {
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thismonthend': function (today) {
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thisyearstart': function (today) {
                today.setDate(1);
                today.setMonth(0);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thisyearend': function (today) {
                today.setDate(31);
                today.setMonth(11);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':thisquarterstart': function (today) {
                // 1 | jan (0), feb (1), march (2)
                // 2 | april (3), may (4), june (5)
                // 3 | july (6), august (7), sept (8)
                // 4 | oct (9), nov (10), dec (11)
                var month = today.getMonth(),
                    mod = month % 3;
                today.setMonth(month - mod);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':thisquarterend': function (today) {
                var month = today.getMonth(),
                    mod = 2 - (month % 3);
                today.setMonth(month + mod);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':nextweekstart': function (today) {
                today.setDate(today.getDate() + (7 - today.getDay()));
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextweekend': function (today) {
                today.setDate(today.getDate() + (7 - today.getDay()) + 6);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':nextmonthstart': function (today) {
                today.setMonth(today.getMonth() + 1);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextmonthend': function (today) {
                today.setMonth(today.getMonth() + 1);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':nextyearstart': function (today) {
                today.setFullYear(today.getFullYear() + 1);
                today.setMonth(0);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextyearend': function (today) {
                today.setFullYear(today.getFullYear() + 1);
                today.setMonth(11);
                today.setDate(31);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':nextquarterstart': function (today) {
                var month = today.getMonth(),
                    mod = 2 - (month % 3);
                today.setMonth(month + mod + 1);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':nextquarterend': function (today) {
                var month = today.getMonth(),
                    mod = 2 - (month % 3);
                today.setMonth(month + mod + 3);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastweekstart': function (today) {
                today.setDate(today.getDate() - today.getDay() - 7);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastweekend': function (today) {
                today.setDate(today.getDate() - today.getDay() - 1);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastmonthstart': function (today) {
                today.setMonth(today.getMonth() - 1);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastmonthend': function (today) {
                today.setMonth(today.getMonth() - 1);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastyearstart': function (today) {
                today.setFullYear(today.getFullYear() - 1);
                today.setMonth(0);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastyearend': function (today) {
                today.setFullYear(today.getFullYear() - 1);
                today.setMonth(11);
                today.setDate(31);
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':lastquarterstart': function (today) {
                var month = today.getMonth(),
                    mod = month % 3;
                today.setMonth(month - mod - 3);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            },
            ':lastquarterend': function (today) {
                var month = today.getMonth(),
                    mod = month % 3;
                today.setMonth(month - mod - 1);
                today.setDate(dojoDate.getDaysInMonth(today));
                today.setHours(23);
                today.setMinutes(59);
                today.setSeconds(59);
                return today;
            },
            ':beforelastyearend': function (today) {
                today.setFullYear(today.getFullYear() - 2);
                today.setMonth(0);
                today.setDate(1);
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                return today;
            }
         },
        /**
        * @param {item} dataItem
        * @param {fieldProperty} field property
        * Return string value of dot notated field
        *
        */
        splitField: function (item, fieldProperty) {
            var sp = fieldProperty.split(".");
            var field = item;
            for (var i = 0; i < sp.length; i++) {
                if (field === null) {
                    return '';
                }
                field = field[sp[i]];
            }
            return field;
        },
        /**
        * @param {item} dataItem
        * @param {fieldProperty} field property
        * @param {value} value to be set
        *
        */
        setField: function (item, fieldProperty, value) {
            var sp = fieldProperty.split(".");
            var field = item;
            for (var i = 0; i < sp.length - 1; i++) {
                if (field.hasOwnProperty(sp[i])) {
                    field = field[sp[i]];
                }
            }
            if (field) {
                field[sp[sp.length - 1]] = value;
            }
        },
        dynamicSort: function dynamicSort(property, sortOrder) {
            // 1 for ascending
            sortOrder = sortOrder === true ? 0 : 1;

            return function (a,b) {
                var result = (Sage.Utility.splitField(a, property) < Sage.Utility.splitField(b, property))
                    ? -1
                    : (Sage.Utility.splitField(a, property) > Sage.Utility.splitField(b, property))
                        ? 1
                        : 0;
                return result * sortOrder;
            };
        }
    }); //end dojo.mixin

    // Ajax/Dojo Patch.  Notifies dojo to reparse partial postback content.
    ready(function () {
        Sage.Utility.appLoadHandler();
    });

    return Sage.Utility;
});
