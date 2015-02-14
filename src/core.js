// -*- c-style: fb; indent-tabs-mode: nil -*-

'use strict';

var modules = [
  require('./char.js'),
  require('./cons.js'),
  require('./equality.js'),
  require('./list.js'),
  require('./number.js'),
  require('./string.js'),
  require('./symbol.js'),
  require('./throw.js'),
  require('./vector.js')
];

var core = {};

for (var i = 0; i < modules.length; i++) {
  var obj = modules[i];
  var blacklist = obj['-core-blacklist'] || {};
  for (var key in obj) {
    if (key !== '-core-blacklist' && !blacklist[key]) {
      core[key] = obj[key];
    }
  }
}

module.exports = core;
