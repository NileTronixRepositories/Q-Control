import { Injectable } from '@angular/core';

import { AuthenticatedSession } from '../models/login-credentials.model';
import { hasAnyJwtPermission } from '../utils/auth-permissions.util';

interface PermissionRoute {
  readonly route: string;
  readonly permissions: readonly string[];
}

const BRANCH_ADMIN_ROUTES: readonly PermissionRoute[] = [
  {
    route: '/technical-admin/branch-editor',
    permissions: [
      'Branches.ViewAll',
      'Branches.ViewDetails',
      'Branches.Create',
      'Branches.Update',
      'BranchAdmins.Create',
    ],
  },
  {
    route: '/technical-admin/branch-branding',
    permissions: ['Branches.ViewDetails', 'Branches.Update'],
  },
  {
    route: '/technical-admin/services/catalog',
    permissions: ['Services.ViewAll'],
  },
  {
    route: '/technical-admin/services/branch-services',
    permissions: ['BranchServices.View'],
  },
  {
    route: '/technical-admin/services/workflows',
    permissions: ['ServiceWorkflows.ViewAll'],
  },
  {
    route: '/technical-admin/waiting-areas',
    permissions: ['WaitingAreas.ViewAll'],
  },
  {
    route: '/technical-admin/windows',
    permissions: ['Windows.ViewAll'],
  },
  {
    route: '/technical-admin/terminals',
    permissions: ['Terminals.ViewAll'],
  },
  {
    route: '/technical-admin/displays',
    permissions: ['Displays.ViewAll'],
  },
];

@Injectable({
  providedIn: 'root',
})
export class AuthNavigationService {
  resolvePostLoginUrl(session: AuthenticatedSession): string {
    if (session.firstLoginFlag) {
      return '/auth/change-initial-password';
    }

    if (session.userType === 'TechnicalAdmin') {
      return '/technical-admin/branch-editor';
    }

    if (session.userType === 'OrganizationAdmin') {
      return '/organization/global-configurations';
    }

    return this.resolveBranchAdminUrl(session);
  }

  private resolveBranchAdminUrl(session: AuthenticatedSession): string {
    const allowedRoute = BRANCH_ADMIN_ROUTES.find((item) =>
      hasAnyJwtPermission(session.token, item.permissions),
    );

    return allowedRoute?.route ?? '/no-access';
  }
}
