import { computed, inject, Injectable } from '@angular/core';

import { AuthSessionService } from '../../auth/services/auth-session.service';
import { resolveJwtPermissions } from '../../auth/utils/auth-permissions.util';
import { GeneralBrandPermission } from '../models/general-brand.model';

@Injectable({
  providedIn: 'root',
})
export class GeneralBrandPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly permissions = computed(() =>
    this.resolvePermissions(this.authSessionService.currentSession()?.token),
  );

  readonly canView = computed(
    () =>
      this.isTechnicalAdmin() ||
      this.hasPermission('GeneralBrand.View') ||
      this.hasPermission('GeneralBrand.Create') ||
      this.hasPermission('GeneralBrand.Update'),
  );

  readonly canCreate = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('GeneralBrand.Create'),
  );

  readonly canUpdate = computed(
    () => this.isTechnicalAdmin() || this.hasPermission('GeneralBrand.Update'),
  );

  hasPermission(permission: GeneralBrandPermission): boolean {
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
        permission.startsWith('GeneralBrand.'),
      ),
    );
  }
}
