// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var fs = require('fs');

var Mcore = require('./core.js');
var Meval = require('./eval.js');
var Mread = require('./read.js');

var InputString = require('./input-string.js');

var cons = Mcore.cons;
var list = Mcore.list;
var intern = Mcore['string->symbol'];
var signal = Mcore.signal;
var check_arg = Mcore['check-arg'];
var call_with_error_handlers = Mcore['call-with-error-handlers'];

var Qend_of_stream = intern('end-of-stream');
var Qfile_error = intern('file-error');

// FIXME: seems like this should take an environment, but not in spec

function load(filename, environment) {
  check_arg(filename, Mcore['string?']);
  try {
    var buffer = fs.readFileSync(filename);
    var stream = new InputString(buffer.toString());
    var finished = false;
    var form;
    var reader = function() {form = Mread.read(stream);}
    var handlers = cons(Qend_of_stream, function (err) {finished = true;});
    while (!finished) {
      form = undefined;
      call_with_error_handlers(reader, handlers);
      if (form !== undefined) {
        Meval.eval(form, environment);
      }
    }
  } catch (err) {
    signal(list(Qfile_error, "No such file", filename));
  }
}

module.exports = {
  load: load
};
