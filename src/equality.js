// Copyright (c) 2015 John Harper. All rights reserved.

'use strict';

function booleanp(x) {
  return x === false || x === true;
}

function not(x) {
  return x === false || x === null || x === undefined ? true : false;
}

function eq(a, b) {
  return a === b;
}

function equal(a, b) {
  if (a === b) {
    return true;
  }
  if (a === null || typeof a !== 'object') {
    return false;
  }
  if (a.equal) {
    return a.equal(b);
  } else if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i++) {
      if (!equal(a[i], b[i])) {
        return false;
      }
    }
    return true;
  } else {
    var k;
    for (k in a) {
      if (!b.hasOwnProperty(k) || !equal(a[k], b[k])) {
        return false;
      }
    }
    for (k in b) {
      if (!a.hasOwnProperty(k)) {
        return false;
      }
    }
    return true;
  }
}

module.exports = {
  'boolean?': booleanp,
  not: not,
  'eq?': eq,
  'equal?': equal
};
