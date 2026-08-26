import { Routes } from '@angular/router';

import { adminPermissionGuard } from '@core/authorization/guards/admin-permission.guard';

export const BRANCH_MANAGEMENT_ROUTES: Routes = [
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
      import('./pages/branch-editor/legacy-page.component').then(
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
    path: 'display-configuration',
    canActivate: [adminPermissionGuard],
    data: {
      requiredAnyPermissions: ['Branches.ViewDetails', 'Branches.Update'],
    },
    loadComponent: () =>
      import('./pages/display-configuration/display-configuration.component').then(
        (component) => component.DisplayConfigurationComponent,
      ),
  },
];
