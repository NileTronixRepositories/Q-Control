import { computed, Injectable, signal } from '@angular/core';

import {
  ApproveServiceGlobalizationRequestResponse,
  PagedServiceGlobalizationRequestsResponse,
  RejectServiceGlobalizationRequestResponse,
  ServiceGlobalizationDecisionState,
  ServiceGlobalizationOrderSort,
  ServiceGlobalizationRequestDetails,
  ServiceGlobalizationRequestListItem,
  ServiceGlobalizationRequestStatus,
  ServiceGlobalizationRequestType,
} from '../models/service-globalization/service-globalization.model';

const EMPTY_PAGE: PagedServiceGlobalizationRequestsResponse = {
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  data: [],
};

@Injectable()
export class ServiceGlobalizationStore {
  private readonly decisionResponses = new Map<
    number,
    ApproveServiceGlobalizationRequestResponse | RejectServiceGlobalizationRequestResponse
  >();

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

  applyDecisionResponse(
    response:
      | ApproveServiceGlobalizationRequestResponse
      | RejectServiceGlobalizationRequestResponse,
  ): void {
    this.decisionResponses.set(response.requestId, response);
    const currentPage = this.page();
    const requestIndex = currentPage.data.findIndex(
      (item) => item.requestId === response.requestId,
    );

    if (requestIndex >= 0) {
      const matchesCurrentFilter =
        this.status() === null || this.status() === response.status;
      const updatedItem = this.mergeListItem(currentPage.data[requestIndex], response);
      const data = matchesCurrentFilter
        ? currentPage.data.map((item, index) =>
            index === requestIndex ? updatedItem : item,
          )
        : currentPage.data.filter((_, index) => index !== requestIndex);

      this.page.set({
        ...currentPage,
        totalItems: matchesCurrentFilter
          ? currentPage.totalItems
          : Math.max(0, currentPage.totalItems - 1),
        data,
      });
    }

    const details = this.selectedDetails();

    if (details?.requestId === response.requestId) {
      this.selectedDetails.set(this.mergeDetails(details, response));
    }
  }

  applyPageResponse(response: PagedServiceGlobalizationRequestsResponse): void {
    let removedItems = 0;
    const data = response.data.flatMap((item) => {
      const decision = this.decisionResponses.get(item.requestId);

      if (!decision) {
        return [item];
      }

      const updatedItem = this.mergeListItem(item, decision);

      if (this.status() !== null && this.status() !== updatedItem.status) {
        removedItems += 1;
        return [];
      }

      return [updatedItem];
    });

    this.page.set({
      ...response,
      totalItems: Math.max(0, response.totalItems - removedItems),
      data,
    });
  }

  applyDetailsResponse(details: ServiceGlobalizationRequestDetails): void {
    const decision = this.decisionResponses.get(details.requestId);
    this.selectedDetails.set(
      decision ? this.mergeDetails(details, decision) : details,
    );
  }

  private mergeListItem(
    item: ServiceGlobalizationRequestListItem,
    response:
      | ApproveServiceGlobalizationRequestResponse
      | RejectServiceGlobalizationRequestResponse,
  ): ServiceGlobalizationRequestListItem {
    return {
      ...item,
      status: response.status,
      reviewedByApplicationUserId: response.reviewedByApplicationUserId,
      reviewedOnUtc: response.reviewedOnUtc,
      rejectionReason:
        response.status === 'Rejected' ? response.rejectionReason : null,
      rowVersion: response.rowVersion,
    };
  }

  private mergeDetails(
    details: ServiceGlobalizationRequestDetails,
    response:
      | ApproveServiceGlobalizationRequestResponse
      | RejectServiceGlobalizationRequestResponse,
  ): ServiceGlobalizationRequestDetails {
    return {
      ...details,
      status: response.status,
      reviewedByApplicationUserId: response.reviewedByApplicationUserId,
      reviewedOnUtc: response.reviewedOnUtc,
      rejectionReason:
        response.status === 'Rejected' ? response.rejectionReason : null,
      rowVersion: response.rowVersion,
    };
  }
}
