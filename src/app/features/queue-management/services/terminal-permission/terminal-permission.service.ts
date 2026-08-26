import { computed, inject, Injectable } from '@angular/core';

import { TerminalPermission } from '../../models/terminal-management/terminal-management.model';
import { AuthSessionService, resolveJwtPermissions } from '@core';

@Injectable({
  providedIn: 'root',
})
export class TerminalPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly permissions = computed(() =>
    this.resolvePermissions(this.authSessionService.currentSession()?.token),
  );

  hasPermission(permission: TerminalPermission): boolean {
    return this.permissions().has(permission);
  }

  readonly canViewAll = computed(() => this.hasPermission('Terminals.ViewAll'));
  readonly canViewDetails = computed(() => this.hasPermission('Terminals.ViewDetails'));
  readonly canCreate = computed(() => this.hasPermission('Terminals.Create'));
  readonly canUpdate = computed(() => this.hasPermission('Terminals.Update'));
  readonly canDeactivate = computed(() => this.hasPermission('Terminals.Deactivate'));
  readonly canReactivate = computed(() => this.hasPermission('Terminals.Reactivate'));
  readonly canDeletePermanent = computed(() => this.hasPermission('Terminals.DeletePermanent'));

  private resolvePermissions(token: string | undefined): ReadonlySet<string> {
    const permissions = resolveJwtPermissions(token);
    return new Set(
      Array.from(permissions).filter((permission) => permission.startsWith('Terminals.')),
    );
  }
}
