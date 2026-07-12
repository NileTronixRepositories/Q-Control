import { computed, Injectable, signal } from '@angular/core';

import { BranchServiceTreeNode, BranchServicesUiMessage } from '../models/branch-services.model';
import { ServiceTreeNode } from '../models/service-management.model';

type CreateBranchTreeMode = 'root' | 'subtree';
interface CreateBranchSubtreeParent {
  readonly id: number;
  readonly label: string;
}

@Injectable()
export class BranchServicesStore {
  readonly selectedBranchId = signal<number | null>(null);
  readonly selectedBranchLabel = signal<string | null>(null);
  readonly branchTree = signal<readonly BranchServiceTreeNode[]>([]);
  readonly serviceCentralTree = signal<readonly ServiceTreeNode[]>([]);
  readonly expandedBranchNodeIds = signal<ReadonlySet<number>>(new Set());
  readonly expandedCentralNodeIds = signal<ReadonlySet<number>>(new Set());
  readonly selectedBranchNodeId = signal<number | null>(null);
  readonly includeInactive = signal(false);
  readonly includeDeleted = signal(false);
  readonly message = signal<BranchServicesUiMessage | null>(null);
  readonly branchTreeLoading = signal(false);
  readonly centralTreeLoading = signal(false);
  readonly branchesLoading = signal(false);
  readonly assigning = signal(false);
  readonly creatingTree = signal(false);
  readonly assignDialogOpen = signal(false);
  readonly createTreeDialogOpen = signal(false);
  readonly createTreeMode = signal<CreateBranchTreeMode>('root');
  readonly createSubtreeParent = signal<CreateBranchSubtreeParent | null>(null);

  readonly hasSelectedBranch = computed(() => this.selectedBranchId() !== null);

  selectBranch(branchId: number | null, label: string | null): void {
    this.selectedBranchId.set(branchId);
    this.selectedBranchLabel.set(label);
    this.selectedBranchNodeId.set(null);
    this.branchTree.set([]);
    this.expandedBranchNodeIds.set(new Set());
  }

  toggleBranchNode(nodeId: number): void {
    this.expandedBranchNodeIds.update((current) => this.toggleSetItem(current, nodeId));
  }

  toggleCentralNode(nodeId: number): void {
    this.expandedCentralNodeIds.update((current) => this.toggleSetItem(current, nodeId));
  }

  selectBranchNode(nodeId: number | null): void {
    this.selectedBranchNodeId.set(nodeId);
  }

  openAssignDialog(): void {
    this.assignDialogOpen.set(true);
  }

  closeAssignDialog(): void {
    this.assignDialogOpen.set(false);
  }

  openCreateTreeDialog(): void {
    this.createTreeMode.set('root');
    this.createSubtreeParent.set(null);
    this.createTreeDialogOpen.set(true);
  }

  openCreateSubtreeDialog(parent: CreateBranchSubtreeParent): void {
    this.createTreeMode.set('subtree');
    this.createSubtreeParent.set(parent);
    this.createTreeDialogOpen.set(true);
  }

  closeCreateTreeDialog(): void {
    this.createTreeDialogOpen.set(false);
    this.createTreeMode.set('root');
    this.createSubtreeParent.set(null);
  }

  private toggleSetItem(current: ReadonlySet<number>, nodeId: number): ReadonlySet<number> {
    const next = new Set(current);

    if (next.has(nodeId)) {
      next.delete(nodeId);
    } else {
      next.add(nodeId);
    }

    return next;
  }
}
