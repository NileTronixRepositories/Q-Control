import { CanDeactivateFn, Routes } from '@angular/router';

import { adminPermissionGuard } from '@core/authorization/guards/admin-permission.guard';
import { adminBranchContextGuard } from '../../layout/admin-shell/guards/admin-branch-context.guard';

const ticketDesignerPendingChangesGuard: CanDeactivateFn<{ canDeactivate(): boolean }> = (
  component,
) => component.canDeactivate();

export const QUEUE_MANAGEMENT_ROUTES: Routes = [
  {
    path: 'queue-operations',
    canActivate: [adminPermissionGuard, adminBranchContextGuard],
    data: {
      requiredAnyPermissions: [
        'Tickets.View',
        'Reservations.View',
        'Tickets.ViewArchive',
        'Reservations.ViewArchive',
      ],
    },
    loadComponent: () =>
      import('./pages/ticket-reservation-operations/ticket-reservation-operations.component').then(
        (component) => component.TicketReservationOperationsComponent,
      ),
  },
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
      import('./pages/windows/windows.component').then((component) => component.WindowsComponent),
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
  {
    path: 'ticket-template',
    canActivate: [adminPermissionGuard, adminBranchContextGuard],
    canDeactivate: [ticketDesignerPendingChangesGuard],
    data: {
      requiredAnyPermissions: ['TicketConfigurations.View'],
    },
    loadComponent: () =>
      import('./pages/ticket-template-builder/ticket-template-builder.component').then(
        (component) => component.TicketTemplateBuilderComponent,
      ),
  },
];
