// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var Mchar = require('./char.js');
var Mcons = require('./cons.js');
var Mstring = require('./string.js');
var Msymbol = require('./symbol.js');
var Mchar = require('./char.js');
var Mthrow = require('./throw.js');

var charp = Mchar['char?'];
var cons = Mcons.cons;
var list = Mcons.list;
var symbolp = Msymbol['symbol?'];
var string_to_symbol = Msymbol['string->symbol'];
var string_to_keyword = Msymbol['string->keyword'];
var stringp = Mstring['string?'];
var integer_to_char = Mchar['integer->char'];
var signal = Mthrow.signal;

var Qend_of_stream = string_to_symbol('end-of-stream');
var Qpremature_end_of_stream = string_to_symbol('premature-end-of-stream');
var Qinvalid_read_syntax = string_to_symbol('invalid-read-syntax');

function signal_end_of_stream(stream, premature) {
  signal(list(premature ? Qpremature_end_of_stream : Qend_of_stream, stream));
}

function signal_read_syntax(stream) {
  signal(list(Qinvalid_read_syntax, stream));
}

var Qquote = string_to_symbol('quote');
var Qbackquote = string_to_symbol('backquote');
var Qbackquote_splice = string_to_symbol('backquote-splice');
var Qbackquote_unquote = string_to_symbol('backquote-unquote');
var Qref = string_to_symbol('ref');

function read_form(stream, nested) {
  var form;
  while (true) {
    var c = skip_whitespace(stream)|0;
    switch (c) {
    case -1:
      signal_end_of_stream(stream, nested);
      break;
    case 40: // '('
      return read_list(stream);
    case 39: // '\''
    case 96: // '`'
      form = read_form(stream);
      return list(c === 39 ? Qquote : Qbackquote, form);
    case 44: // ','
      c = stream.getc()|0;
      if (c !== -1 && c !== 64) { // '@'
        stream.ungetc();
      }
      form = read_form(stream);
      return cons(c === 64 ? Qbackquote_splice : Qbackquote_unquote, form);
    case 91: // '['
      return read_vector(stream, 93);
    case 123: // '{'
      return read_object(stream);
    case 34: // '"'
      return read_string(stream);
    case 35: // '#'
      c = stream.getc()|0;
      switch (c) {
      case -1:
        signal_end_of_stream(stream, nested);
        break;
      case 40: // '('
        return read_vector(stream, 41);
      case 124: // '|'
        skip_comment(stream, c);
        continue;
      case 92: // '\\'
        return read_char(stream);
      case 33: // '!'
        stream.ungetc();
        return read_atom(stream, 35, false, string_to_symbol);
      case 58: // ':'
        return read_atom(stream, stream.getc(), false, string_to_keyword);
      case 116: // 't'
      case 84: // 'T'
        return true;
      case 102: // 'f'
      case 70: // 'F'
        return false;
      default:
        signal_read_syntax(stream);
        break;
      case 98: // 'b'
      case 66: // 'B'
      case 111: // 'o'
      case 79: // 'O'
      case 100: // 'd'
      case 68: // 'D'
      case 120: // 'x'
      case 88: // 'X'
      case 101: // 'e'
      case 69: // 'E'
      case 105: // 'i'
      case 73: // 'I'
        stream.ungetc();
        c = 35; // '#'
        /* falls through */
      }
      /* falls through */
    default:
      form = read_atom(stream, c, true, string_to_symbol);
      if (symbolp(form)) {
        c = stream.getc()||0;
        if (c === 35) {
          var key = read_atom(stream, stream.getc(), false, string_to_symbol);
          return list(Qref, form, list(Qquote, key));
        } else {
          stream.ungetc();
        }
      }
      return form;
    }
  }
}

function read_list(stream) {
  var ret = null;
  var tail = null;
  var dotted = false;
  var complete = false;
  var form;
  while (true) {
    var c = skip_whitespace(stream)|0;
    switch (c) {
    case -1:
      signal_end_of_stream(stream, true);
      break;
    case 41: // ')'
      return ret;
    case 46: // '.'
      if (complete) {
        signal_read_syntax(stream);
      }
      if (!dotted) {
        dotted = true;
        continue;
      }
      signal_read_syntax(stream);
      break;
    default:
      if (complete) {
        signal_read_syntax(stream);
      }
      stream.ungetc();
      form = read_form(stream, true);
      if (!dotted) {
        form = cons(form, null);
      } else {
        complete = true;
      }
      if (tail) {
        tail.cdr = form;
      } else {
        ret = form;
      }
      tail = form;
    }
  }
  // not reached
}

function read_vector(stream, terminator) {
  terminator = terminator|0;
  var array = [];
  while (true) {
    var c = skip_whitespace(stream)|0;
    if (c === -1) {
      signal_end_of_stream(stream, true);
    } else if (c === terminator) {
      return array;
    }
    stream.ungetc();
    array.push(read_form(stream, true));
  }
  // not reached
}

function read_object(stream) {
  var obj = {};
  while (true) {
    var c = skip_whitespace(stream)|0;
    if (c === -1) {
      signal_end_of_stream(stream, true);
    } else if (c === 125) { // '\}'
      return obj;
    }
    stream.ungetc();
    var key = read_form(stream, true);
    if (!stringp(key) && !symbolp(key) && !charp(key)) {
      signal_read_syntax(stream);
    }
    var value = read_form(stream, true);
    obj[key] = value;
  }
  // not reached
}

function read_string(stream) {
  var ret = '';
  while (true) {
    var c = stream.getc()|0;
    switch (c) {
    case -1:
      signal_end_of_stream(stream, true);
      break;
    case 34: // '"'
      return ret;
    case 92: // '\\'
      c = read_string_escape(stream);
      /* falls through */
    default:
      ret += String.fromCharCode(c);
    }
  }
  // not reached
}

function read_string_escape(stream) {
  var c = stream.getc()|0;
  var c1, c2, c3, c4;
  switch (c) {
  case -1:
    signal_end_of_stream(stream, true);
    break;
  case 110: // 'n'
    return 10;
  case 114: // 'r'
    return 13;
  case 102: // 'f'
    return 12;
  case 116: // 't'
    return 9;
  case 118: // 'v'
    return 11;
  case 97: // 'a'
    return 7;
  case 34: // '"'
    return 34;
  case 92: // '\\'
    return 92;
  case 94: // '^'
    c = stream.getc()|0;
    if (c === -1) {
      signal_end_of_stream(stream, true);
    }
    return String.fromCharCode(c).toUpperCase().charCodeAt(0) ^ 64;
  case 48: // '0'
  case 49: // '1'
  case 50: // '2'
  case 51: // '3'
  case 52: // '4'
  case 53: // '5'
  case 54: // '6'
  case 55: // '7'
    c1 = stream.getc()|0;
    c2 = stream.getc()|0;
    if (octal_digit(c1) && octal_digit(c2)) {
      return octal_digit(c) * 64 + octal_digit(c1) * 8 + octal_digit(c2);
    } else {
      signal_read_syntax(stream);
    }
    // not reached
    break;
  case 120: // 'x'
    c1 = stream.getc()|0;
    c2 = stream.getc()|0;
    if (is_hex_digit(c1) && is_hex_digit(c2)) {
      return hex_digit(c1) * 16 + hex_digit(c2);
    } else {
      signal_read_syntax(stream);
    }
    // not reached
    break;
  case 120: // 'u'
    c1 = stream.getc()|0;
    c2 = stream.getc()|0;
    c3 = stream.getc()|0;
    c4 = stream.getc()|0;
    if (is_hex_digit(c1) && is_hex_digit(c2) &&
        is_hex_digit(c3) && is_hex_digit(c3)) {
      return (hex_digit(c1) * 4096 + hex_digit(c2) * 256 +
	      hex_digit(c3) * 16 + hex_digit(c4));
    } else {
      signal_read_syntax(stream);
    }
    // not reached
    break;
  default:
    signal_read_syntax(stream);
  }
}

var char_map = {
  'space': integer_to_char(32),
  'newline': integer_to_char(10),
  'backquote': integer_to_char(8),
  'tab': integer_to_char(9),
  'linefeed': integer_to_char(10),
  'return': integer_to_char(13),
  'page': integer_to_char(12),
  'rubout': integer_to_char(127),
};

function read_char(stream) {
  var c = stream.getc()|0;
  if (c === -1) {
    signal_read_syntax(stream);
  }
  if (!isalpha(c)) {
    return integer_to_char(c);
  }
  var c2 = stream.getc()|0;
  if (c2 === -1) {
    return integer_to_char(c);
  } else if (isdelim(c2)) {
    stream.ungetc(c2);
    return integer_to_char(c);
  }
  c = tolower(c);
  c2 = tolower(c2);
  for (var char_name in char_map) {
    if (char_name.charCodeAt(0) === c && char_name.charCodeAt(1) === c2) {
      for (var char_i = 2; true; char_i++) {
        c = stream.getc()|0;
        if (char_i === char_name.length) {
          if (c !== -1 && !isdelim(c)) {
            signal_read_syntax(stream);
          }
          if (c !== -1) {
            stream.ungetc();
          }
          return char_map[char_name];
        } else if (c === -1 || tolower(c) !== char_name.charCodeAt(char_i)) {
          signal_read_syntax(stream);
        }
      }
    }
  }
  signal_read_syntax(stream);
}

function read_atom(stream, c, allow_number, intern) {
  c = c|0;
  var buffer = '';
  var radix = allow_number ? -1 : 0;
  var sign = 1;
  var ifirst = 0;
  var exact = true;
  var rational = false;
  var exponent = false;
  var had_sign = false;
  var expecting_prefix = false;
  var force_exact = 0;
  while (c !== -1) {
    if (isdelim(c)) {
      stream.ungetc();
      return finish_atom(stream, buffer, ifirst, rational,
                         radix, exact, sign, intern);
    }
    switch (c) {
    case 92: // '\\'
      radix = 0;
      c = stream.getc()|0;
      if (c === -1) {
        signal_end_of_stream(stream, true);
      }
      buffer += String.fromCharCode(c);
      break;
    case 124: // '|'
      radix = 0;
      c = stream.getc()|0;
      while (c !== -1 && c !== 124) {
        buffer += String.fromCharCode(c);
        c = stream.getc()|0;
      }
      if (c === -1) {
        signal_end_of_stream(stream, true);
      }
      break;
    case 35: // '#'
      if (radix === 0 && buffer.length > 0) {
        stream.ungetc();
        return finish_atom(stream, buffer, ifirst, rational,
                           radix, exact, sign, intern);
      }
      /* falls through */
    default:
      if (radix !== 0) {
        // may be a number
        if (expecting_prefix) {
          switch (c) {
          case 98: // 'b'
            radix = 2;
            break;
          case 111: // 'o'
            radix = 8;
            break;
          case 100: // 'd'
            radix = 10;
            break;
          case 120: // 'x'
            radix = 16;
            break;
          case 101: // 'e'
            force_exact = 1;
            break;
          case 105: // 'i'
            force_exact = -1;
            break;
          default:
            radix = 0;
          }
          expecting_prefix = false;
          ifirst = buffer.length + 1;
        } else if (buffer.length === ifirst &&
                   (c === 45 || c === 43 || c === 35)) {
          // '-' || '+' || '#'
          if (c === 35) {
            if (had_sign) {
              radix = 0; // not a number
            } else {
              expecting_prefix = true;
            }
          } else {
            // leading sign
            sign = (c === 45) ? -1 : 1;
            had_sign = true;
          }
          ifirst = buffer.length + 1;
        } else if (radix === -1) {
          if (c === 46) {
            // leading '.'
            radix = 10;
            exact = false;
          } else if (c >= 48 && c <= 57) {
            // leading decimal digit
            radix = 10;
            if (c === 46) {
              exact = false;
            }
          } else {
            // not a number
            radix = 0;
          }
        } else {
          var check_radix = false;
          switch (c) {
          case 46: // '.'
            if (exact && radix === 10 && !rational) {
              exact = false;
            } else {
              radix = 0;
            }
            break;
          case 47: // '/'
            if (exact && !rational) {
              rational = true;
            } else {
              radix = 0;
            }
            break;
          case 45: // '-'
          case 43: // '+'
            if (!exponent) {
              check_radix = true;
            }
            break;
          case 101: // 'e'
            if (radix === 10) {
              if (!rational && !exponent) {
                exponent = true;
                exact = false;
              } else {
                radix = 0;
              }
            } else {
              check_radix = true;
            }
            break;
          default:
            check_radix = true;
          }
          if (check_radix) {
            if (radix <= 10) {
              if (c < 48 || c > 48 + radix - 1) {
                radix = 0;
              }
            } else if (radix === 16) {
              if (!is_hex_digit(c)) {
                radix = 0;
              }
            }
          }
        }
      }
      buffer += String.fromCharCode(c);
    }
    c = stream.getc()|0;
  }
  if (c !== -1) {
    stream.ungetc();
  }
  return finish_atom(stream, buffer, ifirst, rational,
                     radix, exact, sign, intern);
}

function finish_atom(stream, buffer, ifirst, rational,
                     radix, exact, sign, intern)
{
  if (buffer.length === 0) {
    signal_read_syntax(stream);
  }
  if (radix > 0 && ifirst < buffer.length) {
    if (radix === 1) {
      return 0;
    }
    var numbuf = buffer.substr(ifirst);
    var number;
    if (!exact) {
      number = parseFloat(numbuf);
    } else if (rational) {
      var middle = buffer.indexOf('/');
      var numer = parseInt(buffer.substr(0, middle));
      var denom = parseInt(buffer.substr(middle + 1));
      number = numer / denom;
    } else {
      number = parseInt(numbuf, radix);
    }
    if (Number.isFinite(number)) {
      return number * sign;
    }   
  }
  return intern(buffer);
}

// utility functions

function iswhitespace(c) {
  c |= 0;
  switch (c) {
  case 32: // ' '
  case 9:  // '\t'
  case 10: // '\n'
  case 12: // '\f'
  case 13: // '\r'
    return true;
  default:
    return false;
  }
}

function isalpha(c) {
  c |= 0;
  return (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
}

function is_octal_digit(c) {
  c |= 0;
  return c >= 48 && c <= 55;
}

function octal_digit(c) {
  c |= 0;
  if (c >= 48 && c <= 55) {
    return c - 48;
  } else {
    return -1;
  }
}

function is_hex_digit(c) {
  c |= 0;
  return (c >= 48 && c <= 57) || (c >= 97 && c <= 102) || (c >= 65 && c <= 70);
}

function hex_digit(c) {
  c |= 0;
  if (c >= 48 && c <= 57) {
    return c - 48;
  } else if (c >= 97 && c <= 102) {
    return 10 + c - 97;
  } else if (c >= 65 && c <= 70) {
    return 10 + c - 65;
  } else {
    return -1;
  }
}

function isdelim(c) {
  c |= 0;
  switch (c) {
  case 32: // ' '
  case 9:  // '\t'
  case 10: // '\n'
  case 12: // '\f'
  case 13: // '\r'
  case 40: // '('
  case 41: // ')'
  case 91: // '['
  case 93: // ']'
  case 123: // '{'
  case 125: // '{'
  case 34: // '"'
  case 59: // ';'
  case 39: // '''
  case 44: // ','
  case 96: // '`'
    return true;
  default:
    return false;
  }
}

function toupper(c) {
  c |= 0;
  if (c >= 97 && c <= 122) {
    return c - 32;
  } else {
    return c;
  }
}

function tolower(c) {
  c |= 0;
  if (c >= 65 && c <= 90) {
    return c + 32;
  } else {
    return c;
  }
}

function skip_line(stream) {
  while (true) {
    var c = stream.getc()|0;
    switch (c) {
    case -1:
    case 10: // '\n'
    case 12: // '\f'
    case 13: // '\r'
      return;
    }
  }
}

function skip_whitespace(stream) {
  while (true) {
    var c = stream.getc()|0;
    switch (c) {
    case -1:
      return -1;
    case 32: // ' '
    case 9:  // '\t'
    case 10: // '\n'
    case 12: // '\f'
    case 13: // '\r'
      continue;
    case 59: // ';'
      skip_line(stream);
      continue;
    default:
      return c;
    }
  }
  // not reached
}

function skip_comment(stream, terminator) {
  terminator = terminator|0;
  var depth = 1;
  var c = stream.getc()|0;
  while (true) {
    if (c === -1) {
      signal_end_of_stream(stream, true);
    } else if (c === terminator) {
      c = stream.getc()|0;
      if (c === -1 || (c === 35 && --depth === 0)) {
        return;
      }
      continue;
    } else if (c === 35) {
      c = stream.getc()|0;
      if (c === -1) {
        signal_end_of_stream(stream, true);
      } else if (c === terminator) {
        depth++;
      } else {
        continue;
      }
    }
    c = stream.getc()|0;
  }
}

module.exports = {
  read: read_form
};
