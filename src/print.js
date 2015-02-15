// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

/* print options:

   readable: BOOL
   print-escape: 'newlines' || true
   max-length: NUMBER
   max-depth: NUMBER  */

function print(obj, stream, level, opts) {
  if (opts.hasOwnProperty('max-depth') && level > opts['max-depth']) {
    stream.puts('...');
    return;
  }

  if (Array.isArray(obj)) {
    print_vector(obj, stream, level, opts);
    return;
  }

  var type = typeof obj;

  if (type === 'object') {
    if (obj.print) {
      obj.print(print, stream, level, opts);
    } else {
      stream.puts('#<' + obj + '>');
    }
    return;
  }

  if (type === 'number') {
    stream.puts(obj.toString());
    return;
  }

  if (obj === null) {
    stream.puts('()');
    return;
  }

  if (obj === undefined) {
    stream.puts('#<undefined>');
    return;
  }

  if (obj === false) {
    stream.puts('#f');
    return;
  }

  if (obj === true) {
    stream.puts('#t');
    return;
  }

  stream.puts('#<' + obj + '>');
}

function print_vector(vec, stream, level, opts) {
  stream.puts('#(');
  var len = vec.length;
  if (opts.hasOwnProperty('max-length')) {
    len = Math.min(len, opts['max-length']);
  }
  for (var vi = 0; vi < len; vi++) {
    if (vi > 0) {
      stream.puts(' ');
    }
    print(vec[vi], stream, level + 1, opts);
  }
  stream.puts(')');
}

function print_string(stream, str, level, opts) {
  if (opts.hasOwnProperty('readable') && !opts.readable) {
    stream.puts(str);
    return;
  }

  var escape_all = false;
  var escape_newlines = false;

  if (opts['print-escape'] === 'newlines') {
    escape_newlines = true;
  } else if (opts['print-escape'] === true) {
    escape_newlines = escape_all = true;
  }

  stream.puts('"');

  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i)|0;

    if (escape_all && (c < 32 || c > 126)) {
      if (c < 256) {
        stream.puts('\\');
        stream.putc(48 + (c / 64)|0);
        stream.putc(48 + ((c % 64) / 8)|0);
        stream.putc(48 + c % 8);
      } else if (c < 65536) {
        stream.puts('\\u');
        stream.putc(hex_string(c, 4));
      } else {
        // FIXME: ??
        stream.putc(c);
      }
    } else {
      switch (c) {
      case 9: // '\t'
      case 10: // '\n'
      case 12: // '\f'
      case 13: // '\r'
        if (!escape_newlines) {
          stream.putc(c);
        } else {
          if (c === 9) {
            stream.puts('\\t');
          } else if (c === 10) {
            stream.puts('\\n');
          } else if (c === 12) {
            stream.puts('\\f');
          } else if (c === 13) {
            stream.puts('\\r');
          }
        }
        break;

      case 92: // '\\'
        stream.puts('\\\\');
        break;

      case 34: // '"'
        stream.puts('\\"');
        break;

      default:
        stream.putc(c);
      }
    }
  }

  stream.puts('"');
}

function hex_string(x, len) {
  var str = Number.toString(x, 16);
  if (str.length < len) {
    var prefix = '';
    while (str.length + prefix.length < len) {
      prefix += '0';
    }
    str = prefix + str;
  }
  return str;
}

function display(value, stream) {
  print(value, stream, 0, {readable: false, 'max-length': 10, 'max-depth': 4});
}

function write(value, stream) {
  print(value, stream, 0, {readable: true, 'print-escape': true});
}

function newline(stream) {
  stream.putc(10);
}

module.exports = {
  print: print,
  display: display,
  write: write,
  newline: newline,
};
