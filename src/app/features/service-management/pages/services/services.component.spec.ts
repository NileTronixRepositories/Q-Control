import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { BranchServicesApiService } from '../../services/branch/branch-services-api/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/catalog/service-management-permission/service-management-permission.service';
import { ServiceWorkflowApiService } from '../../services/workflow/service-workflow-api/service-workflow-api.service';
import { ServicesComponent } from './services.component';

const emptyPage = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

describe('ServicesComponent', () => {
  let fixture: ComponentFixture<ServicesComponent>;
  let authSessionState: ReturnType<
    typeof signal<{ userType: 'TechnicalAdmin' | 'BranchAdmin'; activeBranchId: number | null }>
  >;
  let permissionState: {
    readonly canViewAll: ReturnType<typeof signal<boolean>>;
    readonly canViewDetails: ReturnType<typeof signal<boolean>>;
    readonly canCreate: ReturnType<typeof signal<boolean>>;
    readonly canUpdate: ReturnType<typeof signal<boolean>>;
    readonly canDelete: ReturnType<typeof signal<boolean>>;
    readonly canRestore: ReturnType<typeof signal<boolean>>;
    readonly canDeletePermanent: ReturnType<typeof signal<boolean>>;
    readonly canAssignBranchServices: ReturnType<typeof signal<boolean>>;
    readonly canCreateBranchServiceTree: ReturnType<typeof signal<boolean>>;
    readonly canViewStartOptions: ReturnType<typeof signal<boolean>>;
  };
  let branchServicesApi: {
    readonly getBranchServicesTree: ReturnType<typeof vi.fn>;
    readonly assignServices: ReturnType<typeof vi.fn>;
    readonly createBranchServiceTree: ReturnType<typeof vi.fn>;
    readonly createBranchServiceSubtree: ReturnType<typeof vi.fn>;
  };
  let api: {
    readonly getServiceTree: ReturnType<typeof vi.fn>;
    readonly getAvailableParents: ReturnType<typeof vi.fn>;
    readonly getServices: ReturnType<typeof vi.fn>;
    readonly resolveMediaUrl: ReturnType<typeof vi.fn>;
    readonly createService: ReturnType<typeof vi.fn>;
    readonly updateService: ReturnType<typeof vi.fn>;
    readonly getServiceDetails: ReturnType<typeof vi.fn>;
    readonly getServiceImages: ReturnType<typeof vi.fn>;
    readonly uploadServiceLogo: ReturnType<typeof vi.fn>;
    readonly uploadServiceIcon: ReturnType<typeof vi.fn>;
    readonly uploadServiceAds: ReturnType<typeof vi.fn>;
    readonly deleteServiceImage: ReturnType<typeof vi.fn>;
    readonly deleteService: ReturnType<typeof vi.fn>;
    readonly restoreService: ReturnType<typeof vi.fn>;
    readonly permanentlyDeleteService: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    api = {
      getServiceTree: vi.fn(() => of([])),
      getAvailableParents: vi.fn(() => of([])),
      getServices: vi.fn(() => of(emptyPage)),
      resolveMediaUrl: vi.fn((value: string | null) => value),
      createService: vi.fn(() => of({ id: 101, rowVersion: 'rv', message: 'Created' })),
      updateService: vi.fn(() => of({ id: 101, rowVersion: 'rv', message: 'Updated' })),
      getServiceDetails: vi.fn(() => of(createServiceDetails())),
      getServiceImages: vi.fn(() => of([])),
      uploadServiceLogo: vi.fn(),
      uploadServiceIcon: vi.fn(),
      uploadServiceAds: vi.fn(),
      deleteServiceImage: vi.fn(),
      deleteService: vi.fn(() =>
        of({ serviceId: 101, rowVersion: 'rv-deleted', message: 'Deleted', isDeleted: true }),
      ),
      restoreService: vi.fn(() =>
        of({
          serviceId: 101,
          rowVersion: 'rv-restored',
          message: 'Restored',
          isDeleted: false,
          effectiveIsActive: true,
        }),
      ),
      permanentlyDeleteService: vi.fn(() => of({ serviceId: 101, message: 'Deleted permanently' })),
    };
    authSessionState = signal<{
      userType: 'TechnicalAdmin' | 'BranchAdmin';
      activeBranchId: number | null;
    }>({
      userType: 'TechnicalAdmin',
      activeBranchId: null,
    });
    permissionState = {
      canViewAll: signal(true),
      canViewDetails: signal(true),
      canCreate: signal(true),
      canUpdate: signal(true),
      canDelete: signal(true),
      canRestore: signal(true),
      canDeletePermanent: signal(true),
      canAssignBranchServices: signal(false),
      canCreateBranchServiceTree: signal(false),
      canViewStartOptions: signal(false),
    };
    branchServicesApi = {
      getBranchServicesTree: vi.fn(() => of([])),
      assignServices: vi.fn(() => of({ createdAssignmentsCount: 1, message: 'Assigned' })),
      createBranchServiceTree: vi.fn(() => of(createBranchCreateResponse(201))),
      createBranchServiceSubtree: vi.fn(() => of(createBranchCreateResponse(202, 122))),
    };
    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: authSessionState.asReadonly(),
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
        { provide: ServiceManagementApiService, useValue: api },
        { provide: BranchServicesApiService, useValue: branchServicesApi },
        { provide: ServiceWorkflowApiService, useValue: {} },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewAll: permissionState.canViewAll.asReadonly(),
            canViewDetails: permissionState.canViewDetails.asReadonly(),
            canCreate: permissionState.canCreate.asReadonly(),
            canUpdate: permissionState.canUpdate.asReadonly(),
            canDelete: permissionState.canDelete.asReadonly(),
            canRestore: permissionState.canRestore.asReadonly(),
            canDeletePermanent: permissionState.canDeletePermanent.asReadonly(),
            canAssignBranchServices: permissionState.canAssignBranchServices.asReadonly(),
            canCreateBranchServiceTree: permissionState.canCreateBranchServiceTree.asReadonly(),
            canViewStartOptions: permissionState.canViewStartOptions.asReadonly(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();
  });

  it('uses the shared full-width admin workspace root without stale utility classes', () => {
    const root = fixture.nativeElement.querySelector(
      '.service-management-page',
    ) as HTMLElement | null;

    expect(root).not.toBeNull();
    expect(root?.classList.contains('container-fluid')).toBe(true);
    expect(root?.classList.contains('w-100')).toBe(true);
    expect(root?.className).not.toContain('!');
  });
  it('uses professional Bootstrap columns for the editor and hierarchy tree', () => {
    const workspace = fixture.nativeElement.querySelector('.svc-workspace') as HTMLElement | null;
    const editor = fixture.nativeElement.querySelector('.svc-editor') as HTMLElement | null;
    const tree = fixture.nativeElement.querySelector(
      '.svc-workspace app-service-hierarchy-tree',
    ) as HTMLElement | null;
    const filters = fixture.nativeElement.querySelectorAll('.svc-central-filters .svc-field');

    expect(workspace?.classList.contains('row')).toBe(true);
    expect(editor?.classList.contains('col-xl-7')).toBe(true);
    expect(tree?.classList.contains('col-xl-5')).toBe(true);
    expect(
      Array.from(filters).every((field) => (field as HTMLElement).classList.contains('col-xl-4')),
    ).toBe(true);
  });
  it('loads the hierarchy and parent lookup on initialization', () => {
    expect(api.getServiceTree).toHaveBeenCalledWith(
      expect.objectContaining({ includeInactive: false, includeDeleted: false }),
    );
    expect(api.getAvailableParents).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.svc-primary-btn')).not.toBeNull();
  });

  it('loads the list and applies the selected scope filter', () => {
    fixture.componentInstance.switchTab('list');
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: 'BranchScoped' } });
    fixture.componentInstance.updateScopeFilter(event);

    expect(api.getServices).toHaveBeenCalledTimes(2);
    expect(api.getServices).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: 'BranchScoped', pageNumber: 1 }),
    );
  });

  it('renders the create form with Bootstrap-first section columns and conditional service code', () => {
    fixture.componentInstance.openCreateRoot();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form.svc-form') as HTMLFormElement | null;
    const sections = Array.from(
      fixture.nativeElement.querySelectorAll('.svc-form-section'),
    ) as HTMLElement[];
    const sectionColumns = sections.filter((section) =>
      Array.from(section.classList).some((className) => className.startsWith('col-')),
    );
    const lowerColumns = Array.from(
      fixture.nativeElement.querySelectorAll('form.svc-form > .row > .col-12'),
    ) as HTMLElement[];
    const basicGrid = fixture.nativeElement.querySelector(
      'form.svc-form .row-cols-sm-2',
    ) as HTMLElement | null;
    const arabicName = fixture.nativeElement.querySelector(
      '[formControlName="arabicName"]',
    ) as HTMLElement | null;
    const englishName = fixture.nativeElement.querySelector(
      '[formControlName="englishName"]',
    ) as HTMLElement | null;
    const arabicMessage = fixture.nativeElement.querySelector(
      '[formControlName="arabicUserMessage"]',
    ) as HTMLElement | null;
    const englishMessage = fixture.nativeElement.querySelector(
      '[formControlName="englishUserMessage"]',
    ) as HTMLElement | null;
    const orderingGrid = fixture.nativeElement
      .querySelector('[formControlName="orderNo"]')
      ?.closest('.row') as HTMLElement | null;
    const orderingColumns = Array.from(orderingGrid?.children ?? []) as HTMLElement[];
    const serviceCodeToggle = fixture.nativeElement.querySelector(
      '[formControlName="isServiceCodeRequired"]',
    ) as HTMLInputElement | null;
    const serviceCodeToggleField = serviceCodeToggle?.closest('label') as HTMLElement | null;
    const numberControls = ['orderNo', 'priority', 'weight'].map(
      (controlName) =>
        fixture.nativeElement.querySelector(
          `[formControlName="${controlName}"]`,
        ) as HTMLElement | null,
    );

    expect(form).not.toBeNull();
    expect(arabicName).not.toBeNull();
    expect(englishName).not.toBeNull();
    expect(serviceCodeToggle).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[formControlName="serviceCode"]')).toBeNull();

    serviceCodeToggle?.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.serviceForm.controls.isServiceCodeRequired.value).toBe(true);
    expect(fixture.nativeElement.querySelector('[formControlName="serviceCode"]')).not.toBeNull();
  });
  it('submits null service-code fields by default when creating a service', () => {
    fixture.componentInstance.openCreateRoot();
    fillRequiredServiceFields();

    fixture.componentInstance.saveService();

    expect(api.createService).toHaveBeenCalledWith(
      expect.objectContaining({ serviceCode: null, isServiceCodeRequired: false }),
    );
  });

  it('trims the service code when the toggle is enabled', () => {
    fixture.componentInstance.openCreateRoot();
    fillRequiredServiceFields();
    fixture.componentInstance.serviceForm.controls.isServiceCodeRequired.setValue(true);
    fixture.componentInstance.serviceForm.controls.serviceCode.setValue(' MED-001 ');

    fixture.componentInstance.saveService();

    expect(api.createService).toHaveBeenCalledWith(
      expect.objectContaining({ serviceCode: 'MED-001', isServiceCodeRequired: true }),
    );
  });

  it('clears and submits null when service-code requirement is disabled', () => {
    fixture.componentInstance.openCreateRoot();
    fillRequiredServiceFields();
    fixture.componentInstance.serviceForm.controls.isServiceCodeRequired.setValue(false);
    fixture.componentInstance.serviceForm.controls.serviceCode.setValue('OLD-001');
    fixture.componentInstance.onServiceCodeRequiredChange({
      target: { checked: false },
    } as unknown as Event);

    fixture.componentInstance.saveService();

    expect(fixture.componentInstance.serviceForm.controls.serviceCode.value).toBe('');
    expect(api.createService).toHaveBeenCalledWith(
      expect.objectContaining({ serviceCode: null, isServiceCodeRequired: false }),
    );
  });

  it('keeps the create form open and marks service code on duplicate-code conflict', () => {
    fixture.componentInstance.openCreateRoot();
    fillRequiredServiceFields();
    fixture.componentInstance.serviceForm.controls.isServiceCodeRequired.setValue(true);
    fixture.componentInstance.serviceForm.controls.serviceCode.setValue('MED-001');

    api.createService.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'Services.Create.ServiceCodeAlreadyExists' },
          }),
      ),
    );

    fixture.componentInstance.saveService();
    fixture.detectChanges();

    expect(fixture.componentInstance.store.panelMode()).toBe('create');
    expect(
      fixture.componentInstance.serviceForm.controls.serviceCode.hasError('serviceCodeExists'),
    ).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('already used');
  });

  it('shows the branch assignment editor as a direction-aware side panel when opened', () => {
    recreateAsBranchAdmin([
      createBranchScopedNode({ id: 122, canEditDefinition: true, isDeleted: false }),
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.svc-editor-drawer')).toBeNull();

    fixture.componentInstance.openCreateRoot();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.svc-editor-drawer')).not.toBeNull();
  });

  it('shows CRUD actions only on the assigned branch services tree', () => {
    recreateAsBranchAdmin([
      createBranchScopedNode({ id: 122, canEditDefinition: true, isDeleted: false }),
    ]);
    fixture.detectChanges();

    const trees = fixture.nativeElement.querySelectorAll('app-service-hierarchy-tree');
    expect(trees.length).toBeGreaterThanOrEqual(1);
    const tree = trees[0];
    expect(tree).not.toBeNull();
  });

  it('creates a root BranchScoped service from the assigned tree using the branch tree endpoint', () => {
    recreateAsBranchAdmin([]);
    fixture.detectChanges();

    fixture.componentInstance.openCreateRoot();
    fillRequiredServiceFields();
    fixture.componentInstance.saveService();

    expect(branchServicesApi.createBranchServiceTree).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        root: expect.objectContaining({
          arabicName: 'Arabic Service',
          englishName: 'Service',
          children: [],
        }),
      }),
    );
    expect(api.createService).not.toHaveBeenCalled();
  });

  it('creates a child BranchScoped service from an assigned parent using the branch subtree endpoint', () => {
    const parent = createBranchScopedNode({ id: 122, canEditDefinition: true, isDeleted: false });
    recreateAsBranchAdmin([parent]);
    fixture.detectChanges();

    fixture.componentInstance.openCreateChild(parent);
    fillRequiredServiceFields();
    fixture.componentInstance.saveService();

    expect(branchServicesApi.createBranchServiceSubtree).toHaveBeenCalledWith(
      5,
      122,
      expect.objectContaining({ root: expect.objectContaining({ englishName: 'Service' }) }),
    );
    expect(api.createService).not.toHaveBeenCalled();
  });

  it('loads rowVersion before deleting, restoring, and permanently deleting assigned BranchScoped services', () => {
    const activeNode = createBranchScopedNode({ id: 122, isDeleted: false });
    const deletedNode = createBranchScopedNode({ id: 123, isDeleted: true });
    recreateAsBranchAdmin([activeNode, deletedNode]);

    api.getServiceDetails.mockReturnValueOnce(
      of(
        createServiceDetails({
          id: 122,
          scope: 'BranchScoped',
          ownerBranchId: 5,
          isOwnedByCurrentBranch: true,
          canEditDefinition: true,
          isDeleted: false,
          rowVersion: 'delete-rv',
        }),
      ),
    );
    fixture.componentInstance.requestTreeDelete(activeNode);
    fixture.componentInstance.confirmAction();

    api.getServiceDetails.mockReturnValueOnce(
      of(
        createServiceDetails({
          id: 123,
          scope: 'BranchScoped',
          ownerBranchId: 5,
          isOwnedByCurrentBranch: true,
          canEditDefinition: true,
          isDeleted: true,
          rowVersion: 'restore-rv',
        }),
      ),
    );
    fixture.componentInstance.requestTreeRestore(deletedNode);
    fixture.componentInstance.confirmAction();

    api.getServiceDetails.mockReturnValueOnce(
      of(
        createServiceDetails({
          id: 123,
          scope: 'BranchScoped',
          ownerBranchId: 5,
          isOwnedByCurrentBranch: true,
          canEditDefinition: true,
          isDeleted: true,
          rowVersion: 'permanent-rv',
        }),
      ),
    );
    fixture.componentInstance.requestTreePermanentDelete(deletedNode);
    fixture.componentInstance.confirmAction();

    expect(api.deleteService).toHaveBeenCalledWith(122, 'delete-rv');
    expect(api.restoreService).toHaveBeenCalledWith(123, 'restore-rv');
    expect(api.permanentlyDeleteService).toHaveBeenCalledWith(123, 'permanent-rv');
    expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalled();
  });
  it('renders the service confirm dialog with compact modal classes', () => {
    const details = createServiceDetails({
      id: 122,
      scope: 'BranchScoped',
      ownerBranchId: 5,
      isOwnedByCurrentBranch: true,
      canEditDefinition: true,
      isDeleted: false,
      rowVersion: 'delete-rv',
    });
    api.getServiceDetails.mockReturnValueOnce(of(details));

    fixture.componentInstance.requestDelete(details);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(
      '.svc-dialog-backdrop',
    ) as HTMLElement | null;
    const dialog = fixture.nativeElement.querySelector('.svc-dialog') as HTMLElement | null;
    const header = fixture.nativeElement.querySelector('.svc-dialog-header') as HTMLElement | null;
    const body = fixture.nativeElement.querySelector('.svc-dialog-body') as HTMLElement | null;
    const subject = fixture.nativeElement.querySelector(
      '.svc-dialog-subject',
    ) as HTMLElement | null;
    const cancelButton = Array.from(
      fixture.nativeElement.querySelectorAll('.svc-dialog button'),
    )[1] as HTMLButtonElement;

    expect(backdrop).not.toBeNull();
    expect(backdrop?.classList).not.toContain('bg-opacity-');
    expect(dialog?.classList).toContain('d-grid');
    expect(dialog?.classList).toContain('overflow-hidden');
    expect(header?.classList).toContain('px-3');
    expect(body?.classList).toContain('d-grid');
    expect(subject?.textContent).toContain('Service');

    cancelButton.click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.svc-dialog')).toBeNull();

    api.getServiceDetails.mockReturnValueOnce(of(details));
    fixture.componentInstance.requestDelete(details);
    fixture.detectChanges();
    const confirmButton = fixture.nativeElement.querySelector(
      '.svc-dialog .svc-primary-btn',
    ) as HTMLButtonElement;
    confirmButton.click();

    expect(api.deleteService).toHaveBeenCalledWith(122, 'delete-rv');
  });
  it('allows Branch Admin to edit an editable assigned BranchScoped service from the assignment tree', () => {
    recreateAsBranchAdmin([
      createBranchScopedNode({ id: 122, canEditDefinition: true, isDeleted: false }),
    ]);
    api.getServiceDetails.mockReturnValueOnce(
      of(
        createServiceDetails({
          id: 122,
          scope: 'BranchScoped',
          ownerBranchId: 5,
          ownerBranchEnglishName: 'Current Branch',
          isOwnedByCurrentBranch: true,
          isAssignedToCurrentBranch: true,
          rowVersion: 'branch-rv',
        }),
      ),
    );
    fixture.detectChanges();

    fixture.componentInstance.openEdit(122);
    fixture.detectChanges();

    expect(api.getServiceDetails).toHaveBeenCalledWith(122);
    expect(fixture.componentInstance.store.panelMode()).toBe('edit');
    expect(fixture.nativeElement.textContent).toContain('Ownership Information');
    expect(fixture.nativeElement.querySelector('[formControlName="arabicName"]')).not.toBeNull();
  });

  it('hides Branch Admin edit action when the assigned service is not editable or is deleted', () => {
    recreateAsBranchAdmin([
      createBranchScopedNode({ id: 122, canEditDefinition: false, isDeleted: false }),
      createBranchScopedNode({ id: 123, canEditDefinition: true, isDeleted: true }),
    ]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.svc-branch-assignment-workspace [title="Edit"]'),
    ).toBeNull();
  });

  it('blocks edit when refreshed details are no longer editable', () => {
    recreateAsBranchAdmin([
      createBranchScopedNode({ id: 122, canEditDefinition: true, isDeleted: false }),
    ]);
    api.getServiceDetails.mockReturnValueOnce(
      of(createServiceDetails({ id: 122, canEditDefinition: false })),
    );
    fixture.detectChanges();

    fixture.componentInstance.openEdit(122);
    fixture.detectChanges();

    expect(fixture.componentInstance.store.panelMode()).toBe('closed');
    expect(fixture.nativeElement.textContent).toContain('permission');
  });

  it('updates an editable BranchScoped service with rowVersion and no ownership fields', () => {
    const details = createServiceDetails({
      id: 122,
      scope: 'BranchScoped',
      ownerBranchId: 5,
      ownerBranchEnglishName: 'Current Branch',
      isOwnedByCurrentBranch: true,
      isAssignedToCurrentBranch: true,
      rowVersion: 'branch-rv',
    });
    api.getServiceDetails.mockReturnValueOnce(of(details));
    fixture.componentInstance.openEdit(122);
    fillRequiredServiceFields();
    fixture.componentInstance.serviceForm.controls.arabicName.setValue('Updated Arabic');
    fixture.componentInstance.serviceForm.controls.englishName.setValue('Updated English');

    fixture.componentInstance.saveService();

    expect(api.updateService).toHaveBeenCalledWith(
      122,
      expect.objectContaining({
        rowVersion: 'branch-rv',
        arabicName: 'Updated Arabic',
        englishName: 'Updated English',
      }),
    );
    const request = api.updateService.mock.calls[0][1] as Record<string, unknown>;
    expect(request).not.toHaveProperty('scope');
    expect(request).not.toHaveProperty('ownerBranchId');
    expect(request).not.toHaveProperty('isOwnedByCurrentBranch');
    expect(request).not.toHaveProperty('canEditDefinition');
  });

  it('submits null ticket fields when ticket issuing is disabled during update', () => {
    api.getServiceDetails.mockReturnValueOnce(
      of(createServiceDetails({ id: 122, rowVersion: 'branch-rv' })),
    );
    fixture.componentInstance.openEdit(122);
    fixture.componentInstance.serviceForm.patchValue({
      arabicName: 'Arabic Service',
      englishName: 'Service',
      isTicketIssuable: 'false',
      rangePrefix: 'OLD',
      rangeStartNumber: 10,
      rangeEndNumber: 99,
      waitingDuration: 15,
      noOfTicketCopies: 2,
    });

    fixture.componentInstance.saveService();

    expect(api.updateService).toHaveBeenCalledWith(
      122,
      expect.objectContaining({
        rowVersion: 'branch-rv',
        isTicketIssuable: false,
        rangePrefix: null,
        rangeStartNumber: null,
        rangeEndNumber: null,
        waitingDuration: null,
        noOfTicketCopies: null,
      }),
    );
  });
  it('keeps edit form open and marks Arabic name on duplicate-name conflict', () => {
    api.getServiceDetails.mockReturnValueOnce(
      of(createServiceDetails({ id: 122, rowVersion: 'branch-rv' })),
    );
    api.updateService.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'Services.Update.DuplicateArabicName' },
          }),
      ),
    );
    fixture.componentInstance.openEdit(122);
    fillRequiredServiceFields();

    fixture.componentInstance.saveService();
    fixture.detectChanges();

    expect(fixture.componentInstance.store.panelMode()).toBe('edit');
    expect(
      fixture.componentInstance.serviceForm.controls.arabicName.hasError('duplicateName'),
    ).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Arabic name is already used');
  });

  it('shows a reload action for update concurrency conflicts', () => {
    api.getServiceDetails.mockReturnValueOnce(
      of(createServiceDetails({ id: 122, rowVersion: 'stale-rv' })),
    );
    api.updateService.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'Services.Update.ConcurrencyConflict' },
          }),
      ),
    );
    fixture.componentInstance.openEdit(122);
    fillRequiredServiceFields();

    fixture.componentInstance.saveService();
    fixture.detectChanges();

    const reloadButton = fixture.nativeElement.querySelector(
      '.svc-inline-action-btn',
    ) as HTMLButtonElement | null;
    expect(reloadButton).not.toBeNull();
    api.getServiceDetails.mockReturnValueOnce(
      of(createServiceDetails({ id: 122, rowVersion: 'fresh-rv' })),
    );
    reloadButton?.click();

    expect(api.getServiceDetails).toHaveBeenLastCalledWith(122);
  });
  it('renders grouped service details and the media manager after details load', () => {
    fixture.componentInstance.openView(101);
    fixture.detectChanges();

    const detailsView = fixture.nativeElement.querySelector(
      '.svc-details-view',
    ) as HTMLElement | null;
    const sections = Array.from(
      fixture.nativeElement.querySelectorAll('.svc-bento-card'),
    ) as HTMLElement[];
    const detailItems = fixture.nativeElement.querySelectorAll('.svc-bento-row');
    const fallbackLogo = fixture.nativeElement.querySelector(
      '.svc-details-logo-empty',
    ) as HTMLElement | null;

    expect(api.getServiceDetails).toHaveBeenCalledWith(101);
    (fixture.nativeElement.querySelectorAll('.svc-details-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(api.getServiceImages).toHaveBeenCalledWith(101, undefined);
    expect(detailsView).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.svc-details-summary')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.svc-summary-badge').length).toBe(3);
    expect(sections.map((section) => section.dataset['section'])).toEqual([
      'basic',
      'behavior',
      'numbers',
    ]);
    expect(detailItems.length).toBe(16);
    expect(fallbackLogo).not.toBeNull();
    expect(fixture.nativeElement.querySelector('app-service-media-manager')).not.toBeNull();
  });

  it('renders the service logo when available and keeps media read-only without update access', () => {
    permissionState.canUpdate.set(false);
    api.getServiceDetails.mockReturnValueOnce(
      of(createServiceDetails({ logoUrl: '/Media/Services/101/Logo/logo.webp' })),
    );

    fixture.componentInstance.openView(101);
    fixture.detectChanges();

    (fixture.nativeElement.querySelectorAll('.svc-details-tab')[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    const logo = fixture.nativeElement.querySelector(
      'img.svc-details-logo',
    ) as HTMLImageElement | null;
    const media = fixture.nativeElement.querySelector('.service-media') as HTMLElement | null;

    expect(logo?.getAttribute('src')).toBe('/Media/Services/101/Logo/logo.webp');
    expect(fixture.nativeElement.querySelector('.svc-details-logo-empty')).toBeNull();
    expect(media?.classList).toContain('is-read-only');
    expect(media?.querySelectorAll('input[type="file"]').length).toBe(0);
  });

  it('presents deleted and operationally disabled services with danger states', () => {
    api.getServiceDetails.mockReturnValueOnce(
      of(
        createServiceDetails({
          isActive: false,
          effectiveIsActive: false,
          isDeleted: true,
          canEditDefinition: false,
        }),
      ),
    );

    fixture.componentInstance.openView(101);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.svc-summary-badge.status-deleted')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.svc-detail-state.is-negative').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.svc-note-danger')).not.toBeNull();
  });

  function recreateAsBranchAdmin(
    nodes: readonly ReturnType<typeof createBranchScopedNode>[],
  ): void {
    fixture.destroy();
    authSessionState.set({ userType: 'BranchAdmin', activeBranchId: 5 });
    permissionState.canViewAll.set(false);
    permissionState.canCreate.set(false);
    permissionState.canAssignBranchServices.set(true);
    permissionState.canUpdate.set(true);
    permissionState.canDelete.set(true);
    permissionState.canRestore.set(true);
    permissionState.canDeletePermanent.set(true);
    permissionState.canCreateBranchServiceTree.set(true);
    branchServicesApi.getBranchServicesTree.mockReturnValue(of(nodes));
    fixture = TestBed.createComponent(ServicesComponent);
  }

  function createBranchScopedNode(overrides = {}) {
    return {
      id: 122,
      parentServiceId: null,
      scope: 'BranchScoped' as const,
      ownerBranchId: 5,
      ownerBranchArabicName:
        'Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¾Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�±Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¹ Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�­Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�§Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¾Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¬Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¦Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¾Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¾Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¦Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a� ',
      ownerBranchEnglishName: 'Current Branch',
      isOwnedByCurrentBranch: true,
      isAssignedToCurrentBranch: true,
      canEditDefinition: true,
      arabicName:
        'Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�®Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¯Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¾Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¬Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¦Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�© Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¾Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�±Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a� Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò��¢Ò¢â�a¬�&¾Ò�a�¢Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��šÒ�a�¹Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò�a�¦Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò¢â�a¬�&�SÒ�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò¢â�a¬� Ò��¢Ò¢â��š�¬Ò¢â��ž�¢Ò�� �"Ò⬠â����Ò�â��šÒ�a�¢Ò�� �"Ò�a�¢Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�â��šÒ�a�¬Ò�� �"Ò¢â�a¬�¦Ò�â��šÒ�a�¡Ò�� �"Ò⬠â����Ò�â�� Ò¢â�a¬â�~¢Ò�� �"Ò�a�¢Ò��¢Ò¢â�a¬�&¡Ò�a�¬Ò�â��¦Ò�a�¡Ò�� �"Ò⬠â����Ò��¢Ò¢â��š�¬Ò⬦�¡Ò�� �"Ò¢â�a¬�&¡Ò�â��šÒ�a�¹',
      englishName: 'Branch Service',
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
      ...overrides,
    };
  }

  function fillRequiredServiceFields(): void {
    fixture.componentInstance.serviceForm.patchValue({
      arabicName: 'Arabic Service',
      englishName: 'Service',
      isTicketIssuable: 'true',
      rangePrefix: 'S',
    });
  }
  function createBranchCreateResponse(id: number, parentServiceId: number | null = null) {
    return {
      branchId: 5,
      scope: 'BranchScoped' as const,
      ownerBranchId: 5,
      createdServicesCount: 1,
      createdAssignmentsCount: 1,
      parentServiceId,
      globalizationRequest: null,
      message: 'Created',
      root: {
        id,
        parentServiceId,
        arabicName: 'Arabic Service',
        englishName: 'Service',
        scope: 'BranchScoped' as const,
        ownerBranchId: 5,
        serviceCode: null,
        isServiceCodeRequired: false,
        isTicketIssuable: true,
        children: [],
      },
    };
  }

  function createServiceDetails(overrides = {}) {
    return {
      id: 101,
      parentServiceId: null,
      scope: 'Global' as const,
      ownerBranchId: null,
      ownerBranchArabicName: null,
      ownerBranchEnglishName: null,
      isOwnedByCurrentBranch: false,
      isAssignedToCurrentBranch: null,
      canEditDefinition: true,
      arabicName: 'Arabic Service',
      englishName: 'Service',
      parentServiceNameAr: null,
      parentServiceNameEn: null,
      logoUrl: null,
      serviceCode: null,
      isServiceCodeRequired: false,
      isActive: true,
      effectiveIsActive: true,
      isTicketIssuable: true,
      hasChildren: false,
      canIssueTicket: true,
      isDeleted: false,
      orderNo: 0,
      priority: 0,
      weight: 0,
      rowVersion: 'rv',
      arabicUserMessage: null,
      englishUserMessage: null,
      isClientInputRequired: false,
      hasReservation: false,
      rangePrefix: 'S',
      rangeStartNumber: 1,
      rangeEndNumber: 999,
      waitingDuration: 0,
      noOfTicketCopies: 1,
      ...overrides,
    };
  }
});
