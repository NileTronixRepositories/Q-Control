import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subject, throwError } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import {
  PagedServiceGlobalizationRequestsResponse,
  ServiceGlobalizationRequestListItem,
} from '../../models/service-globalization.model';
import { ServiceDataInvalidationService } from '../../services/service-data-invalidation.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { BranchGlobalizationRequestsComponent } from './branch-globalization-requests.component';

describe('BranchGlobalizationRequestsComponent request triggers', () => {
  let fixture: ComponentFixture<BranchGlobalizationRequestsComponent>;
  let api: {
    readonly getBranchRequests: ReturnType<typeof vi.fn>;
    readonly approveRequest: ReturnType<typeof vi.fn>;
    readonly rejectRequest: ReturnType<typeof vi.fn>;
  };
  let invalidation: WritableSignal<{ readonly branchId: number; readonly revision: number } | null>;
  let canApprove: WritableSignal<boolean>;
  let canReject: WritableSignal<boolean>;
  let requests: Subject<PagedServiceGlobalizationRequestsResponse>[];
  let authSession: { readonly shouldClearSessionForHttpStatus: ReturnType<typeof vi.fn>; readonly clearSession: ReturnType<typeof vi.fn> };
  let router: { readonly navigateByUrl: ReturnType<typeof vi.fn> };
  let invalidationService: {
    readonly branchRequestsInvalidation: ReturnType<WritableSignal<{ readonly branchId: number; readonly revision: number } | null>['asReadonly']>;
    readonly invalidateAfterApproval: ReturnType<typeof vi.fn>;
    readonly invalidateAfterRejection: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.useFakeTimers();
    requests = [];
    api = {
      getBranchRequests: vi.fn(() => {
        const request = new Subject<PagedServiceGlobalizationRequestsResponse>();
        requests.push(request);
        return request;
      }),
      approveRequest: vi.fn(),
      rejectRequest: vi.fn(),
    };
    invalidation = signal(null);
    authSession = {
      shouldClearSessionForHttpStatus: vi.fn(() => false),
      clearSession: vi.fn(),
    };
    router = { navigateByUrl: vi.fn() };
    canApprove = signal(false);
    canReject = signal(false);
    invalidationService = {
      branchRequestsInvalidation: invalidation.asReadonly(),
      invalidateAfterApproval: vi.fn(),
      invalidateAfterRejection: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [BranchGlobalizationRequestsComponent],
      providers: [
        { provide: ServiceGlobalizationApiService, useValue: api },
        { provide: AuthSessionService, useValue: authSession },
        { provide: Router, useValue: router },
        { provide: ServiceDataInvalidationService, useValue: invalidationService },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canApproveGlobalizationRequests: canApprove.asReadonly(),
            canRejectGlobalizationRequests: canReject.asReadonly(),
          },
        },
        {
          provide: TechnicalAdminI18nStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchGlobalizationRequestsComponent);
    fixture.componentRef.setInput('branchId', 5);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) {
      fixture.destroy();
    }
    vi.useRealTimers();
  });

  it('does not load while closed, then sends one request when opened', () => {
    expect(api.getBranchRequests).not.toHaveBeenCalled();

    openPopup();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);

    requests[0].next(emptyPage(5));
    requests[0].complete();
    fixture.detectChanges();

    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);
  });

  it('reloads once for the active branch and ignores another branch invalidation', () => {
    openPopup();
    requests[0].next(emptyPage(0));
    requests[0].complete();

    invalidation.set({ branchId: 5, revision: 1 });
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);

    invalidation.set({ branchId: 7, revision: 2 });
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
  });

  it('does not let an older branch response overwrite the current branch page', () => {
    openPopup();
    fixture.componentRef.setInput('branchId', 6);
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);

    requests[0].next(emptyPage(99));
    requests[0].complete();
    requests[1].next(emptyPage(6));
    requests[1].complete();
    fixture.detectChanges();

    const state = fixture.componentInstance as unknown as {
      readonly page: WritableSignal<PagedServiceGlobalizationRequestsResponse>;
    };
    expect(state.page().totalItems).toBe(6);
  });

  it('does not request on close and reloads once when reopened', () => {
    openPopup();
    const state = fixture.componentInstance as unknown as {
      readonly status: WritableSignal<'Pending' | 'Approved' | 'Rejected' | null>;
    };
    state.status.set('Approved');
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);

    openPopup();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
    expect(api.getBranchRequests.mock.calls[1][1].status).toBe('Approved');
  });

  it('polls the open list every 15 seconds without overlapping requests', () => {
    openPopup();

    vi.advanceTimersByTime(15_000);
    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);

    requests[0].next(emptyPage(1));
    requests[0].complete();
    fixture.detectChanges();

    vi.advanceTimersByTime(15_000);
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);

    requests[1].next(emptyPage(1));
    requests[1].complete();
    fixture.destroy();
    vi.advanceTimersByTime(15_000);

    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
  });

  it('uses distinct enterprise badge colors for every request status', () => {
    const component = fixture.componentInstance as unknown as {
      statusClasses(status: 'Pending' | 'Approved' | 'Rejected'): string;
    };

    expect(component.statusClasses('Pending')).toContain('amber');
    expect(component.statusClasses('Approved')).toContain('emerald');
    expect(component.statusClasses('Rejected')).toContain('rose');
  });

  it('keeps branch-only users in read-only mode', () => {
    openPopup();
    requests[0].next(pageWith([requestItem({ status: 'Pending' })]));
    requests[0].complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-action="approve"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-action="reject"]')).toBeNull();
  });

  it('shows approve and reject actions for pending requests when review permissions exist', () => {
    canApprove.set(true);
    canReject.set(true);
    openPopup();
    requests[0].next(
      pageWith([
        requestItem({ requestId: 1, status: 'Pending' }),
        requestItem({ requestId: 2, status: 'Approved' }),
      ]),
    );
    requests[0].complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[data-action="approve"]').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('[data-action="reject"]').length).toBe(1);
  });

  it('approves a pending request and invalidates branch service data', () => {
    canApprove.set(true);
    const mutation = new Subject<{ readonly requestId: number; readonly status: 'Approved'; readonly branchId: number; readonly promotedServiceIds: readonly number[]; readonly reviewedByApplicationUserId: string; readonly reviewedOnUtc: string; readonly rowVersion: string; readonly message: string }>();
    api.approveRequest.mockReturnValueOnce(mutation);
    openPopup();

    const item = requestItem({ requestId: 7, status: 'Pending', rowVersion: 'rv-7' });
    const component = fixture.componentInstance as unknown as {
      requestDecision(item: ServiceGlobalizationRequestListItem, action: 'approve'): void;
      confirmDecision(): void;
    };
    component.requestDecision(item, 'approve');
    component.confirmDecision();

    expect(api.approveRequest).toHaveBeenCalledWith(7, 'rv-7');

    mutation.next({
      requestId: 7,
      status: 'Approved',
      branchId: 5,
      promotedServiceIds: [10],
      reviewedByApplicationUserId: 'admin',
      reviewedOnUtc: '2026-07-19T14:09:33.3969804',
      rowVersion: 'rv-approved',
      message: 'Approved',
    });
    mutation.complete();

    expect(invalidationService.invalidateAfterApproval).toHaveBeenCalledWith(5);
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
  });

  it('sends a trimmed rejection reason and keeps the dialog open on mutation errors', () => {
    canReject.set(true);
    api.rejectRequest.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Failed' } })),
    );
    openPopup();

    const item = requestItem({ requestId: 8, status: 'Pending', rowVersion: 'rv-8' });
    const component = fixture.componentInstance as unknown as {
      readonly decisionState: WritableSignal<unknown>;
      readonly rejectionReason: WritableSignal<string>;
      readonly error: WritableSignal<string | null>;
      requestDecision(item: ServiceGlobalizationRequestListItem, action: 'reject'): void;
      confirmDecision(): void;
    };
    component.requestDecision(item, 'reject');
    component.rejectionReason.set('  Missing documents  ');
    component.confirmDecision();

    expect(api.rejectRequest).toHaveBeenCalledWith(8, 'rv-8', {
      rejectionReason: 'Missing documents',
    });
    expect(component.decisionState()).not.toBeNull();
    expect(component.error()).toBeTruthy();
  });
  it('closes a stale decision and reloads the branch list on concurrency conflicts', () => {
    canApprove.set(true);
    api.approveRequest.mockReturnValueOnce(
      throwError(() =>
        new HttpErrorResponse({
          status: 409,
          error: { detail: 'Request is no longer pending' },
        }),
      ),
    );
    openPopup();

    const item = requestItem({ requestId: 9, status: 'Pending', rowVersion: 'rv-9' });
    const component = fixture.componentInstance as unknown as {
      readonly decisionState: WritableSignal<unknown>;
      readonly error: WritableSignal<string | null>;
      requestDecision(item: ServiceGlobalizationRequestListItem, action: 'approve'): void;
      confirmDecision(): void;
    };
    component.requestDecision(item, 'approve');
    component.confirmDecision();

    expect(api.approveRequest).toHaveBeenCalledWith(9, 'rv-9');
    expect(component.decisionState()).toBeNull();
    expect(component.error()).toContain('Request is no longer pending');
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
  });

  function openPopup(): void {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  }
});

function emptyPage(totalItems: number): PagedServiceGlobalizationRequestsResponse {
  return { currentPage: 1, pageSize: 10, totalItems, data: [] };
}

function pageWith(data: readonly ServiceGlobalizationRequestListItem[]): PagedServiceGlobalizationRequestsResponse {
  return { currentPage: 1, pageSize: 10, totalItems: data.length, data };
}

function requestItem(
  overrides: Partial<ServiceGlobalizationRequestListItem> = {},
): ServiceGlobalizationRequestListItem {
  return {
    requestId: 1,
    requestType: 'LeafUnderGlobalParent',
    status: 'Pending',
    branchId: 5,
    branchArabicName: '??? ??????',
    branchEnglishName: 'QA Branch',
    rootServiceId: 20,
    rootServiceArabicName: '????',
    rootServiceEnglishName: 'Service',
    parentServiceId: 10,
    parentServiceArabicName: '??',
    parentServiceEnglishName: 'Parent',
    servicesCount: 1,
    requestedByApplicationUserId: 'user-1',
    requestedOnUtc: '2026-07-19T14:09:33.3969804',
    reviewedByApplicationUserId: null,
    reviewedOnUtc: null,
    rejectionReason: null,
    rowVersion: 'rv-1',
    ...overrides,
  };
}