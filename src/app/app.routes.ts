import { Routes } from '@angular/router';

import {
  organizationAccessGuard,
  technicalAdminAccessGuard,
} from './features/auth/guards/auth-access.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (component) => component.LoginComponent
      )
  },
  {
    path: 'dashboard',
    redirectTo: 'organization/global-configurations'
  },
  {
    path: 'organization',
    canMatch: [organizationAccessGuard],
    loadChildren: () =>
      import('./features/organization/organization.routes').then(
        (routes) => routes.ORGANIZATION_ROUTES
      )
  },
  {
    path: 'technical-admin',
    canMatch: [technicalAdminAccessGuard],
    loadChildren: () =>
      import('./features/technical-admin/technical-admin.routes').then(
        (routes) => routes.TECHNICAL_ADMIN_ROUTES
      )
  },
  {
    path: 'service-request',
    loadChildren: () =>
      import('./features/service-request/service-request.routes').then(
        (routes) => routes.SERVICE_REQUEST_ROUTES
      )
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

