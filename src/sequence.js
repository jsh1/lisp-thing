// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

var Mcons = require('./cons.js');
var Mlist = require('./list.js');
var Mstring = require('./string.js');
var Mvector = require('./vector.js');
var Mnumber = require('./number.js');
var Mthrow = require('./throw.js');

var pairp = Mcons['pair?'];
var listp = Mcons['list?'];
var cons = Mcons.cons;
var car = Mcons.car;
var cdr = Mcons.cdr;
var list_ref = Mlist['list-ref'];
var list_length = Mlist['list-length'];
var stringp = Mstring['string?'];
var string_length = Mstring['string-length'];
var string_ref = Mstring['string-ref'];
var vectorp = Mvector['vector?'];
var vector_length = Mvector['vector-length'];
var vector_ref = Mvector['vector-ref'];
var positive_integer_p = Mnumber['positive-integer?'];
var check_arg = Mthrow['check-arg'];
var signal_invalid_arg = Mthrow['signal-invalid-arg'];

function length(seq) {
  if (listp(seq)) {
    return list_length(seq);
  } else if (vectorp(seq)) {
    return vector_length(seq);
  } else if (stringp(seq)) {
    return string_length(seq);
  } else {
    signal_invalid_arg(seq);
  }
}

function elt(seq, i) {
  check_arg(i, positive_integer_p);
  if (listp(seq)) {
    return list_ref(seq, i);
  } else if (vectorp(seq)) {
    return vector_ref(seq, i);
  } else if (stringp(seq)) {
    return string_ref(seq, i);
  } else {
    signal_invalid_arg(seq);
  }
}

function copy_sequence(seq) {
  if (seq === null) {
    return null;
  }
  var ret = null;
  if (pairp(seq)) {
    var tail = cons(seq.car, null);
    seq = seq.cdr;
    while (pairp(seq)) {
      tail = tail.cdr = cons(seq.car, null);
      seq = seq.cdr;
    }
    tail.cdr = seq;
  } else if (vectorp(seq)) {
    ret = seq.slice();
  } else if (stringp(seq)) {
    // strings are immutable in JS
    ret = seq;
  } else {
    signal_invalid_arg(seq);
  }
}

module.exports = {
  length: length,
  elt: elt,
  'copy-sequence': copy_sequence
};
