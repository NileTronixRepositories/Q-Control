import { computed, Injectable, signal } from '@angular/core';

import { BranchListItem } from '../../technical-admin/models/branch-management.model';
import { PagedServiceResponse, ServiceTreeNode } from '../models/service-management.model';
import {
  ServiceWorkflowDetails,
  ServiceWorkflowListItem,
  ServiceWorkflowListQuery,
  ServiceWorkflowScope,
  WorkflowCandidateQuery,
  WorkflowCandidateService,
  WorkflowConfirmState,
  WorkflowPanelMode,
  WorkflowStartOptions,
} from '../models/service-workflow.model';

export const EMPTY_WORKFLOW_PAGE: PagedServiceResponse<ServiceWorkflowListItem> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

export const EMPTY_CANDIDATE_PAGE: PagedServiceResponse<WorkflowCandidateService> = {
  currentPage: 1,
  pageSize: 25,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

const DEFAULT_WORKFLOW_QUERY: ServiceWorkflowListQuery = {
  searchText: '',
  isActive: null,
  pageNumber: 1,
  pageSize: 10,
  orderSort: 'Newest',
};

const DEFAULT_CANDIDATE_QUERY: WorkflowCandidateQuery = {
  searchText: '',
  parentServiceId: null,
  pageNumber: 1,
  pageSize: 25,
};

@Injectable()
export class ServiceWorkflowStore {
  readonly scope = signal<ServiceWorkflowScope | null>(null);
  readonly selectedBranchId = signal<number | null>(null);
  readonly branches = signal<readonly BranchListItem[]>([]);
  readonly branchTree = signal<readonly ServiceTreeNode[]>([]);
  readonly expandedBranchNodeIds = signal<ReadonlySet<number>>(new Set());
  readonly selectedBranchNodeId = signal<number | null>(null);
  readonly branchTreeSearchText = signal('');

  readonly query = signal<ServiceWorkflowListQuery>(DEFAULT_WORKFLOW_QUERY);
  readonly candidateQuery = signal<WorkflowCandidateQuery>(DEFAULT_CANDIDATE_QUERY);
  readonly page = signal<PagedServiceResponse<ServiceWorkflowListItem>>(EMPTY_WORKFLOW_PAGE);
  readonly candidates = signal<PagedServiceResponse<WorkflowCandidateService>>(EMPTY_CANDIDATE_PAGE);
  readonly startOptions = signal<WorkflowStartOptions | null>(null);
  readonly selectedDetails = signal<ServiceWorkflowDetails | null>(null);
  readonly panelMode = signal<WorkflowPanelMode>('closed');
  readonly confirmState = signal<WorkflowConfirmState | null>(null);
  readonly message = signal<{ readonly tone: 'success' | 'error' | 'info'; readonly text: string } | null>(null);

  readonly branchesLoading = signal(false);
  readonly branchTreeLoading = signal(false);
  readonly listLoading = signal(false);
  readonly detailsLoading = signal(false);
  readonly candidatesLoading = signal(false);
  readonly startOptionsLoading = signal(false);
  readonly saving = signal(false);
  readonly mutating = signal(false);

  readonly hasScope = computed(() => this.scope() !== null);
  readonly isPanelOpen = computed(() => this.panelMode() !== 'closed');

  selectBranch(branchId: number | null): void {
    this.selectedBranchId.set(branchId);
    this.branchTree.set([]);
    this.expandedBranchNodeIds.set(new Set());
    this.branchTreeSearchText.set('');
    this.selectedBranchNodeId.set(null);
    this.clearScope();
  }

  setScope(scope: ServiceWorkflowScope): void {
    const current = this.scope();
    if (current?.branchId === scope.branchId && current.leafServiceId === scope.leafServiceId) return;
    this.clearWorkflowData();
    this.scope.set(scope);
    this.selectedBranchId.set(scope.branchId);
    this.selectedBranchNodeId.set(scope.leafServiceId);
  }

  clearScope(): void {
    this.scope.set(null);
    this.clearWorkflowData();
  }

  updateQuery(patch: Partial<ServiceWorkflowListQuery>): void {
    this.query.update((query) => ({ ...query, ...patch }));
  }

  updateCandidateQuery(patch: Partial<WorkflowCandidateQuery>): void {
    this.candidateQuery.update((query) => ({ ...query, ...patch }));
  }

  toggleBranchNode(nodeId: number): void {
    this.expandedBranchNodeIds.update((current) => {
      const next = new Set(current);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  }

  expandBranchNodes(nodeIds: readonly number[]): void {
    this.expandedBranchNodeIds.update((current) => {
      const next = new Set(current);
      nodeIds.forEach((nodeId) => next.add(nodeId));
      return next;
    });
  }

  openPanel(mode: WorkflowPanelMode): void {
    this.panelMode.set(mode);
    this.confirmState.set(null);
  }

  closePanel(): void {
    this.panelMode.set('closed');
    this.selectedDetails.set(null);
    this.confirmState.set(null);
  }

  private clearWorkflowData(): void {
    this.query.set(DEFAULT_WORKFLOW_QUERY);
    this.candidateQuery.set(DEFAULT_CANDIDATE_QUERY);
    this.page.set(EMPTY_WORKFLOW_PAGE);
    this.candidates.set(EMPTY_CANDIDATE_PAGE);
    this.startOptions.set(null);
    this.selectedDetails.set(null);
    this.panelMode.set('closed');
    this.confirmState.set(null);
    this.listLoading.set(false);
    this.detailsLoading.set(false);
    this.candidatesLoading.set(false);
    this.startOptionsLoading.set(false);
    this.saving.set(false);
    this.mutating.set(false);
  }
}
