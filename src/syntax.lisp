;; Copyright (c) 2015 John Harper. All rights reserved.

;; Syntactic expansions

(define define-macro
  (cons 'macro (lambda (args . def)
		 (list 'define (car args)
		       (list 'cons ''macro (list* 'lambda (cdr args) def))))))

(define-macro (let bindings . body)
  (cons (list* 'lambda
	       (map (lambda (x)
		      (if (pair? x) (car x) x)) bindings)
	       body)
	(map (lambda (x)
	       (if (pair? x) (cons 'progn (cdr x)) ()))
	     bindings)))

(define-macro (letrec bindings . body)
  ((lambda (vars setters)
     (list* 'let vars (nconc setters body)))
   (map (lambda (x)
	  (if (pair? x) (car x) x)) bindings)
   (map (lambda (x)
	  (if (pair? x)
	      (list 'set! (car x) (cons 'progn (cdr x)))
	    (list 'set! x nil))) bindings)))

(define-macro (if condition then . else)
  (cond (else (list 'cond (list condition then) (cons #t else)))
	(#t (list 'cond (list condition then)))))

(define-macro (when condition . body)
  (list 'if condition (cons 'progn body)))

(define-macro (unless condition . body)
  (list 'if (list 'not? condition) (cons 'progn body)))

(define-macro (or . args)
  (if (null? args)
      #f
    (cons 'cond (map list args))))

(define-macro (and . args)
  (if (null? args)
      #t
    (let ((rest (nreverse args))
	  (body ()))
      (while (pair? rest)
	(set! body (if body
		       (list 'cond (list (car rest) body))
		     (list 'cond (list (car rest)))))
	(set! rest (cdr rest)))
      body)))

(define-macro (let* . args)
  (let ((rest (reverse (car args)))
	(body (cons 'progn (cdr args))))
    (while (pair? rest)
      (set! body (list 'let (list (car rest)) body))
      (set! rest (cdr rest)))
    body))

(define-macro (do vars test . body)
  (list 'let (map (lambda (x) (list (car x) (cadr x))) vars)
	(list* 'while (list 'not (car test))
	       (cons 'progn body)
	       (map (lambda (x)
		      (list 'set! (car x) (or (caddr x) (cadr x)))) vars))
	(cadr test)))

(define-macro (catch tag . body)
  (list 'call-with-catch tag (list* 'lambda () body)))

(define-macro (unwind-protect form . body)
  (list 'call-with-unwind-protect
	(list 'lambda () form)
	(list* 'lambda () body)))

(define-macro (condition-case var form . handlers)
  (list* 'call-with-error-handlers
	 (list 'lambda '() form)
	 (map (lambda (h)
		(list 'cons (list 'quote (car h))
		      (list* 'lambda (if (symbol? var) (list var) ()) (cdr h))))
	      handlers)))

(define-macro (begin . forms)
  (cons 'progn forms))
