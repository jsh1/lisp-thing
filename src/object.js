// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var Mequality = require('./equality.js');
var Msymbol = require('./symbol.js');

var not = Mequality.not;
var intern = Msymbol['string->symbol'];

function objectp(arg) {
  return arg !== null && typeof arg === 'object';
}

function make_object() {
  return {};
}

function object_ref(object, key) {
  return object[key];
}

function object_defines_p(object, key) {
  return object.hasOwnProperty(key);
}

function object_set(object, key, value) {
  object[key] = value;
}

function object_delete(object, key, value) {
  delete object[key];
}

function object_for_each(fun, object) {
  for (var key in object) {
    fun(key, object[key]);
  }
}

function object_map(fun, object) {
  var copy = {};
  for (var key in object) {
    var value = fun(key, object[key]);
    if (value !== undefined) {
      copy[key] = value;
    }
  }
  return copy;
}

function object_filter(fun, object) {
  var copy = {};
  for (var key in object) {
    var value = object[key];
    if (!not(fun(key, value))) {
      copy[key] = value;
    }
  }
  return copy;
}

module.exports = {
  'object?': objectp,
  'make-object': make_object,
  'object-ref': object_ref,
  'object-defines?': object_defines_p,
  'object-set!': object_set,
  'object-delete!': object_delete,
  'object-for-each': object_for_each,
  'object-map': object_map,
  'object-filter': object_filter,
};
