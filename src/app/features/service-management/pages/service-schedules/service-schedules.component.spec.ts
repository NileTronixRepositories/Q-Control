import { HttpErrorResponse } from '@angular/common/http';
import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, ParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthenticatedSession } from '../../../auth/models/login-credentials.model';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { ServiceTreeNode } from '../../models/service-management.model';
import { ServiceSchedule } from '../../models/service-schedule.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceScheduleApiService } from '../../services/service-schedule-api.service';
import { ServiceSchedulesComponent } from './service-schedules.component';

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
  arabicName: '????? ?????',
  englishName: 'Issue Certificate',
  isActive: true,
  effectiveIsActive: true,
  isTicketIssuable: true,
  hasChildren: false,
  canIssueTicket: true,
  isDeleted: false,
  orderNo: 1,
  children: [],
};

const parentService: ServiceTreeNode = {
  ...eligibleLeaf,
  id: 5,
  parentServiceId: null,
  arabicName: '??????',
  englishName: 'Certificates',
  isTicketIssuable: false,
  hasChildren: true,
  canIssueTicket: false,
  children: [eligibleLeaf],
};

const alternateLeaf: ServiceTreeNode = {
  ...eligibleLeaf,
  id: 26,
  parentServiceId: 6,
  englishName: 'Renew License',
};

const alternateParent: ServiceTreeNode = {
  ...parentService,
  id: 6,
  englishName: 'Licenses',
  children: [alternateLeaf],
};

const ineligibleLeaf: ServiceTreeNode = {
  ...eligibleLeaf,
  id: 30,
  parentServiceId: null,
  englishName: 'Inactive Service',
  isActive: false,
};

const savedSchedule = createSchedule();

describe('ServiceSchedulesComponent', () => {
  let fixture: ComponentFixture<ServiceSchedulesComponent>;
  let currentSession: WritableSignal<AuthenticatedSession | null>;
  let scheduleApi: {
    readonly getSchedule: ReturnType<typeof vi.fn>;
    readonly createSchedule: ReturnType<typeof vi.fn>;
    readonly updateSchedule: ReturnType<typeof vi.fn>;
  };
  let canCreate: WritableSignal<boolean>;
  let canUpdate: WritableSignal<boolean>;
  let branchServicesApi: { readonly getBranchServicesTree: ReturnType<typeof vi.fn> };
  let authSession: {
    readonly currentSession: ReturnType<WritableSignal<AuthenticatedSession | null>['asReadonly']>;
    readonly shouldClearSessionForHttpStatus: ReturnType<typeof vi.fn>;
    readonly clearSession: ReturnType<typeof vi.fn>;
  };
  let router: { readonly navigateByUrl: ReturnType<typeof vi.fn> };
  let activatedRoute: { snapshot: { paramMap: ParamMap } };

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
    canCreate = signal(true);
    canUpdate = signal(true);
    scheduleApi = {
      getSchedule: vi.fn(() => of(savedSchedule)),
      createSchedule: vi.fn(() => of(createSchedule({ scheduleId: 2, rowVersion: 'created' }))),
      updateSchedule: vi.fn(() => of(createSchedule({ rowVersion: 'updated' }))),
    };
    authSession = {
      currentSession: currentSession.asReadonly(),
      shouldClearSessionForHttpStatus: vi.fn(() => false),
      clearSession: vi.fn(),
    };
    branchServicesApi = {
      getBranchServicesTree: vi.fn(() => of([eligibleLeaf])),
    };
    router = { navigateByUrl: vi.fn() };
    activatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({ branchId: '10', leafServiceId: '25' }),
      },
    };

    await TestBed.configureTestingModule({
      imports: [ServiceSchedulesComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: activatedRoute,
        },
        { provide: Router, useValue: router },
        { provide: AuthSessionService, useValue: authSession },
        {
          provide: TechnicalAdminI18nStore,
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
                currentPage: 1,
                pageSize: 100,
                totalPages: 1,
                totalItems: 1,
                hasPreviousPage: false,
                hasNextPage: false,
                data: [
                  {
                    branchId: 10,
                    arabicName: '?????',
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
        { provide: ServiceScheduleApiService, useValue: scheduleApi },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewSchedules: signal(true).asReadonly(),
            canCreateSchedule: canCreate.asReadonly(),
            canUpdateSchedule: canUpdate.asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceSchedulesComponent);
    fixture.detectChanges();
  });

  it('loads and renders the schedule for the route branch service', () => {
    expect(scheduleApi.getSchedule).toHaveBeenCalledWith(10, 25);
    expect(fixture.nativeElement.textContent).toContain('Issue Certificate');
    expect(fixture.nativeElement.textContent).toContain('08:00');
    expect(fixture.nativeElement.textContent).toContain('Operational');
  });
  it('renders branch selection from the generic schedules route without loading a schedule', () => {
    recreateGenericRoute([parentService]);

    expect(scheduleApi.getSchedule).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Select a branch');
  });

  it('renders the first service dropdown after selecting a branch', () => {
    recreateGenericRoute([parentService]);

    selectDropdown(0, '10');

    expect(branchServicesApi.getBranchServicesTree).toHaveBeenCalledWith(10, {
      includeInactive: false,
      includeDeleted: false,
    });
    expect(fixture.nativeElement.textContent).toContain('Certificates');
    expect(scheduleApi.getSchedule).not.toHaveBeenCalled();
  });

  it('reveals child dropdowns and loads the schedule when an eligible leaf is selected', () => {
    recreateGenericRoute([parentService]);

    selectDropdown(0, '10');
    selectDropdown(1, '5');

    expect(fixture.nativeElement.textContent).toContain('Issue Certificate');
    expect(scheduleApi.getSchedule).not.toHaveBeenCalled();

    selectDropdown(2, '25');

    expect(scheduleApi.getSchedule).toHaveBeenCalledWith(10, 25);
    expect(fixture.nativeElement.textContent).toContain('08:00');
  });

  it('clears the active schedule when changing a higher service level', () => {
    recreateGenericRoute([parentService, alternateParent]);

    selectDropdown(0, '10');
    selectDropdown(1, '5');
    selectDropdown(2, '25');
    expect(scheduleApi.getSchedule).toHaveBeenCalledTimes(1);

    selectDropdown(1, '6');

    expect(scheduleApi.getSchedule).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).not.toContain('08:00');
    expect(fixture.nativeElement.textContent).toContain('Renew License');
  });

  it('does not render ineligible leaves as schedule targets', () => {
    recreateGenericRoute([ineligibleLeaf]);

    selectDropdown(0, '10');

    expect(fixture.nativeElement.textContent).not.toContain('Inactive Service');
    expect(scheduleApi.getSchedule).not.toHaveBeenCalled();
  });

  it('creates a schedule from the not-configured state without sending a rowVersion', () => {
    recreateWithScheduleNotFound();

    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.openCreate();
    component.scheduleForm.setValue({
      startTime: '09:00',
      endTime: '17:00',
      workDays: ['Sunday', 'Monday'],
      isSlotCodeRequired: true,
      slotCode: 'A1',
    });
    component.submit();

    expect(scheduleApi.createSchedule).toHaveBeenCalledWith(10, 25, {
      startTime: '09:00:00',
      endTime: '17:00:00',
      workDays: ['Sunday', 'Monday'],
      isSlotCodeRequired: true,
      slotCode: 'A1',
    });
    expect(scheduleApi.createSchedule.mock.calls[0][2]).not.toHaveProperty('rowVersion');
  });

  it('updates a schedule with the latest rowVersion', () => {
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.openEdit();
    component.scheduleForm.patchValue({ startTime: '10:00', endTime: '16:00' });
    component.submit();

    expect(scheduleApi.updateSchedule).toHaveBeenCalledWith(
      10,
      25,
      expect.objectContaining({
        startTime: '10:00:00',
        endTime: '16:00:00',
        rowVersion: 'v1',
      }),
    );
    expect(component.schedule()?.rowVersion).toBe('updated');
  });

  it('requires slot code only when the option is enabled', () => {
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.openEdit();
    component.scheduleForm.setValue({
      startTime: '08:00',
      endTime: '15:00',
      workDays: ['Sunday'],
      isSlotCodeRequired: true,
      slotCode: '',
    });
    component.submit();

    expect(scheduleApi.updateSchedule).not.toHaveBeenCalled();
    expect(component.scheduleForm.controls.slotCode.hasError('slotCodeRequired')).toBe(true);
  });

  it('keeps an unavailable schedule visible and blocks editing', () => {
    recreateWithSchedule(createSchedule({ isCurrentlyOperational: false }));

    const editButton = fixture.nativeElement.querySelector(
      '.schedule-hero-actions .primary-action',
    ) as HTMLButtonElement | null;

    expect(fixture.nativeElement.textContent).toContain('Currently Unavailable');
    expect(fixture.nativeElement.textContent).toContain('Saving is disabled');
    expect(editButton?.disabled).toBe(true);
  });

  it('binds SlotCodeAlreadyExists to the slot code field', () => {
    scheduleApi.updateSchedule.mockReturnValueOnce(
      throwError(() =>
        new HttpErrorResponse({
          status: 409,
          error: { code: 'SlotCodeAlreadyExists' },
        }),
      ),
    );
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.openEdit();
    component.scheduleForm.setValue({
      startTime: '08:00',
      endTime: '15:00',
      workDays: ['Sunday'],
      isSlotCodeRequired: true,
      slotCode: 'A1',
    });
    component.submit();

    expect(scheduleApi.updateSchedule).toHaveBeenCalled();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('already used');
  });

  it('requires manual reload after a concurrency conflict', () => {
    scheduleApi.updateSchedule.mockReturnValueOnce(
      throwError(() =>
        new HttpErrorResponse({
          status: 409,
          error: { code: 'ConcurrencyConflict' },
        }),
      ),
    );
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.openEdit();
    component.scheduleForm.patchValue({ endTime: '18:00' });
    component.submit();
    fixture.detectChanges();

    expect(component.reloadRequired()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Reload latest');
  });

  it('clears the auth session on unauthorized errors', () => {
    authSession.shouldClearSessionForHttpStatus.mockReturnValueOnce(true);
    recreateWithScheduleError(new HttpErrorResponse({ status: 401, error: { code: 'Unauthorized' } }));

    expect(authSession.clearSession).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  function recreateGenericRoute(tree: readonly ServiceTreeNode[]): void {
    fixture.destroy();
    activatedRoute.snapshot.paramMap = convertToParamMap({});
    branchServicesApi.getBranchServicesTree.mockReturnValue(of(tree));
    scheduleApi.getSchedule.mockClear();
    fixture = TestBed.createComponent(ServiceSchedulesComponent);
    fixture.detectChanges();
  }

  function selectDropdown(index: number, value: string): void {
    const selects = Array.from(
      fixture.nativeElement.querySelectorAll('select'),
    ) as HTMLSelectElement[];
    const select = selects[index];

    if (!select) {
      throw new Error('Expected select at index ' + index + '.');
    }

    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function recreateWithSchedule(schedule: ServiceSchedule): void {
    fixture.destroy();
    scheduleApi.getSchedule.mockReturnValue(of(schedule));
    fixture = TestBed.createComponent(ServiceSchedulesComponent);
    fixture.detectChanges();
  }

  function recreateWithScheduleNotFound(): void {
    recreateWithScheduleError(
      new HttpErrorResponse({
        status: 404,
        error: { code: 'ServiceSchedules.Get.ScheduleNotFound' },
      }),
    );
  }

  function recreateWithScheduleError(error: HttpErrorResponse): void {
    fixture.destroy();
    scheduleApi.getSchedule.mockReturnValue(throwError(() => error));
    fixture = TestBed.createComponent(ServiceSchedulesComponent);
    fixture.detectChanges();
  }
});

interface TestScheduleComponent {
  readonly scheduleForm: ServiceSchedulesComponent['scheduleForm'];
  readonly schedule: ServiceSchedulesComponent['schedule'];
  readonly reloadRequired: ServiceSchedulesComponent['reloadRequired'];
  openCreate(): void;
  openEdit(): void;
  submit(): void;
}

function createSchedule(overrides: Partial<ServiceSchedule> = {}): ServiceSchedule {
  return {
    scheduleId: 1,
    branchId: 10,
    serviceId: 25,
    startTime: '08:00:00',
    endTime: '15:00:00',
    workDays: ['Sunday', 'Monday'],
    isSlotCodeRequired: false,
    slotCode: null,
    isCurrentlyOperational: true,
    rowVersion: 'v1',
    createdByApplicationUserId: 'creator',
    createdOnUtc: '2026-07-16T08:00:00Z',
    lastModifiedByApplicationUserId: null,
    lastModifiedOnUtc: null,
    message: null,
    ...overrides,
  };
}

