import { computed, inject, Injectable } from '@angular/core';

import { AuthSessionService, resolveJwtPermissions } from '@core';
import { BranchConfigurationPermission } from '@features/branch-management/models/branch-configuration/branch-configuration.model';

@Injectable({
  providedIn: 'root',
})
export class BranchConfigurationPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly permissions = computed(() =>
    this.resolvePermissions(this.authSessionService.currentSession()?.token),
  );

  readonly canView = computed(
    () =>
      this.isTechnicalAdmin() ||
      this.hasPermission('BranchConfigurations.View') ||
      this.hasPermission('BranchConfigurations.Create') ||
      this.hasPermission('BranchConfigurations.Update'),
  );

  readonly canCreate = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('BranchConfigurations.Create'),
  );

  readonly canUpdate = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('BranchConfigurations.Update'),
  );

  hasPermission(permission: BranchConfigurationPermission): boolean {
    if (this.isTechnicalAdmin()) {
      return true;
    }
    return this.permissions().has(permission);
  }

  private isTechnicalAdmin(): boolean {
    return this.authSessionService.currentSession()?.userType === 'TechnicalAdmin';
  }

  private resolvePermissions(token: string | undefined): ReadonlySet<string> {
    const permissions = resolveJwtPermissions(token);
    return new Set(
      Array.from(permissions).filter((permission) =>
        permission.startsWith('BranchConfigurations.'),
      ),
    );
  }
}
