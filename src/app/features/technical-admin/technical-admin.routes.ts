import { Routes } from '@angular/router';

import { technicalAdminPermissionGuard } from './guards/technical-admin-permission.guard';

export const TECHNICAL_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layout/technical-admin-shell.component').then(
        (component) => component.TechnicalAdminShellComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'branch-editor',
      },
      {
        path: 'branch-editor',
        canActivate: [technicalAdminPermissionGuard],
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
        canActivate: [technicalAdminPermissionGuard],
        data: {
          requiredAnyPermissions: ['Branches.ViewDetails'],
        },
        loadComponent: () =>
          import('./pages/branch-branding/branch-branding.component').then(
            (component) => component.BranchBrandingComponent,
          ),
      },
      {
        path: 'services',
        canActivate: [technicalAdminPermissionGuard],
        data: {
          requiredAnyPermissions: ['Services.ViewAll', 'BranchServices.View', 'ServiceWorkflows.ViewAll'],
        },
        loadChildren: () =>
          import('../service-management/service-management.routes').then(
            (routes) => routes.SERVICE_MANAGEMENT_ROUTES,
          ),
      },
      {
        path: 'waiting-areas',
        canActivate: [technicalAdminPermissionGuard],
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
        canActivate: [technicalAdminPermissionGuard],
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
        canActivate: [technicalAdminPermissionGuard],
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
        canActivate: [technicalAdminPermissionGuard],
        data: {
          requiredAnyPermissions: ['Terminals.ViewAll'],
        },
        loadComponent: () =>
          import('./pages/terminals/terminals.component').then(
            (component) => component.TerminalsComponent,
          ),
      },
    ],
  },
];
