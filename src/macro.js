// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

function LispMacro(fun, name) {
  this.name = name;
  this.fun = fun;
}

LispMacro.prototype.toString = function() {
  if (this.name) {
    return 'macro:' + this.name;
  } else {
    return 'macro';
  }
};

function make_macro(fun, name) {
  return new LispMacro(fun, name);
}

function macrop(arg) {
  return arg instanceof LispMacro;
}

function macro_function(arg) {
  return arg.fun;
}

function macro_name(arg) {
  return arg.name || null;
}

module.exports = {
  'make-macro': make_macro,
  'macro?': macrop,
  'macro-function': macro_function,
  'macro-name': macro_name,
};
