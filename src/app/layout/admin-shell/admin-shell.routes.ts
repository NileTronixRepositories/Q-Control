import { Routes } from '@angular/router';

import { BRANCH_MANAGEMENT_ROUTES } from '@features/branch-management/public-api';
import { QUEUE_MANAGEMENT_ROUTES } from '@features/queue-management/public-api';
import { adminPermissionGuard } from '@core/authorization/guards/admin-permission.guard';

export const ADMIN_SHELL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../../layout/admin-shell/admin-shell.component').then(
        (component) => component.AdminShellComponent,
      ),
    children: [
      ...BRANCH_MANAGEMENT_ROUTES,
      ...QUEUE_MANAGEMENT_ROUTES,
      {
        path: 'services',
        canActivate: [adminPermissionGuard],
        data: {
          requiredAnyPermissions: [
            'Services.ViewAll',
            'Services.ViewCentralTree',
            'BranchServices.View',
            'ServiceWorkflows.ViewAll',
            'ServiceSchedules.View',
            'ServiceGlobalizationRequests.ViewAll',
            'ServiceGlobalizationRequests.ViewOwn',
          ],
        },
        loadChildren: () =>
          import('@features/service-management/public-api').then(
            (routes) => routes.SERVICE_MANAGEMENT_ROUTES,
          ),
      },
      {
        path: 'segments',
        canActivate: [adminPermissionGuard],
        data: {
          allowTechnicalAdminWithoutPermission: true,
          requiredAnyPermissions: [
            'Segments.ViewAll',
            'Segments.CreateBranchScoped',
            'Segments.CreateGlobal',
            'Segments.Update',
          ],
        },
        loadChildren: () =>
          import('@features/segment-management/public-api').then(
            (routes) => routes.SEGMENT_MANAGEMENT_ROUTES,
          ),
      },
      {
        path: 'segment-globalization-requests',
        canActivate: [adminPermissionGuard],
        data: {
          requiredAnyPermissions: ['SegmentGlobalizationRequests.ViewAll'],
        },
        loadComponent: () =>
          import(
            '@features/segment-management/pages/technical-globalization-requests/technical-globalization-requests.component'
          ).then((component) => component.TechnicalGlobalizationRequestsComponent),
      },
      {
        path: 'branch-segment-requests',
        canActivate: [adminPermissionGuard],
        data: {
          requiredAnyPermissions: ['SegmentGlobalizationRequests.ViewOwn'],
        },
        loadComponent: () =>
          import(
            '@features/segment-management/pages/branch-segment-requests/branch-segment-requests.component'
          ).then((component) => component.BranchSegmentRequestsComponent),
      },
    ],
  },
];
