import { computed, Injectable, signal } from '@angular/core';

import {
  PagedServiceGlobalizationRequestsResponse,
  ServiceGlobalizationDecisionState,
  ServiceGlobalizationOrderSort,
  ServiceGlobalizationRequestDetails,
  ServiceGlobalizationRequestStatus,
  ServiceGlobalizationRequestType,
} from '../models/service-globalization.model';

const EMPTY_PAGE: PagedServiceGlobalizationRequestsResponse = {
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  data: [],
};

@Injectable()
export class ServiceGlobalizationStore {
  readonly page = signal<PagedServiceGlobalizationRequestsResponse>(EMPTY_PAGE);
  readonly status = signal<ServiceGlobalizationRequestStatus | null>(null);
  readonly requestType = signal<ServiceGlobalizationRequestType | null>(null);
  readonly branchId = signal<number | null>(null);
  readonly searchText = signal('');
  readonly orderSort = signal<ServiceGlobalizationOrderSort>('Newest');
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly detailsLoading = signal(false);
  readonly mutating = signal(false);
  readonly selectedDetails = signal<ServiceGlobalizationRequestDetails | null>(null);
  readonly detailsOpen = signal(false);
  readonly decisionState = signal<ServiceGlobalizationDecisionState | null>(null);
  readonly message = signal<{ readonly tone: 'success' | 'error' | 'info'; readonly text: string } | null>(null);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.page().totalItems / Math.max(1, this.page().pageSize))),
  );
  readonly hasPreviousPage = computed(() => this.page().currentPage > 1);
  readonly hasNextPage = computed(() => this.page().currentPage < this.totalPages());

  openDetails(): void {
    this.detailsOpen.set(true);
  }

  closeDetails(): void {
    if (!this.mutating()) {
      this.detailsOpen.set(false);
      this.selectedDetails.set(null);
      this.decisionState.set(null);
    }
  }

  closeDecision(): void {
    if (!this.mutating()) this.decisionState.set(null);
  }
}
