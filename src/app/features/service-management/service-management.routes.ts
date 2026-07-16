import { Routes } from '@angular/router';

import { adminPermissionGuard } from '../technical-admin/guards/admin-permission.guard';
import { serviceSchedulePendingChangesGuard } from './guards/service-schedule-pending-changes.guard';

export const SERVICE_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'catalog',
  },
  {
    path: 'catalog',
    canActivate: [adminPermissionGuard],
    data: {
      requiredAnyPermissions: ['Services.ViewAll', 'BranchServices.Assign'],
    },
    loadComponent: () =>
      import('./pages/services/services.component').then((component) => component.ServicesComponent),
  },
  {
    path: 'branch-services',
    canActivate: [adminPermissionGuard],
    data: {
      requiredAnyPermissions: ['BranchServices.View'],
    },
    loadComponent: () =>
      import('./pages/branch-services/branch-services.component').then(
        (component) => component.BranchServicesComponent,
      ),
  },
  {
    path: 'workflows',
    canActivate: [adminPermissionGuard],
    data: {
      requiredAnyPermissions: ['ServiceWorkflows.ViewAll'],
    },
    loadComponent: () =>
      import('./pages/service-workflows/service-workflows.component').then(
        (component) => component.ServiceWorkflowsComponent,
      ),
  },
  {
    path: 'branches/:branchId/services/:leafServiceId/workflows',
    canActivate: [adminPermissionGuard],
    data: {
      requiredAnyPermissions: ['ServiceWorkflows.ViewAll'],
    },
    loadComponent: () =>
      import('./pages/service-workflows/service-workflows.component').then(
        (component) => component.ServiceWorkflowsComponent,
      ),
  },
  {
    path: 'schedules',
    canActivate: [adminPermissionGuard],
    canDeactivate: [serviceSchedulePendingChangesGuard],
    data: {
      allowTechnicalAdminWithoutPermission: true,
      requiredAnyPermissions: ['ServiceSchedules.View'],
    },
    loadComponent: () =>
      import('./pages/service-schedules/service-schedules.component').then(
        (component) => component.ServiceSchedulesComponent,
      ),
  },
  {
    path: 'branches/:branchId/services/:leafServiceId/schedule',
    canActivate: [adminPermissionGuard],
    canDeactivate: [serviceSchedulePendingChangesGuard],
    data: {
      allowTechnicalAdminWithoutPermission: true,
      requiredAnyPermissions: ['ServiceSchedules.View'],
    },
    loadComponent: () =>
      import('./pages/service-schedules/service-schedules.component').then(
        (component) => component.ServiceSchedulesComponent,
      ),
  },
  {
    path: 'globalization-requests',
    canActivate: [adminPermissionGuard],
    data: {
      requiredAnyPermissions: ['ServiceGlobalizationRequests.ViewAll'],
    },
    loadComponent: () =>
      import('./pages/globalization-requests/globalization-requests.component').then(
        (component) => component.GlobalizationRequestsComponent,
      ),
  },
  {
    path: 'central-tree',
    canActivate: [adminPermissionGuard],
    data: {
      requiredAnyPermissions: ['Services.ViewCentralTree'],
    },
    loadComponent: () =>
      import('./pages/central-service-tree/central-service-tree.component').then(
        (component) => component.CentralServiceTreeComponent,
      ),
  },
];


