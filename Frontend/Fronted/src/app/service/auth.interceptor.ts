import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.headers.has('Authorization')) {
    return next(req);
  }

  const authService = inject(AuthService);
  const token = authService.getToken();
  if (!token) {
    return next(req);
  }

  const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  const cloned = req.clone({
    setHeaders: {
      Authorization: authHeader
    }
  });

  return next(cloned);
};
