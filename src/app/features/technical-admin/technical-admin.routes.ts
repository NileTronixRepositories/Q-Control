import { Routes } from '@angular/router';

import { adminPermissionGuard } from './guards/admin-permission.guard';
import { technicalAdminBranchContextGuard } from './guards/technical-admin-branch-context.guard';

export const TECHNICAL_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/admin-shell.component').then((component) => component.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'branch-editor',
      },
      {
        path: 'branch-editor',
        canActivate: [adminPermissionGuard],
        data: {
          pageKey: 'branch-editor',
          title: 'Branch Editor',
          description: 'Manage branch records, operating status, and assigned queue counters.',
          allowTechnicalAdminWithoutPermission: true,
          requiredAnyPermissions: [
            'Branches.ViewAll',
            'Branches.ViewDetails',
            'Branches.Create',
            'Branches.Update',
            'BranchAdmins.Create',
          ],
        },
        loadComponent: () =>
          import('./pages/legacy-page/legacy-page.component').then(
            (component) => component.LegacyPageComponent,
          ),
      },
      {
        path: 'branch-branding',
        canActivate: [adminPermissionGuard],
        data: {
          requiredAnyPermissions: ['Branches.ViewDetails'],
        },
        loadComponent: () =>
          import('./pages/branch-branding/branch-branding.component').then(
            (component) => component.BranchBrandingComponent,
          ),
      },
      {
        path: 'display-videos',
        canActivate: [adminPermissionGuard],
        data: {
          requiredAnyPermissions: ['Branches.ViewDetails'],
        },
        loadComponent: () =>
          import('./pages/branch-videos/branch-videos.component').then(
            (component) => component.BranchVideosComponent,
          ),
      },
      {
        path: 'branch-configuration',
        canActivate: [adminPermissionGuard],
        data: {
          allowTechnicalAdminWithoutPermission: true,
          requiredAnyPermissions: [
            'BranchConfigurations.View',
            'BranchConfigurations.Create',
            'BranchConfigurations.Update',
          ],
        },
        loadComponent: () =>
          import('./pages/branch-configuration/branch-configuration.component').then(
            (component) => component.BranchConfigurationComponent,
          ),
      },
      {
        path: 'general-brand',
        canActivate: [adminPermissionGuard],
        data: {
          requiredAnyPermissions: [
            'GeneralBrand.View',
            'GeneralBrand.Create',
            'GeneralBrand.Update',
          ],
        },
        loadComponent: () =>
          import('./pages/general-brand/general-brand.component').then(
            (component) => component.GeneralBrandComponent,
          ),
      },
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
          import('../service-management/service-management.routes').then(
            (routes) => routes.SERVICE_MANAGEMENT_ROUTES,
          ),
      },
      {
        path: 'waiting-areas',
        canActivate: [adminPermissionGuard, technicalAdminBranchContextGuard],
        data: {
          allowTechnicalAdminWithoutPermission: true,
          requiredAnyPermissions: ['WaitingAreas.ViewAll'],
        },
        loadComponent: () =>
          import('./pages/waiting-areas/waiting-areas.component').then(
            (component) => component.WaitingAreasComponent,
          ),
      },
      {
        path: 'windows',
        canActivate: [adminPermissionGuard, technicalAdminBranchContextGuard],
        data: {
          requiredAnyPermissions: ['Windows.ViewAll'],
        },
        loadComponent: () =>
          import('./pages/windows/windows.component').then(
            (component) => component.WindowsComponent,
          ),
      },
      {
        path: 'displays',
        canActivate: [adminPermissionGuard, technicalAdminBranchContextGuard],
        data: {
          requiredAnyPermissions: [
            'Displays.ViewAll',
            'DisplayWindows.ViewLinked',
            'DisplayWindows.ViewAvailable',
            'DisplayWindows.Assign',
            'DisplayWindows.Unassign',
          ],
        },
        loadComponent: () =>
          import('./pages/displays/displays.component').then(
            (component) => component.DisplaysComponent,
          ),
      },
      {
        path: 'terminals',
        canActivate: [adminPermissionGuard, technicalAdminBranchContextGuard],
        data: {
          requiredAnyPermissions: ['Terminals.ViewAll'],
        },
        loadComponent: () =>
          import('./pages/terminals/terminals.component').then(
            (component) => component.TerminalsComponent,
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
          import('../segment-management/segment-management.routes').then(
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
          import('../segment-management/pages/technical-globalization-requests/technical-globalization-requests.component').then(
            (component) => component.TechnicalGlobalizationRequestsComponent,
          ),
      },
      {
        path: 'branch-segment-requests',
        canActivate: [adminPermissionGuard],
        data: {
          requiredAnyPermissions: ['SegmentGlobalizationRequests.ViewOwn'],
        },
        loadComponent: () =>
          import('../segment-management/pages/branch-segment-requests/branch-segment-requests.component').then(
            (component) => component.BranchSegmentRequestsComponent,
          ),
      },
    ],
  },
];
