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
var Mthrow = require('./throw.js');
var Mnumber = require('./number.js');
var Mequality = require('./equality.js');

var pairp = Mcons['pair?'];
var cons = Mcons.cons;
var car = Mcons.car;
var cdr = Mcons.cdr;
var listp = Mcons['list?'];
var positive_integer_p = Mnumber['positive-integer?'];
var equal = Mequality['equal?'];
var check_arg = Mthrow['check-arg'];

function make_list(len, value) {
  check_arg(len, positive_integer_p);
  var lst = null;
  for (var i = 0; i < len; i++) {
    lst = cons(lst, value || null);
  }
  return lst;
}

function append() {
  var len = arguments.length;
  var ret = null;
  var tail = null;
  while (len >= 0 && arguments[len - 1] === null) {
    len--;
  }
  for (var i = 0; i < len; i++) {
    var lst = arguments[i];
    check_arg(lst, listp);
    if (lst !== null) {
      if (i !== len - 1) {
        for (; pairp(lst); lst = cdr(lst)) {
          var next = cons(lst.car, null);
          if (tail) {
            tail.cdr = next;
          } else {
            ret = next;
          }
          tail = next;
        }
      } else {
        if (tail) {
          tail.cdr = lst;
        } else {
          ret = lst;
        }
      }
    }
  }
  return ret;
}

function nconc() {
  var ret = null;
  var tail = null;
  var len = arguments.length;
  for (var i = 0; i < len; i++) {
    var lst = arguments[i];
    check_arg(lst, listp);
    if (lst !== null) {
      if (tail) {
        tail.cdr = lst;
      } else {
        ret = lst;
        tail = lst;
      }
      var next = cdr(tail);
      for (; pairp(next); next = cdr(next)) {
        tail = next;
      }
    }
  }
  return ret;
}

function reverse(lst) {
  check_arg(lst, listp);
  var ret = null;
  for (; pairp(lst); lst = cdr(lst)) {
    ret = cons(lst.car, ret);
  }
  return ret;
}

function nreverse(lst) {
  check_arg(lst, listp);
  var ret = null;
  while (pairp(lst)) {
    var next = lst.cdr;
    lst.cdr = ret;
    ret = lst;
    lst = next;
  }
  return ret;
}

function list_length(lst) {
  check_arg(lst, listp);
  var len = 0;
  while (pairp(lst)) {
    len++;
    lst = lst.cdr;
  }
  return len;
}

function list_tail(lst, i) {
  check_arg(lst, listp);
  check_arg(i, positive_integer_p);
  for (; i > 0; i--) {
    lst = cdr(lst);
  }
  return lst;
}

function list_ref(lst, i) {
  check_arg(lst, listp);
  check_arg(i, positive_integer_p);
  for (; i > 0; i--) {
    lst = cdr(lst);
  }
  return car(lst);
}

function memq(a, lst) {
  check_arg(lst, listp);
  while (pairp(lst)) {
    if (lst.car === a) {
      return lst;
    }
    lst = lst.cdr;
  }
  return null;
}

function member(a, lst) {
  check_arg(lst, listp);
  while (pairp(lst)) {
    if (equal(lst.car, a)) {
      return lst;
    }
    lst = lst.cdr;
  }
  return null;
}

function assq(lst, a) {
  check_arg(lst, listp);
  while (pairp(lst)) {
    var cell = lst.car;
    if (car(cell) === a) {
      return cell;
    }
    lst = lst.cdr;
  }
  return null;
}

function assoc(lst, a) {
  check_arg(lst, listp);
  while (pairp(lst)) {
    var cell = lst.car;
    if (equal(car(cell), a)) {
      return cell;
    }
    lst = cdr(lst);
  }
  return null;
}

module.exports = {
  'make-list': make_list,
  append: append,
  nconc: nconc,
  reverse: reverse,
  nreverse: nreverse,
  'list-length': list_length,
  'list-tail': list_tail,
  'list-ref': list_ref,
  memq: memq,
  member: member,
  assq: assq,
  assoc: assoc
};
