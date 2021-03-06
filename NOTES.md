
# Special Forms

	(quote VALUE) => VALUE
	(lambda ARGS . BODY) => PROCEDURE
	(define SYMBOL VALUE)
	(define (X . ARGS) . BODY) => (define X (lambda ARGS . BODY))
	(set! SYMBOL VALUE)
	(progn FORM-1 ... FORM-N) => result of evaluating FORM-N
	(cond (VALUE . BODY) ...) => VALUE or BODY
	(while CONDITION . BODY)

Chose to make `while` the only looping primitive, can't use tail
recursion for now (this stings, but Javascript doesn't provide it yet,
and efficiency / interop. goals require native function calling).

Lambda ARGS is traditional `(ARG1 ARG2 ... [. REST])` with the addition
of `#!optional`, `#!keyword` and `#!rest`. All non-required parameters
may have default values as the second element of a list, with the
symbol as the first, e.g. `(lambda (#!optional (a 1)) ...)`.

Note that `define` has a recursive definition, e.g.: `(define ((x y) z)
(+ y z))` is legal.

# Standard Macros

	(define-macro SYMBOL VALUE)
	(define-macro (X . ARGS) ...) => (define-macro X (lambda ARGS ...))
	(let VARS . BODY)
	(let SYM VARS . BODY)
	(let* VARS . BODY)
	(letrec VARS . BODY)
	(if CONDITION TRUE-FORM . ELSE-FORMS)
	(when CONDITION . BODY)
	(unless CONDITION . BODY)
	(or . FORMS)
	(and . FORMS)
	(do VARS TEST . BODY)
	(catch TAG . BODY)
	(unwind-protect FORM . BODY)
	(condition-case VAR FORM . HANDLERS)
	(begin . BODY)

# Conditionals

The only false values are `#f` (JS `false`), `()` (JS `null`) and JS
`undefined` (which has no Lisp syntax).

`nil` is available as a global binding to `()` as a convenience.
Similarly `t` is bound to `#t`.

# Non-Local Exits and Exceptions

Using Javascript `throw` and `try ... catch` to implement non-local
control flow. Going old school:

	(throw TAG VALUE)
	(catch TAG BODY...)

	(signal LIST)		-- (ERROR-SYMBOL ERROR-DATA...)
	(condition-case VAR
	    FORM
	  HANDLER-1 ... HANDLER-N)

where each HANDLER is either `(ERROR-SYMBOL BODY...)` or `((ERROR-1 ...
ERROR-N) BODY...)`. The special symbol `error` matches any error
condition. If VAR is non-null it's a symbol to be bound to the `LIST`
given to `signal`.

# Object Read Syntax

	{KEY-1 VALUE-1 ... KEY-N VALUE-N}	-- JS object

KEYs may be symbols (or keywords), strings or characters. Not numbers.

# Repl

	$ node src/repl.js

then to load the standard macros:

	lisp> (load "src/syntax.scm" environment)

# Compiler

Is unimplemented. This was going to be the whole point, but I got
distracted before starting it.
