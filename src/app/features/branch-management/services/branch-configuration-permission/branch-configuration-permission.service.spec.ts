import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { BranchConfigurationPermissionService } from '@features/branch-management/services/branch-configuration-permission/branch-configuration-permission.service';

function createTokenWithPermissions(permissions: string[]): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ permissions }));
  return `${header}.${payload}.mock-signature`;
}

describe('BranchConfigurationPermissionService', () => {
  let service: BranchConfigurationPermissionService;
  const mockSessionSignal = signal<any>(null);

  const mockAuthSessionService = {
    currentSession: mockSessionSignal,
    activeSession: mockSessionSignal,
  };

  beforeEach(() => {
    mockSessionSignal.set(null);
    TestBed.configureTestingModule({
      providers: [
        BranchConfigurationPermissionService,
        { provide: AuthSessionService, useValue: mockAuthSessionService },
      ],
    });
    service = TestBed.inject(BranchConfigurationPermissionService);
  });

  it('should grant all permissions to TechnicalAdmin automatically', () => {
    mockSessionSignal.set({
      userType: 'TechnicalAdmin',
      token: createTokenWithPermissions([]),
      userId: 1,
      userName: 'tech_admin',
      email: 'tech@admin.com',
      displayName: 'Technical Admin',
      expiresAt: new Date(Date.now() + 10000),
      firstLoginFlag: false,
    });

    expect(service.canView()).toBe(true);
    expect(service.canCreate()).toBe(true);
    expect(service.canUpdate()).toBe(true);
    expect(service.hasPermission('BranchConfigurations.View')).toBe(true);
  });

  it('should evaluate permissions correctly for BranchAdmin with explicit claims', () => {
    mockSessionSignal.set({
      userType: 'BranchAdmin',
      token: createTokenWithPermissions(['BranchConfigurations.View', 'BranchConfigurations.Create']),
      userId: 2,
      userName: 'branch_admin',
      email: 'branch@admin.com',
      displayName: 'Branch Admin',
      expiresAt: new Date(Date.now() + 10000),
      firstLoginFlag: false,
    });

    expect(service.canView()).toBe(true);
    expect(service.canCreate()).toBe(true);
    expect(service.canUpdate()).toBe(false);
    expect(service.hasPermission('BranchConfigurations.Update')).toBe(false);
  });

  it('should deny permissions when session is null or lacks relevant claims', () => {
    mockSessionSignal.set(null);

    expect(service.canView()).toBe(false);
    expect(service.canCreate()).toBe(false);
    expect(service.canUpdate()).toBe(false);
  });
});
