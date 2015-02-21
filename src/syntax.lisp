
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

(define-macro (cond . forms)
  (let ((lst (reverse forms))
	(ret #f))
    (while (pair? lst)
      (set! ret (list 'if (caar lst) (cons 'progn (cdar lst)) ret))
      (set! lst (cdr lst)))
    ret))

;;(define let*
;;  (cons 'macro (lambda (bindings . body))))

(define-macro (catch tag . body)
  (list 'call-with-catch tag (list* 'lambda () body)))

(define-macro (unwind-protect form . body)
  (list 'call-with-unwind-protect
	(list 'lambda () form)
	(list* 'lambda () body)))
