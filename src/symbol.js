// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

function LispSymbol(a, keyword) {
  this.sym = a;
  this.key = keyword;
}

LispSymbol.prototype.equal = function(a) {
  return a instanceof LispSymbol && this.sym === a.sym && this.key === a.key;
};

// mostly so that symbols can be used as object keys

LispSymbol.prototype.toString = function() {
  return this.sym;
};

LispSymbol.prototype.print = function(print, stream, level, opts) {
  if (opts.hasOwnProperty('readable') && !opts.readable) {
    stream.puts(this.sym);
    return;
  }

  var s = this.sym;
  var i = 0;

  if (!this.key) {
    var seen_digit = false;
    switch (s.charCodeAt(i++)) {
      // '0' .. '9'
    case 48: case 49: case 50: case 51: case 52:
    case 53: case 54: case 55: case 56: case 57:
      seen_digit = true;
      /* falls through */
    case 45: case 43: case 46: // '+', '-', '.'
      while (i < s.length) {
        switch (s[i++]) {
          // '0' .. '9'
        case 48: case 49: case 50: case 51: case 52:
        case 53: case 54: case 55: case 56: case 57:
          seen_digit = true;
          /* falls through */
        case 47: case 46: // '/', '.'
          break;
        default:
          i = s.length;
        }
      }
    }
    if (seen_digit) {
      stream.puts('\\');
    }
  } else {
    stream.puts('#:');
  }

  i = 0;
  while (i < s.length) {
    var c = s.charCodeAt(i++);
    switch (c) {
    case 40: case 41: case 91: case 93: // '(', ')', '[', ']'
    case 39: case 34: case 59: case 92: // '\'', '"', ';', '\\'
    case 124: case 44: case 96: // '|', ',', '`'
      stream.puts('\\');
      break;

    case 35: // '#'
      // don't escape #!foo
      if (i !== 1 || i === s.length || s[i] !== '!') {
	stream.puts('\\');
      }
      break;

    default:
      if (c <= 32 || c === 127) {
	stream.puts('\\');
      }
    }

    stream.putc(c);
  }
};

function symbolp(a) {
  return a instanceof LispSymbol;
}

function keywordp(a) {
  return a instanceof LispSymbol && a.key;
}

function symbol_to_string(a) {
  return a.sym;
}

var obarray = {};

function string_to_symbol(a) {
  var x = obarray[a];
  if (!x) {
    x = new LispSymbol(a, false);
    obarray[a] = x;
  }
  return x;
}

var keyarray = {};

function string_to_keyword(a) {
  var x = keyarray[a];
  if (!x) {
    x = new LispSymbol(a, true);
    keyarray[a] = x;
  }
  return x;
}

module.exports = {
  'symbol?': symbolp,
  'symbol->string': symbol_to_string,
  'string->symbol': string_to_symbol,
  'keyword?': keywordp,
  'string->keyword': string_to_keyword
};
