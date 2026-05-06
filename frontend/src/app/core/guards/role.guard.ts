import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const requiredRoles: string[] = route.data?.['roles'] ?? [];

  const user = auth.user();
  if (!user) {
    router.navigate(['/login']);
    return false;
  }

  if (requiredRoles.length === 0) return true;

  // ADMIN bypasses all role checks
  if (user.role === 'ADMIN') return true;

  if (requiredRoles.includes(user.role)) return true;

  router.navigate(['/app/dashboard']);
  return false;
};
