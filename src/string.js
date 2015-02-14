// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

var Mcons = require('./cons.js');
var Mchar = require('./char.js');
var Mnumber = require('./number.js');
var Mthrow = require('./throw.js');

var pairp = Mcons['pair?'];
var charp = Mchar['char?'];
var integer_to_char = Mchar['integer->char'];
var postive_integer_p = Mnumber['postive-integer?'];
var check_arg = Mthrow['check-arg'];
var signal_invalid_arg = Mthrow['signal-invalid-arg'];

function stringp(a) {
  return typeof a === 'string';
}

function string_length(a) {
  check_arg(a, stringp);
  return a.length;
}

function string_equal(a, b) {
  check_arg(a, stringp);
  check_arg(b, stringp);
  return a === b;
}

function string_less(a, b) {
  check_arg(a, stringp);
  check_arg(b, stringp);
  return a < b;
}

function string_ref(a, i) {
  check_arg(a, stringp);
  if (i < 0 || i >= a.length) {
    signal_invalid_arg(i);
  }
  return integer_to_char(a.charCodeAt(i));
}

function substring(str, start, end) {
  check_arg(str, stringp);
  check_arg(start, postive_integer_p);
  if (start < 0 || start >= str.length) {
    signal_invalid_arg(start);
  }
  if (end === undefined) {
    return str.substring(start);
  }
  check_arg(end, postive_integer_p);
  if (end < start || end >= str.length) {
    signal_invalid_arg(end);
  }
  return str.substring(start, end);
}

function concat() {
  var ret = '';
  for (var i = 0; i < arguments.length; i++) {
    var elt = arguments[i];
    if (charp(elt)) {
      ret += elt.char;
    } else if (pairp(elt)) {
      while (pairp(elt)) {
	ret += elt.car.char;
	elt = elt.cdr;
      }
    } else if (Array.isArray(elt)) {
      for (var vi = 0; vi < elt.length; vi++) {
	ret += elt[vi].char;
      }
    } else if (stringp(elt)) {
      ret += elt;
    } else {
      signal_invalid_arg(elt);
    }
  }
  return ret;
}

module.exports = {
  'string?': stringp,
  'string-length': string_length,
  'string=?': string_equal,
  'string<?': string_less,
  'string-ref': string_ref,
  substring: substring,
  concat: concat
};
