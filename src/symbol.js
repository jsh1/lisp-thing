// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

function LispSymbol(a) {
  this.sym = a;
}

LispSymbol.prototype.equal = function(a) {
  return a instanceof LispSymbol && this.sym === a.sym;
};

function symbolp(a) {
  return a instanceof LispSymbol;
}

function symbol_to_string(a) {
  return a.sym;
}

var obarray = {};

function string_to_symbol(a) {
  var x = obarray[a];
  if (!x) {
    x = new LispSymbol(a);
    obarray[a] = x;
  }
  return x;
}

module.exports = {
  'symbol?': symbolp,
  'symbol->string': symbol_to_string,
  'string->symbol': string_to_symbol
};
