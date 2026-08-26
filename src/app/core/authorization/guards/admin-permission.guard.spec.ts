import { ActivatedRouteSnapshot, Router, UrlTree, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { AuthenticatedSession, AuthenticatedUserType } from '@features/auth/models/login-credentials/login-credentials.model';
import { AuthSessionService } from '@core';
import { adminPermissionGuard } from './admin-permission.guard';

describe('adminPermissionGuard', () => {
  let activeSession: AuthenticatedSession | null;
  let router: Router;

  beforeEach(() => {
    activeSession = createSession('BranchAdmin', createJwt(['ServiceWorkflows.ViewAll']));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            activeSession: () => activeSession,
          } satisfies Pick<AuthSessionService, 'activeSession'>,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('allows branch admins with the required permission', () => {
    expect(runGuard(['ServiceWorkflows.ViewAll'])).toBe(true);
  });

  it('blocks branch admins without the required permission', () => {
    activeSession = createSession('BranchAdmin', createJwt([]));

    expect(router.serializeUrl(runGuard(['ServiceWorkflows.ViewAll']) as UrlTree)).toBe(
      '/access-denied',
    );
  });

  it('allows technical admins on routes explicitly marked as permissionless', () => {
    activeSession = createSession('TechnicalAdmin', createJwt([]));

    expect(runGuard(['WaitingAreas.ViewAll'], true)).toBe(true);
  });
});

function runGuard(
  requiredAnyPermissions: readonly string[],
  allowTechnicalAdminWithoutPermission = false,
): boolean | UrlTree {
  const route = {
    data: {
      requiredAnyPermissions,
      allowTechnicalAdminWithoutPermission,
    },
  } as unknown as ActivatedRouteSnapshot;

  return TestBed.runInInjectionContext(() => adminPermissionGuard(route, {} as never)) as
    | boolean
    | UrlTree;
}

function createSession(
  userType: AuthenticatedUserType,
  token: string,
): AuthenticatedSession {
  return {
    token,
    userType,
    requiresBranchSelection: false,
    activeBranchId: null,
    branches: [],
    firstLoginFlag: false,
    passwordExpiredFlag: false,
    passwordChangedOnUtc: null,
    passwordExpiresOnUtc: null,
  };
}

function createJwt(permissions: readonly string[]): string {
  const payload = btoa(JSON.stringify({ permissions }))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${payload}.signature`;
}
