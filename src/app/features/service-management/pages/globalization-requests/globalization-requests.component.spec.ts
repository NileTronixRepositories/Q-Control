import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

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
import { GlobalizationRequestsComponent } from './globalization-requests.component';

describe('GlobalizationRequestsComponent responsive presentation', () => {
  let fixture: ComponentFixture<GlobalizationRequestsComponent>;
  let api: { readonly getRequests: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = { getRequests: vi.fn(() => of(createPage())) };

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
});

function createPage(): PagedServiceGlobalizationRequestsResponse {
  return {
    currentPage: 1,
    pageSize: 10,
    totalItems: 3,
    data: [createItem(1, 'Pending'), createItem(2, 'Approved'), createItem(3, 'Rejected')],
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
