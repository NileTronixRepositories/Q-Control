import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { SegmentPermissionService } from './segment-permission.service';

describe('SegmentPermissionService', () => {
  function createServiceFor(
    session: { token?: string; userType?: string } | null,
  ): SegmentPermissionService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        SegmentPermissionService,
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal(session).asReadonly() },
        },
      ],
    });
    return TestBed.inject(SegmentPermissionService);
  }

  function createTokenForPermissions(permissions: readonly string[]): string {
    const payload = btoa(JSON.stringify({ permissions }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    return `header.${payload}.signature`;
  }

  it('grants all permissions for TechnicalAdmin userType', () => {
    const service = createServiceFor({ userType: 'TechnicalAdmin' });
    expect(service.isTechnicalAdmin()).toBe(true);
    expect(service.canViewAllSegments()).toBe(true);
    expect(service.canCreateGlobalSegment()).toBe(true);
    expect(service.canApproveGlobalizationRequest()).toBe(true);
  });

  it('resolves segment permissions correctly from JWT token', () => {
    const token = createTokenForPermissions([
      'Segments.ViewAll',
      'Segments.CreateBranchScoped',
      'BranchServiceSegments.View',
      'BranchServiceSegments.Assign',
      'SegmentGlobalizationRequests.ViewOwn',
    ]);
    const service = createServiceFor({ token, userType: 'BranchAdmin', activeBranchId: 1 } as any);

    expect(service.isBranchAdmin()).toBe(true);
    expect(service.canViewAllSegments()).toBe(true);
    expect(service.canCreateBranchScopedSegment()).toBe(true);
    expect(service.canViewBranchServiceSegments()).toBe(true);
    expect(service.canAssignBranchServiceSegments()).toBe(true);
    expect(service.canViewOwnGlobalizationRequests()).toBe(true);
    expect(service.canCreateGlobalSegment()).toBe(false);
  });
});
