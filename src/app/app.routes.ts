import { inject } from '@angular/core';
import { RedirectFunction, Router, Routes } from '@angular/router';

import {
  adminConsoleAccessGuard,
  organizationAccessGuard,
} from './features/auth/guards/auth-access.guard';

const redirectLegacyTechnicalAdminRoute: RedirectFunction = (route) => {
  const router = inject(Router);
  const [, ...remainingPath] = route.url.map((segment) => segment.path);

  return router.createUrlTree(['/admin', ...remainingPath], {
    queryParams: route.queryParams,
    fragment: route.fragment ?? undefined,
  });
};

export const routes: Routes = [
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/pages/login/login.component').then(
            (component) => component.LoginComponent,
          ),
      },
      {
        path: 'change-initial-password',
        loadComponent: () =>
          import('./features/auth/pages/change-initial-password/change-initial-password.component').then(
            (component) => component.ChangeInitialPasswordComponent,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'login',
      },
    ],
  },
  {
    path: 'login',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./features/auth/pages/access-state/access-state.component').then(
        (component) => component.AccessStateComponent,
      ),
  },
  {
    path: 'no-access',
    loadComponent: () =>
      import('./features/auth/pages/access-state/access-state.component').then(
        (component) => component.AccessStateComponent,
      ),
  },
  {
    path: 'dashboard',
    redirectTo: 'organization/global-configurations',
  },
  {
    path: 'organization',
    canMatch: [organizationAccessGuard],
    loadChildren: () =>
      import('./features/organization/organization.routes').then(
        (routes) => routes.ORGANIZATION_ROUTES,
      ),
  },
  {
    path: 'admin',
    canMatch: [adminConsoleAccessGuard],
    loadChildren: () =>
      import('./features/technical-admin/technical-admin.routes').then(
        (routes) => routes.TECHNICAL_ADMIN_ROUTES,
      ),
  },
  {
    path: 'technical-admin/**',
    redirectTo: redirectLegacyTechnicalAdminRoute,
  },
  {
    path: 'service-request',
    loadChildren: () =>
      import('./features/service-request/service-request.routes').then(
        (routes) => routes.SERVICE_REQUEST_ROUTES,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'auth/login',
  },
  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
