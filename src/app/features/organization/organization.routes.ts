import { Routes } from '@angular/router';

import { OrganizationStore } from './store/organization.store';
import { OrganizationShellStore } from './store/organization-shell.store';

export const ORGANIZATION_ROUTES: Routes = [
  {
    path: '',
    providers: [OrganizationStore, OrganizationShellStore],
    loadComponent: () =>
      import('./layout/organization-shell.component').then(
        (component) => component.OrganizationShellComponent
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'global-configurations'
      },
      {
        path: 'global-configurations',
        loadComponent: () =>
          import(
            './pages/global-configurations/global-configurations.component'
          ).then((component) => component.GlobalConfigurationsComponent)
      },
      {
        path: 'ticket-calling-management',
        loadComponent: () =>
          import(
            './pages/ticket-calling-management/ticket-calling-management.component'
          ).then((component) => component.TicketCallingManagementComponent)
      },
      {
        path: 'audio-announcement',
        loadComponent: () =>
          import('./pages/audio-announcement/audio-announcement.component').then(
            (component) => component.AudioAnnouncementComponent
          )
      },
      {
        path: 'ticket-status-management',
        loadComponent: () =>
          import(
            './pages/ticket-status-management/ticket-status-management.component'
          ).then((component) => component.TicketStatusManagementComponent)
      }
    ]
  }
];

