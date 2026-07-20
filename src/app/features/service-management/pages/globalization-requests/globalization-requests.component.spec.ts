import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import {
  PagedServiceGlobalizationRequestsResponse,
  ServiceGlobalizationRequestListItem,
} from '../../models/service-globalization.model';
import { ServiceDataInvalidationService } from '../../services/service-data-invalidation.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceGlobalizationStore } from '../../store/service-globalization.store';
import { GlobalizationRequestsComponent } from './globalization-requests.component';

describe('GlobalizationRequestsComponent responsive presentation', () => {
  let fixture: ComponentFixture<GlobalizationRequestsComponent>;
  let api: {
    readonly getRequests: ReturnType<typeof vi.fn>;
    readonly getRequestDetails: ReturnType<typeof vi.fn>;
    readonly approveRequest: ReturnType<typeof vi.fn>;
    readonly rejectRequest: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      getRequests: vi.fn(() => of(createPage())),
      getRequestDetails: vi.fn(() => of(createDetails())),
      approveRequest: vi.fn(),
      rejectRequest: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [GlobalizationRequestsComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: signal(null).asReadonly(),
            shouldClearSessionForHttpStatus: () => false,
            clearSession: vi.fn(),
          },
        },
        {
          provide: TechnicalAdminI18nStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
          },
        },
        { provide: ServiceGlobalizationApiService, useValue: api },
        {
          provide: BranchManagementApiService,
          useValue: {
            getBranches: vi.fn(() =>
              of({ currentPage: 1, pageSize: 100, totalItems: 0, data: [] }),
            ),
          },
        },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewGlobalizationRequestDetails: signal(true).asReadonly(),
            canApproveGlobalizationRequests: signal(true).asReadonly(),
            canRejectGlobalizationRequests: signal(true).asReadonly(),
          },
        },
        {
          provide: ServiceDataInvalidationService,
          useValue: {
            invalidateAfterApproval: vi.fn(),
            invalidateAfterRejection: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalizationRequestsComponent);
    fixture.detectChanges();
  });

  it('renders the same requests in the desktop table and mobile cards', () => {
    const desktopRows = fixture.nativeElement.querySelectorAll(
      '[data-testid="requests-desktop"] tbody tr',
    );
    const mobileCards = fixture.nativeElement.querySelectorAll(
      '[data-testid="requests-mobile"] > article',
    );

    expect(desktopRows.length).toBe(3);
    expect(mobileCards.length).toBe(3);
  });

  it('uses distinct status colors and shows decisions for pending requests only', () => {
    const pendingBadge = fixture.nativeElement.querySelector('[data-status="Pending"]');
    const approvedBadge = fixture.nativeElement.querySelector('[data-status="Approved"]');
    const rejectedBadge = fixture.nativeElement.querySelector('[data-status="Rejected"]');

    expect(pendingBadge.className).toContain('amber');
    expect(approvedBadge.className).toContain('emerald');
    expect(rejectedBadge.className).toContain('rose');
    expect(fixture.nativeElement.querySelectorAll('[data-action="approve"]').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('[data-action="reject"]').length).toBe(2);
  });

  it('sends one additional request when the status filter changes', () => {
    expect(api.getRequests).toHaveBeenCalledTimes(1);
    const statusFilter = fixture.nativeElement.querySelector(
      '[data-testid="status-filter"]',
    ) as HTMLSelectElement;

    statusFilter.value = 'Approved';
    statusFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(api.getRequests).toHaveBeenCalledTimes(2);
    expect(api.getRequests.mock.calls[1][0].status).toBe('Approved');
  });

  it('ignores an older list response after a forced refresh starts', () => {
    const staleResponse = new Subject<PagedServiceGlobalizationRequestsResponse>();
    const freshResponse = new Subject<PagedServiceGlobalizationRequestsResponse>();
    api.getRequests
      .mockReturnValueOnce(staleResponse.asObservable())
      .mockReturnValueOnce(freshResponse.asObservable());
    const component = fixture.componentInstance as unknown as {
      loadRequests(pageNumber?: number, force?: boolean): void;
      readonly store: {
        readonly page: () => PagedServiceGlobalizationRequestsResponse;
      };
    };

    component.loadRequests(1);
    component.loadRequests(1, true);
    expect(api.getRequests).toHaveBeenCalledTimes(3);

    freshResponse.next(createSinglePage('Approved'));
    freshResponse.complete();
    staleResponse.next(createSinglePage('Pending'));
    staleResponse.complete();
    fixture.detectChanges();

    expect(component.store.page().data[0].status).toBe('Approved');
  });

  it('applies an approval immediately and forces a fresh list request', () => {
    api.approveRequest.mockReturnValueOnce(
      of({
        requestId: 1,
        status: 'Approved' as const,
        branchId: 5,
        promotedServiceIds: [101],
        reviewedByApplicationUserId: 'reviewer-1',
        reviewedOnUtc: '2026-07-13T11:00:00Z',
        rowVersion: 'approved-version',
        message: 'Approved',
      }),
    );
    api.getRequests.mockReturnValueOnce(of(createSinglePage('Pending')));
    const component = fixture.componentInstance as unknown as {
      confirmDecision(): void;
      readonly store: ServiceGlobalizationStore;
    };
    component.store.decisionState.set({
      action: 'approve',
      requestId: 1,
      serviceName: 'Service 1',
      rowVersion: 'row-version-1',
    });

    component.confirmDecision();
    fixture.detectChanges();

    expect(api.approveRequest).toHaveBeenCalledWith(1, 'row-version-1');
    expect(api.getRequests).toHaveBeenCalledTimes(2);
    expect(component.store.page().data[0].status).toBe('Approved');
  });
  it('loads request details only through the details endpoint', () => {
    const component = fixture.componentInstance as unknown as {
      openDetails(requestId: number): void;
      readonly store: ServiceGlobalizationStore;
    };

    component.openDetails(1);
    fixture.detectChanges();

    expect(api.getRequestDetails).toHaveBeenCalledWith(1);
    expect(component.store.selectedDetails()?.requestId).toBe(1);
  });

  it('closes the decision and reloads the list after a concurrency conflict', () => {
    api.approveRequest.mockReturnValueOnce(
      throwError(() =>
        new HttpErrorResponse({
          status: 409,
          error: { detail: 'Request is no longer pending' },
        }),
      ),
    );
    const component = fixture.componentInstance as unknown as {
      confirmDecision(): void;
      readonly store: ServiceGlobalizationStore;
    };
    component.store.decisionState.set({
      action: 'approve',
      requestId: 1,
      serviceName: 'Service 1',
      rowVersion: 'row-version-1',
    });

    component.confirmDecision();
    fixture.detectChanges();

    expect(api.approveRequest).toHaveBeenCalledWith(1, 'row-version-1');
    expect(component.store.decisionState()).toBeNull();
    expect(component.store.message()?.text).toContain('Request is no longer pending');
    expect(api.getRequests).toHaveBeenCalledTimes(2);
  });
});

function createPage(): PagedServiceGlobalizationRequestsResponse {
  return {
    currentPage: 1,
    pageSize: 10,
    totalItems: 3,
    data: [createItem(1, 'Pending'), createItem(2, 'Approved'), createItem(3, 'Rejected')],
  };
}

function createSinglePage(
  status: ServiceGlobalizationRequestListItem['status'],
): PagedServiceGlobalizationRequestsResponse {
  return {
    currentPage: 1,
    pageSize: 10,
    totalItems: 1,
    data: [createItem(1, status)],
  };
}

function createItem(
  requestId: number,
  status: ServiceGlobalizationRequestListItem['status'],
): ServiceGlobalizationRequestListItem {
  return {
    requestId,
    requestType: 'BranchServiceTree',
    status,
    branchId: 5,
    branchArabicName: 'الفرع الرئيسي',
    branchEnglishName: 'Main Branch',
    rootServiceId: 100 + requestId,
    rootServiceArabicName: `خدمة ${requestId}`,
    rootServiceEnglishName: `Service ${requestId}`,
    parentServiceId: null,
    parentServiceArabicName: null,
    parentServiceEnglishName: null,
    servicesCount: 1,
    requestedByApplicationUserId: 'user-1',
    requestedOnUtc: '2026-07-13T10:00:00Z',
    reviewedByApplicationUserId: status === 'Pending' ? null : 'reviewer-1',
    reviewedOnUtc: status === 'Pending' ? null : '2026-07-13T11:00:00Z',
    rejectionReason: status === 'Rejected' ? 'Needs changes' : null,
    rowVersion: `row-version-${requestId}`,
  };
}

function createDetails() {
  return {
    requestId: 1,
    requestType: 'BranchServiceTree' as const,
    status: 'Pending' as const,
    branchId: 5,
    branchArabicName: 'الفرع الرئيسي',
    branchEnglishName: 'Main Branch',
    rootServiceId: 101,
    requestedByApplicationUserId: 'user-1',
    requestedOnUtc: '2026-07-13T10:00:00Z',
    reviewedByApplicationUserId: null,
    reviewedOnUtc: null,
    rejectionReason: null,
    parentService: null,
    services: [
      {
        serviceId: 101,
        parentServiceId: null,
        arabicName: 'خدمة 1',
        englishName: 'Service 1',
        scope: 'BranchScoped' as const,
        ownerBranchId: 5,
        isActive: true,
        isDeleted: false,
        children: [],
      },
    ],
    rowVersion: 'details-row-version',
  };
}