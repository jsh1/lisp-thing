// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

var Mcons = require('./cons.js');
var Msymbol = require('./symbol.js');

var pairp = Mcons['pair?'];
var cons = Mcons.cons;
var car = Mcons.car;
var cdr = Mcons.cdr;
var cadr = Mcons.cadr;
var listp = Mcons['list?'];
var list = Mcons.list;
var string_to_symbol = Msymbol['string->symbol'];

function call_with_catch(tag, thunk) {
  try {
    return thunk();
  } catch(e) {
    if (car(e) === tag) {
      return cdr(e);
    } else {
      throw e;
    }
  }
}

function call_with_unwind_protect(thunk, prot_thunk) {
  var threw = false;
  var ret, exc;
  try {
    ret = thunk();
  } catch(e) {
    threw = true;
    exc = e;
  }
  prot_thunk();
  if (threw) {
    throw exc;
  }
  return ret;
}

var Qerror = string_to_symbol('error');
var Qinvalid_arg = string_to_symbol('invalid-arg');
var Qmissing_arg = string_to_symbol('missing-arg');
var Qinvalid_lambda = string_to_symbol('invalid-lambda');
var Qarith_error = string_to_symbol('arith-error');

function call_with_error_handlers(thunk /* . handlers */) {
  try {
    return thunk();
  } catch(e) {
    if (car(e) !== Qerror) {
      throw e;
    }
    var type = cadr(e);
    for (var i = 1; i < arguments.length; i++) {
      var h_type = car(arguments[i]);
      if ((listp(h_type) && memq(type, h_type)) ||
          h_type === Qerror || h_type === type) {
        return cdr(arguments[i])(cdr(e));
      }
    }
    throw e;
  }
}

function memq(a, lst) {
  while (pairp(lst)) {
    if (lst.car === a) {
      return lst.cdr;
    }
    lst = lst.cdr;
  }
  return null;
}

function throw_(tag, value) {
  throw cons(tag, value);
}

function signal(data) {
  throw cons(Qerror, data);
}

function signal_invalid_arg(arg) {
  signal(list(Qinvalid_arg, arg));
}

function signal_missing_arg(i) {
  signal(list(Qmissing_arg, i));
}

function signal_invalid_lambda(lst, arg) {
  signal(list(Qinvalid_lambda, lst, arg));
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
