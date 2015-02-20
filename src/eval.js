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
var Mlist = require('./list.js');
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
var apply = Mlist.apply;
var signal = Mthrow.signal;
var signal_missing_arg = Mthrow['signal-missing-arg'];

var Qinvalid_lambda = string_to_symbol('invalid-lambda');
var Qunbound_variable = string_to_symbol('unbound-variable');
var Qmacro = string_to_symbol('macro');

function eval_(form, env) {
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
      return env_set(env, car(form), eval_(cadr(form), env));
    case 'quote':
      return car(form);
    case 'lambda':
      return make_procedure(car(form), cdr(form), env);
    case 'if':
      value = eval_(car(form), env);
      form = cdr(form);
      if (!false_condition(value)) {
	return eval_(car(form), env);
      } else {
	return progn(cdr(form), env);
      }
      break;
    case 'while':
      while (true) {
	value = eval_(car(form), env);
	if (false_condition(value)) {
	  return value;
	}
	progn(cdr(form), env)
      }
      /* not reached. */
    case 'progn':
      return progn(form, env);
    }
  }

  fun = eval_(fun, env);

  if (pairp(fun) && fun.car == Qmacro) {
    return eval_(apply(cdr(fun), form), env);
  }

  /* FIXME: to do tail call elimination we'd need a custom `apply`
     and to not represent lisp functions as JS functions. Right
     now that seems like a bad trade-off as our long-term goal is
     to compile lambda expressions to native JS functions. */

  return fun.apply(null, eval_list(form, env));
}

function false_condition(value) {
  return value === false || value === null || value === undefined
}

// returns an array

function eval_list(lst, env) {
  var vec = [];
  while (pairp(lst)) {
    vec.push(eval_(lst.car, env));
    lst = lst.cdr;
  }
  return vec;
}

function progn(lst, env) {
  var ret;
  while (pairp(lst)) {
    ret = eval_(lst.car, env);
    lst = lst.cdr;
  }
  return ret;
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

/* FIXME: preprocess lambda args outside the closure, then try to
   return a specialized function that matches the argument patterns
   (for small numbers of required arguments). */

function make_procedure(args, body, env) {
  function apply_lambda() {
    return progn(body, procedure_env(args, arguments, env));
  };
  return apply_lambda;
}

var Qoptional = string_to_symbol('#!optional');
var Qkey = string_to_symbol('#!key');
var Qrest = string_to_symbol('#!rest');

function procedure_env(args, argv, env) {
  var argv_i = 0;
  var state = 0;
  var keywords = null;
  var sym, value, def, j, rest;
  var lst = args;
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
        signal_invalid_lambda(args, param);
      }
      env = env_push(env, sym, value);
      continue;
    case 1: // optional
      if (symbolp(param)) {
        if (param == Qoptional) {
          signal_invalid_lambda(args, param);
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
          value = eval_(cadr(param), env);
        }
      } else {
        signal_invalid_lambda(args, param);
      }
      env = env_push(env, param, value);
      continue;
    case 2: // key
      if (symbolp(param)) {
        if (param == Qoptional || param == Qkey) {
          signal_invalid_lambda(args, param);
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
        signal_invalid_lambda(args, param);
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
      value = def === null ? null : eval_(def, env);
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
        signal_invalid_lambda(args, param);
      }
      continue;
    case 4: // nothing
      signal_invalid_lambda(args, param);
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
    signal_invalid_lambda(args, lst);
  }
  return env;
}

function signal_invalid_lambda(lst, arg) {
  signal(list(Qinvalid_lambda, lst, arg));
}

module.exports = {
  eval: eval_
};
