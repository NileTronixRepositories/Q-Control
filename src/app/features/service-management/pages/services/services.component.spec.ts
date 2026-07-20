import { HttpErrorResponse } from '@angular/common/http';
import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceWorkflowApiService } from '../../services/service-workflow-api.service';
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
    readonly permanentlyDeleteService: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
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
      permanentlyDeleteService: vi.fn(() => of({ serviceId: 101, message: 'Deleted permanently' })),
    };

    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: computed(() => ({
              userType: 'TechnicalAdmin' as const,
              activeBranchId: null,
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
        { provide: ServiceManagementApiService, useValue: api },
        { provide: BranchServicesApiService, useValue: {} },
        { provide: ServiceWorkflowApiService, useValue: {} },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewAll: signal(true).asReadonly(),
            canViewDetails: signal(true).asReadonly(),
            canCreate: signal(true).asReadonly(),
            canUpdate: signal(true).asReadonly(),
            canDelete: signal(true).asReadonly(),
            canRestore: signal(true).asReadonly(),
            canDeletePermanent: signal(true).asReadonly(),
            canAssignBranchServices: signal(false).asReadonly(),
            canViewStartOptions: signal(false).asReadonly(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();
  });

  it('uses the shared full-width admin workspace root without stale utility classes', () => {
    const root = fixture.nativeElement.querySelector('.service-management-page') as HTMLElement | null;

    expect(root).not.toBeNull();
    expect(root?.classList.contains('container-fluid')).toBe(true);
    expect(root?.classList.contains('w-100')).toBe(true);
    expect(root?.className).not.toContain('!');
  });
  it('uses professional Bootstrap columns for the editor and hierarchy tree', () => {
    const workspace = fixture.nativeElement.querySelector('.svc-workspace') as HTMLElement | null;
    const editor = fixture.nativeElement.querySelector('.svc-editor') as HTMLElement | null;
    const tree = fixture.nativeElement.querySelector('.svc-workspace app-service-hierarchy-tree') as HTMLElement | null;
    const filters = fixture.nativeElement.querySelectorAll('.svc-central-filters .svc-field');

    expect(workspace?.classList.contains('row')).toBe(true);
    expect(editor?.classList.contains('col-xl-5')).toBe(true);
    expect(tree?.classList.contains('col-xl-7')).toBe(true);
    expect(Array.from(filters).every((field) => (field as HTMLElement).classList.contains('col-xl-4'))).toBe(true);
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
    fixture.componentInstance.onServiceCodeRequiredChange({ target: { checked: false } } as unknown as Event);

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
    expect(fixture.componentInstance.serviceForm.controls.serviceCode.hasError('serviceCodeExists')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('already used');
  });


  it('renders the service media manager after service details load', () => {
    fixture.componentInstance.openView(101);
    fixture.detectChanges();

    expect(api.getServiceDetails).toHaveBeenCalledWith(101);
    expect(api.getServiceImages).toHaveBeenCalledWith(101, undefined);
    expect(fixture.nativeElement.querySelector('app-service-media-manager')).not.toBeNull();
  });
  function fillRequiredServiceFields(): void {
    fixture.componentInstance.serviceForm.patchValue({
      arabicName: 'Arabic Service',
      englishName: 'Service',
      isTicketIssuable: 'true',
      rangePrefix: 'S',
    });
  }
function createServiceDetails() {
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
  };
  }
});


