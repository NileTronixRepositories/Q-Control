import { Injectable, computed, signal } from '@angular/core';

import { PagedServiceResponse } from '../models/service-management.model';
import {
  ServiceRelatedWorkflow,
  ServiceWorkflowDetails,
  ServiceWorkflowListItem,
  ServiceWorkflowListQuery,
  WorkflowCandidateQuery,
  WorkflowCandidateService,
  WorkflowConfirmState,
  WorkflowPanelMode,
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
  startServiceId: null,
  pageNumber: 1,
  pageSize: 10,
  orderSort: 'modifiedOnUtc desc',
};

const DEFAULT_CANDIDATE_QUERY: WorkflowCandidateQuery = {
  searchText: '',
  parentServiceId: null,
  includeInactive: false,
  includeDeleted: false,
  pageNumber: 1,
  pageSize: 25,
};

@Injectable()
export class ServiceWorkflowStore {
  readonly query = signal<ServiceWorkflowListQuery>(DEFAULT_WORKFLOW_QUERY);
  readonly candidateQuery = signal<WorkflowCandidateQuery>(DEFAULT_CANDIDATE_QUERY);
  readonly page = signal<PagedServiceResponse<ServiceWorkflowListItem>>(EMPTY_WORKFLOW_PAGE);
  readonly candidates = signal<PagedServiceResponse<WorkflowCandidateService>>(EMPTY_CANDIDATE_PAGE);
  readonly suggestedWorkflows = signal<readonly ServiceRelatedWorkflow[]>([]);
  readonly suggestionAnchorServiceId = signal<number | null>(null);
  readonly suggestionAnchorService = signal<WorkflowCandidateService | null>(null);
  readonly suggestionStepUid = signal<string | null>(null);
  readonly selectedSuggestionWorkflowId = signal<number | null>(null);
  readonly selectedDetails = signal<ServiceWorkflowDetails | null>(null);
  readonly panelMode = signal<WorkflowPanelMode>('closed');
  readonly confirmState = signal<WorkflowConfirmState | null>(null);
  readonly message = signal<{ readonly tone: 'success' | 'error' | 'info'; readonly text: string } | null>(null);

  readonly listLoading = signal(false);
  readonly detailsLoading = signal(false);
  readonly candidatesLoading = signal(false);
  readonly suggestionsLoading = signal(false);
  readonly saving = signal(false);
  readonly mutating = signal(false);

  readonly isPanelOpen = computed(() => this.panelMode() !== 'closed');

  updateQuery(patch: Partial<ServiceWorkflowListQuery>): void {
    this.query.update((query) => ({ ...query, ...patch }));
  }

  updateCandidateQuery(patch: Partial<WorkflowCandidateQuery>): void {
    this.candidateQuery.update((query) => ({ ...query, ...patch }));
  }

  openPanel(mode: WorkflowPanelMode): void {
    this.panelMode.set(mode);
    this.confirmState.set(null);
  }

  closePanel(): void {
    this.panelMode.set('closed');
    this.selectedDetails.set(null);
    this.confirmState.set(null);
    this.clearSuggestions();
  }

  clearSuggestions(): void {
    this.suggestedWorkflows.set([]);
    this.suggestionsLoading.set(false);
    this.suggestionAnchorServiceId.set(null);
    this.suggestionAnchorService.set(null);
    this.suggestionStepUid.set(null);
    this.selectedSuggestionWorkflowId.set(null);
  }
}




