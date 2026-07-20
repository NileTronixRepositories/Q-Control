import { describe, expect, it } from 'vitest';

import { ServiceTreeNode } from '../models/service-management.model';
import { ServiceManagementStore } from './service-management.store';

describe('ServiceManagementStore available branch assignment tree', () => {
  it('removes assigned leaves while preserving available siblings without mutating the source tree', () => {
    const assignedLeaf = createNode(2, {
      parentServiceId: 1,
      isAssignedToCurrentBranch: true,
    });
    const availableLeaf = createNode(3, {
      parentServiceId: 1,
      isAssignedToCurrentBranch: false,
    });
    const parent = createNode(1, {
      hasChildren: true,
      children: [assignedLeaf, availableLeaf],
    });
    const sourceTree = [parent] as const;
    const store = new ServiceManagementStore();

    store.serviceTree.set(sourceTree);

    const availableTree = store.availableBranchAssignmentTree();

    expect(availableTree).toHaveLength(1);
    expect(availableTree[0]).not.toBe(parent);
    expect(availableTree[0].children).toEqual([availableLeaf]);
    expect(availableTree[0].children[0]).toBe(availableLeaf);
    expect(sourceTree[0].children).toEqual([assignedLeaf, availableLeaf]);
    expect(store.serviceTree()).toBe(sourceTree);
  });


  it('excludes BranchScoped leaves from the branch assignment source', () => {
    const branchScopedLeaf = createNode(70, {
      scope: 'BranchScoped',
      ownerBranchId: 5,
      isOwnedByCurrentBranch: true,
      isAssignedToCurrentBranch: false,
    });
    const globalLeaf = createNode(71, { isAssignedToCurrentBranch: false });
    const store = new ServiceManagementStore();

    store.serviceTree.set([branchScopedLeaf, globalLeaf]);

    expect(store.availableBranchAssignmentTree()).toEqual([globalLeaf]);
  });
  it('reactively removes a stale source leaf when it appears in the assigned branch tree', () => {
    const sourceLeaf = createNode(10, { isAssignedToCurrentBranch: false });
    const store = new ServiceManagementStore();

    store.serviceTree.set([sourceLeaf]);
    expect(store.availableBranchAssignmentTree()).toEqual([sourceLeaf]);

    store.assignedBranchServiceTree.set([createNode(10)]);

    expect(store.availableBranchAssignmentTree()).toEqual([]);
  });

  it('prunes the complete ancestor chain when no available descendants remain', () => {
    const assignedLeaf = createNode(30, { parentServiceId: 20 });
    const childParent = createNode(20, {
      parentServiceId: 10,
      hasChildren: true,
      children: [assignedLeaf],
    });
    const root = createNode(10, {
      hasChildren: true,
      children: [childParent],
    });
    const store = new ServiceManagementStore();

    store.serviceTree.set([root]);
    store.assignedBranchServiceTree.set([createNode(30)]);

    expect(store.availableBranchAssignmentTree()).toEqual([]);
  });

  it('keeps an unloaded parent even when its id exists in the assigned tree', () => {
    const unloadedParent = createNode(50, {
      hasChildren: true,
      children: [],
    });
    const store = new ServiceManagementStore();

    store.serviceTree.set([unloadedParent]);
    store.assignedBranchServiceTree.set([createNode(50)]);

    expect(store.availableBranchAssignmentTree()).toEqual([unloadedParent]);
    expect(store.availableBranchAssignmentTree()[0]).toBe(unloadedParent);
  });
});

function createNode(id: number, overrides: Partial<ServiceTreeNode> = {}): ServiceTreeNode {
  return {
    id,
    parentServiceId: null,
    scope: 'Global',
    ownerBranchId: null,
    ownerBranchArabicName: null,
    ownerBranchEnglishName: null,
    isOwnedByCurrentBranch: false,
    isAssignedToCurrentBranch: null,
    canEditDefinition: false,
    arabicName: `Ø®Ø¯Ù…Ø© ${id}`,
    englishName: `Service ${id}`,
    serviceCode: null,
    isServiceCodeRequired: false,
    isActive: true,
    effectiveIsActive: true,
    isTicketIssuable: true,
    hasChildren: false,
    canIssueTicket: true,
    isDeleted: false,
    orderNo: id,
    children: [],
    ...overrides,
  };
}
