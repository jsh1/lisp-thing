// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

function OutputString(str) {
  this.s = '';
}

OutputString.prototype.puts = function(str) {
  this.s += str;
};

OutputString.prototype.putc = function(c) {
  this.s += String.fromCharCode(c);
};

OutputString.prototype.get = function() {
  return this.s;
};

module.exports = OutputString;
