import { computed, Injectable, signal } from '@angular/core';

import {
  PagedServiceResponse,
  ServiceConfirmState,
  ServiceDetails,
  ServiceListItem,
  ServiceListQuery,
  ServiceManagementTab,
  ServicePanelMode,
  ServiceParentOption,
  ServiceTreeNode,
  ServiceUiMessage,
} from '../models/service-management.model';

export const EMPTY_SERVICE_PAGE: PagedServiceResponse<ServiceListItem> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

const DEFAULT_QUERY: ServiceListQuery = {
  pageNumber: 1,
  pageSize: 10,
  searchText: '',
  isActive: null,
  isDeleted: false,
  isTicketIssuable: null,
  parentServiceId: null,
  scope: null,
  ownerBranchId: null,
  isAssignedToCurrentBranch: null,
  orderSort: 'orderNo',
};

@Injectable()
export class ServiceManagementStore {
  readonly activeTab = signal<ServiceManagementTab>('tree');
  readonly listQuery = signal<ServiceListQuery>(DEFAULT_QUERY);
  readonly servicePage = signal<PagedServiceResponse<ServiceListItem>>(EMPTY_SERVICE_PAGE);
  readonly serviceTree = signal<readonly ServiceTreeNode[]>([]);
  readonly assignedBranchServiceTree = signal<readonly ServiceTreeNode[]>([]);
  readonly parentOptions = signal<readonly ServiceParentOption[]>([]);
  readonly selectedDetails = signal<ServiceDetails | null>(null);
  readonly selectedTreeServiceId = signal<number | null>(null);
  readonly createParentServiceId = signal<number | null>(null);
  readonly createParentName = signal<string | null>(null);
  readonly panelMode = signal<ServicePanelMode>('closed');
  readonly confirmState = signal<ServiceConfirmState | null>(null);
  readonly message = signal<ServiceUiMessage | null>(null);
  readonly expandedTreeNodeIds = signal<ReadonlySet<number>>(new Set());
  readonly expandedAssignedBranchNodeIds = signal<ReadonlySet<number>>(new Set());
  readonly draggedBranchAssignmentNode = signal<ServiceTreeNode | null>(null);

  readonly listLoading = signal(false);
  readonly treeLoading = signal(false);
  readonly assignedBranchTreeLoading = signal(false);
  readonly branchAssigning = signal(false);
  readonly detailsLoading = signal(false);
  readonly parentsLoading = signal(false);
  readonly saving = signal(false);
  readonly mutating = signal(false);
  readonly uploadingLogo = signal(false);

  readonly isPanelOpen = computed(() => this.panelMode() !== 'closed');

  updateQuery(patch: Partial<ServiceListQuery>): void {
    this.listQuery.update((query) => ({
      ...query,
      ...patch,
    }));
  }

  resetQueryPage(): void {
    this.updateQuery({ pageNumber: 1 });
  }

  openPanel(mode: ServicePanelMode): void {
    this.panelMode.set(mode);
    this.confirmState.set(null);
  }

  closePanel(): void {
    this.panelMode.set('closed');
    this.selectedDetails.set(null);
    this.clearCreateParentContext();
  }

  selectTreeNode(serviceId: number | null): void {
    this.selectedTreeServiceId.set(serviceId);
  }

  setCreateParentContext(parentServiceId: number | null, parentName: string): void {
    this.createParentServiceId.set(parentServiceId);
    this.createParentName.set(parentName);
  }

  clearCreateParentContext(): void {
    this.createParentServiceId.set(null);
    this.createParentName.set(null);
  }

  expandTreeNode(nodeId: number): void {
    this.expandedTreeNodeIds.update((current) => {
      if (current.has(nodeId)) {
        return current;
      }

      const next = new Set(current);
      next.add(nodeId);
      return next;
    });
  }

  toggleTreeNode(nodeId: number): void {
    this.expandedTreeNodeIds.update((current) => {
      const next = new Set(current);

      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      return next;
    });
  }

  toggleAssignedBranchNode(nodeId: number): void {
    this.expandedAssignedBranchNodeIds.update((current) => this.toggleSetItem(current, nodeId));
  }

  expandAssignedBranchNodes(nodeIds: readonly number[]): void {
    this.expandedAssignedBranchNodeIds.update((current) => {
      const next = new Set(current);
      nodeIds.forEach((nodeId) => next.add(nodeId));
      return next;
    });
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

  reset(): void {
    this.activeTab.set('tree');
    this.listQuery.set(DEFAULT_QUERY);
    this.servicePage.set(EMPTY_SERVICE_PAGE);
    this.serviceTree.set([]);
    this.assignedBranchServiceTree.set([]);
    this.parentOptions.set([]);
    this.selectedDetails.set(null);
    this.selectedTreeServiceId.set(null);
    this.clearCreateParentContext();
    this.panelMode.set('closed');
    this.confirmState.set(null);
    this.message.set(null);
    this.expandedTreeNodeIds.set(new Set());
    this.expandedAssignedBranchNodeIds.set(new Set());
    this.draggedBranchAssignmentNode.set(null);
    this.listLoading.set(false);
    this.treeLoading.set(false);
    this.assignedBranchTreeLoading.set(false);
    this.branchAssigning.set(false);
    this.detailsLoading.set(false);
    this.parentsLoading.set(false);
    this.saving.set(false);
    this.mutating.set(false);
    this.uploadingLogo.set(false);
  }
}
