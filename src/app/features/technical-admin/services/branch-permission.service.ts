import { computed, inject, Injectable } from '@angular/core';

import { AuthSessionService } from '../../auth/services/auth-session.service';
import { BranchBrandingPermission } from '../models/branch-branding.model';

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

  hasPermission(permission: BranchBrandingPermission): boolean {
    return this.permissions().has(permission);
  }

  private resolvePermissions(token: string | undefined): ReadonlySet<string> {
    if (!token) {
      return new Set();
    }

    const payload = this.decodeJwtPayload(token);

    if (!payload) {
      return new Set();
    }

    return new Set(this.extractPermissions(payload));
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

  private extractPermissions(payload: Record<string, unknown>): readonly string[] {
    const permissions: string[] = [];
    const directKeys = [
      'permissions',
      'permission',
      'permissionNames',
      'permission_names',
      'branchesPermissions',
      'branches_permissions',
      'scope',
      'scp',
    ];

    for (const key of directKeys) {
      permissions.push(...this.collectPermissionStrings(payload[key]));
    }

    for (const [key, value] of Object.entries(payload)) {
      if (this.isPermissionCandidateKey(key)) {
        permissions.push(...this.collectPermissionStrings(value));
      }
    }

    return permissions.filter((permission) => permission.startsWith('Branches.'));
  }

  private collectPermissionStrings(value: unknown, depth = 0): readonly string[] {
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