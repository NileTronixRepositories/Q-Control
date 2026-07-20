import {
  ServiceActionPermissions,
  ServiceActionSubject,
  canAssignServiceLeaf,
  canPermanentDeleteService,
  canRestoreService,
  canSoftDeleteService,
  canUnassignService,
  canUpdateService,
} from './service-action-rules.util';

const fullPermissions: ServiceActionPermissions = {
  canAssignBranchServices: true,
  canUnassignBranchServices: true,
  canUpdate: true,
  canDelete: true,
  canRestore: true,
  canDeletePermanent: true,
};

function service(overrides: Partial<ServiceActionSubject> = {}): ServiceActionSubject {
  return {
    scope: 'BranchScoped',
    isAssignedToCurrentBranch: null,
    canEditDefinition: true,
    isOwnedByCurrentBranch: true,
    isDeleted: false,
    hasChildren: false,
    children: [],
    isActive: true,
    effectiveIsActive: true,
    ...overrides,
  };
}

describe('service action rules', () => {
  it('allows assigning only unassigned active Global leaves', () => {
    expect(
      canAssignServiceLeaf(
        service({ scope: 'Global', isAssignedToCurrentBranch: false }),
        fullPermissions,
      ),
    ).toBe(true);
    expect(
      canAssignServiceLeaf(
        service({ scope: 'BranchScoped', isAssignedToCurrentBranch: false }),
        fullPermissions,
      ),
    ).toBe(false);
    expect(
      canAssignServiceLeaf(
        service({ scope: 'Global', isAssignedToCurrentBranch: true }),
        fullPermissions,
      ),
    ).toBe(false);
    expect(
      canAssignServiceLeaf(
        service({ scope: 'Global', isAssignedToCurrentBranch: false, hasChildren: true }),
        fullPermissions,
      ),
    ).toBe(false);
  });

  it('allows unassigning only assigned Global leaves', () => {
    expect(
      canUnassignService(
        service({ scope: 'Global', isAssignedToCurrentBranch: true }),
        fullPermissions,
      ),
    ).toBe(true);
    expect(
      canUnassignService(
        service({ scope: 'BranchScoped', isAssignedToCurrentBranch: true }),
        fullPermissions,
      ),
    ).toBe(false);
    expect(
      canUnassignService(
        service({ scope: 'Global', isAssignedToCurrentBranch: true, hasChildren: true }),
        fullPermissions,
      ),
    ).toBe(false);
  });

  it('allows definition update when editable, not deleted, and permitted', () => {
    expect(canUpdateService(service(), fullPermissions)).toBe(true);
    expect(canUpdateService(service({ isDeleted: true }), fullPermissions)).toBe(false);
    expect(canUpdateService(service({ canEditDefinition: false }), fullPermissions)).toBe(false);
    expect(canUpdateService(service(), { ...fullPermissions, canUpdate: false })).toBe(false);
  });

  it('limits lifecycle actions to owned BranchScoped services', () => {
    expect(canSoftDeleteService(service(), fullPermissions)).toBe(true);
    expect(canSoftDeleteService(service({ scope: 'Global' }), fullPermissions)).toBe(false);
    expect(canSoftDeleteService(service({ isOwnedByCurrentBranch: false }), fullPermissions)).toBe(false);

    const deleted = service({ isDeleted: true });
    expect(canRestoreService(deleted, fullPermissions)).toBe(true);
    expect(canPermanentDeleteService(deleted, fullPermissions)).toBe(true);
    expect(canRestoreService(service({ scope: 'Global', isDeleted: true }), fullPermissions)).toBe(false);
    expect(canPermanentDeleteService(service({ isOwnedByCurrentBranch: false, isDeleted: true }), fullPermissions)).toBe(false);
  });

  it('denies actions when the required permission is missing', () => {
    expect(
      canAssignServiceLeaf(
        service({ scope: 'Global', isAssignedToCurrentBranch: false }),
        { ...fullPermissions, canAssignBranchServices: false },
      ),
    ).toBe(false);
    expect(canSoftDeleteService(service(), { ...fullPermissions, canDelete: false })).toBe(false);
    expect(canRestoreService(service({ isDeleted: true }), { ...fullPermissions, canRestore: false })).toBe(false);
    expect(
      canPermanentDeleteService(service({ isDeleted: true }), {
        ...fullPermissions,
        canDeletePermanent: false,
      }),
    ).toBe(false);
  });
});