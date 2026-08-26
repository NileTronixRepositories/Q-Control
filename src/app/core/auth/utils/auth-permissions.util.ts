const PERMISSION_CLAIM_KEYS = [
  'permissions',
  'permission',
  'permissionNames',
  'permission_names',
  'branchesPermissions',
  'branches_permissions',
  'branchAdminsPermissions',
  'branch_admins_permissions',
  'windowsPermissions',
  'windows_permissions',
  'terminalsPermissions',
  'terminals_permissions',
  'displaysPermissions',
  'displays_permissions',
  'displayWindowsPermissions',
  'display_windows_permissions',
  'servicesPermissions',
  'services_permissions',
  'serviceWorkflowsPermissions',
  'service_workflows_permissions',
  'scope',
  'scp',
] as const;

export function resolveJwtPermissions(token: string | undefined): ReadonlySet<string> {
  if (!token) {
    return new Set();
  }

  const payload = decodeJwtPayload(token);

  if (!payload) {
    return new Set();
  }

  return new Set(extractPermissions(payload));
}

export function hasAnyJwtPermission(
  token: string | undefined,
  permissions: readonly string[],
): boolean {
  if (permissions.length === 0) {
    return true;
  }

  const userPermissions = resolveJwtPermissions(token);
  return permissions.some((permission) => userPermissions.has(permission));
}

export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = base64UrlToBase64(parts[1]);
    const decoded = atob(normalized);
    const parsedValue = JSON.parse(decoded) as unknown;

    return parsedValue && typeof parsedValue === 'object'
      ? (parsedValue as Record<string, unknown>)
      : null;
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
