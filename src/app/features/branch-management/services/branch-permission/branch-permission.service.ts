import { computed, inject, Injectable } from '@angular/core';

import { AuthSessionService, resolveJwtPermissions } from '@core';
import { BranchBrandingPermission } from '@features/branch-management/models/branch-branding/branch-branding.model';

@Injectable({
  providedIn: 'root',
})
export class BranchPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly permissions = computed(() =>
    this.resolvePermissions(this.authSessionService.currentSession()?.token),
  );

  readonly canViewDetails = computed(() => this.hasPermission('Branches.ViewDetails'));
  readonly canUpdate = computed(() => this.hasPermission('Branches.Update'));
  readonly canCreateBranchAdmin = computed(() => this.hasPermission('BranchAdmins.Create'));

  hasPermission(permission: BranchBrandingPermission): boolean {
    return this.permissions().has(permission);
  }

  private resolvePermissions(token: string | undefined): ReadonlySet<string> {
    const permissions = resolveJwtPermissions(token);
    return new Set(
      Array.from(permissions).filter(
        (permission) => permission.startsWith('Branches.') || permission.startsWith('BranchAdmins.'),
      ),
    );
  }
}
