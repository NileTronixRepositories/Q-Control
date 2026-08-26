import {
  ApproveServiceGlobalizationRequestResponse,
  RejectServiceGlobalizationRequestResponse,
  ServiceGlobalizationRequestDetails,
  ServiceGlobalizationRequestListItem,
} from '../models/service-globalization/service-globalization.model';
import { ServiceGlobalizationStore } from './service-globalization.store';

describe('ServiceGlobalizationStore decision responses', () => {
  let store: ServiceGlobalizationStore;

  beforeEach(() => {
    store = new ServiceGlobalizationStore();
    store.page.set({
      currentPage: 1,
      pageSize: 10,
      totalItems: 1,
      data: [createListItem()],
    });
  });

  it('patches an approved request immediately when all statuses are visible', () => {
    store.applyDecisionResponse(createApprovedResponse());

    expect(store.page().data[0]).toEqual(
      expect.objectContaining({
        requestId: 1,
        status: 'Approved',
        reviewedByApplicationUserId: 'reviewer-1',
        reviewedOnUtc: '2026-07-13T11:00:00Z',
        rejectionReason: null,
        rowVersion: 'approved-version',
      }),
    );
    expect(store.page().totalItems).toBe(1);
  });

  it('removes a completed request from the pending filter and updates the total', () => {
    store.status.set('Pending');

    store.applyDecisionResponse(createApprovedResponse());

    expect(store.page().data).toEqual([]);
    expect(store.page().totalItems).toBe(0);
  });

  it('patches open details from a rejected response including the rejection reason', () => {
    store.selectedDetails.set(createDetails());

    store.applyDecisionResponse(createRejectedResponse());

    expect(store.selectedDetails()).toEqual(
      expect.objectContaining({
        requestId: 1,
        status: 'Rejected',
        reviewedByApplicationUserId: 'reviewer-2',
        reviewedOnUtc: '2026-07-13T12:00:00Z',
        rejectionReason: 'The service definition needs changes.',
        rowVersion: 'rejected-version',
      }),
    );
  });
});

function createListItem(): ServiceGlobalizationRequestListItem {
  return {
    requestId: 1,
    requestType: 'BranchServiceTree',
    status: 'Pending',
    branchId: 5,
    branchArabicName: 'الفرع الرئيسي',
    branchEnglishName: 'Main Branch',
    rootServiceId: 100,
    rootServiceArabicName: 'خدمة',
    rootServiceEnglishName: 'Service',
    parentServiceId: null,
    parentServiceArabicName: null,
    parentServiceEnglishName: null,
    servicesCount: 1,
    requestedByApplicationUserId: 'branch-user',
    requestedOnUtc: '2026-07-13T10:00:00Z',
    reviewedByApplicationUserId: null,
    reviewedOnUtc: null,
    rejectionReason: null,
    rowVersion: 'pending-version',
  };
}

function createDetails(): ServiceGlobalizationRequestDetails {
  const item = createListItem();

  return {
    requestId: item.requestId,
    requestType: item.requestType,
    status: item.status,
    branchId: item.branchId,
    branchArabicName: item.branchArabicName,
    branchEnglishName: item.branchEnglishName,
    rootServiceId: item.rootServiceId,
    requestedByApplicationUserId: item.requestedByApplicationUserId,
    requestedOnUtc: item.requestedOnUtc,
    reviewedByApplicationUserId: item.reviewedByApplicationUserId,
    reviewedOnUtc: item.reviewedOnUtc,
    rejectionReason: item.rejectionReason,
    parentService: null,
    services: [],
    rowVersion: item.rowVersion,
  };
}

function createApprovedResponse(): ApproveServiceGlobalizationRequestResponse {
  return {
    requestId: 1,
    status: 'Approved',
    branchId: 5,
    promotedServiceIds: [100],
    reviewedByApplicationUserId: 'reviewer-1',
    reviewedOnUtc: '2026-07-13T11:00:00Z',
    rowVersion: 'approved-version',
    message: 'Approved',
  };
}

function createRejectedResponse(): RejectServiceGlobalizationRequestResponse {
  return {
    requestId: 1,
    status: 'Rejected',
    branchId: 5,
    rejectionReason: 'The service definition needs changes.',
    reviewedByApplicationUserId: 'reviewer-2',
    reviewedOnUtc: '2026-07-13T12:00:00Z',
    rowVersion: 'rejected-version',
    message: 'Rejected',
  };
}
