// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var fs = require('fs');

var Mcore = require('./core.js');
var Mthrow = require('./throw.js');

var InputString = require('./input-string.js');
var OutputFile = require('./output-string.js');

var intern = Mcore['string->symbol'];
var list = Mcore.list;
var symbol_to_string = Mcore['symbol->string'];
var signal = Mthrow.signal;
var signal_invalid_arg = Mthrow['signal-missing-arg'];

var Qfile_error = intern('file-error');

function LispInputFile(path) {
  // FIXME: stupid, but node gives us no fopen/fgetc eqivalent?
  var buffer = fs.readFileSync(path);
  this.stream = new InputString(buffer.toString());
}

LispInputFile.prototype.getc = function() {
  return this.stream.getc();
};

LispInputFile.prototype.ungetc = function() {
  this.stream.ungetc();
};

LispInputFile.prototype.close = function() {
  this.stream = null;
};

function LispOutputFile(path, append) {
  this.file = fs.createWriteStream(path, {mode: append ? 'a' : 'w'});
}

LispOutputFile.prototype.puts = function(s) {
  this.file.write(s);
};

LispOutputFile.prototype.close = function() {
  this.file.end();
  this.file = null;
};

function open_file(path, mode) {
  try {
    switch (symbol_to_string(mode)) {
    case 'read':
      return new LispInputFile(path);
    case 'write':
      return new LispOutputFile(path, false);
    case 'append':
      return new LispOutputFile(path, true);
    default:
      signal_invalid_arg(mode);
    }
  } catch (e) {
    signal(list(Qfile_error, "No such file", path));
  }
}

function close_file(file) {
  file.close();
}

module.exports = {
  'open-file': open_file,
  'close-file': close_file
};
