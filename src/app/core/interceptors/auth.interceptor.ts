import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from '../auth.store';

/**
 * Functional interceptor that:
 *  1. Attaches Bearer token to every outgoing request (if available).
 *  2. On 401/403, triggers logout and redirects to /login.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authStore = inject(AuthStore);
  const token = authStore.token();

  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Only logout if we had a token (avoids loop on login requests)
        if (token) {
          authStore.logout();
        }
      }
      return throwError(() => error);
    }),
  );
};
