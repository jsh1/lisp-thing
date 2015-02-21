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

var readline = require('readline');
var fs = require('fs');

var Mcore = require('./core.js');
var Meval = require('./eval.js');
var Mload = require('./load.js');
var Mread = require('./read.js');
var Mprint = require('./print.js');

var InputString = require('./input-string.js');
var OutputString = require('./output-string.js');

var pairp = Mcore['pair?'];
var cons = Mcore.cons;
var list = Mcore.list;
var car = Mcore.car;
var cdr = Mcore.cdr;
var cadr = Mcore.cadr;
var caddr = Mcore.caddr;
var signal = Mcore.signal;
var call_with_error_handlers = Mcore['call-with-error-handlers'];
var intern = Mcore['string->symbol'];
var symbol_to_string = Mcore['symbol->string'];

var Qerror = intern('error');
var Qend_of_stream = intern('end-of-stream');
var Qpremature_end_of_stream = intern('premature-end-of-stream');

// our global environment
var user_env = {};
var environment = list(user_env, Mcore, Mread, Meval, Mload, Mprint);

// FIXME: so it can be passed to load and eval!?
user_env.environment = environment;

var rl = readline.createInterface(process.stdin, process.stdout);

// input we've read, but read failed on
var pending_input = '';

rl.on('line', function(str) {
  str = pending_input + str;
  pending_input = '';

  call_with_error_handlers(function () {
    var form = Mread.read(new InputString(str));
    rl.setPrompt('lisp> ');
    call_with_error_handlers(function () {
      var result = Meval.eval(form, environment);
      if (result !== undefined) {
        var out = new OutputString();
        Mprint.write(result, out);
        process.stdout.write(out.get() + '\n');
      }
    }, cons(Qerror,
            function(err) {
              var out = new OutputString();
              Mprint.write(err, out);
              process.stdout.write('Error: ' + out.get() + '\n');
            }));
  }, cons(list(Qend_of_stream, Qpremature_end_of_stream),
          function(err) {
            pending_input = str + '\n';
            rl.setPrompt('lisp... ');
          }));

  rl.prompt();
});

rl.on('close', function() {
  process.exit(0);
});

rl.on('SIGINT', function() {
  rl.write('User interrupt!');
  pending_input = '';
  rl.setPrompt('lisp> ');
});

rl.setPrompt('lisp> ');
rl.prompt();
