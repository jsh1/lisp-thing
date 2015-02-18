/* Copyright (c) 2015 John Harper <jsh@unfactored.org>

   Permission is hereby granted, free of charge, to any person
   obtaining a copy of this software and associated documentation files
   (the "Software"), to deal in the Software without restriction,
   including without limitation the rights to use, copy, modify, merge,
   publish, distribute, sublicense, and/or sell copies of the Software,
   and to permit persons to whom the Software is furnished to do so,
   subject to the following conditions:

   The above copyright notice and this permission notice shall be
   included in all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
   EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
   MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
   NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
   BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
   ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
   CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE. */

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
