import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';

import { AuthenticatedUserType } from '../models/login-credentials.model';
import { AuthSessionService } from '../services/auth-session.service';

export const technicalAdminAccessGuard: CanMatchFn = () => canAccessFeature('TechnicalAdmin');

export const organizationAccessGuard: CanMatchFn = () => canAccessFeature('OrganizationAdmin');

function canAccessFeature(requiredUserType: AuthenticatedUserType): boolean | UrlTree {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);
  const session = authSessionService.activeSession();

  if (session?.userType === requiredUserType) {
    return true;
  }

  return router.createUrlTree(['/login']);
}
