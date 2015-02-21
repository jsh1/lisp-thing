// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var Mnumber = require('./number.js');
var Mthrow = require('./throw.js');

var integerp = Mnumber['integer?'];
var check_arg = Mthrow['check-arg'];

function LispChar(a) {
  this.char = String.fromCharCode(a);
}

LispChar.prototype.equal = function(a) {
  return a instanceof LispChar && this.char === a.char;
};

LispChar.prototype.toString = function() {
  return this.char;
};

LispChar.prototype.print = function(print, stream, level, opts) {
  if (opts.hasOwnProperty('readable') && !opts.readable) {
    stream.puts(this.char);
    return;
  }

  stream.puts('#\\');

  switch (this.char.charCodeAt(0)) {
  case 8:
    stream.puts('backquote');
    return;
  case 9:
    stream.puts('tab');
    return;
  case 10:
    stream.puts('newline');
    return;
  case 12:
    stream.puts('page');
    return;
  case 13:
    stream.puts('return');
    return;
  case 20:
    stream.puts('space');
    return;
  case 127:
    stream.puts('rubout');
    return;
  }

  stream.puts(this.char);
};

function charp(a) {
  return a instanceof LispChar;
}

function char_eq(a, b) {
  check_arg(a, charp);
  check_arg(b, charp);
  return a.char === b.char;
}

function char_lt(a, b) {
  check_arg(a, charp);
  check_arg(b, charp);
  return a.char < b.char;
}

function char_le(a, b) {
  check_arg(a, charp);
  check_arg(b, charp);
  return a.char <= b.char;
}

function char_gt(a, b) {
  check_arg(a, charp);
  check_arg(b, charp);
  return a.char > b.char;
}

function char_ge(a, b) {
  check_arg(a, charp);
  check_arg(b, charp);
  return a.char >= b.char;
}

function char_to_integer(a) {
  check_arg(a, charp);
  return a.char.charCodeAt(0);
}

var charray = {};

function integer_to_char(c) {
  check_arg(c, integerp);
  var x = charray[c];
  if (!x) {
    x = new LispChar(c);
    charray[c] = x;
  }
  return x;
}

function read_char(stream) {
  var c = stream.getc();
  if (c !== -1) {
    return integer_to_char(c);
  } else {
    return null;
  }
}

function peek_char(stream) {
  var c = stream.getc();
  if (c !== -1) {
    stream.ungetc();
    return integer_to_char(c);
  } else {
    return null;
  }
}

function eof_object_p(obj) {
  return obj === null;
}

// FIXME: implement char-ready?

function write_char(c, stream) {
  check_arg(c, charp);
  stream.putc(char_to_integer(c));
}

module.exports = {
  'char?': charp, 
  'char=?': char_eq,
  'char<?': char_lt,
  'char<=?': char_le,
  'char>?': char_gt,
  'char>=?': char_ge,
  'char->integer': char_to_integer,
  'integer->char': integer_to_char,
  'read-char': read_char,
  'peek-char': peek_char,
  'eof-object?': eof_object_p,
  'write-char': write_char
};
