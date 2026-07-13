import { computed, inject, Injectable } from '@angular/core';

import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServicePermission } from '../models/service-management.model';
import { ServiceWorkflowPermission } from '../models/service-workflow.model';
import { ServiceGlobalizationPermission } from '../models/service-globalization.model';

export type ServiceAreaPermission =
  | ServicePermission
  | ServiceWorkflowPermission
  | ServiceGlobalizationPermission;

const PERMISSION_CLAIM_KEYS = [
  'permissions',
  'permission',
  'permissionNames',
  'permission_names',
  'servicesPermissions',
  'services_permissions',
  'serviceWorkflowsPermissions',
  'service_workflows_permissions',
  'scope',
  'scp',
] as const;

const SERVICE_PERMISSIONS = new Set<ServicePermission>([
  'Services.ViewAll',
  'Services.ViewDetails',
  'Services.Create',
  'Services.Update',
  'Services.Delete',
  'Services.Restore',
  'Services.ViewCentralTree',
  'BranchServices.View',
  'BranchServices.Assign',
  'BranchServices.Unassign',
  'BranchServiceTrees.Create',
]);

const GLOBALIZATION_PERMISSIONS = new Set<ServiceGlobalizationPermission>([
  'ServiceGlobalizationRequests.ViewAll',
  'ServiceGlobalizationRequests.ViewDetails',
  'ServiceGlobalizationRequests.ViewOwn',
  'ServiceGlobalizationRequests.Approve',
  'ServiceGlobalizationRequests.Reject',
]);

const WORKFLOW_PERMISSIONS = new Set<ServiceWorkflowPermission>([
  'ServiceWorkflows.ViewAll',
  'ServiceWorkflows.ViewDetails',
  'ServiceWorkflows.Create',
  'ServiceWorkflows.Update',
  'ServiceWorkflows.Deactivate',
  'ServiceWorkflows.Reactivate',
  'ServiceWorkflows.ViewCandidateServices',
  'ServiceWorkflows.ViewServiceWorkflows',
  'ServiceWorkflows.ViewStartOptions',
]);

@Injectable({ providedIn: 'root' })
export class ServiceManagementPermissionService {
  private readonly authSessionService = inject(AuthSessionService);

  readonly permissions = computed(() =>
    this.resolvePermissions(this.authSessionService.currentSession()?.token),
  );

  readonly canViewAll = computed(() => this.hasPermission('Services.ViewAll'));
  readonly canViewDetails = computed(() => this.hasPermission('Services.ViewDetails'));
  readonly canCreate = computed(() => this.hasPermission('Services.Create'));
  readonly canUpdate = computed(() => this.hasPermission('Services.Update'));
  readonly canDelete = computed(() => this.hasPermission('Services.Delete'));
  readonly canRestore = computed(() => this.hasPermission('Services.Restore'));
  readonly canViewCentralTree = computed(() => this.hasPermission('Services.ViewCentralTree'));
  readonly canViewGlobalizationRequests = computed(() =>
    this.hasPermission('ServiceGlobalizationRequests.ViewAll'),
  );
  readonly canViewGlobalizationRequestDetails = computed(() =>
    this.hasPermission('ServiceGlobalizationRequests.ViewDetails'),
  );
  readonly canViewOwnGlobalizationRequests = computed(() =>
    this.hasPermission('ServiceGlobalizationRequests.ViewOwn'),
  );
  readonly canApproveGlobalizationRequests = computed(() =>
    this.hasPermission('ServiceGlobalizationRequests.Approve'),
  );
  readonly canRejectGlobalizationRequests = computed(() =>
    this.hasPermission('ServiceGlobalizationRequests.Reject'),
  );
  readonly canViewBranchServices = computed(() => this.hasPermission('BranchServices.View'));
  readonly canAssignBranchServices = computed(() => this.hasPermission('BranchServices.Assign'));
  readonly canUnassignBranchServices = computed(() =>
    this.hasPermission('BranchServices.Unassign'),
  );
  readonly canCreateBranchServiceTree = computed(() =>
    this.hasPermission('BranchServiceTrees.Create'),
  );

  readonly canViewWorkflows = computed(() => this.hasPermission('ServiceWorkflows.ViewAll'));
  readonly canViewWorkflowDetails = computed(() =>
    this.hasPermission('ServiceWorkflows.ViewDetails'),
  );
  readonly canCreateWorkflow = computed(() => this.hasPermission('ServiceWorkflows.Create'));
  readonly canUpdateWorkflow = computed(() => this.hasPermission('ServiceWorkflows.Update'));
  readonly canDeactivateWorkflow = computed(() =>
    this.hasPermission('ServiceWorkflows.Deactivate'),
  );
  readonly canReactivateWorkflow = computed(() =>
    this.hasPermission('ServiceWorkflows.Reactivate'),
  );
  readonly canViewCandidateServices = computed(() =>
    this.hasPermission('ServiceWorkflows.ViewCandidateServices'),
  );
  readonly canViewServiceWorkflows = computed(() =>
    this.hasPermission('ServiceWorkflows.ViewServiceWorkflows'),
  );
  readonly canViewStartOptions = computed(() =>
    this.hasPermission('ServiceWorkflows.ViewStartOptions'),
  );

  hasPermission(permission: ServiceAreaPermission): boolean {
    return this.permissions().has(permission);
  }

  private resolvePermissions(token: string | undefined): ReadonlySet<ServiceAreaPermission> {
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

  private extractPermissions(payload: Record<string, unknown>): readonly ServiceAreaPermission[] {
    const permissions: string[] = [];

    for (const key of PERMISSION_CLAIM_KEYS) {
      permissions.push(...this.collectPermissionStrings(payload[key]));
    }

    for (const [key, value] of Object.entries(payload)) {
      if (this.isPermissionCandidateKey(key)) {
        permissions.push(...this.collectPermissionStrings(value));
      }
    }

    return permissions.filter((permission): permission is ServiceAreaPermission =>
      this.isServiceAreaPermission(permission),
    );
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

  private isServiceAreaPermission(value: string): value is ServiceAreaPermission {
    return (
      SERVICE_PERMISSIONS.has(value as ServicePermission) ||
      WORKFLOW_PERMISSIONS.has(value as ServiceWorkflowPermission) ||
      GLOBALIZATION_PERMISSIONS.has(value as ServiceGlobalizationPermission)
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
