// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

function LispChar(a) {
  this.char = String.fromCharCode(a);
}

LispChar.prototype.equal = function(a) {
  return a instanceof LispChar && this.char === a.char;
};

function charp(a) {
  return a instanceof LispChar;
}

function char_eq(a, b) {
  return a.char === b.char;
}

function char_lt(a, b) {
  return a.char < b.char;
}

function char_le(a, b) {
  return a.char <= b.char;
}

function char_gt(a, b) {
  return a.char > b.char;
}

function char_ge(a, b) {
  return a.char >= b.char;
}

function char_to_integer(a) {
  return a.char.charCodeAt(0);
}

var charray = {};

function integer_to_char(c) {
  var x = charray[c];
  if (!x) {
    x = new LispChar(c);
    charray[c] = x;
  }
  return x;
}

module.exports = {
  'char?': charp, 
  'char=?': char_eq,
  'char<?': char_lt,
  'char<=?': char_le,
  'char>?': char_gt,
  'char>=?': char_ge,
  'char->integer': char_to_integer,
  'integer->char': integer_to_char
};
