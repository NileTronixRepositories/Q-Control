import { Routes } from '@angular/router';

import { technicalAdminPermissionGuard } from './guards/technical-admin-permission.guard';
import { TechnicalAdminStore } from './store/technical-admin.store';

export const TECHNICAL_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [TechnicalAdminStore],
    loadComponent: () =>
      import('./layout/technical-admin-shell.component').then(
        (component) => component.TechnicalAdminShellComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'general',
      },
      {
        path: 'general',
        loadComponent: () =>
          import('./pages/general-theme/general-theme.component').then(
            (component) => component.GeneralThemeComponent,
          ),
      },
      {
        path: 'service-request',
        loadComponent: () =>
          import('./pages/service-request-layout/service-request-layout.component').then(
            (component) => component.ServiceRequestLayoutComponent,
          ),
      },
      {
        path: 'branch-editor',
        data: {
          pageKey: 'branch-editor',
          title: 'Branch Editor',
          description: 'Manage branch records, operating status, and assigned queue counters.',
        },
        loadComponent: () =>
          import('./pages/legacy-page/legacy-page.component').then(
            (component) => component.LegacyPageComponent,
          ),
      },
      {
        path: 'waiting-areas',
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
      {
        path: 'online-monitoring',
        data: {
          pageKey: 'online-monitoring',
          title: 'Online Monitoring',
          description: 'Track branch connectivity, active tickets, and service availability.',
        },
        loadComponent: () =>
          import('./pages/legacy-page/legacy-page.component').then(
            (component) => component.LegacyPageComponent,
          ),
      },
    ],
  },
];
