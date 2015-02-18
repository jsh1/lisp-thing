/* Copyright (c) 2015 John Hsarper <jsh@unfactored.org>

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

var Mequality = require('./equality.js');
var Mthrow = require('./throw.js');

var equal = Mequality['equal?'];
var check_arg, signal_invalid_arg;

// lazy loading to avoid circular object dependency
function load_throw() {
  var Mthrow = require('./throw.js');
  signal_invalid_arg = Mthrow['signal-invalid-arg'];
  check_arg = Mthrow['check-arg'];
}

function LispCons(a, b) {
  this.car = a; this.cdr = b;
}

LispCons.prototype.equal = function(a) {
  return a instanceof LispCons &&
    equal(this.car, a.car) && equal(this.cdr, a.cdr);
};

LispCons.prototype.print = function(print, stream, level, opts) {
  var max_length = opts['max-length'] || Infinity;

  stream.puts('(');

  var obj = this;
  var i = 0;

  while(pairp(obj.cdr)) {
    if (i++ > max_length) {
      stream.puts('...');
      break;
    }
    print(obj.car, stream, level + 1, opts);
    obj = cdr(obj);
    stream.puts(' ');
  }

  if (i++ < max_length) {
    print(car(obj), stream, level + 1, opts);
    if (cdr(obj) !== null) {
      stream.puts(' . ');
      print(cdr(obj), stream, level + 1, opts);
    }
  }

  stream.puts(')');
};

function pairp(a) {
  return a instanceof LispCons;
}

function cons(a, b) {
  return new LispCons(a, b);
}

function car(a) {
  if (a instanceof LispCons) {
    return a.car;
  } else if (a === null) {
    return null;
  } else {
    load_throw();
    signal_invalid_arg(a);
  }
}

function cdr(a) {
  if (a instanceof LispCons) {
    return a.cdr;
  } else if (a === null) {
    return null;
  } else {
    load_throw();
    signal_invalid_arg(a);
  }
}

function set_car(a, b) {
  if (!check_arg) {
    load_throw();
  }
  check_arg(a, pairp);
  a.car = b;
}

function set_cdr(a, b) {
  if (!check_arg) {
    load_throw();
  }
  check_arg(a, pairp);
  a.cdr = b;
}

function caar(a) {return car(car(a));}
function cadr(a) {return car(cdr(a));}
function cdar(a) {return cdr(car(a));}
function cddr(a) {return cdr(cdr(a));}
function caaar(a) {return car(car(car(a)));}
function caadr(a) {return car(car(cdr(a)));}
function cadar(a) {return car(cdr(car(a)));}
function caddr(a) {return car(cdr(cdr(a)));}
function cdaar(a) {return cdr(car(car(a)));}
function cdadr(a) {return cdr(car(cdr(a)));}
function cddar(a) {return cdr(cdr(car(a)));}
function cdddr(a) {return cdr(cdr(cdr(a)));}
function caaaar(a) {return car(car(car(car(a))));}
function caaadr(a) {return car(car(car(cdr(a))));}
function caadar(a) {return car(car(cdr(car(a))));}
function caaddr(a) {return car(car(cdr(cdr(a))));}
function cadaar(a) {return car(cdr(car(car(a))));}
function cadadr(a) {return car(cdr(car(cdr(a))));}
function caddar(a) {return car(cdr(cdr(car(a))));}
function cadddr(a) {return car(cdr(cdr(cdr(a))));}
function cdaaar(a) {return cdr(car(car(car(a))));}
function cdaadr(a) {return cdr(car(car(cdr(a))));}
function cdadar(a) {return cdr(car(cdr(car(a))));}
function cdaddr(a) {return cdr(car(cdr(cdr(a))));}
function cddaar(a) {return cdr(cdr(car(car(a))));}
function cddadr(a) {return cdr(cdr(car(cdr(a))));}
function cdddar(a) {return cdr(cdr(cdr(car(a))));}
function cddddr(a) {return cdr(cdr(cdr(cdr(a))));}

function nullp(a) {
  return a === null;
}

function listp(a) {
  return a === null || pairp(a);
}

function list() {
  var lst = null;
  for (var i = arguments.length - 1; i >= 0; i--) {
    lst = cons(arguments[i], lst);
  }
  return lst;
}

function list_star() {
  if (arguments.length === 0) {
    return null;
  }
  var i = arguments.length - 1;
  var lst = arguments[i--];
  for (; i >= 0; i--) {
    lst = cons(arguments[i], lst);
  }
  return lst;
}

module.exports = {
  'pair?': pairp,
  cons: cons,
  car: car,
  cdr: cdr,
  'set-car!': set_car,
  'set-cdr!': set_cdr,
  caar: caar,
  cadr: cadr,
  cdar: cdar,
  cddr: cddr,
  caaar: caaar,
  caadr: caadr,
  cadar: cadar,
  caddr: caddr,
  cdaar: cdaar,
  cdadr: cdadr,
  cddar: cddar,
  cdddr: cdddr,
  caaaar: caaaar,
  caaadr: caaadr,
  caadar: caadar,
  caaddr: caaddr,
  cadaar: cadaar,
  cadadr: cadadr,
  caddar: caddar,
  cadddr: cadddr,
  cdaaar: cdaaar,
  cdaadr: cdaadr,
  cdadar: cdadar,
  cdaddr: cdaddr,
  cddaar: cddaar,
  cddadr: cddadr,
  cdddar: cdddar,
  cddddr: cddddr,
  'null?': nullp,
  'list?': listp,
  list: list,
  'list*': list_star
};
