import { computed, inject, Injectable } from '@angular/core';

import { WindowPermission } from '../../models/window-management/window-management.model';
import { AuthSessionService, resolveJwtPermissions } from '@core';

@Injectable({
  providedIn: 'root',
})
export class WindowPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly permissions = computed(() => this.resolvePermissions(this.authSessionService.currentSession()?.token));

  hasPermission(permission: WindowPermission): boolean {
    return this.permissions().has(permission);
  }

  readonly canViewAll = computed(() => this.hasPermission('Windows.ViewAll'));
  readonly canViewDetails = computed(() => this.hasPermission('Windows.ViewDetails'));
  readonly canCreate = computed(() => this.hasPermission('Windows.Create'));
  readonly canUpdate = computed(() => this.hasPermission('Windows.Update'));
  readonly canDeactivate = computed(() => this.hasPermission('Windows.Deactivate'));
  readonly canReactivate = computed(() => this.hasPermission('Windows.Reactivate'));
  readonly canDeletePermanent = computed(() => this.hasPermission('Windows.DeletePermanent'));

  private resolvePermissions(token: string | undefined): ReadonlySet<string> {
    const permissions = resolveJwtPermissions(token);
    return new Set(
      Array.from(permissions).filter((permission) => permission.startsWith('Windows.')),
    );
  }
}
