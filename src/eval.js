// -*- c-style: fb; indent-tabs-mode: nil -*-

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
var assq = Mlist.assq;
var signal_missing_arg = Mthrow['signal-missing-arg'];
var signal_invalid_lambda = Mthrow['signal-invalid-lambda'];

// depends on the definitions in runtime.js

function eval_form(form, env) {
  form = macroexpand(form, env);
  if (symbolp(form)) {
    return env_ref(env, form);
  } else if (pairp(form)) {
    var fun = car(form);
    if (symbolp(fun)) {
      var value;
      switch (fun.sym) {
      case 'set!':
	value = eval_form(caddr(form), env);
	return env_set(env, cadr(form), value);
      case 'quote':
	return cadr(form);
      case 'lambda':
	return new Lambda(cadr(form), cddr(form), env);
      case 'if':
	value = eval_form(cadr(form), env);
	if (!(value === false || value === null || value === undefined)) {
	  value = eval_form(caddr(form), env);
	} else {
	  value = progn(cdddr(form), env);
	}
	return value;
      }
    }
    return eval_form(car(form), env).apply(null, eval_vec(cdr(form), env));
  } else {
    return form;
  }
}

function macroexpand(form, env) {
  return form;
}

function progn(lst, env) {
  var value = null;
  while (pairp(lst)) {
    value = eval_form(lst.car, env);
    lst = lst.cdr;
  }
  return value;
}

function eval_vec(lst, env) {
  var vec = [];
  while (pairp(lst)) {
    vec.push(eval_form(lst.car, env));
    lst = lst.cdr;
  }
  return vec;
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
  if (env) {
    return env[sym.sym];
  } else {
    return undefined;
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
  return progn(this.body, this.bind_argv(argv));
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
	  value = eval_form(cadr(param), env);
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
      value = def === null ? null : eval_form(def, env);
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

module.exports = {
  eval: eval_form
};
