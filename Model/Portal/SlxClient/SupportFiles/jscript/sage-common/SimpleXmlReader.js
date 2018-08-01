﻿/*  ------------------------------------------------------------------------
    Sage.SimpleXmlReader
    Copyright © 1997-2013, SalesLogix, N.A., LLC. All rights reserved.  
   
    The Sage.SimpleXmlReader class implements a simple cross-browser xml
    reader (designed to work in IE and Firefox).
    
    Future: Use prototype replacements instead of this class.
    ------------------------------------------------------------------------ */

Sage.SimpleXmlReader = function(xml) {
    this.xmlDocument = null;
    if (typeof xml != "undefined") {
        this.loadXml(xml);
    }
};

Sage.SimpleXmlReader.prototype.getNodeText = function(node) {
    return (Sage.Utility.isIE) ? node.text : node.textContent;
};

Sage.SimpleXmlReader.prototype.loadXml = function(xml) {
    this.xmlDocument = null;
    if (Sage.Utility.isIE) {
        var oXmlDocument = new ActiveXObject("Microsoft.XMLDOM");
        oXmlDocument.async = false;
        oXmlDocument.loadXML(xml);
        this.xmlDocument = oXmlDocument;
        return true;
    }
    else {
        if (typeof DOMParser != "undefined") {
            var oDOMParser = new DOMParser();
            var oXmlDocument = oDOMParser.parseFromString(xml, "text/xml");
            this.xmlDocument = oXmlDocument;
            return true;
        }
        else {
            throw new Error("The xml could not be loaded in Sage.SimpleXmlReader.loadXml().");
        }
    }
    return false;
};

Sage.SimpleXmlReader.prototype.selectChildNodes = function(path) {
    if (Sage.Utility.isIE) {
        return this.xmlDocument.selectNodes(path);
    }
    else {
        var oEvaluator = new XPathEvaluator();
        var oNode = oEvaluator.evaluate(path, this.xmlDocument, null, XPathResult.ORDERED_NODE_ITERATOR_TYPE, null);
        var arrNodes = new Array;
        if (oNode != null) {
            var oElement = oNode.iterateNext();
            while (oElement) {
                arrNodes.push(oElement);
                oElement = oNode.iterateNext();
            }
        }
        return arrNodes;
    }
};

Sage.SimpleXmlReader.prototype.selectSingleNode = function(path, node) {
    if (Sage.Utility.isIE) {
        if (node) {
            return node.selectSingleNode(path);
        }
        else {
            return this.xmlDocument.selectSingleNode(path);
        }
    }
    else {
        var oContextNode = (typeof node == "undefined") ? this.xmlDocument : node;
        var oEvaluator = new XPathEvaluator();
        var oNode = oEvaluator.evaluate(path, oContextNode, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        if (oNode != null) {
            return oNode.singleNodeValue;
        }
    }
    return null;
};

Sage.SimpleXmlReader.prototype.selectSingleNodeText = function(path, node) {
    var oNode = this.selectSingleNode(path, node);
    if (oNode != null) {
        return (Sage.Utility.isIE) ? oNode.text : oNode.textContent;
    }
    else {
        throw new Error(String.format("The node could not be located for the path '{0}' in Sage.SimpleXmlReader.selectSingleNodeText().", path));
    }
};