import { Routes } from '@angular/router';

import { technicalAdminPermissionGuard } from '../technical-admin/guards/technical-admin-permission.guard';

export const SERVICE_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog',
  },
  {
    path: 'catalog',
    canActivate: [technicalAdminPermissionGuard],
    data: {
      requiredAnyPermissions: ['Services.ViewAll'],
    },
    loadComponent: () =>
      import('./pages/services/services.component').then((component) => component.ServicesComponent),
  },
  {
    path: 'workflows',
    canActivate: [technicalAdminPermissionGuard],
    data: {
      requiredAnyPermissions: ['ServiceWorkflows.ViewAll'],
    },
    loadComponent: () =>
      import('./pages/service-workflows/service-workflows.component').then(
        (component) => component.ServiceWorkflowsComponent,
      ),
  },
];
