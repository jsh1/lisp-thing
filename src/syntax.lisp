
(define let
  (cons 'macro (lambda (bindings . body)
		 (cons (list* 'lambda
			      (map (lambda (x)
				     (if (pair? x) (car x) x)) bindings)
			      body)
		       (map (lambda (x)
			      (if (pair? x) (cons 'progn (cdr x)) ()))
			    bindings)))))

(define let*
  (cons 'macro (lambda (bindings . body)
		 (if (eq? (list-length bindings) 0)
		     (cons 'progn body)
		   (if (eq? 

(define catch
  (cons 'macro (lambda (tag . body)
		 (list 'call-with-catch (list 'quote tag)
		       (list* 'lambda () body)))))

(define unwind-protect
  (cons 'macro (lambda (form . body)
		 (list 'call-with-unwind-protect
		       (list 'lambda () form)
		       (list* 'lambda () body)))))
