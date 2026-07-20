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
  serviceCode: null,
  isServiceCodeRequired: false,
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
                    branchId: 1,
                    arabicName: '???? ???????',
                    englishName: 'Workflow QA Branch',
                    isActive: true,
                  },
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
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    expect(scheduleApi.getSchedule).toHaveBeenCalledWith(10, 25);
    expect(component.selectedBranchId()).toBe(10);
    expect(component.selectedServicePath()).toEqual([25]);
    expect(fixture.nativeElement.textContent).toContain('Issue Certificate');
    expect(timeInputValues()).toContain('08:00');
    expect(fixture.nativeElement.textContent).toContain('Operational');
  });
  it('renders the single inline weekly editor table with loaded time slots', () => {
    recreateWithSchedule(
      createSchedule({
        days: [
          {
            dayOfWeek: 'Sunday',
            timeSlots: [
              { startTime: '08:00:00', endTime: '10:00:00' },
              { startTime: '10:00:00', endTime: '12:00:00' },
            ],
          },
          { dayOfWeek: 'Monday', timeSlots: [{ startTime: '13:00:00', endTime: '15:00:00' }] },
        ],
      }),
    );

    const rows = fixture.nativeElement.querySelectorAll('.schedule-table tbody tr');
    const tables = fixture.nativeElement.querySelectorAll('.schedule-form .schedule-table');
    const heroMutationActions = fixture.nativeElement.querySelectorAll(
      '.schedule-hero-actions .primary-action',
    );

    expect(tables).toHaveLength(1);
    expect(heroMutationActions).toHaveLength(0);
    expect(rows).toHaveLength(7);
    expect(fixture.nativeElement.textContent).toContain('Sunday');
    expect(timeInputValues()).toEqual(
      expect.arrayContaining(['08:00', '10:00', '12:00', '13:00', '15:00']),
    );
  });

  it('renders editable weekly slots as table rows with closed day rows', () => {
    recreateWithSchedule(
      createSchedule({
        days: [
          {
            dayOfWeek: 'Sunday',
            timeSlots: [
              { startTime: '08:00:00', endTime: '10:00:00' },
              { startTime: '10:00:00', endTime: '12:00:00' },
            ],
          },
        ],
      }),
    );
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.schedule-week-table tbody tr');
    const timeInputs = fixture.nativeElement.querySelectorAll('.schedule-week-table input[type="time"]');
    const addActions = fixture.nativeElement.querySelectorAll('.schedule-actions-cell button[aria-label="Add Schedule"]');
    const misplacedAddActions = fixture.nativeElement.querySelectorAll('.schedule-slots-cell button[aria-label="Add Schedule"]');

    expect(rows).toHaveLength(7);
    expect(timeInputs).toHaveLength(4);
    expect(fixture.nativeElement.textContent).toContain('Closed');
    expect(fixture.nativeElement.textContent).toContain('Add Schedule');
    expect(addActions).toHaveLength(7);
    expect(misplacedAddActions).toHaveLength(0);
  });
  it('renders the final summary strip, single table, and sticky save footer', () => {
    fixture.detectChanges();

    const summary = fixture.nativeElement.querySelector('.schedule-summary-strip') as HTMLElement | null;
    const table = fixture.nativeElement.querySelectorAll('.schedule-week-table');
    const footer = fixture.nativeElement.querySelector('.schedule-sticky-footer') as HTMLElement | null;
    const footerButtons = footer?.querySelectorAll('.schedule-form-action') ?? [];
    const rowFormActions = fixture.nativeElement.querySelectorAll('tbody .schedule-form-action');

    const summaryItems = summary?.querySelectorAll('.summary-item') ?? [];

    expect(summary).not.toBeNull();
    expect(summaryItems[0]?.textContent).toContain('Branch');
    expect(summaryItems[1]?.textContent).toContain('Service');
    expect(summaryItems[1]?.textContent).toContain('Issue Certificate');
    expect(summary?.textContent).toContain('Code');
    expect(summary?.textContent).toContain('Code required');
    expect(summary?.textContent).toContain('Operational');
    expect(table).toHaveLength(1);
    expect(footer).not.toBeNull();
    expect(footer?.textContent).toContain('Cancel');
    expect(footer?.textContent).toContain('Save Changes');
    expect(footerButtons).toHaveLength(2);
    expect(buttonsByText('Cancel', footer ?? fixture.nativeElement)).toHaveLength(1);
    expect(buttonsByText('Save Changes', footer ?? fixture.nativeElement)).toHaveLength(1);
    expect(rowFormActions).toHaveLength(0);
  });
  it('resets dirty inline changes without leaving the page', () => {
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    component.timeSlotGroups(0)[0].controls.startTime.setValue('07:30');
    fixture.detectChanges();

    component.resetInlineChanges();
    fixture.detectChanges();

    expect(component.timeSlotGroups(0)[0].controls.startTime.value).toBe('08:00');
    expect(component.scheduleForm.dirty).toBe(false);
    expect(fixture.nativeElement.querySelectorAll('.schedule-form .schedule-table')).toHaveLength(1);
    confirmSpy.mockRestore();
  });

  it('adds another slot from the editable row action', () => {
    recreateWithSchedule(
      createSchedule({
        days: [{ dayOfWeek: 'Sunday', timeSlots: [{ startTime: '08:00:00', endTime: '10:00:00' }] }],
      }),
    );
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    fixture.detectChanges();
    clickButtonByLabel('Add Schedule');
    fixture.detectChanges();

    expect(component.timeSlotGroups(0)).toHaveLength(2);
  });

  it('opens a closed day from the row add action', () => {
    recreateWithScheduleNotFound();
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    fixture.detectChanges();
    clickButtonByLabel('Add Schedule');
    fixture.detectChanges();

    expect(component.dayGroups()[0].controls.isWorkingDay.value).toBe(true);
    expect(component.timeSlotGroups(0)).toHaveLength(1);
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
    expect(timeInputValues()).toContain('08:00');
  });

  it('keeps selector values synced after updating a manually selected schedule', () => {
    recreateGenericRoute([parentService]);
    selectDropdown(0, '10');
    selectDropdown(1, '5');
    selectDropdown(2, '25');
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.timeSlotGroups(0)[0].controls.endTime.setValue('16:30');
    component.submit();
    fixture.detectChanges();

    expect(component.selectedBranchId()).toBe(10);
    expect(component.selectedServicePath()).toEqual([5, 25]);
    expect(selectValues()).toEqual(['10', '5', '25']);
  });

  it('syncs selector path for a nested branch service tree from the schedule response', () => {
    recreateRouteWithSchedule(
      1,
      122,
      [createNestedServiceTree()],
      createSchedule({ branchId: 1, serviceId: 122 }),
    );
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    expect(scheduleApi.getSchedule).toHaveBeenCalledWith(1, 122);
    expect(component.selectedBranchId()).toBe(1);
    expect(component.selectedServicePath()).toEqual([4, 21, 122]);
  });

  it('keeps nested global service dropdown values visible after manual selection', () => {
    recreateGenericRoute([createNestedServiceTree()]);
    scheduleApi.getSchedule.mockReturnValue(of(createSchedule({ branchId: 1, serviceId: 122 })));

    selectDropdown(0, '1');
    selectDropdown(1, '4');
    selectDropdown(2, '21');
    selectDropdown(3, '122');
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    expect(scheduleApi.getSchedule).toHaveBeenCalledWith(1, 122);
    expect(component.selectedBranchId()).toBe(1);
    expect(component.selectedServicePath()).toEqual([4, 21, 122]);
    expect(selectValues()).toEqual(['1', '4', '21', '122']);
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
    setDaySlot(component, 0, '09:00', '17:00');
    setDaySlot(component, 1, '10:00', '14:00');
    component.scheduleForm.controls.isSlotCodeRequired.setValue(true);
    component.scheduleForm.controls.slotCode.setValue('A1');
    component.submit();

    expect(scheduleApi.createSchedule).toHaveBeenCalledWith(10, 25, {
      days: [
        { dayOfWeek: 'Sunday', timeSlots: [{ startTime: '09:00:00', endTime: '17:00:00' }] },
        { dayOfWeek: 'Monday', timeSlots: [{ startTime: '10:00:00', endTime: '14:00:00' }] },
      ],
      isSlotCodeRequired: true,
      slotCode: 'A1',
    });
    expect(scheduleApi.createSchedule.mock.calls[0][2]).not.toHaveProperty('rowVersion');
  });

  it('updates a schedule with the latest rowVersion', () => {
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    const sundaySlot = component.timeSlotGroups(0)[0];
    sundaySlot.controls.startTime.setValue('10:00');
    sundaySlot.controls.endTime.setValue('16:00');
    component.submit();

    expect(scheduleApi.updateSchedule).toHaveBeenCalledWith(
      10,
      25,
      expect.objectContaining({
        days: expect.arrayContaining([
          { dayOfWeek: 'Sunday', timeSlots: [{ startTime: '10:00:00', endTime: '16:00:00' }] },
        ]),
        rowVersion: 'v1',
      }),
    );
    expect(component.schedule()?.rowVersion).toBe('updated');
  });
  it('normalizes api schedule times to HH:mm when editing', () => {
    recreateWithSchedule(createSchedule({
      days: [{ dayOfWeek: 'Sunday', timeSlots: [{ startTime: '11:24:00', endTime: '17:24:00' }] }],
    }));
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    expect(component.timeSlotGroups(0)[0].controls.startTime.value).toBe('11:24');
    expect(component.timeSlotGroups(0)[0].controls.endTime.value).toBe('17:24');
  });

  it('normalizes AM/PM schedule times to HH:mm when editing', () => {
    recreateWithSchedule(createSchedule({
      days: [{ dayOfWeek: 'Sunday', timeSlots: [{ startTime: '11:24 AM', endTime: '05:24 PM' }] }],
    }));
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    expect(component.timeSlotGroups(0)[0].controls.startTime.value).toBe('11:24');
    expect(component.timeSlotGroups(0)[0].controls.endTime.value).toBe('17:24');
  });

  it('blocks invalid text times before updating the schedule', () => {
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.timeSlotGroups(0)[0].controls.endTime.setValue('05:24 PM');

    component.submit();
    fixture.detectChanges();

    expect(scheduleApi.updateSchedule).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Enter a valid time.');
  });

  it('populates editable days from the current schedule response', () => {
    recreateWithSchedule(
      createSchedule({
        days: [
          { dayOfWeek: 'Sunday', timeSlots: [{ startTime: '08:00:00', endTime: '10:00:00' }] },
          { dayOfWeek: 'Monday', timeSlots: [{ startTime: '10:00:00', endTime: '12:00:00' }] },
          { dayOfWeek: 'Tuesday', timeSlots: [{ startTime: '12:00:00', endTime: '14:00:00' }] },
          { dayOfWeek: 'Wednesday', timeSlots: [{ startTime: '14:00:00', endTime: '16:00:00' }] },
          { dayOfWeek: 'Friday', timeSlots: [{ startTime: '16:00:00', endTime: '18:00:00' }] },
          { dayOfWeek: 'Saturday', timeSlots: [{ startTime: '18:00:00', endTime: '19:00:00' }] },
        ],
      }),
    );
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    expect(component.dayGroups()[1].controls.isWorkingDay.value).toBe(true);
    expect(component.dayGroups()[4].controls.isWorkingDay.value).toBe(false);
    expect(component.timeSlotGroups(1)[0].controls.startTime.value).toBe('10:00');
  });

  it('submits working days from the editable weekly form', () => {
    recreateWithSchedule(createSchedule({
      days: [{ dayOfWeek: 'Sunday', timeSlots: [{ startTime: '08:00:00', endTime: '15:00:00' }] }],
    }));
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    setDaySlot(component, 5, '16:00', '18:00');
    component.submit();

    expect(scheduleApi.updateSchedule).toHaveBeenCalledWith(
      10,
      25,
      expect.objectContaining({
        days: [
          { dayOfWeek: 'Sunday', timeSlots: [{ startTime: '08:00:00', endTime: '15:00:00' }] },
          { dayOfWeek: 'Friday', timeSlots: [{ startTime: '16:00:00', endTime: '18:00:00' }] },
        ],
      }),
    );
  });


  it('initializes create mode with seven closed days', () => {
    recreateWithScheduleNotFound();
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    expect(component.dayGroups()).toHaveLength(7);
    expect(component.dayGroups().every((day) => !day.controls.isWorkingDay.value)).toBe(true);
  });

  it('closes a day when its last time slot is removed', () => {
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    component.removeTimeSlot(0, 0);

    expect(component.dayGroups()[0].controls.isWorkingDay.value).toBe(false);
    expect(component.timeSlotGroups(0)).toHaveLength(0);
  });

  it('blocks submitting an empty weekly schedule', () => {
    recreateWithScheduleNotFound();
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    component.submit();

    expect(scheduleApi.createSchedule).not.toHaveBeenCalled();
    expect(component.scheduleForm.hasError('daysRequired')).toBe(true);
  });

  it('blocks duplicate and overlapping time slots within the same day', () => {
    recreateWithSchedule(createSchedule({
      days: [{ dayOfWeek: 'Sunday', timeSlots: [{ startTime: '03:00:00', endTime: '06:00:00' }] }],
    }));
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    component.addTimeSlot(0);
    component.timeSlotGroups(0)[1].controls.startTime.setValue('03:00');
    component.timeSlotGroups(0)[1].controls.endTime.setValue('06:00');
    component.submit();
    expect(scheduleApi.updateSchedule).not.toHaveBeenCalled();
    expect(component.scheduleForm.hasError('duplicateTimeSlot')).toBe(true);

    component.timeSlotGroups(0)[1].controls.startTime.setValue('05:00');
    component.timeSlotGroups(0)[1].controls.endTime.setValue('09:00');
    component.submit();
    expect(scheduleApi.updateSchedule).not.toHaveBeenCalled();
    expect(component.scheduleForm.hasError('overlappingTimeSlots')).toBe(true);
  });

  it('accepts adjacent time slots and the same range on different days', () => {
    recreateWithSchedule(createSchedule({
      days: [{ dayOfWeek: 'Sunday', timeSlots: [{ startTime: '03:00:00', endTime: '06:00:00' }] }],
    }));
    const component = fixture.componentInstance as unknown as TestScheduleComponent;

    component.addTimeSlot(0);
    component.timeSlotGroups(0)[1].controls.startTime.setValue('06:00');
    component.timeSlotGroups(0)[1].controls.endTime.setValue('09:00');
    setDaySlot(component, 1, '03:00', '06:00');
    component.submit();

    expect(scheduleApi.updateSchedule).toHaveBeenCalledWith(
      10,
      25,
      expect.objectContaining({
        days: [
          {
            dayOfWeek: 'Sunday',
            timeSlots: [
              { startTime: '03:00:00', endTime: '06:00:00' },
              { startTime: '06:00:00', endTime: '09:00:00' },
            ],
          },
          { dayOfWeek: 'Monday', timeSlots: [{ startTime: '03:00:00', endTime: '06:00:00' }] },
        ],
      }),
    );
  });
  it('requires slot code only when the option is enabled', () => {
    const component = fixture.componentInstance as unknown as TestScheduleComponent;
    component.scheduleForm.controls.isSlotCodeRequired.setValue(true);
    component.scheduleForm.controls.slotCode.setValue('');
    component.submit();

    expect(scheduleApi.updateSchedule).not.toHaveBeenCalled();
    expect(component.scheduleForm.controls.slotCode.hasError('slotCodeRequired')).toBe(true);
  });

  it('keeps an unavailable schedule visible and blocks editing', () => {
    recreateWithSchedule(createSchedule({ isCurrentlyOperational: false }));

    const heroMutationActions = fixture.nativeElement.querySelectorAll(
      '.schedule-hero-actions .primary-action',
    );
    const saveButton = buttonsByText('Save Changes')[0];
    const firstTimeInput = fixture.nativeElement.querySelector(
      'input[type="time"]',
    ) as HTMLInputElement | null;

    expect(fixture.nativeElement.textContent).toContain('Currently Unavailable');
    expect(fixture.nativeElement.textContent).toContain('Saving is disabled');
    expect(heroMutationActions).toHaveLength(0);
    expect(saveButton.disabled).toBe(true);
    expect(firstTimeInput?.readOnly).toBe(true);
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
    component.scheduleForm.controls.isSlotCodeRequired.setValue(true);
    component.scheduleForm.controls.slotCode.setValue('A1');
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
    component.timeSlotGroups(0)[0].controls.endTime.setValue('18:00');
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

  function timeInputValues(): readonly string[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll('input[type="time"]'),
    ).map((input) => (input as HTMLInputElement).value);
  }

  function buttonsByText(text: string, root: ParentNode = fixture.nativeElement): HTMLButtonElement[] {
    return Array.from(root.querySelectorAll('button')).filter((button) =>
      (button.textContent ?? '').includes(text),
    ) as HTMLButtonElement[];
  }

  function clickButtonByLabel(label: string): void {
    const button = fixture.nativeElement.querySelector(
      'button[aria-label="' + label + '"]',
    ) as HTMLButtonElement | null;

    if (!button) {
      throw new Error('Expected button with aria-label ' + label + '.');
    }

    button.click();
  }
  function selectDropdown(index: number, value: string): void {
    const select = selectElements()[index];

    if (!select) {
      throw new Error('Expected select at index ' + index + '.');
    }

    select.value = value;
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function selectValues(): readonly string[] {
    return selectElements().map((select) => select.value);
  }

  function selectElements(): HTMLSelectElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('select')) as HTMLSelectElement[];
  }

  function recreateRouteWithSchedule(
    branchId: number,
    leafServiceId: number,
    tree: readonly ServiceTreeNode[],
    schedule: ServiceSchedule,
  ): void {
    fixture.destroy();
    activatedRoute.snapshot.paramMap = convertToParamMap({
      branchId: String(branchId),
      leafServiceId: String(leafServiceId),
    });
    branchServicesApi.getBranchServicesTree.mockReturnValue(of(tree));
    scheduleApi.getSchedule.mockReturnValue(of(schedule));
    scheduleApi.getSchedule.mockClear();
    fixture = TestBed.createComponent(ServiceSchedulesComponent);
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
  readonly selectedBranchId: ServiceSchedulesComponent['selectedBranchId'];
  readonly selectedServicePath: ServiceSchedulesComponent['selectedServicePath'];
  readonly reloadRequired: ServiceSchedulesComponent['reloadRequired'];
  resetInlineChanges(): void;
  submit(): void;
  dayGroups(): ServiceSchedulesComponent['scheduleForm']['controls']['days']['controls'];
  timeSlotGroups(dayIndex: number): ReturnType<TestScheduleComponent['dayGroups']>[number]['controls']['timeSlots']['controls'];
  toggleWorkingDay(dayIndex: number, checked: boolean): void;
  addTimeSlot(dayIndex: number): void;
  removeTimeSlot(dayIndex: number, slotIndex: number): void;
}

function setDaySlot(
  component: TestScheduleComponent,
  dayIndex: number,
  startTime: string,
  endTime: string,
): void {
  if (component.timeSlotGroups(dayIndex).length === 0) {
    component.toggleWorkingDay(dayIndex, true);
  }

  const slot = component.timeSlotGroups(dayIndex)[0];
  slot.controls.startTime.setValue(startTime);
  slot.controls.endTime.setValue(endTime);
}

function createNestedServiceTree(): ServiceTreeNode {
  const nestedLeaf: ServiceTreeNode = {
    ...eligibleLeaf,
    id: 122,
    parentServiceId: 21,
    isAssignedToCurrentBranch: null,
    arabicName: '????? ??????? ??????',
    englishName: 'General Internal Medicine Clinic',
  };
  const middleNode: ServiceTreeNode = {
    ...parentService,
    id: 21,
    parentServiceId: 4,
    isAssignedToCurrentBranch: null,
    arabicName: '??????? ??????',
    englishName: 'Internal Medicine',
    children: [nestedLeaf],
  };

  return {
    ...parentService,
    id: 4,
    parentServiceId: null,
    isAssignedToCurrentBranch: null,
    arabicName: '???????? ????????',
    englishName: 'Outpatient Clinics',
    children: [middleNode],
  };
}

function createSchedule(overrides: Partial<ServiceSchedule> = {}): ServiceSchedule {
  return {
    scheduleId: 1,
    branchId: 10,
    serviceId: 25,
    days: [
      { dayOfWeek: 'Sunday', timeSlots: [{ startTime: '08:00:00', endTime: '15:00:00' }] },
      { dayOfWeek: 'Monday', timeSlots: [{ startTime: '08:00:00', endTime: '15:00:00' }] },
    ],
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

