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

var Msymbol = require('./symbol.js');
var Mcons = require('./cons.js');
var Mthrow = require('./throw.js');

var symbolp = Msymbol['symbol?'];
var string_to_symbol = Msymbol['string->symbol'];
var symbol_to_string = Msymbol['symbol->string'];
var pairp = Mcons['pair?'];
var cons = Mcons.cons;
var car = Mcons.car;
var cdr = Mcons.cdr;
var cadr = Mcons.cadr;
var cddr = Mcons.cddr;
var caddr = Mcons.caddr;
var cdddr = Mcons.cdddr;
var list = Mcons.list;
var signal = Mthrow.signal;
var signal_missing_arg = Mthrow['signal-missing-arg'];

var Qinvalid_lambda = string_to_symbol('invalid-lambda');
var Qunbound_variable = string_to_symbol('unbound-variable');

function lazy_eval(form, env, tail_posn) {
  while (true) {
    form = macroexpand(form, env);

    if (symbolp(form)) {
      return env_ref(env, form);
    } else if (!pairp(form)) {
      return form;
    }

    var fun = form.car;
    form = form.cdr;

    if (symbolp(fun)) {
      var value;
      switch (fun.sym) {
      case 'set!':
        return env_set(env, car(form), force_eval(cadr(form), env));
      case 'quote':
        return car(form);
      case 'lambda':
        return new Lambda(car(form), cdr(form), env);
      case 'if':
        value = force_eval(car(form), env);
        form = cdr(form);
        if (!(value === false || value === null || value === undefined)) {
          form = car(form);
          continue;
        } else {
          form = cdr(form);
          while (pairp(cdr(form))) {
            force_eval(form.car, env);
            form = form.cdr;
          }
          form = car(form);
          continue;
        }
        // not reached
      }
    }

    fun = force_eval(fun, env);

    var argv = [];
    while (pairp(form)) {
      argv.push(force_eval(form.car, env));
      form = form.cdr;
    }

    if (tail_posn) {
      return new TailCall(fun, argv);
    } else {
      return fun.apply(null, argv);
    }
  }

  // not reached
}

function force_eval(form, env) {
  var value = lazy_eval(form, env, false);
  if (value instanceof TailCall) {
    value = value.invoke();
  }
  return value;
}

function macroexpand(form, env) {
  return form;
}

function env_ref(env, sym) {
  while (pairp(env)) {
    var cell = env.car;
    if (cell.car === sym) {
      return cell.cdr;
    }
    env = env.cdr;
  }
  // alist can be dotted to object with global env
  var value = env ? env[sym.sym] : undefined;
  if (value !== undefined) {
    return value;
  } else {
    signal(list(Qunbound_variable, sym));
  }
}

function env_set(env, sym, value) {
  while (pairp(env)) {
    var cell = env.car;
    if (cell.car === sym) {
      cell.cdr = value;
      return;
    }
  }
  if (env && env.hasOwnProperty(sym.sym)) {
    env[sym.sym] = value;
  } else {
    signal(list(Qunbound_variable, sym));
  }
}

function env_push(env, sym, value) {
  return cons(cons(sym, value), env);
}

function Lambda(args, body, env) {
  this.args = args;
  this.body = body;
  this.env = env;
}

Lambda.prototype.apply = function(unused, argv) {
  var lst = this.body;
  while (pairp(cdr(lst))) {
    force_eval(lst.car, this.env);
    lst = lst.cdr;
  }
  return lazy_eval(car(lst), this.bind_argv(argv), true);
};

var Qoptional = string_to_symbol('#!optional');
var Qkey = string_to_symbol('#!key');
var Qrest = string_to_symbol('#!rest');

Lambda.prototype.bind_argv = function(argv) {
  var env = this.env;
  var argv_i = 0;
  var state = 0;
  var keywords = null;
  var lst = this.args;
  var sym, value, def, j, rest;
  while (pairp(lst)) {
    var param = lst.car;
    lst = lst.cdr;
    switch (state) {
    case 0: // required
      if (symbolp(param)) {
        if (param == Qoptional) {
          state = 1;
          continue;
        } else if (param == Qkey) {
          state = 2;
          continue;
        } else if (param == Qrest) {
          state = 3;
          continue;
        } else {
          if (argv_i >= argv.length) {
            signal_missing_arg(argv_i);
          }
          sym = param;
          value = argv[argv_i++];
        }
      } else {
        signal_invalid_lambda(this.args, param);
      }
      env = env_push(env, sym, value);
      continue;
    case 1: // optional
      if (symbolp(param)) {
        if (param == Qoptional) {
          signal_invalid_lambda(this.args, param);
        } else if (param == Qkey) {
          state = 2;
          continue;
        } else if (param == Qrest) {
          state = 3;
          continue;
        } else {
          sym = param;
          value = argv_i < argv.length ? argv[argv_i++] : null;
        }
      } else if (symbolp(car(param))) {
        sym = car(param);
        if (argv_i < argv.length) {
          value = argv[argv_i++];
        } else {
          value = force_eval(cadr(param), env);
        }
      } else {
        signal_invalid_lambda(this.args, param);
      }
      env = env_push(env, param, value);
      continue;
    case 2: // key
      if (symbolp(param)) {
        if (param == Qoptional || param == Qkey) {
          signal_invalid_lambda(this.args, param);
        } else if (param == Qrest) {
          state = 3;
          continue;
        } else {
          sym = param;
          def = null;
        }
      } else if (symbolp(car(param))) {
        sym = car(param);
        def = cadr(param);
      } else {
        signal_invalid_lambda(this.args, param);
      }
      if (keywords === null) {
        keywords = {};
      }
      var key_sym = string_to_symbol('#:' + symbol_to_string(sym));
      for (j = argv_i; j < argv.length - 1; j++) {
        if (keywords[j]) {
          continue;
        }
        if (argv[j] == key_sym) {
          keywords[j] = true;
          keywords[j+1] = true;
          env = env_push(env, sym, argv[j+1]);
          continue;
        }
      }
      value = def === null ? null : force_eval(def, env);
      env = env_push(env, param, value);
      continue;
    case 3: // rest
      if (symbolp(param)) {
        rest = null;
        for (j = argv.length - 1; j >= argv_i; j--) {
          if (keywords && keywords[j]) {
            continue;
          }
          rest = cons(argv[j], rest);
        }
        env = env_push(env, param, rest);
        state = 4;
      } else {
        signal_invalid_lambda(this.args, param);
      }
      continue;
    case 4: // nothing
      signal_invalid_lambda(this.args, param);
    }
  }
  if (symbolp(lst)) {
    if (state < 4) {
      rest = null;
      for (j = argv.length - 1; j >= argv_i; j--) {
        if (keywords && keywords[j]) {
          continue;
        }
        rest = cons(argv[j], rest);
      }
      env = env_push(env, lst, rest);
    }
  } else if (lst !== null) {
    signal_invalid_lambda(this.args, lst);
  }
  return env;
};

function TailCall(fun, argv) {
  this.fun = fun;
  this.argv = argv;
}

TailCall.prototype.invoke = function() {
  return this.fun.apply(null, this.argv);
};

function signal_invalid_lambda(lst, arg) {
  signal(list(Qinvalid_lambda, lst, arg));
}

module.exports = {
  eval: force_eval
};
