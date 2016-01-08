# b3nd
knockout-style bindings for Backbone models and views

##installation:
```sh
npm install --save b3nd
```

##usage:
```js
const b3nd = require('b3nd');
```
bind.view binds your model's data to DOM elements
call bind with your view to bind your view to your model's change events:
```js
var bind = require('bunsen/helpers/bind');
var MyView = Backbone.View.extend({
  initialize : function () {
    bind(this);
  },
});
```
This above code binds your model to your view's DOM elements.
To specify how your view should consume the binding, specify a data-model-bind
attribute in the element(s) of your view. The syntax of the data-model-bind attribute
is that of of a javascript object, but without the outer braces. The key is the name
of the binding, and the value is a javascript expression. The binding expression is
evaluated in the global scope and has access to a variable called "model" that
contains the values of the model to which the element is bound. For example:

```html
<div>My full name is:
  <span data-model-bind='text : model.firstName'>
    <span data-model-bind='text : model.lastName, visible : model.lastName'>
    <span data-model-bind='visible : !model.lastName'>Oops, last name is not set</span>
  </span>
</div>
```

In this example, whenever firstName or lastName changes in your model, the DOM
will automatically update according to the 'text' binding. If lastName is falsy,
then "Oops, last name is not set" is shown. For a list of pre-defined bindings,
see the bindings object below.

computeds can be specified as a property of the view on which bind is called:

```js
var MyView = Backbone.View.extend({
  computed : {
    fullName : function (attributes) {
      return attributes.firstName + " " + attributes.lastName;
    }
  },
  initialize : function () {
    b3nd(this);
  },
});
```

The computed callback is passed the result of calling toJSON on the model.

the result of computeds can be referenced in the binding data on a global called `computed`:
```html
<div data-model-bind='text : computed.fullName'></div>
```