import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { AuthenticatedSession, AuthenticatedUserType } from '../models/login-credentials.model';
import { AuthSessionService } from '../services/auth-session.service';
import { adminConsoleAccessGuard } from './auth-access.guard';

describe('adminConsoleAccessGuard', () => {
  let activeSession: AuthenticatedSession | null;
  let router: Router;

  beforeEach(() => {
    activeSession = createSession('TechnicalAdmin');

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

  it('allows technical admins and branch admins into the admin console', () => {
    expect(runGuard()).toBe(true);

    activeSession = createSession('BranchAdmin');

    expect(runGuard()).toBe(true);
  });

  it('blocks organization admins from the admin console', () => {
    activeSession = createSession('OrganizationAdmin');

    expect(router.serializeUrl(runGuard() as UrlTree)).toBe('/auth/login');
  });
});

function runGuard(): boolean | UrlTree {
  return TestBed.runInInjectionContext(() => adminConsoleAccessGuard({} as never, [])) as
    | boolean
    | UrlTree;
}

function createSession(userType: AuthenticatedUserType): AuthenticatedSession {
  return {
    token: 'token',
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
