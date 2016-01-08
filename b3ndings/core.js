"use strict";
var forEach = require('lodash.foreach');
var debounce = require('lodash.debounce');
var classList = require('classlist');

module.exports = [
    {
        name: 'click',
        init : function (bindingData, model, view) {
            this.addEventListener('click', function () {
                bindingData.apply(view, arguments);
            });
        }
    }, {
        // binds to object attributes. Attributes should be specified as a map from key (attribute name) to value (attribute value) in the binding expression. Attributes are set using Element.prototype.setAttribute
        name: 'prop',
        update : function () {
            forEach(arguments[0], function (attrName, attrValue) {
                this.setAttribute(attrValue, attrName);
            }.bind(this))
        }
    }, {
        name: 'attr',
        update : function () {
            forEach(arguments[0], function (attrName, attrValue) {
                this.setAttribute(attrValue, attrName);
            }.bind(this))
        }
    }, {
        name: 'style',
        update : function () {
            forEach(arguments[0], function (attrName, attrValue) {
                this.setAttribute(attrValue, attrName);
            }.bind(this))
        }
    }, {
        name: 'css',
        update : function (bindingData) {
            forEach(bindingData, function (v, k) {
                classList(this)[v ? 'add' : 'remove'](k);
            }, this);
        }
    }, {
        // if the binding expression is false, the element is hidden, otherwise the element is shown.
        name: 'visible',
        update : function (bindingData) {
            if (bindingData) {
                this.style.display = '';
            } else {
                this.style.display = 'none';
            }
        }
    }, {
        name: 'hidden',
        update : function (bindingData) {
            this.style.visibility = bindingData ? 'visible' : 'hidden';
        }
    },
    {
        name: 'textarea',
        init : function (bindingData, model) {
            this.addEventListener('keyup', debounce(function () {
                model.set(bindingData, this.value);
            }.bind(this), 200));
        }
    }, {
        // binds the text of an element (using textContent property of element instance) to the binding expression
        name: 'text',
        update : function (bindingData) {
            this.textContent = bindingData;
        }
    }, {
        // binds the html of an element (using innerHTML property of element instance) to the binding expression
        name: 'html',
        update : function (bindingData) {
            this.innerHTML = bindingData;
        }
    }, {
        // binds the value of an input field to the value of the binding expression
        name: 'val',
        update: function (bindingData) {
            if (this.matches(':radio,:checkbox') && !this.matches(':checked')) { // TODO: handle this case when the need arises
                console.warn("val binding for checkable elements is not yet supported");
                return;
            }
            this.value = bindingData;
        }
    }, {
        name: 'contenteditable',
        init : function (bindingData, model) {
            var contenteditable = this.getAttribute('contenteditable');
            var property = contenteditable.match(/^plaintext/) ? 'textContent' : 'innerHTML';
            var handler = function () {
                model.set(bindingData, this[property]());
            }.bind(this);
            ['change', 'keyup', 'keydown'].forEach(function (eventName) {
                this.addEventListener(eventName, handler);
            }.bind(this));
        }
    }, {
        name: 'contenteditablePlaintext',
        init : function (bindingData, model) {
            var handler = function () {
                model.set(bindingData, this.textContent);
            }.bind(this);
            ['change', 'keyup', 'keydown'].forEach(function (eventName) {
                this.addEventListener(eventName, handler);
            }.bind(this));
        }
    }, {
        name: 'modelval',
        init : function (bindingData, model) {
            this.addEventListener('change', function () {
                model.set(bindingData, this.value);
            }.bind(this))
        }
    }
];
