import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { computed, signal, WritableSignal } from '@angular/core';
import { of, Subject } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import {
  ServiceDeleteResponse,
  ServiceDetails,
  ServiceRestoreResponse,
  ServiceTreeNode,
} from '../../models/service-management.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { UnassignBranchLeafServiceResponse } from '../../models/branch-services.model';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { PagedServiceGlobalizationRequestsResponse } from '../../models/service-globalization.model';
import { BranchServicesStore } from '../../store/branch-services.store';
import { BranchServicesComponent } from './branch-services.component';

describe('BranchServicesComponent branch service actions', () => {
  let fixture: ComponentFixture<BranchServicesComponent>;
  let unassignResult: Subject<UnassignBranchLeafServiceResponse>;
  let lifecycleResult: Subject<ServiceDeleteResponse | ServiceRestoreResponse>;
  let branchServicesApi: {
    readonly getBranchServicesTree: ReturnType<typeof vi.fn>;
    readonly unassignLeafService: ReturnType<typeof vi.fn>;
  };
  let serviceManagementApi: {
    readonly getServiceTree: ReturnType<typeof vi.fn>;
    readonly getServiceDetails: ReturnType<typeof vi.fn>;
    readonly deleteService: ReturnType<typeof vi.fn>;
    readonly restoreService: ReturnType<typeof vi.fn>;
  };
  let canViewOwnRequests: WritableSignal<boolean>;
  let currentUserType: WritableSignal<'BranchAdmin' | 'TechnicalAdmin'>;
  let globalizationApi: { readonly getBranchRequests: ReturnType<typeof vi.fn> };

  const leaf = createLeafNode();
  const ownedLeaf = createOwnedBranchNode(200, false);
  const deletedOwnedLeaf = createOwnedBranchNode(201, true);
  const foreignBranchLeaf = createOwnedBranchNode(202, false, 9);

  beforeEach(async () => {
    vi.useFakeTimers();
    unassignResult = new Subject<UnassignBranchLeafServiceResponse>();
    lifecycleResult = new Subject<ServiceDeleteResponse | ServiceRestoreResponse>();
    canViewOwnRequests = signal(false);
    currentUserType = signal<'BranchAdmin' | 'TechnicalAdmin'>('BranchAdmin');
    globalizationApi = {
      getBranchRequests: vi.fn((_: number, query: { readonly pageSize: number }) =>
        of<PagedServiceGlobalizationRequestsResponse>({
          currentPage: 1,
          pageSize: query.pageSize,
          totalItems: 3,
          data: [],
        }),
      ),
    };
    branchServicesApi = {
      getBranchServicesTree: vi.fn(() =>
        of([leaf, ownedLeaf, deletedOwnedLeaf, foreignBranchLeaf]),
      ),
      unassignLeafService: vi.fn(() => unassignResult.asObservable()),
    };
    serviceManagementApi = {
      getServiceTree: vi.fn(() => of([])),
      getServiceDetails: vi.fn((serviceId: number) =>
        of(createServiceDetails(serviceId === deletedOwnedLeaf.id ? deletedOwnedLeaf : ownedLeaf)),
      ),
      deleteService: vi.fn(() => lifecycleResult.asObservable()),
      restoreService: vi.fn(() => lifecycleResult.asObservable()),
    };

    await TestBed.configureTestingModule({
      imports: [BranchServicesComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: computed(() => ({
              token: 'token',
              userType: currentUserType(),
              activeBranchId: 5,
              branches: [
                {
                  branchId: 5,
                  englishName: 'Main Branch',
                  arabicName: 'الفرع الرئيسي',
                  isActive: true,
                },
              ],
            })),
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
        { provide: BranchManagementApiService, useValue: { getBranches: vi.fn() } },
        { provide: BranchServicesApiService, useValue: branchServicesApi },
        { provide: ServiceManagementApiService, useValue: serviceManagementApi },
        { provide: ServiceGlobalizationApiService, useValue: globalizationApi },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewBranchServices: signal(true).asReadonly(),
            canViewWorkflows: signal(false).asReadonly(),
            canAssignBranchServices: signal(true).asReadonly(),
            canUnassignBranchServices: signal(true).asReadonly(),
            canDelete: signal(true).asReadonly(),
            canRestore: signal(true).asReadonly(),
            canCreateBranchServiceTree: signal(false).asReadonly(),
            canViewOwnGlobalizationRequests: canViewOwnRequests.asReadonly(),
          },
        },
        { provide: Router, useValue: { navigateByUrl: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchServicesComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) {
      fixture.destroy();
    }
    vi.useRealTimers();
  });

  it('loads the pending badge only, then loads the full list when the notification opens', () => {
    canViewOwnRequests.set(true);
    fixture.detectChanges();

    expect(globalizationApi.getBranchRequests).toHaveBeenCalledTimes(1);
    expect(globalizationApi.getBranchRequests).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ status: 'Pending', pageNumber: 1, pageSize: 1 }),
    );

    const notificationButton = fixture.nativeElement.querySelector('.bi-bell')
      ?.closest('button') as HTMLButtonElement | null;
    expect(notificationButton).not.toBeNull();
    expect(notificationButton?.textContent).toContain('3');
    expect(
      notificationButton?.querySelector('[data-testid="pending-requests-shadow"]'),
    ).not.toBeNull();

    notificationButton?.click();
    fixture.detectChanges();

    expect(notificationButton?.textContent).not.toContain('3');
    expect(
      notificationButton?.querySelector('[data-testid="pending-requests-shadow"]'),
    ).toBeNull();
    expect(globalizationApi.getBranchRequests).toHaveBeenCalledTimes(2);
    expect(globalizationApi.getBranchRequests.mock.calls[1][1]).toEqual(
      expect.objectContaining({ status: null, pageNumber: 1, pageSize: 10 }),
    );
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
  });

  it('keeps the badge hidden for the same request and restores it for a newer request', () => {
    globalizationApi.getBranchRequests
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of(pendingRequestsPage(query.pageSize, 3, 101)),
      )
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of(pendingRequestsPage(query.pageSize, 3, 101)),
      )
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of(pendingRequestsPage(query.pageSize, 3, 101)),
      )
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of(pendingRequestsPage(query.pageSize, 3, 102)),
      );

    canViewOwnRequests.set(true);
    fixture.detectChanges();

    const notificationButton = fixture.nativeElement.querySelector('.bi-bell')
      ?.closest('button') as HTMLButtonElement;
    notificationButton.click();
    fixture.detectChanges();

    const store = fixture.debugElement.injector.get(BranchServicesStore);
    store.closeGlobalizationRequestsDialog();
    fixture.detectChanges();

    vi.advanceTimersByTime(15_000);
    fixture.detectChanges();

    expect(notificationButton.querySelector('[data-testid="pending-requests-shadow"]')).toBeNull();
    expect(notificationButton.textContent).not.toContain('3');

    vi.advanceTimersByTime(15_000);
    fixture.detectChanges();

    expect(notificationButton.textContent).toContain('3');
    expect(
      notificationButton.querySelector('[data-testid="pending-requests-shadow"]'),
    ).not.toBeNull();
  });

  it('restores the badge from a count increase when the API omits the newest row', () => {
    globalizationApi.getBranchRequests
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of(pendingRequestsPage(query.pageSize, 3, null)),
      )
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of(pendingRequestsPage(query.pageSize, 3, null)),
      )
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of(pendingRequestsPage(query.pageSize, 4, null)),
      );

    canViewOwnRequests.set(true);
    fixture.detectChanges();

    const notificationButton = fixture.nativeElement.querySelector('.bi-bell')
      ?.closest('button') as HTMLButtonElement;
    notificationButton.click();
    fixture.detectChanges();

    fixture.debugElement.injector
      .get(BranchServicesStore)
      .closeGlobalizationRequestsDialog();
    fixture.detectChanges();

    vi.advanceTimersByTime(15_000);
    fixture.detectChanges();

    expect(notificationButton.textContent).toContain('4');
    expect(
      notificationButton.querySelector('[data-testid="pending-requests-shadow"]'),
    ).not.toBeNull();
  });

  it('polls as a technical admin and refreshes service trees when a request is completed', () => {
    globalizationApi.getBranchRequests
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of<PagedServiceGlobalizationRequestsResponse>({
          currentPage: 1,
          pageSize: query.pageSize,
          totalItems: 3,
          data: [],
        }),
      )
      .mockImplementationOnce((_: number, query: { readonly pageSize: number }) =>
        of<PagedServiceGlobalizationRequestsResponse>({
          currentPage: 1,
          pageSize: query.pageSize,
          totalItems: 2,
          data: [],
        }),
      );

    canViewOwnRequests.set(true);
    fixture.detectChanges();

    expect(globalizationApi.getBranchRequests).toHaveBeenCalledTimes(1);
    expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalledTimes(1);

    currentUserType.set('TechnicalAdmin');
    fixture.detectChanges();
    vi.advanceTimersByTime(15_000);
    fixture.detectChanges();

    expect(globalizationApi.getBranchRequests).toHaveBeenCalledTimes(2);
    expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalledTimes(2);
    expect(serviceManagementApi.getServiceTree).toHaveBeenCalledTimes(1);
  });

  it('loads the latest row version, soft deletes once, and refreshes both trees', () => {
    openAndConfirmLifecycle('Delete');
    clickLifecycleConfirmButton();

    expect(serviceManagementApi.getServiceDetails).toHaveBeenCalledWith(ownedLeaf.id);
    expect(serviceManagementApi.deleteService).toHaveBeenCalledTimes(1);
    expect(serviceManagementApi.deleteService).toHaveBeenCalledWith(
      ownedLeaf.id,
      'row-version-200',
    );

    lifecycleResult.next({
      id: ownedLeaf.id,
      isDeleted: true,
      isActive: false,
      rowVersion: 'row-version-200-next',
      message: 'Branch service deleted',
    });
    lifecycleResult.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-branch-service-lifecycle-dialog')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Branch service deleted');
    expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalledTimes(2);
    expect(serviceManagementApi.getServiceTree).toHaveBeenCalledTimes(1);
  });

  it('restores a deleted owned service and reports operationally disabled state', () => {
    openAndConfirmLifecycle('Restore');

    expect(serviceManagementApi.getServiceDetails).toHaveBeenCalledWith(deletedOwnedLeaf.id);
    expect(serviceManagementApi.restoreService).toHaveBeenCalledWith(
      deletedOwnedLeaf.id,
      'row-version-201',
    );

    lifecycleResult.next({
      id: deletedOwnedLeaf.id,
      isDeleted: false,
      isActive: true,
      effectiveIsActive: false,
      canIssueTicket: false,
      rowVersion: 'row-version-201-next',
      message: 'Restored',
    });
    lifecycleResult.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      SERVICE_MANAGEMENT_TRANSLATIONS.en.restoredButDisabled,
    );
  });

  for (const scenario of [
    { status: 400, detail: 'If-Match is invalid' },
    { status: 403, detail: 'Foreign branch service is forbidden' },
    { status: 404, detail: 'Service was not found' },
    { status: 409, detail: 'The row version is stale' },
  ]) {
    it(`closes lifecycle confirmation and refreshes stale data for ${scenario.status}`, () => {
      openAndConfirmLifecycle('Delete');
      lifecycleResult.error(
        new HttpErrorResponse({
          status: scenario.status,
          error: { detail: scenario.detail },
        }),
      );
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-branch-service-lifecycle-dialog')).toBeNull();
      expect(fixture.nativeElement.textContent).toContain(scenario.detail);
      expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalledTimes(2);
    });
  }

  it('confirms once, calls the endpoint, closes the dialog, and refreshes both trees', () => {
    openAndConfirmUnassignment();
    clickConfirmButton();

    expect(branchServicesApi.unassignLeafService).toHaveBeenCalledTimes(1);
    expect(branchServicesApi.unassignLeafService).toHaveBeenCalledWith(5, leaf.id);

    unassignResult.next({
      branchId: 5,
      leafServiceId: leaf.id,
      unassignedServiceIds: [leaf.id, 1],
      removedAssignmentsCount: 2,
    });
    unassignResult.complete();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-unassign-branch-service-dialog')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain(
      'Unassigned Cardiology and removed 2 service assignments.',
    );
    expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalledTimes(2);
    expect(serviceManagementApi.getServiceTree).toHaveBeenCalledTimes(1);
  });

  for (const scenario of [
    { status: 400, detail: 'Leaf service ID must be greater than zero', closes: false, refreshes: false },
    { status: 403, detail: 'Forbidden by branch scope', closes: false, refreshes: false },
    { status: 404, detail: 'Assignment was not found', closes: true, refreshes: true },
    { status: 409, detail: 'The selected service is not a leaf', closes: false, refreshes: false },
  ]) {
    it(`shows the backend ProblemDetails message for ${scenario.status}`, () => {
      openAndConfirmUnassignment();
      unassignResult.error(
        new HttpErrorResponse({
          status: scenario.status,
          error: { detail: scenario.detail },
        }),
      );
      fixture.detectChanges();

      const dialog = fixture.nativeElement.querySelector(
        'app-unassign-branch-service-dialog',
      );
      expect(fixture.nativeElement.textContent).toContain(
        scenario.detail,
      );
      expect(dialog === null).toBe(scenario.closes);
      expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalledTimes(
        scenario.refreshes ? 2 : 1,
      );
    });
  }

  function openAndConfirmUnassignment(): void {
    const unassignButton = fixture.nativeElement.querySelector(
      'button[aria-label="Unassign"]',
    ) as HTMLButtonElement;
    unassignButton.click();
    fixture.detectChanges();
    clickConfirmButton();
  }

  function clickConfirmButton(): void {
    const confirmButton = fixture.nativeElement.querySelector(
      'app-unassign-branch-service-dialog footer button:last-child',
    ) as HTMLButtonElement;
    confirmButton.click();
    fixture.detectChanges();
  }

  function openAndConfirmLifecycle(label: 'Delete' | 'Restore'): void {
    const actionButton = fixture.nativeElement.querySelector(
      `button[aria-label="${label}"]`,
    ) as HTMLButtonElement;
    actionButton.click();
    fixture.detectChanges();
    clickLifecycleConfirmButton();
  }

  function clickLifecycleConfirmButton(): void {
    const confirmButton = fixture.nativeElement.querySelector(
      'app-branch-service-lifecycle-dialog footer button:last-child',
    ) as HTMLButtonElement;
    confirmButton.click();
    fixture.detectChanges();
  }
});

function createLeafNode(): ServiceTreeNode {
  return {
    id: 100,
    parentServiceId: 1,
    scope: 'Global',
    ownerBranchId: null,
    ownerBranchArabicName: null,
    ownerBranchEnglishName: null,
    isOwnedByCurrentBranch: false,
    isAssignedToCurrentBranch: true,
    canEditDefinition: false,
    arabicName: 'القلب',
    englishName: 'Cardiology',
    isActive: true,
    effectiveIsActive: true,
    isTicketIssuable: true,
    hasChildren: false,
    canIssueTicket: true,
    isDeleted: false,
    orderNo: 1,
    children: [],
  };
}

function createOwnedBranchNode(
  id: number,
  isDeleted: boolean,
  ownerBranchId = 5,
): ServiceTreeNode {
  return {
    id,
    parentServiceId: null,
    scope: 'BranchScoped',
    ownerBranchId,
    ownerBranchArabicName: 'الفرع',
    ownerBranchEnglishName: 'Branch',
    isOwnedByCurrentBranch: ownerBranchId === 5,
    isAssignedToCurrentBranch: true,
    canEditDefinition: ownerBranchId === 5,
    arabicName: `خدمة ${id}`,
    englishName: `Owned Service ${id}`,
    isActive: !isDeleted,
    effectiveIsActive: !isDeleted,
    isTicketIssuable: true,
    hasChildren: false,
    canIssueTicket: !isDeleted,
    isDeleted,
    orderNo: id,
    children: [],
  };
}

function createServiceDetails(node: ServiceTreeNode): ServiceDetails {
  return {
    ...node,
    parentServiceNameAr: null,
    parentServiceNameEn: null,
    logoUrl: null,
    priority: 0,
    weight: 0,
    rowVersion: `row-version-${node.id}`,
    arabicUserMessage: null,
    englishUserMessage: null,
    isClientInputRequired: false,
    hasReservation: false,
    rangePrefix: 'S',
    rangeStartNumber: 1,
    rangeEndNumber: 999,
    waitingDuration: 0,
    noOfTicketCopies: 1,
  };
}

function pendingRequestsPage(
  pageSize: number,
  totalItems: number,
  requestId: number | null,
): PagedServiceGlobalizationRequestsResponse {
  return {
    currentPage: 1,
    pageSize,
    totalItems,
    data:
      requestId === null
        ? []
        : [
            {
              requestId,
              requestType: 'BranchServiceTree',
              status: 'Pending',
              branchId: 5,
              branchArabicName: 'الفرع الرئيسي',
              branchEnglishName: 'Main Branch',
              rootServiceId: 100,
              rootServiceArabicName: 'الخدمة',
              rootServiceEnglishName: 'Service',
              parentServiceId: null,
              parentServiceArabicName: null,
              parentServiceEnglishName: null,
              servicesCount: 1,
              requestedByApplicationUserId: 'branch-admin',
              requestedOnUtc: '2026-07-14T08:00:00Z',
              reviewedByApplicationUserId: null,
              reviewedOnUtc: null,
              rejectionReason: null,
              rowVersion: `row-version-${requestId}`,
            },
          ],
  };
}
