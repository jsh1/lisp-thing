// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

var readline = require('readline');
var rl = readline.createInterface(process.stdin, process.stdout);

var Mcore = require('./core.js');
var Meval = require('./eval.js');
var Mread = require('./read.js');
var Mprint = require('./print.js');

var InputString = require('./input-string.js');
var OutputString = require('./output-string.js');

var Qdefine = Mcore['string->symbol']('define');
var Qerror = Mcore['string->symbol']('error');
var Qend_of_stream = Mcore['string->symbol']('end-of-stream');
var Qpremature_end_of_stream = Mcore['string->symbol']('premature-end-of-stream');

var environment = Mcore;
var pending_input = '';

var read_error_handlers = Mcore.cons(
  Mcore.list(Qend_of_stream, Qpremature_end_of_stream),
  function(err) {
    pending_input = str;
    rl.setPrompt('... ');
  });

var eval_error_handlers = Mcore.cons(Qerror,
  function(err) {
    var out = new OutputString();
    Mprint.write(err, out);
    process.stdout.write('Error: ' + out.get() + '\n');
  });

function on_line(str) {
  str = pending_input + str;
  pending_input = '';

  Mcore['call-with-error-handlers'](function () {
    var form = Mread.read(new InputString(str))
    rl.setPrompt('> ');
    Mcore['call-with-error-handlers'](function () {
      if (Mcore.car(form) === Qdefine) {
	// `eval` won't extend our environment!
	var result = Meval.eval(Mcore.caddr(form));
        environment = Mcore.cons(result, environment);
      } else {
	var result = Meval.eval(form, environment);
	if (result !== undefined) {
	  var out = new OutputString();
	  Mprint.write(result, out);
	  process.stdout.write(out.get() + '\n');
	}
      }
    }, eval_error_handlers);
  }, read_error_handlers);

  rl.prompt();
}

function on_close() {
  process.exit(0);
}

rl.setPrompt('> ');
rl.prompt();

rl.on('line', on_line).on('close', on_close);
