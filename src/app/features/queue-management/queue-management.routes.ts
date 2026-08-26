import { Routes } from '@angular/router';

import { adminPermissionGuard } from '@core/authorization/guards/admin-permission.guard';
import { adminBranchContextGuard } from '../../layout/admin-shell/guards/admin-branch-context.guard';

export const QUEUE_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'waiting-areas',
    canActivate: [adminPermissionGuard, adminBranchContextGuard],
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
    canActivate: [adminPermissionGuard, adminBranchContextGuard],
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
    canActivate: [adminPermissionGuard, adminBranchContextGuard],
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
    canActivate: [adminPermissionGuard, adminBranchContextGuard],
    data: {
      requiredAnyPermissions: ['Terminals.ViewAll'],
    },
    loadComponent: () =>
      import('./pages/terminals/terminals.component').then(
        (component) => component.TerminalsComponent,
      ),
  },
];
