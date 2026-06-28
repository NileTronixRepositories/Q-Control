import { computed, inject, Injectable } from '@angular/core';

import { DisplayPermission } from '../models/display-management.model';
import { AuthSessionService } from '../../auth/services/auth-session.service';

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
    if (!token) {
      return new Set();
    }

    const payload = this.decodeJwtPayload(token);

    if (!payload) {
      return new Set();
    }

    const values = this.extractPermissions(payload);
    return new Set(values);
  }

  private decodeJwtPayload(token: string): Record<string, unknown> | null {
    const parts = token.split('.');

    if (parts.length !== 3) {
      return null;
    }

    try {
      const normalized = this.base64UrlToBase64(parts[1]);
      const decoded = atob(normalized);
      return JSON.parse(decoded) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private extractPermissions(payload: Record<string, unknown>): string[] {
    const permissions: string[] = [];
    const directKeys = [
      'permissions',
      'permission',
      'permissionNames',
      'permission_names',
      'displaysPermissions',
      'displays_permissions',
      'displayWindowsPermissions',
      'display_windows_permissions',
      'scope',
      'scp',
    ];

    for (const key of directKeys) {
      const value = payload[key];
      permissions.push(...this.collectPermissionStrings(value));
    }

    for (const [key, value] of Object.entries(payload)) {
      if (this.isPermissionCandidateKey(key)) {
        permissions.push(...this.collectPermissionStrings(value));
      }
    }

    return permissions.filter(
      (item) => item.startsWith('Displays.') || item.startsWith('DisplayWindows.'),
    );
  }

  private collectPermissionStrings(value: unknown, depth = 0): string[] {
    if (depth > 4) {
      return [];
    }

    if (typeof value === 'string') {
      return value
        .split(/[\s,;]+/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (Array.isArray(value)) {
      return value.flatMap((item) => this.collectPermissionStrings(item, depth + 1));
    }

    if (value && typeof value === 'object') {
      return Object.values(value as Record<string, unknown>).flatMap((item) =>
        this.collectPermissionStrings(item, depth + 1),
      );
    }

    return [];
  }

  private isPermissionCandidateKey(key: string): boolean {
    const normalized = key.toLowerCase();
    return (
      normalized.includes('permission') ||
      normalized.endsWith('/permission') ||
      normalized.includes('scope') ||
      normalized.includes('roles') ||
      normalized.includes('claims')
    );
  }

  private base64UrlToBase64(value: string): string {
    const padded = value.replace(/-/g, '+').replace(/_/g, '/');
    const modulo = padded.length % 4;

    if (modulo === 2) {
      return `${padded}==`;
    }

    if (modulo === 3) {
      return `${padded}=`;
    }

    if (modulo === 1) {
      return padded.slice(0, -1);
    }

    return padded;
  }
}