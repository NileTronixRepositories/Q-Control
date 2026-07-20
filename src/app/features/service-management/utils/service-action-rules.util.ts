import { ServiceListItem, ServiceDetails, ServiceTreeNode } from '../models/service-management.model';

export type ServiceActionSubject = Pick<
  ServiceListItem | ServiceDetails | ServiceTreeNode,
  | 'scope'
  | 'isAssignedToCurrentBranch'
  | 'canEditDefinition'
  | 'isOwnedByCurrentBranch'
  | 'isDeleted'
  | 'hasChildren'
> & {
  readonly children?: readonly ServiceTreeNode[];
  readonly isActive?: boolean;
  readonly effectiveIsActive?: boolean;
};

export interface ServiceActionPermissions {
  readonly canAssignBranchServices?: boolean;
  readonly canUnassignBranchServices?: boolean;
  readonly canUpdate?: boolean;
  readonly canDelete?: boolean;
  readonly canRestore?: boolean;
  readonly canDeletePermanent?: boolean;
}

export function isLeafService(service: ServiceActionSubject): boolean {
  return !service.hasChildren && (service.children?.length ?? 0) === 0;
}

export function canAssignService(
  service: ServiceActionSubject,
  permissions: ServiceActionPermissions,
): boolean {
  return (
    service.scope === 'Global' &&
    service.isAssignedToCurrentBranch === false &&
    permissions.canAssignBranchServices === true
  );
}

export function canAssignServiceLeaf(
  service: ServiceActionSubject,
  permissions: ServiceActionPermissions,
): boolean {
  return (
    canAssignService(service, permissions) &&
    isLeafService(service) &&
    service.isDeleted === false &&
    service.isActive === true &&
    service.effectiveIsActive === true
  );
}

export function canUnassignService(
  service: ServiceActionSubject,
  permissions: ServiceActionPermissions,
): boolean {
  return (
    service.scope === 'Global' &&
    service.isAssignedToCurrentBranch === true &&
    isLeafService(service) &&
    permissions.canUnassignBranchServices === true
  );
}

export function canUpdateService(
  service: ServiceActionSubject,
  permissions: ServiceActionPermissions,
): boolean {
  return (
    service.canEditDefinition === true &&
    service.isDeleted === false &&
    permissions.canUpdate === true
  );
}

export function canSoftDeleteService(
  service: ServiceActionSubject,
  permissions: ServiceActionPermissions,
): boolean {
  return (
    service.scope === 'BranchScoped' &&
    service.isOwnedByCurrentBranch === true &&
    service.canEditDefinition === true &&
    service.isDeleted === false &&
    permissions.canDelete === true
  );
}

export function canRestoreService(
  service: ServiceActionSubject,
  permissions: ServiceActionPermissions,
): boolean {
  return (
    service.scope === 'BranchScoped' &&
    service.isOwnedByCurrentBranch === true &&
    service.isDeleted === true &&
    permissions.canRestore === true
  );
}

export function canPermanentDeleteService(
  service: ServiceActionSubject,
  permissions: ServiceActionPermissions,
): boolean {
  return (
    service.scope === 'BranchScoped' &&
    service.isOwnedByCurrentBranch === true &&
    service.isDeleted === true &&
    permissions.canDeletePermanent === true
  );
}