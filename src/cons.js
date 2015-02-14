// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

var Mequality = require('./equality.js');

var equal = Mequality['equal?'];

function LispCons(a, b) {
  this.car = a; this.cdr = b;
}

LispCons.prototype.equal = function(a) {
  return a instanceof LispCons &&
    equal(this.car, a.car) && equal(this.cdr, a.cdr);
};

function pairp(a) {
  return a instanceof LispCons;
}

function cons(a, b) {
  return new LispCons(a, b);
}

function car(a) {
  return (a instanceof LispCons) ? a.car : null;
}

function cdr(a) {
  return (a instanceof LispCons) ? a.cdr : null;
}

function set_car(a, b) {
  a.car = b;
}

function set_cdr(a, b) {
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
