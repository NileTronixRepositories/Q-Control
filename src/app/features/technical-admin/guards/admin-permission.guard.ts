import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../../auth/services/auth-session.service';
import { hasAnyJwtPermission } from '../../auth/utils/auth-permissions.util';

export const adminPermissionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authSessionService = inject(AuthSessionService);
  const session = authSessionService.activeSession();

  if (!session) {
    return router.createUrlTree(['/auth/login']);
  }

  if (session.firstLoginFlag) {
    return router.createUrlTree(['/auth/change-initial-password']);
  }

  const requiredPermissions = readRequiredPermissions(route);

  if (session.userType === 'TechnicalAdmin' && route.data['allowTechnicalAdminWithoutPermission'] === true) {
    return true;
  }

  if (requiredPermissions.length === 0) {
    return true;
  }

  return hasAnyJwtPermission(session.token, requiredPermissions)
    ? true
    : router.createUrlTree(['/access-denied']);
};

function readRequiredPermissions(route: ActivatedRouteSnapshot): readonly string[] {
  const value = route.data['requiredAnyPermissions'];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}
