// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

var Mcore = require('./core.js');
var Mthrow = require('./throw.js');

var symbolp = Mcore['symbol?'];
var keywordp = Mcore['keyword?'];
var string_to_symbol = Mcore['string->symbol'];
var symbol_to_string = Mcore['symbol->string'];
var pairp = Mcore['pair?'];
var cons = Mcore.cons;
var car = Mcore.car;
var cdr = Mcore.cdr;
var caar = Mcore.caar;
var cdar = Mcore.cdar;
var cadr = Mcore.cadr;
var cddr = Mcore.cddr;
var caddr = Mcore.caddr;
var cdddr = Mcore.cdddr;
var list = Mcore.list;
var list_ = Mcore['list*'];
var apply = Mcore.apply;
var not = Mcore.not;
var signal = Mthrow.signal;
var signal_missing_arg = Mthrow['signal-missing-arg'];
var call_with_error_handlers = Mthrow['call-with-error-handlers'];

var Qlambda = string_to_symbol('lambda');
var Qmacro = string_to_symbol('macro');

var Qinvalid_lambda = string_to_symbol('invalid-lambda');
var Qunbound_variable = string_to_symbol('unbound-variable');

/* Leaving tail call elimination to the mercy of the host interpreter.
   Javascript will catch up eventually, none of the hacks we could do
   would really help. */

function eval_(form, env) {
  if (!pairp(form)) {
    if (symbolp(form) && !keywordp(form)) {
      return env_ref(env, form);
    } else {
      return form;
    }
  }

  var fun = form.car;
  form = form.cdr;

  if (symbolp(fun)) {
    var value, term;
    switch (fun.sym) {
    case 'define':
      // (define (X . ARGS) . BODY) => (define X (lambda ARGS . BODY))
      while (pairp(car(form))) {
        form = list(caar(form), list_(Qlambda, cdar(form), cdr(form)));
      }
      return env_define(env, car(form), eval_(cadr(form), env));
    case 'set!':
      return env_set(env, car(form), eval_(cadr(form), env));
    case 'quote':
      return car(form);
    case 'lambda':
      return make_procedure(car(form), cdr(form), env);
    case 'cond':
      while (pairp(form)) {
        term = form.car;
        value = eval_(car(term), env);
        if (!not(value)) {
          term = cdr(term);
          if (pairp(term)) {
            return progn(term, env);
          } else {
            return value;
          }
        }
        form = form.cdr;
      }
      return false;
    case 'while':
      while (true) {
	value = eval_(car(form), env);
	if (not(value)) {
	  return value;
	}
	progn(cdr(form), env);
      }
      break;
    case 'progn':
      return progn(form, env);
    }
  }

  fun = eval_(fun, env);

  if (pairp(fun) && fun.car == Qmacro) {
    return eval_(apply(fun.cdr, form), env);
  }

  return fun.apply(null, eval_list(form, env));
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

// environment is a list of frames, each frame is an object

function env_begin(env) {
  return cons({}, env);
}

function env_ref(env, sym) {
  while (pairp(env)) {
    var map = env.car;
    if (map.hasOwnProperty(sym.sym)) {
      return map[sym.sym];
    }
    env = env.cdr;
  }
  signal(list(Qunbound_variable, sym));
}

function env_set(env, sym, value) {
  while (pairp(env)) {
    var map = env.car;
    if (map.hasOwnProperty(sym.sym)) {
      map[sym.sym] = value;
      return;
    }
    env = env.cdr;
  }
  signal(list(Qunbound_variable, sym));
}

function env_define(env, sym, value) {
  if (pairp(env)) {
    var map = env.car;
    map[sym.sym] = value;
  } else {
    // FIXME: better error?
    signal(list(Qunbound_variable, sym));
  }
}

/* FIXME: preprocess lambda args outside the closure, then try to
   return a specialized function that matches the argument patterns
   (for small numbers of required arguments). */

function make_procedure(args, body, env) {
  function apply_lambda() {
    return progn(body, procedure_env(args, arguments, env));
  }
  return apply_lambda;
}

var Qoptional = string_to_symbol('#!optional');
var Qkey = string_to_symbol('#!key');
var Qrest = string_to_symbol('#!rest');

function procedure_env(args, argv, env) {
  // create a new frame for this lambda
  env = env_begin(env);
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
      if (symbolp(param) && !keywordp(param)) {
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
      env_define(env, sym, value);
      continue;
    case 1: // optional
      if (symbolp(param) && !keywordp(param)) {
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
      } else if (symbolp(car(param)) && !keywordp(car(param))) {
        sym = car(param);
        if (argv_i < argv.length) {
          value = argv[argv_i++];
        } else {
          value = eval_(cadr(param), env);
        }
      } else {
        signal_invalid_lambda(args, param);
      }
      env_define(env, sym, value);
      continue;
    case 2: // key
      if (symbolp(param) && !keywordp(param)) {
        if (param == Qoptional || param == Qkey) {
          signal_invalid_lambda(args, param);
        } else if (param == Qrest) {
          state = 3;
          continue;
        } else {
          sym = param;
          def = null;
        }
      } else if (symbolp(car(param)) && !keywordp(car(param))) {
        sym = car(param);
        def = cadr(param);
      } else {
        signal_invalid_lambda(args, param);
      }
      if (keywords === null) {
        keywords = {};
      }
      for (j = argv_i; j < argv.length - 1; j++) {
        if (keywords[j]) {
          continue;
        }
        if (keywordp(argv[j]) && argv[j].sym === sym.sym) {
          env_define(env, sym, argv[j+1]);
          keywords[j] = true;
          keywords[j+1] = true;
          break;
        }
      }
      if (j === argv.length - 1) {
        value = def === null ? null : eval_(def, env);
        env_define(env, sym, value);
      }
      continue;
    case 3: // rest
      if (symbolp(param) && !keywordp(param)) {
        rest = null;
        for (j = argv.length - 1; j >= argv_i; j--) {
          if (keywords && keywords[j]) {
            continue;
          }
          rest = cons(argv[j], rest);
        }
        env_define(env, param, rest);
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
      env_define(env, lst, rest);
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
