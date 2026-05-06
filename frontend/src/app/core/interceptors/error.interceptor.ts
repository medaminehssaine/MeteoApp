import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NotificationService } from '../services/notification.service';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const notification = inject(NotificationService);
  const auth = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      switch (error.status) {
        case 401:
          // Only logout on non-auth endpoints
          if (!req.url.includes('/auth/')) {
            auth.logout().subscribe({ error: () => {} });
          }
          break;
        case 403:
          notification.error('Accès refusé — permissions insuffisantes');
          break;
        case 404:
          notification.error('Ressource introuvable');
          break;
        case 400: {
          const msg = error.error?.message || error.error?.error || 'Erreur de validation';
          notification.error(msg);
          break;
        }
        case 409:
          notification.error(error.error?.message || 'Conflit — ressource existante');
          break;
        case 429:
          notification.warning('Trop de requêtes — veuillez patienter');
          break;
        case 0:
          notification.error('Impossible de contacter le serveur');
          break;
        default:
          if (error.status >= 500) {
            notification.error('Une erreur serveur est survenue');
          }
      }
      return throwError(() => error);
    })
  );
};
