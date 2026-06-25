import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthSessionService } from '../../auth/services/auth-session.service';

const PERMISSION_CLAIM_KEYS = [
  'permissions',
  'permission',
  'permissionNames',
  'permission_names',
  'windowsPermissions',
  'windows_permissions',
  'terminalsPermissions',
  'terminals_permissions',
  'displaysPermissions',
  'displays_permissions',
  'scope',
  'scp',
] as const;

export const technicalAdminPermissionGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const authSessionService = inject(AuthSessionService);
  const requiredPermissions = readRequiredPermissions(route);

  if (requiredPermissions.length === 0) {
    return true;
  }

  const token = authSessionService.currentSession()?.token;
  const userPermissions = resolvePermissions(token);
  const hasRequiredPermission = requiredPermissions.some((permission) =>
    userPermissions.has(permission),
  );

  return hasRequiredPermission ? true : router.createUrlTree(['/technical-admin/general']);
};

function readRequiredPermissions(route: ActivatedRouteSnapshot): readonly string[] {
  const value = route.data['requiredAnyPermissions'];

  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string');
}

function resolvePermissions(token: string | undefined): ReadonlySet<string> {
  if (!token) {
    return new Set();
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return new Set();
  }

  return new Set(extractPermissions(payload));
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = base64UrlToBase64(parts[1]);
    const decoded = atob(normalized);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractPermissions(payload: Record<string, unknown>): readonly string[] {
  const permissions: string[] = [];

  for (const key of PERMISSION_CLAIM_KEYS) {
    permissions.push(...collectPermissionStrings(payload[key]));
  }

  for (const [key, value] of Object.entries(payload)) {
    if (isPermissionCandidateKey(key)) {
      permissions.push(...collectPermissionStrings(value));
    }
  }

  return permissions;
}

function collectPermissionStrings(value: unknown, depth = 0): readonly string[] {
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
    return value.flatMap((item) => collectPermissionStrings(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) =>
      collectPermissionStrings(item, depth + 1),
    );
  }

  return [];
}
function isPermissionCandidateKey(key: string): boolean {
  const normalized = key.toLowerCase();

  return (
    normalized.includes('permission') ||
    normalized.endsWith('/permission') ||
    normalized.includes('scope') ||
    normalized.includes('roles') ||
    normalized.includes('claims')
  );
}

function base64UrlToBase64(value: string): string {
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