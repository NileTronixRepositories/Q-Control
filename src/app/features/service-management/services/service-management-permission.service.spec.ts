import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceManagementPermissionService } from './service-management-permission.service';

describe('ServiceManagementPermissionService', () => {
  it('recognizes BranchServices.Unassign from the JWT permission claim', () => {
    const payload = btoa(JSON.stringify({ permissions: ['BranchServices.Unassign'] }))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    const token = `header.${payload}.signature`;

    TestBed.configureTestingModule({
      providers: [
        ServiceManagementPermissionService,
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal({ token }).asReadonly() },
        },
      ],
    });

    const service = TestBed.inject(ServiceManagementPermissionService);

    expect(service.canUnassignBranchServices()).toBe(true);
    expect(service.hasPermission('BranchServices.Unassign')).toBe(true);
  });

  it('enables delete and restore for a new JWT containing both permissions', () => {
    const service = createServiceForPermissions(['Services.Delete', 'Services.Restore']);

    expect(service.canDelete()).toBe(true);
    expect(service.canRestore()).toBe(true);
  });

  it('keeps delete and restore disabled for an older JWT without the permissions', () => {
    const service = createServiceForPermissions(['Services.ViewAll', 'BranchServices.View']);

    expect(service.canDelete()).toBe(false);
    expect(service.canRestore()).toBe(false);
  });

  it('recognizes globalization and central-tree permissions', () => {
    const service = createServiceForPermissions([
      'ServiceGlobalizationRequests.ViewAll',
      'ServiceGlobalizationRequests.ViewDetails',
      'ServiceGlobalizationRequests.ViewOwn',
      'ServiceGlobalizationRequests.Approve',
      'ServiceGlobalizationRequests.Reject',
      'Services.ViewCentralTree',
    ]);
    expect(service.canViewGlobalizationRequests()).toBe(true);
    expect(service.canViewGlobalizationRequestDetails()).toBe(true);
    expect(service.canViewOwnGlobalizationRequests()).toBe(true);
    expect(service.canApproveGlobalizationRequests()).toBe(true);
    expect(service.canRejectGlobalizationRequests()).toBe(true);
    expect(service.canViewCentralTree()).toBe(true);
  });

  it('recognizes the branch-scoped set-default workflow permission', () => {
    const service = createServiceForPermissions(['ServiceWorkflows.SetDefault']);

    expect(service.canSetDefaultWorkflow()).toBe(true);
    expect(service.hasPermission('ServiceWorkflows.SetDefault')).toBe(true);
  });
});

function createServiceForPermissions(
  permissions: readonly string[],
): ServiceManagementPermissionService {
  TestBed.resetTestingModule();
  const payload = btoa(JSON.stringify({ permissions }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  const token = `header.${payload}.signature`;

  TestBed.configureTestingModule({
    providers: [
      ServiceManagementPermissionService,
      {
        provide: AuthSessionService,
        useValue: { currentSession: signal({ token }).asReadonly() },
      },
    ],
  });

  return TestBed.inject(ServiceManagementPermissionService);
}
