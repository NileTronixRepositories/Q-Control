import { inject } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';

import { AuthenticatedUserType } from '../models/login-credentials.model';
import { AuthSessionService } from '../services/auth-session.service';

export const technicalAdminAccessGuard: CanMatchFn = () => canAccessTechnicalAdminFeature();

export const organizationAccessGuard: CanMatchFn = () => canAccessFeature('OrganizationAdmin');

function canAccessTechnicalAdminFeature(): boolean | UrlTree {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);
  const session = authSessionService.activeSession();

  if (!session) {
    return router.createUrlTree(['/auth/login']);
  }

  if (session.firstLoginFlag) {
    return router.createUrlTree(['/auth/change-initial-password']);
  }

  if (session.userType === 'TechnicalAdmin' || session.userType === 'BranchAdmin') {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
}

function canAccessFeature(requiredUserType: AuthenticatedUserType): boolean | UrlTree {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);
  const session = authSessionService.activeSession();

  if (!session) {
    return router.createUrlTree(['/auth/login']);
  }

  if (session.firstLoginFlag) {
    return router.createUrlTree(['/auth/change-initial-password']);
  }

  if (session.userType === requiredUserType) {
    return true;
  }

  return router.createUrlTree(['/auth/login']);
}
