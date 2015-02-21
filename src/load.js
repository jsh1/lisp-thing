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
