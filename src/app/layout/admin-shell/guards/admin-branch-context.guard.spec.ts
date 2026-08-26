import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, provideRouter } from '@angular/router';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';

import { AuthenticatedSession } from '@features/auth/models/login-credentials/login-credentials.model';
import { AuthSessionService } from '@core';
import { BranchDetails } from '@features/branch-management/public-api';
import { BranchManagementApiService } from '@features/branch-management/public-api';
import { AdminBranchContextStore } from '../store/admin-branch-context.store';
import { adminBranchContextGuard } from './admin-branch-context.guard';

describe('adminBranchContextGuard', () => {
  const session = signal<AuthenticatedSession | null>(null);
  const selectedBranch = signal<ReturnType<typeof createContextBranch> | null>(null);
  const selectBranch = vi.fn((branch: ReturnType<typeof createContextBranch>) =>
    selectedBranch.set(branch),
  );
  const clear = vi.fn(() => selectedBranch.set(null));
  const getBranchDetails = vi.fn<BranchManagementApiService['getBranchDetails']>();
  let router: Router;

  beforeEach(() => {
    vi.clearAllMocks();
    selectedBranch.set(null);
    session.set(createSession('TechnicalAdmin'));
    getBranchDetails.mockReturnValue(of(createBranchDetails()));

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthSessionService, useValue: { currentSession: session.asReadonly() } },
        { provide: BranchManagementApiService, useValue: { getBranchDetails } },
        {
          provide: AdminBranchContextStore,
          useValue: { selectedBranch: selectedBranch.asReadonly(), selectBranch, clear },
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  it('allows branch admins without requiring a branch query parameter', () => {
    session.set(createSession('BranchAdmin'));

    expect(runGuard('/admin/windows')).toBe(true);
    expect(getBranchDetails).not.toHaveBeenCalled();
  });

  it('loads and preserves a valid branch on a technical-admin deep link', async () => {
    const result = await firstValueFrom(
      runGuard('/admin/windows?branchId=7') as Observable<unknown>,
    );

    expect(result).toBe(true);
    expect(getBranchDetails).toHaveBeenCalledWith(7);
    expect(selectBranch).toHaveBeenCalledWith(createContextBranch());
  });

  it('redirects a technical admin when branchId is missing or invalid', () => {
    const result = runGuard('/admin/windows');

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/admin/branch-editor',
    );
  });

  it('redirects when the branch lookup fails', async () => {
    getBranchDetails.mockReturnValue(throwError(() => new Error('not found')));

    const result = await firstValueFrom(
      runGuard('/admin/windows?branchId=999') as Observable<unknown>,
    );

    expect(router.serializeUrl(result as ReturnType<Router['createUrlTree']>)).toBe(
      '/admin/branch-editor',
    );
    expect(clear).toHaveBeenCalledOnce();
  });

  function runGuard(url: string): unknown {
    return TestBed.runInInjectionContext(() =>
      adminBranchContextGuard(
        {} as ActivatedRouteSnapshot,
        { url } as RouterStateSnapshot,
      ),
    );
  }
});

function createContextBranch() {
  return {
    branchId: 7,
    arabicName: 'فرع القاهرة',
    englishName: 'Cairo Branch',
    isActive: true,
    effectiveIsActive: true,
  } as const;
}

function createBranchDetails(): BranchDetails {
  return {
    ...createContextBranch(),
    ipAddress: '10.0.0.7',
    governorate: 'Cairo',
    city: 'Cairo',
    createdBy: null,
    createdOnUtc: '2026-07-21T08:00:00Z',
    lastModifiedBy: null,
    modifiedOnUtc: null,
    rowVersion: 'branch-rv-7',
    license: null,
    location: null,
  };
}

function createSession(userType: AuthenticatedSession['userType']): AuthenticatedSession {
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
