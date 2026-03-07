import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  // Ajouter le token si dispo
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Debug (tu peux enlever après)
  console.log('INTERCEPT', req.method, req.url);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si token invalide/expiré → logout + redirect login
      if (error.status === 401) {
        authService.logout();

        // on garde l'url actuelle pour revenir après login
        const returnUrl = router.url;

        router.navigate(['/login'], {
          queryParams: { returnUrl },
        });
      }

      return throwError(() => error);
    }),
  );
};
