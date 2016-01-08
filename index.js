"use strict";

var elementDataStore = require('element-data-store');
var assign = require('lodash.assign');
var forEach = require('lodash.foreach');
var isArray = require('lodash.isarray');
var omit = require('lodash.omit');
var reduce = require('lodash.reduce');
var localeval = require('localeval');
var result = require('lodash.result');
var coreB3ndings = require('./b3ndings/core');
var boundaryKey = '__b3nd-boundary';
var root = typeof global !== 'undefined' ? global : window;
var iterateB3ndings = function (view, model, cb) {
    var boundElementSelector = "[data-model-bind]";
    var modelObj = result(model, 'toJSON');
    var stateObj = result(view.state, 'toJSON');
    var boundElements;
    var b3ndResult;
    var scopeObj;
    scopeObj = {
        b3ndResult: undefined,
        view: view,
        state: stateObj,
        model: modelObj,
        computed: view.computeds && reduce(result(view, 'computeds'), function (memo, computed, key) {
            if (!(computed instanceof Function)) {
                computed = view[key];
            }
            memo[key] = computed.call(view, modelObj);
            return memo;
        }, {})
    };
    elementDataStore.set(view.el, boundaryKey, true); // prevents bound parent views from messing with us
    boundElements = Array.prototype.slice.call(view.el.querySelectorAll(boundElementSelector));
    if (view.el.matches(boundElementSelector)) {
        boundElements.push(view.el);
    }
    boundElements.filter(function (el) {
        // filter out any elements that are on the other side of a b3nding boundary
        while (el && el !== view.el) {
            if (elementDataStore.get(el, boundaryKey)) {
                return false;
            }
            el = el.parentNode;
        }
        return true;
    }).forEach(function (el) {
        try {
            b3ndResult = localeval("({" + el.getAttribute('data-model-bind') + "});", scopeObj);
        } catch (e) {
            throw new EvalError("syntax error in b3nding: " + el.getAttribute('data-model-bind'), e.fileName, e.lineNumber);
        }
        forEach(b3ndResult, function (b3ndingValue, b3ndingName) {
            if (!this.b3ndings[b3ndingName]) {
                console.warn('undefined b3nding: ' + b3ndingName);
                return;
            }
            cb.call(view, this.b3ndings[b3ndingName], el, b3ndingValue);
        }, this);
    }.bind(this));
};

var initB3ndings = function (options) {
    iterateB3ndings.call(this, this.view, this.model, function (b3nding, el, value) {
        if (b3nding.init) {
            b3nding.init.call(el, value, this.model, this.view, options);
        }
    }.bind(this));
};
var updateB3ndings = function (view, model, options) {
    iterateB3ndings.call(this, view, model, function (b3nding, el, value) {
        if (b3nding.update) {
            b3nding.update.call(el, value, model, view, options);
        }
    });
};
var B3nd;
var B3ndContext;
B3ndContext = function () {};
B3ndContext.prototype = {
    on: function () {
        if (this.model) {
            this.model.on('change', this.forceUpdate, this);
        }
        if (this.options.nested) {
            this.model.on('nested-change', this.forceUpdate, this);
        }
        if (this.view.state) {
            this.view.state.on('change', this.forceUpdate, this);
        }
    },
    off: function () {
        if (this.model) {
            this.model.off('change', this.forceUpdate, this);
        }
        if (this.options.nested) {
            this.model.off('nested-change', this.forceUpdate, this);
        }
        if (this.view.state) {
            this.view.state.off('change', this.forceUpdate, this);
        }
    },
    forceUpdate: function () {
        B3nd._updateB3ndings.call(this, this.view, this.model);
    }
};

/**
 * signature:
 *   b3nd(view[, model][, options]); // context is not a Backbone.View
 *   view.b3nd([model][, options]); // context is a Backbone.View
 * @param model (required) - The model to which the view will be bound.
 * @param view (required) -  The view with the elements that will be bound to the model.
 */
B3nd = module.exports = function () {
    var options = {};
    var args = Array.prototype.slice.apply(arguments);
    var b3nd = new B3ndContext();
    if (result(this, 'el')) { // if it's a backbone view
        b3nd.view = this;
    } else {
        b3nd.view = args.shift();
    }
    b3nd.model = args.pop();
    if (b3nd.model) {
        if (!b3nd.model.toJSON) { // if it's not a backbone model
            options = b3nd.model || {};
            b3nd.model = args.pop();
        }
    }
    if (!b3nd.model) {
        b3nd.model = b3nd.view.model;
    }
    options = assign({
        using : [], // additional b3ndings
        nested : false
    }, options);
    if (!isArray(options.using)) {
        options.using = [options.using];
    }
    // finished parsing args
    options.using = options.using.concat(coreB3ndings);
    b3nd.b3ndings = options.using.reduce(function (b3ndings, b3nding) {
        b3ndings[b3nding.name] = b3nding;
        return b3ndings;
    }, {});
    b3nd.options = omit(options, 'using');
    initB3ndings.call(b3nd, b3nd.options);
    b3nd.on();
    b3nd.forceUpdate();
    return b3nd;
};
module.exports._updateB3ndings = updateB3ndings; // exported for test spec
