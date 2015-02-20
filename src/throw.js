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

var Mcons = require('./cons.js');
var Msymbol = require('./symbol.js');

var pairp = Mcons['pair?'];
var car = Mcons.car;
var cdr = Mcons.cdr;
var listp = Mcons['list?'];
var list = Mcons.list;
var string_to_symbol = Msymbol['string->symbol'];

// data must be a list

function LispException(tag, data) {
  this.tag = tag;
  this.data = data;
}

function call_with_catch(tag, thunk) {
  try {
    return thunk();
  } catch(e) {
    if (e instanceof LispException && e.tag === tag) {
      return e.data;
    } else {
      throw e;
    }
  }
}

function call_with_unwind_protect(thunk, prot_thunk) {
  try {
    return thunk();
  } finally {
    prot_thunk();
  }
}

var Qerror = string_to_symbol('error');
var Qinvalid_arg = string_to_symbol('invalid-arg');
var Qmissing_arg = string_to_symbol('missing-arg');
var Qarith_error = string_to_symbol('arith-error');

function call_with_error_handlers(thunk /* . handlers */) {
  try {
    return thunk();
  } catch(e) {
    if (!(e instanceof LispException) || e.tag !== Qerror) {
      throw e;
    }
    var type = e.data.car;
    for (var i = 1; i < arguments.length; i++) {
      var h_type = car(arguments[i]);
      if ((listp(h_type) && memq(type, h_type)) ||
          h_type === Qerror || h_type === type) {
        return cdr(arguments[i])(e.data);
      }
    }
    throw e;
  }
}

function memq(a, lst) {
  while (pairp(lst)) {
    if (lst.car === a) {
      return lst;
    }
    lst = lst.cdr;
  }
  return null;
}

function throw_(tag, value) {
  throw new LispException(tag, value);
}

function signal(data) {
  throw new LispException(Qerror, data);
}

function signal_invalid_arg(arg) {
  signal(list(Qinvalid_arg, arg));
}

function signal_missing_arg(i) {
  signal(list(Qmissing_arg, i));
}

function signal_divide_by_zero() {
  signal(list(Qarith_error, list('Divide by zero')));
}

function signal_domain_error() {
  signal(list(Qarith_error, list('Domain error')));
}

function check_arg(arg, pred) {
  if (!pred(arg)) {
    signal_invalid_arg(arg);
  }
}

module.exports = {
  'call-with-catch': call_with_catch,
  'call-with-unwind-protect': call_with_unwind_protect,
  'call-with-error-handlers': call_with_error_handlers,
  throw: throw_,
  signal: signal,
  'signal-invalid-arg': signal_invalid_arg,
  'signal-missing-arg': signal_missing_arg,
  'signal-divide-by-zero': signal_divide_by_zero,
  'signal-domain-error': signal_domain_error,
  'check-arg': check_arg,

  '-core-blacklist': {
    'signal-invalid-arg': true,
    'signal-missing-arg': true,
    'signal-divide-by-zero': true,
    'signal-domain-error': true,
  }
};
