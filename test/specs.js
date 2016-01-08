"use strict";
var b3nd = require('../index');
var Model = require('backbone-model').Model;
var sinon = require('sinon');
var jsdom = require("jsdom").jsdom;
var assert = require('assert');
describe("b3nd", function () {
    var api;
    var view;
    var model;
    var fooBinding;
    var barBinding;
    var View; // fake Backbone view constructor
    var cid = 0;
    var window;
    var document;
    var sandbox;
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
        document = jsdom(undefined, {});
        window = document.defaultView;
        View = function (options) {
            this.el = document.createElement('div');
            this.model = options.model;
            this.cid = ++cid;
        };
        View.prototype.setElement = function (el) {
            this.el = el;
        };
        fooBinding = {
            name: 'fooBinding',
            init: sinon.spy(),
            update: sinon.spy()
        };
        barBinding = {
            name: 'barBinding',
            init: sinon.spy(),
            update: sinon.spy()
        };
        model = new Model();
        view = new View({model: model});
        api = b3nd(view);
    });
    afterEach(function () {
        sandbox.restore();
    });
    describe("call", function () {
        it("should pay attention to explicitly passed models", function () {
            var m = new Model();
            var v = new View({model : new Model()});
            var api;
            sandbox.stub(m, 'bind', m.b3nd);
            api = b3nd(v, m);
            assert.equal(api.model, m);
            assert.equal(api.view, v);
        });
        it("should infer the view from the context if present", function () {
            var m = new Model();
            var v = new View({model : m});
            var api;
            sandbox.stub(m, 'bind', m.b3nd);
            api = b3nd.call(v);
            assert.equal(api.model, m);
            assert.equal(api.view, v);
        });
        it("should infer the model from the view if not passed directly", function () {
            var m = new Model();
            var v = new View({model : m});
            var api;
            api = b3nd(v);
            assert.equal(api.model, m);
            assert.equal(api.view, v);
        });
    });
    describe("extending with options.using", function () {
        var api;
        it("should consume additional b3ndings from options.using", function () {
            api = b3nd(view, {using: fooBinding});
            assert(api.b3ndings.fooBinding);
        });
    });
    describe("updateBindings", function () {
        beforeEach(function () {
            model = new Model();
            view = new View({model: model});
            api = b3nd(view, {using: fooBinding});
        });
        describe("b3nding handler", function () {
            var m;
            var v;
            beforeEach(function () {
                m = new Model();
                v = new View({model : m});
                v.state = new Model({
                    stateAttribute: 'hello world'
                });
            });
            describe("basic b3nding", function () {
                var api;
                beforeEach(function () {
                    v.el.innerHTML = "<div data-model-bind='fooBinding : model.foo'>";
                    api = b3nd(v, {using: fooBinding});
                });
                it("should call init", function () {
                    sinon.assert.calledWith(api.b3ndings.fooBinding.init, m.get('foo'), m, v);
                });
                it("should call update on model change", function () {
                    m.set('foo', 'blargh');
                    sinon.assert.callCount(api.b3ndings.fooBinding.update, 2);
                    assert.equal(api.b3ndings.fooBinding.update.secondCall.args[0], m.get('foo'));
                    assert.equal(api.b3ndings.fooBinding.update.secondCall.args[1], m);
                    assert.equal(api.b3ndings.fooBinding.update.secondCall.args[2], v);
                });
            });
            describe("b3nding expression", function () {
                var api;
                beforeEach(function () {
                    v.el.innerHTML = "<div data-model-bind='fooBinding : view.cid, barBinding : state.stateAttribute'>";
                });
                it("should have a global called 'state' when the view has a state property", function () {
                    api = b3nd(v, {using: [fooBinding, barBinding]});
                    assert(v.state.cid);
                    sinon.assert.called(barBinding.init);
                    assert.equal(barBinding.init.firstCall.args[0], v.state.get('stateAttribute'));
                });
                it("should not have a global called 'state' when the view does not have a state property", function () {
                    v.state  = undefined;
                    var caughtException = false;
                    try {
                        api = b3nd(v, {using: [fooBinding, barBinding]});
                    } catch (e) {
                        caughtException = true;
                    }
                    assert(caughtException);
                });
                it("should have a global called 'view'", function () {
                    api = b3nd(v, {using: [fooBinding, barBinding]});
                    assert(v.cid);
                    sinon.assert.calledWith(fooBinding.init, v.cid, m, v);
                });
            });
            describe("computeds", function () {
                describe('regular computeds', function () {
                    beforeEach(function () {
                        v.computeds = {
                            bar: function () {
                                return m.get('foo') + 1;
                            }
                        };
                        v.el.innerHTML = "<div data-model-bind='fooBinding : computed.bar'>";
                        api = b3nd(v, {using: fooBinding});
                    });
                    afterEach(function () {
                        v.computeds = undefined;
                    });
                    it('should offer a map of evaluted computeds in the b3nding scope', function () {
                        m.set('foo', 5);
                        var mostRecentCall = api.b3ndings.fooBinding.update.lastCall;
                        assert.equal(mostRecentCall.args[0], 6);
                        assert.equal(mostRecentCall.args[1], m);
                    });
                });
                describe('proxied computeds', function () {
                    beforeEach(function () {
                        v.baz = function () {
                            return 'computed baz';
                        };
                        v.computeds = {
                            baz: true
                        };
                        v.el.innerHTML = "<div data-model-bind='fooBinding : computed.baz'>";
                        api = b3nd(v, {using: fooBinding});
                    });
                    afterEach(function () {
                        v.computeds = undefined;
                    });
                    it('should proxy non-function computeds to view methods', function () {
                        assert.equal(api.b3ndings.fooBinding.update.lastCall.args[0], 'computed baz');
                    });
                });
            });
            xdescribe("contenteditable b3nding", function () {
                // incompatible with jsdom;
                beforeEach(function () {
                    v.el.innerHTML = "<div id='content' data-model-bind=>";
                    b3nd(v);
                });
                it("should update the model when the content changes", function () {
                    v.el.querySelector("#content").innerHTML = "hello";
                    v.el.trigger(document.createEvent('trigger'));
                    expect(m.get('content')).toEqual("hello");
                });
            });
            it("should include the parent element when applying b3ndings", function () {
                var el = document.createElement('div');
                el.setAttribute('data-model-bind', 'fooBinding : model.foo');
                v.setElement(el);
                b3nd(v, {using: fooBinding});
                assert.equal(api.b3ndings.fooBinding.update.firstCall.args[0], m.get('foo'));
                assert.equal(api.b3ndings.fooBinding.update.firstCall.args[1], m);
                assert.equal(api.b3ndings.fooBinding.update.firstCall.args[2], v);
                m.set('foo', 'blargh');
                assert.equal(api.b3ndings.fooBinding.update.secondCall.args[0], m.get('foo'));
                assert.equal(api.b3ndings.fooBinding.update.secondCall.args[1], m);
                assert.equal(api.b3ndings.fooBinding.update.secondCall.args[2], v);
            });
        });
    });
});
