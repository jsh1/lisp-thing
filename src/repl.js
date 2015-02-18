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

var call_with_error_handlers = Mcore['call-with-error-handlers'];
var intern = Mcore['string->symbol'];

var Qdefine = intern('define');
var Qerror = intern('error');
var Qend_of_stream = intern('end-of-stream');
var Qpremature_end_of_stream = intern('premature-end-of-stream');

var environment = Mcore;
var pending_input = '';

rl.on('line', function(str) {
  str = pending_input + str;
  pending_input = '';

  call_with_error_handlers(function () {
    var form = Mread.read(new InputString(str));
    rl.setPrompt('> ');
    call_with_error_handlers(function () {
      var result;
      if (Mcore.car(form) === Qdefine) {
	// `eval` won't extend our environment!
	result = Meval.eval(Mcore.caddr(form));
        environment = Mcore.cons(result, environment);
      } else {
	result = Meval.eval(form, environment);
	if (result !== undefined) {
	  var out = new OutputString();
	  Mprint.write(result, out);
	  process.stdout.write(out.get() + '\n');
	}
      }
    }, Mcore.cons(Qerror,
		  function(err) {
		    var out = new OutputString();
		    Mprint.write(err, out);
		    process.stdout.write('Error: ' + out.get() + '\n');
		  }));
  }, Mcore.cons(Mcore.list(Qend_of_stream, Qpremature_end_of_stream),
		function(err) {
		  pending_input = str + '\n';
		  rl.setPrompt('... ');
		}));

  rl.prompt();
});

rl.on('close', function() {
  process.exit(0);
});

rl.on('SIGINT', function() {
  rl.write('User interrupt!');
  pending_input = '';
  rl.setPrompt('> ');
});

rl.setPrompt('> ');
rl.prompt();
