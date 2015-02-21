// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var Mthrow = require('./throw.js');

var check_arg = Mthrow['check-arg'];
var signal_divide_by_zero = Mthrow['signal-divide-by-zero'];
var signal_domain_error = Mthrow['signal-domain-error'];
var signal_missing_arg = Mthrow['signal-missing-arg'];

function numberp(a) {
  return typeof a === 'number';
}

function integerp(a) {
  return typeof a === 'number' && a|0 === a;
}

function positive_integer_p(a) {
  return typeof a === 'number' && Math.abs(a|0) === a;
}

function foldv(args, pred, f) {
  if (args.length < 1) {
    signal_missing_arg(1);
  }
  var ret = args[0];
  check_arg(ret, pred);
  for (var i = 1; i < args.length; i++) {
    var elt = args[i];
    check_arg(elt, pred);
    ret = f(ret, elt);
  }
  return ret;
}

function number_foldv(args, f) {
  return foldv(args, numberp, f);
}

function integer_foldv(args, f) {
  return foldv(args, integerp, f);
}

function compare_foldv(args, f) {
  if (args.length < 2) {
    signal_missing_arg(args.length + 1);
  }
  check_arg(args[0], numberp);
  for (var i = 1; i < args.length; i++) {
    check_arg(args[i], numberp);
    if (!f(args[i-1], args[i])) {
      return false;
    }
  }
  return true;
}

function plus() {
  if (arguments.length === 0) {
    return 0;
  } else {
    return number_foldv(arguments, function(a, b) {return a + b;});
  }
}

function minus() {
  if (arguments.length === 0) {
    signal_missing_arg(0);
  } else if (arguments.length === 1) {
    check_arg(arguments[0], numberp);
    return -arguments[0];
  } else {
    return number_foldv(arguments, function(a, b) {return a - b;});
  }
}

function product() {
  if (arguments.length === 0) {
    return 1;
  } else {
    return number_foldv(arguments, function(a, b) {return a * b;});
  }
}

function divide() {
  if (arguments.length === 0) {
    signal_missing_arg(0);
  } else if (arguments.length === 1) {
    check_arg(arguments[0], numberp);
    return 1 / arguments[0];
  } else {
    return number_foldv(arguments, function(a, b) {
      if (b === 0) {
	signal_divide_by_zero();
      }
      return a / b;
    });
  }
}

function remainder(a, b) {
  check_arg(a, numberp);
  check_arg(b, numberp);
  if (b === 0) {
    return signal_divide_by_zero();
  } else {
    return a % b;
  }
}

function modulo(a, b) {
  check_arg(a, numberp);
  check_arg(b, numberp);
  if (b === 0) {
    return signal_divide_by_zero();
  } else {
    var c = a % b;
    if (b < 0 ? c > 0 : c < 0) {
      c += b;
    }
    return c;
  }
}

function quotient(a, b) {
  check_arg(a, integerp);
  check_arg(b, integerp);
  if (b === 0) {
    return signal_divide_by_zero();
  } else {
    return (a / b)|0;
  }
}

function lognot(a) {
  check_arg(a, integerp);
  return ~a;
}

function logior() {
  return integer_foldv(arguments, function(a, b) {return a | b;});
}

function logxor() {
  return integer_foldv(arguments, function(a, b) {return a ^ b;});
}

function logand() {
  return integer_foldv(arguments, function(a, b) {return a & b;});
}

function plus1(a) {
  check_arg(a, numberp);
  return a + 1;
}

function sub1(a) {
  check_arg(a, numberp);
  return a - 1;
}

function ash(a, b) {
  check_arg(a, integerp);
  check_arg(b, integerp);
  return a << b;
}

function floor(a) {
  check_arg(a, numberp);
  return Math.floor(a);
}

function ceiling(a) {
  check_arg(a, numberp);
  return Math.ceil(a);
}

function truncate(a) {
  check_arg(a, numberp);
  return a | 0;
}

function round(a) {
  check_arg(a, numberp);
  return Math.round(a);
}

function exp(a) {
  check_arg(a, numberp);
  return Math.exp(a);
}

function log(a, b) {
  check_arg(a, numberp);
  if (b === undefined) {
    if (a >= 0) {
      return Math.log(a);
    }
  } else {
    check_arg(b, numberp);
    if (a >= 0 && b >= 0) {
      return Math.log(a) / Math.log(b);
    }
  }
  return signal_domain_error();
}

function sin(a) {
  check_arg(a, numberp);
  return Math.sin(a);
}

function cos(a) {
  check_arg(a, numberp);
  return Math.cos(a);
}

function tan(a) {
  check_arg(a, numberp);
  return Math.tan(a);
}

function asin(a) {
  check_arg(a, numberp);
  return Math.asin(a);
}

function acos(a) {
  check_arg(a, numberp);
  return Math.acos(a);
}

function atan(a, b) {
  check_arg(a, numberp);
  if (b === undefined) {
    return Math.atan(a);
  } else {
    check_arg(b, numberp);
    return Math.atan2(a, b);
  }
}

function sqrt(a) {
  check_arg(a, numberp);
  return Math.sqrt(a);
}

function expt(a, b) {
  check_arg(a, numberp);
  check_arg(b, numberp);
  return Math.pow(a, b);
}

function gcd() {
  if (arguments.length === 0) {
    return 0;
  } else if (arguments.length === 1) {
    check_arg(arguments[0], integerp);
    return arguments[0];
  } else {
    return integer_foldv(arguments, function(a, b) {
      // Euclid's algorithm
      a = Math.abs(a|0);
      b = Math.abs(b|0);
      while (a !== 0) {
	var t = b % a;
	b = a;
	a = t;
      }
      return b;
    });
  }
}

function lcm() {
  if (arguments.length === 0) {
    return 1;
  } else {
    var prod = 1;
    for (var i = 0; i < arguments.length; i++) {
      check_arg(arguments[i], numberp);
      prod = prod * Math.abs(arguments[i]);
    }
    var div = gcd.apply(null, arguments);
    return prod / div;
  }
}

function max() {
  return foldv(arguments, function (a) {return true;}, function(a, b) {
    // FIXME: using '<' directly not a good idea?
    return a < b ? b : a;
  });
}

function min() {
  return foldv(arguments, function (a) {return true;}, function(a, b) {
    // FIXME: using '<' directly not a good idea?
    return a < b ? a : b;
  });
}

function abs(x) {
  check_arg(x, numberp);
  return Math.abs(x);
}

function numeric_equal() {
  return compare_foldv(arguments, function(a, b) {return a === b;});
}

function numeric_less() {
  return compare_foldv(arguments, function(a, b) {return a < b;});
}

function numeric_greater() {
  return compare_foldv(arguments, function(a, b) {return a > b;});
}

function numeric_less_or_equal() {
  return compare_foldv(arguments, function(a, b) {return a <= b;});
}

function numeric_greater_or_equal() {
  return compare_foldv(arguments, function(a, b) {return a >= b;});
}

function zerop(x) {
  check_arg(x, numberp);
  return x === 0;
}

function positivep(x) {
  check_arg(x, numberp);
  return x > 0;
}

function negativep(x) {
  check_arg(x, numberp);
  return x < 0;
}

function oddp(x) {
  check_arg(x, numberp);
  return x % 1 === 1;
}

function evenp(x) {
  check_arg(x, numberp);
  return x %1 === 0;
}

function string_to_number(str, radix) {
  if (!radix) {
    return Number.parseFloat(str);
  } else {
    return Number.parseInt(str, radix);
  }
}

function number_to_string(a, radix) {
  check_arg(a, numberp);
  return Number.toString(a, radix || 10);
}

module.exports = {
  'number?': numberp,
  'integer?': integerp,
  'positive-integer?': positive_integer_p,
  '+': plus,
  '-': minus,
  '*': product,
  '/': divide,
  remainder: remainder,
  modulo: modulo,
  quotient: quotient,
  lognot: lognot,
  logior: logior,
  logxor: logxor,
  logand: logand,
  '1+': plus1,
  '1-': sub1,
  ash: ash,
  floor: floor,
  ceiling: ceiling,
  truncate: truncate,
  round: round,
  exp: exp,
  log: log,
  sin: sin,
  cos: cos,
  tan: tan,
  asin: asin,
  acos: acos,
  atan: atan,
  sqrt: sqrt,
  expt: expt,
  gcd: gcd,
  lcm: lcm,
  max: max,
  min: min,
  abs: abs,
  '=': numeric_equal,
  '<': numeric_less,
  '>': numeric_greater,
  '<=': numeric_less_or_equal,
  '>=': numeric_greater_or_equal,
  'zero?': zerop,
  'positive?': positivep,
  'negative?': negativep,
  'odd?': oddp,
  'even?': evenp,
  'string->number': string_to_number,
  'number->string': number_to_string,
};
