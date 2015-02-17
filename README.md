
Wasting some time writing a dialect of Lisp hosted on Node.js (for now,
port to other Javascript environments if ever useful). Right now, it's
not even close to useful.


## Rationale

- Javascript is the universal high level VM.

- Javascript as a language feels wrong...

- ...but it has great primitives to build on, and many people are
building runtimes.

- I've been missing Lisp.


## Goals

- Compile to Javascript, both ahead-of-time and dynamically.

- Don't expose implicit type conversions to Lisp code.

- Lisp-1, mostly Scheme-like API. (Ignore call/cc! car/cdr ignore (),
() tests as false.)

- Module system that works with the usual `require` model.

- Straightforward FFI in and out of JS.

## Anti-Goals

- NOT going to try to create idiomatic (or even readable) JS.

