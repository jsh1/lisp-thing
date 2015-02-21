// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var Mnumber = require('./number.js');
var Mthrow = require('./throw.js');

var positive_integer_p = Mnumber['positive-integer?'];
var check_arg = Mthrow['check-arg'];
var signal_invalid_arg = Mthrow['signal-invalid-arg'];

function vectorp(a) {
  return Array.isArray(a);
}

function vector() {
  var ret = new Array(arguments.length);
  for (var i = 0; i < arguments.length; i++) {
    ret[i] = arguments[i];
  }
  return ret;
}

function make_vector(len, value) {
  check_arg(len, positive_integer_p);
  if (value === undefined) {
    value = null;
  }
  var vec = new Array(len);
  for (var i = 0; i < len; i++) {
    vec[i] = value;
  }
  return vec;
}

function vector_length(a) {
  check_arg(a, vectorp);
  return a.length;
}

function vector_ref(a, b) {
  check_arg(a, vectorp);
  check_arg(b, positive_integer_p);
  if (b > a.length) {
    signal_invalid_arg(b);
  }
  return a[b];
}

function vector_set(a, b, c) {
  check_arg(a, vectorp);
  check_arg(b, positive_integer_p);
  if (b > a.length) {
    signal_invalid_arg(b);
  }
  a[b] = c;
}

module.exports = {
  'vector?': vectorp,
  vector: vector,
  'make-vector': make_vector,
  'vector-length': vector_length,
  'vector-ref': vector_ref,
  'vector-set': vector_set
};
