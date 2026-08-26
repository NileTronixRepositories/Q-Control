import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AuthenticatedSession } from '../../../auth/models/login-credentials/login-credentials.model';
import { BranchManagementApiService } from '@features/branch-management/public-api';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { ServiceTreeNode } from '../../models/service-management/service-management.model';
import { ServiceWorkflowListItem, WorkflowCandidateService } from '../../models/service-workflow/service-workflow.model';
import { BranchServicesApiService } from '../../services/branch/branch-services-api/branch-services-api.service';
import { ServiceManagementPermissionService } from '../../services/catalog/service-management-permission/service-management-permission.service';
import { ServiceWorkflowApiService } from '../../services/workflow/service-workflow-api/service-workflow-api.service';
import { ServiceWorkflowsComponent } from './service-workflows.component';

const emptyPage = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

const eligibleLeaf: ServiceTreeNode = {
  id: 25,
  parentServiceId: 5,
  scope: 'Global',
  ownerBranchId: null,
  ownerBranchArabicName: null,
  ownerBranchEnglishName: null,
  isOwnedByCurrentBranch: false,
  isAssignedToCurrentBranch: true,
  canEditDefinition: false,
  arabicName: 'إصدار شهادة',
  englishName: 'Issue Certificate',
  serviceCode: null,
  isServiceCodeRequired: false,
  isActive: true,
  effectiveIsActive: true,
  isTicketIssuable: true,
  hasChildren: false,
  canIssueTicket: true,
  isDeleted: false,
  orderNo: 1,
  children: [],
};

describe('ServiceWorkflowsComponent', () => {
  let fixture: ComponentFixture<ServiceWorkflowsComponent>;
  let currentSession: WritableSignal<AuthenticatedSession | null>;
  let branchServicesApi: { readonly getBranchServicesTree: ReturnType<typeof vi.fn> };
  let workflowApi: {
    readonly getWorkflows: ReturnType<typeof vi.fn>;
    readonly getCandidateServices: ReturnType<typeof vi.fn>;
    readonly getWorkflowStartOptions: ReturnType<typeof vi.fn>;
    readonly getWorkflowDetails: ReturnType<typeof vi.fn>;
    readonly setDefaultWorkflow: ReturnType<typeof vi.fn>;
    readonly deactivateWorkflow: ReturnType<typeof vi.fn>;
    readonly reactivateWorkflow: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    currentSession = signal<AuthenticatedSession | null>({
      token: 'token',
      userType: 'TechnicalAdmin',
      requiresBranchSelection: false,
      activeBranchId: null,
      branches: [],
      firstLoginFlag: false,
      passwordExpiredFlag: false,
      passwordChangedOnUtc: null,
      passwordExpiresOnUtc: null,
    });
    branchServicesApi = {
      getBranchServicesTree: vi.fn(() => of([eligibleLeaf])),
    };
    workflowApi = {
      getWorkflows: vi.fn(() => of(emptyPage)),
      getCandidateServices: vi.fn(() => of({ ...emptyPage, pageSize: 25 })),
      getWorkflowStartOptions: vi.fn(() =>
        of({
          serviceId: 25,
          branchId: 10,
          leafServiceId: 25,
          hasWorkflows: false,
          defaultWorkflowId: null,
          mode: 'NoWorkflow' as const,
          requiresWorkflowSelection: false,
          autoApplyWorkflowId: null,
          workflows: [],
        }),
      ),
      getWorkflowDetails: vi.fn(),
      setDefaultWorkflow: vi.fn(),
      deactivateWorkflow: vi.fn(),
      reactivateWorkflow: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ServiceWorkflowsComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ branchId: '10', leafServiceId: '25' }),
            },
          },
        },
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: currentSession.asReadonly(),
            shouldClearSessionForHttpStatus: () => false,
            clearSession: vi.fn(),
          },
        },
        {
          provide: AdminI18nStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
          },
        },
        {
          provide: BranchManagementApiService,
          useValue: {
            getBranches: vi.fn(() =>
              of({
                ...emptyPage,
                data: [
                  {
                    branchId: 10,
                    arabicName: 'الفرع',
                    englishName: 'Branch',
                    isActive: true,
                  },
                ],
              }),
            ),
          },
        },
        {
          provide: BranchServicesApiService,
          useValue: branchServicesApi,
        },
        { provide: ServiceWorkflowApiService, useValue: workflowApi },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewWorkflows: signal(true).asReadonly(),
            canViewWorkflowDetails: signal(true).asReadonly(),
            canCreateWorkflow: signal(true).asReadonly(),
            canUpdateWorkflow: signal(true).asReadonly(),
            canSetDefaultWorkflow: signal(true).asReadonly(),
            canDeactivateWorkflow: signal(true).asReadonly(),
            canReactivateWorkflow: signal(true).asReadonly(),
            canViewCandidateServices: signal(true).asReadonly(),
            canViewStartOptions: signal(true).asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceWorkflowsComponent);
    fixture.detectChanges();
  });

  it('loads workflows, candidates, and start options with branch and leaf scope', () => {
    expect(workflowApi.getWorkflows).toHaveBeenCalledWith(
      10,
      25,
      expect.objectContaining({ orderSort: 'Newest', pageNumber: 1 }),
    );
    expect(workflowApi.getCandidateServices).toHaveBeenCalledWith(
      10,
      expect.objectContaining({ parentServiceId: null }),
    );
    expect(workflowApi.getWorkflowStartOptions).toHaveBeenCalledWith(10, 25);
    expect(fixture.componentInstance.store.scope()).toEqual(
      expect.objectContaining({ branchId: 10, leafServiceId: 25 }),
    );
  });

  it('rejects a Branch Administrator deep link for another branch before workflow calls', () => {
    fixture.destroy();
    currentSession.set({
      ...currentSession()!,
      userType: 'BranchAdmin',
      activeBranchId: 99,
      branches: [
        {
          branchId: 99,
          arabicName: 'الفرع النشط',
          englishName: 'Active Branch',
          isActive: true,
        },
      ],
    });
    branchServicesApi.getBranchServicesTree.mockClear();
    workflowApi.getWorkflows.mockClear();

    fixture = TestBed.createComponent(ServiceWorkflowsComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.scopeError()).toBe(
      fixture.componentInstance.translations().invalidWorkflowScope,
    );
    expect(branchServicesApi.getBranchServicesTree).not.toHaveBeenCalled();
    expect(workflowApi.getWorkflows).not.toHaveBeenCalled();
  });

  it('opens the create panel directly from an eligible tree service without route navigation', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');
    workflowApi.getWorkflows.mockClear();
    workflowApi.getCandidateServices.mockClear();
    workflowApi.getWorkflowStartOptions.mockClear();

    fixture.componentInstance.openNodeWorkflows(eligibleLeaf);
    fixture.componentInstance.openCreate();

    expect(navigateSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.store.panelMode()).toBe('create');
    expect(fixture.componentInstance.store.scope()).toEqual(
      expect.objectContaining({ branchId: 10, leafServiceId: 25 }),
    );
    expect(workflowApi.getWorkflows).toHaveBeenCalledWith(10, 25, expect.any(Object));
    expect(workflowApi.getCandidateServices).toHaveBeenCalledWith(10, expect.any(Object));
    expect(workflowApi.getWorkflowStartOptions).toHaveBeenCalledWith(10, 25);
  });
  it('reloads only the scoped workflow list when the active filter changes', () => {
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: 'false' } });
    fixture.componentInstance.updateStatusFilter(event);

    expect(workflowApi.getWorkflows).toHaveBeenLastCalledWith(
      10,
      25,
      expect.objectContaining({ isActive: false, pageNumber: 1 }),
    );
  });

  it('accepts repeated candidate services and normalizes order after moving', () => {
    const candidate = {
      serviceId: 25,
      parentServiceId: 5,
      parentArabicName: 'الخدمات',
      parentEnglishName: 'Services',
      arabicName: 'إصدار شهادة',
      englishName: 'Issue Certificate',
      serviceCode: null,
      isActive: true,
      isDeleted: false,
      effectiveIsActive: true,
      isTicketIssuable: true,
    };

    fixture.componentInstance.openCreate();
    fixture.componentInstance.selectCandidate(candidate);
    fixture.componentInstance.selectCandidate(candidate);

    expect(fixture.componentInstance.builderSteps().map((step) => step.service.serviceId)).toEqual([
      25,
      25,
    ]);
  });

  it('adds a dragged candidate service to the workflow builder', () => {
    const candidate = createCandidate({ serviceId: 30, englishName: 'Cardiology' });
    fixture.componentInstance.store.candidates.set({
      ...emptyPage,
      pageSize: 25,
      totalItems: 1,
      data: [candidate],
    });
    fixture.componentInstance.openCreate();

    const event = createWorkflowDragEvent();
    fixture.componentInstance.startCandidateDrag(candidate, event);
    fixture.componentInstance.dropWorkflowItem(event);

    expect(fixture.componentInstance.builderSteps().map((step) => step.service.serviceId)).toEqual([
      30,
    ]);
  });


  it('resets candidate pagination and trims search changes', () => {
    fixture.componentInstance.store.updateCandidateQuery({ pageNumber: 3, searchText: 'old' });
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: { value: '  certificate  ' } });

    fixture.componentInstance.updateCandidateSearch(event);

    expect(fixture.componentInstance.store.candidateQuery()).toEqual(
      expect.objectContaining({ searchText: 'certificate', pageNumber: 1 }),
    );
  });

  it('shows candidate service code badges only when a code exists', () => {
    fixture.componentInstance.store.candidates.set({
      ...emptyPage,
      pageSize: 25,
      totalItems: 2,
      data: [
        createCandidate({ serviceId: 30, englishName: 'Certificate', serviceCode: ' CERT-001 ' }),
        createCandidate({ serviceId: 31, englishName: 'No Code', serviceCode: null }),
      ],
    });
    fixture.componentInstance.openCreate();
    fixture.detectChanges();

    const badges = fixture.nativeElement.querySelectorAll(
      '.workflow-candidate-code',
    ) as NodeListOf<HTMLElement>;

    expect(badges.length).toBe(1);
    expect(badges[0].textContent?.trim()).toBe('CERT-001');
  });
  it('reorders existing workflow steps with drag and drop', () => {
    const first = createCandidate({ serviceId: 31, englishName: 'First' });
    const second = createCandidate({ serviceId: 32, englishName: 'Second' });
    const third = createCandidate({ serviceId: 33, englishName: 'Third' });
    fixture.componentInstance.openCreate();
    fixture.componentInstance.selectCandidate(first);
    fixture.componentInstance.selectCandidate(second);
    fixture.componentInstance.selectCandidate(third);

    const firstUid = fixture.componentInstance.builderSteps()[0].uid;
    const event = createWorkflowDragEvent();
    fixture.componentInstance.startStepDrag(firstUid, event);
    fixture.componentInstance.dropWorkflowItem(event, 3);

    expect(fixture.componentInstance.builderSteps().map((step) => step.service.serviceId)).toEqual([
      32,
      33,
      31,
    ]);
  });
  it('does not open a deactivate confirmation for the default workflow', () => {
    fixture.componentInstance.requestDeactivate(createWorkflow({ isDefault: true }));

    expect(fixture.componentInstance.store.confirmState()).toBeNull();
    expect(fixture.componentInstance.store.message()?.text).toBe(
      fixture.componentInstance.translations().defaultCannotDeactivate,
    );
  });

  it('adopts the set-default response locally before the list refresh completes', () => {
    const currentDefault = createWorkflow({ workflowId: 11, isDefault: true });
    const nextDefault = createWorkflow({ workflowId: 12, rowVersion: 'v1' });
    fixture.componentInstance.store.page.set({
      ...emptyPage,
      totalItems: 2,
      data: [currentDefault, nextDefault],
    });
    workflowApi.setDefaultWorkflow.mockReturnValue(
      of({ ...nextDefault, isDefault: true, rowVersion: 'v2', message: 'Updated' }),
    );
    workflowApi.getWorkflows.mockReturnValue(NEVER);

    fixture.componentInstance.requestSetDefault(nextDefault);
    fixture.componentInstance.confirmAction();

    const [previous, selected] = fixture.componentInstance.store.page().data;
    expect(previous.isDefault).toBe(false);
    expect(selected).toEqual(expect.objectContaining({ isDefault: true, rowVersion: 'v2' }));
  });

  it('closes a failed mutation and reloads scoped data after a concurrency conflict', () => {
    workflowApi.deactivateWorkflow.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'ConcurrencyConflict' },
          }),
      ),
    );
    fixture.componentInstance.requestDeactivate(createWorkflow());

    fixture.componentInstance.confirmAction();

    expect(workflowApi.deactivateWorkflow).toHaveBeenCalledTimes(1);
    expect(workflowApi.getWorkflows).toHaveBeenLastCalledWith(10, 25, expect.any(Object));
    expect(workflowApi.getWorkflowStartOptions).toHaveBeenLastCalledWith(10, 25);
    expect(fixture.componentInstance.store.confirmState()).toBeNull();
    expect(fixture.componentInstance.store.message()?.text).toBe(
      fixture.componentInstance.translations().concurrencyError,
    );
  });
});

function createWorkflow(
  overrides: Partial<ServiceWorkflowListItem> = {},
): ServiceWorkflowListItem {
  return {
    workflowId: 11,
    branchId: 10,
    leafServiceId: 25,
    arabicName: 'مسار',
    englishName: 'Workflow',
    isDefault: false,
    startServiceId: 25,
    startServiceArabicName: 'خدمة',
    startServiceEnglishName: 'Service',
    stepsCount: 2,
    isActive: true,
    steps: [],
    rowVersion: 'v1',
    createdOnUtc: null,
    modifiedOnUtc: null,
    ...overrides,
  };
}

function createCandidate(
  overrides: Partial<WorkflowCandidateService> = {},
): WorkflowCandidateService {
  return {
    serviceId: 25,
    parentServiceId: 5,
    parentArabicName: 'Parent',
    parentEnglishName: 'Services',
    arabicName: 'Service',
    englishName: 'Service',
    serviceCode: null,
    isActive: true,
    isDeleted: false,
    effectiveIsActive: true,
    isTicketIssuable: true,
    ...overrides,
  };
}

function createWorkflowDragEvent(): DragEvent {
  const data = new Map<string, string>();

  return {
    dataTransfer: {
      effectAllowed: 'uninitialized',
      dropEffect: 'none',
      setData: vi.fn((type: string, value: string) => data.set(type, value)),
      getData: vi.fn((type: string) => data.get(type) ?? ''),
    },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: null,
    relatedTarget: null,
  } as unknown as DragEvent;
}

