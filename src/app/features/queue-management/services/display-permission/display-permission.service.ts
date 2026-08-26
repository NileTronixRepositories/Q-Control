import { computed, inject, Injectable } from '@angular/core';

import { DisplayPermission } from '../../models/display-management/display-management.model';
import { AuthSessionService, resolveJwtPermissions } from '@core';

@Injectable({
  providedIn: 'root',
})
export class DisplayPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly permissions = computed(() =>
    this.resolvePermissions(this.authSessionService.currentSession()?.token),
  );

  hasPermission(permission: DisplayPermission): boolean {
    return this.permissions().has(permission);
  }

  readonly canViewAll = computed(() => this.hasPermission('Displays.ViewAll'));
  readonly canViewDetails = computed(() => this.hasPermission('Displays.ViewDetails'));
  readonly canCreate = computed(() => this.hasPermission('Displays.Create'));
  readonly canUpdate = computed(() => this.hasPermission('Displays.Update'));
  readonly canDeactivate = computed(() => this.hasPermission('Displays.Deactivate'));
  readonly canReactivate = computed(() => this.hasPermission('Displays.Reactivate'));
  readonly canDeletePermanent = computed(() => this.hasPermission('Displays.DeletePermanent'));
  readonly canViewLinkedWindows = computed(() => this.hasPermission('DisplayWindows.ViewLinked'));
  readonly canViewAvailableWindows = computed(() =>
    this.hasPermission('DisplayWindows.ViewAvailable'),
  );
  readonly canAssignWindow = computed(() => this.hasPermission('DisplayWindows.Assign'));
  readonly canUnassignWindow = computed(() => this.hasPermission('DisplayWindows.Unassign'));
  readonly canManageDisplayWindows = computed(() =>
    this.canViewLinkedWindows() ||
      this.canViewAvailableWindows() ||
      this.canAssignWindow() ||
      this.canUnassignWindow(),
  );

  private resolvePermissions(token: string | undefined): ReadonlySet<string> {
    const permissions = resolveJwtPermissions(token);
    return new Set(
      Array.from(permissions).filter(
        (permission) => permission.startsWith('Displays.') || permission.startsWith('DisplayWindows.'),
      ),
    );
  }
}
