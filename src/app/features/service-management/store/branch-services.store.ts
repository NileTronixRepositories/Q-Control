import { computed, Injectable, signal } from '@angular/core';

import {
  BranchServiceTreeNode,
  BranchServicesUiMessage,
  BranchServiceLifecycleConfirmState,
  BranchServiceUnassignConfirmState,
} from '../models/branch-services.model';
import { ServiceTreeNode } from '../models/service-management.model';
import { ServiceScope } from '../models/service-management.model';

type CreateBranchTreeMode = 'root' | 'subtree';
interface CreateBranchSubtreeParent {
  readonly id: number;
  readonly label: string;
  readonly scope: ServiceScope;
  readonly ownerBranchId: number | null;
  readonly isOwnedByCurrentBranch: boolean;
  readonly canEditDefinition: boolean;
}

interface PendingRequestsSeenSnapshot {
  readonly newestRequestId: number | null;
  readonly count: number;
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
  readonly unassigning = signal(false);
  readonly lifecyclePreparing = signal(false);
  readonly lifecycleMutating = signal(false);
  readonly creatingTree = signal(false);
  readonly assignDialogOpen = signal(false);
  readonly createTreeDialogOpen = signal(false);
  readonly globalizationRequestsDialogOpen = signal(false);
  readonly pendingGlobalizationRequestsCount = signal(0);
  readonly pendingGlobalizationRequestsNewestId = signal<number | null>(null);
  readonly pendingGlobalizationRequestsLoading = signal(false);
  private readonly pendingGlobalizationRequestsSeenByBranch = signal<
    ReadonlyMap<number, PendingRequestsSeenSnapshot>
  >(new Map());
  readonly createTreeMode = signal<CreateBranchTreeMode>('root');
  readonly createSubtreeParent = signal<CreateBranchSubtreeParent | null>(null);
  readonly unassignConfirmState = signal<BranchServiceUnassignConfirmState | null>(null);
  readonly lifecycleConfirmState = signal<BranchServiceLifecycleConfirmState | null>(null);

  readonly hasSelectedBranch = computed(() => this.selectedBranchId() !== null);
  readonly hasUnreadPendingGlobalizationRequests = computed(() => {
    const branchId = this.selectedBranchId();
    const count = this.pendingGlobalizationRequestsCount();

    if (branchId === null || count <= 0) {
      return false;
    }

    const seenSnapshot = this.pendingGlobalizationRequestsSeenByBranch().get(branchId);

    if (!seenSnapshot) {
      return true;
    }

    const newestRequestId = this.pendingGlobalizationRequestsNewestId();

    if (newestRequestId !== null && seenSnapshot.newestRequestId !== null) {
      return newestRequestId > seenSnapshot.newestRequestId;
    }

    return count > seenSnapshot.count;
  });

  selectBranch(branchId: number | null, label: string | null): void {
    this.selectedBranchId.set(branchId);
    this.selectedBranchLabel.set(label);
    this.selectedBranchNodeId.set(null);
    this.branchTree.set([]);
    this.expandedBranchNodeIds.set(new Set());
    this.unassignConfirmState.set(null);
    this.lifecycleConfirmState.set(null);
    this.globalizationRequestsDialogOpen.set(false);
    this.pendingGlobalizationRequestsCount.set(0);
    this.pendingGlobalizationRequestsNewestId.set(null);
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

  openGlobalizationRequestsDialog(): void {
    this.globalizationRequestsDialogOpen.set(true);
  }

  markPendingGlobalizationRequestsAsSeen(): void {
    const branchId = this.selectedBranchId();

    if (branchId === null) {
      return;
    }

    this.pendingGlobalizationRequestsSeenByBranch.update((current) => {
      const next = new Map(current);
      next.set(branchId, {
        newestRequestId: this.pendingGlobalizationRequestsNewestId(),
        count: this.pendingGlobalizationRequestsCount(),
      });
      return next;
    });
  }

  closeGlobalizationRequestsDialog(): void {
    this.globalizationRequestsDialogOpen.set(false);
  }

  openUnassignConfirm(state: BranchServiceUnassignConfirmState): void {
    this.unassignConfirmState.set(state);
  }

  closeUnassignConfirm(): void {
    if (!this.unassigning()) {
      this.unassignConfirmState.set(null);
    }
  }

  openLifecycleConfirm(state: BranchServiceLifecycleConfirmState): void {
    this.lifecycleConfirmState.set(state);
  }

  closeLifecycleConfirm(): void {
    if (!this.lifecyclePreparing() && !this.lifecycleMutating()) {
      this.lifecycleConfirmState.set(null);
    }
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
