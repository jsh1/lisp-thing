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

function booleanp(x) {
  return x === false || x === true;
}

function not(x) {
  return x ? false : true;
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
