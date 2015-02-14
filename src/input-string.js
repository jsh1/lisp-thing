// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

function InputString(str) {
  this.s = str;
  this.i = 0;
}

InputString.prototype.getc = function() {
  if (this.i < this.s.length) {
    return this.s.charCodeAt(this.i++);
  } else {
    return -1;
  }
};

InputString.prototype.ungetc = function() {
  this.i--;
};

module.exports = InputString;
