import { signal } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { BranchConfigurationComponent } from './branch-configuration.component';
import { AuthSessionService } from '@core';
import { BranchManagementApiService } from '@features/branch-management/services/branch-management-api/branch-management-api.service';
import { BranchConfigurationApiService } from '@features/branch-management/services/branch-configuration-api/branch-configuration-api.service';
import { BranchConfigurationPermissionService } from '@features/branch-management/services/branch-configuration-permission/branch-configuration-permission.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { BranchConfigurationResponse } from '@features/branch-management/models/branch-configuration/branch-configuration.model';

describe('BranchConfigurationComponent', () => {
  let component: BranchConfigurationComponent;
  let fixture: ComponentFixture<BranchConfigurationComponent>;

  const mockLanguageSignal = signal<'en' | 'ar'>('en');
  const mockDirectionSignal = signal<'ltr' | 'rtl'>('ltr');
  const mockTranslationsSignal = signal<any>({
    topbarEyebrow: 'Operations Dashboard',
    branchConfigurationLabel: 'Branch Configuration',
    branchConfigurationDescription: 'Configure allowed time before service start.',
    branchLabel: 'Branch',
    refreshLabel: 'Refresh',
    savedSuccessfullyLabel: 'Saved successfully',
    configurationReadOnlyMessage: 'You have view-only access.',
    concurrencyConflictMessage: 'Another user modified this configuration.',
    loadingLabel: 'Loading...',
    allowedTimeLabel: 'Allowed Time',
    activeBranchLabel: 'Active',
    inactiveLabel: 'Inactive',
    allowedTimeHelp: 'Defines early ticket issuance window.',
    hoursLabel: 'Hours',
    minutesLabel: 'Minutes',
    secondsLabel: 'Seconds',
    saveConfigurationLabel: 'Save Configuration',
  });

  const mockBranchManagementApi = {
    getBranches: vi.fn(),
  };

  const mockBranchConfigurationApi = {
    getBranchConfiguration: vi.fn(),
    createBranchConfiguration: vi.fn(),
    updateBranchConfiguration: vi.fn(),
  };

  const mockPermissionService = {
    canView: signal<boolean>(true),
    canCreate: signal<boolean>(true),
    canUpdate: signal<boolean>(true),
  };

  const mockRouter = {
    navigate: vi.fn().mockReturnValue(Promise.resolve(true)),
    navigateByUrl: vi.fn().mockReturnValue(Promise.resolve(true)),
  };

  const mockRoute = {
    snapshot: {
      queryParamMap: {
        get: vi.fn().mockReturnValue('1'),
      },
    },
  };

  const mockAuthSession = {
    clearSession: vi.fn(),
    shouldClearSessionForHttpStatus: vi.fn().mockReturnValue(false),
    currentSession: vi.fn().mockReturnValue({
      userType: 'TechnicalAdmin',
      activeBranchId: null,
      branches: [],
    }),
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();

    mockBranchManagementApi.getBranches.mockReturnValue(
      of({ data: [{ branchId: 1, englishName: 'Main Branch', arabicName: 'الفرع الرئيسي' }] }),
    );

    mockBranchConfigurationApi.getBranchConfiguration.mockReturnValue(
      of({
        branchId: 1,
        allowedTime: '00:30:00',
        maximumTicketCallAttempts: 5,
        ticketNoShowAutoCancellationMinutes: 30,
        ticketArchiveRetentionDays: 30,
        isConfigured: true,
        rowVersion: 'v1',
        message: null,
      } satisfies BranchConfigurationResponse),
    );

    await TestBed.configureTestingModule({
      imports: [BranchConfigurationComponent],
      providers: [
        { provide: BranchManagementApiService, useValue: mockBranchManagementApi },
        { provide: BranchConfigurationApiService, useValue: mockBranchConfigurationApi },
        { provide: BranchConfigurationPermissionService, useValue: mockPermissionService },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockRoute },
        { provide: AuthSessionService, useValue: mockAuthSession },
        {
          provide: AdminI18nStore,
          useValue: {
            language: mockLanguageSignal,
            direction: mockDirectionSignal,
            translations: mockTranslationsSignal,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchConfigurationComponent);
    component = fixture.componentInstance;
  });

  it('should initialize and load branches and initial branch configuration including ticket runtime fields', () => {
    fixture.detectChanges();
    expect(mockBranchManagementApi.getBranches).toHaveBeenCalled();
    expect(component.selectedBranchId()).toBe(1);
    expect(mockBranchConfigurationApi.getBranchConfiguration).toHaveBeenCalledWith(1);
    expect(component.configForm.value).toEqual({
      hours: 0,
      minutes: 30,
      seconds: 0,
      maximumTicketCallAttempts: 5,
      ticketNoShowAutoCancellationMinutes: 30,
      ticketArchiveRetentionDays: 30,
    });
    expect(component.isConfigured()).toBe(true);
    expect(component.rowVersion()).toBe('v1');
  });

  it('Scenario 1: No saved config (isConfigured: false), displays default create values, saving calls POST with all 4 parameters', () => {
    mockBranchConfigurationApi.getBranchConfiguration.mockReturnValue(
      of({
        branchId: 1,
        allowedTime: '00:00:00',
        maximumTicketCallAttempts: 0,
        ticketNoShowAutoCancellationMinutes: 0,
        ticketArchiveRetentionDays: 0,
        isConfigured: false,
        rowVersion: null,
        message: null,
      } satisfies BranchConfigurationResponse),
    );
    mockBranchConfigurationApi.createBranchConfiguration.mockReturnValue(
      of({
        branchId: 1,
        allowedTime: '01:00:00',
        maximumTicketCallAttempts: 5,
        ticketNoShowAutoCancellationMinutes: 30,
        ticketArchiveRetentionDays: 30,
        isConfigured: true,
        rowVersion: 'v1-new',
        message: null,
      } satisfies BranchConfigurationResponse),
    );

    fixture.detectChanges();
    expect(component.isConfigured()).toBe(false);
    expect(component.configForm.value).toEqual({
      hours: 0,
      minutes: 0,
      seconds: 0,
      maximumTicketCallAttempts: 3,
      ticketNoShowAutoCancellationMinutes: 30,
      ticketArchiveRetentionDays: 30,
    });

    component.configForm.patchValue({
      hours: 1,
      minutes: 0,
      seconds: 0,
      maximumTicketCallAttempts: 5,
      ticketNoShowAutoCancellationMinutes: 30,
      ticketArchiveRetentionDays: 30,
    });
    component.save();

    expect(mockBranchConfigurationApi.createBranchConfiguration).toHaveBeenCalledWith(1, {
      allowedTime: '01:00:00',
      maximumTicketCallAttempts: 5,
      maxCallAttempts: 5,
      ticketNoShowAutoCancellationMinutes: 30,
      noShowAutoCancellationMinutes: 30,
      noShowReturnStatus: 'Waiting',
      ticketArchiveRetentionDays: 30,
      ticketHistoricalUsageHours: 720,
    });
    expect(component.isConfigured()).toBe(true);
    expect(component.rowVersion()).toBe('v1-new');
  });

  it('Scenario 2: Existing config (isConfigured: true), saving calls PUT with RowVersion and all ticket settings', () => {
    fixture.detectChanges();

    mockBranchConfigurationApi.updateBranchConfiguration.mockReturnValue(
      of({
        branchId: 1,
        allowedTime: '00:45:00',
        maximumTicketCallAttempts: 6,
        ticketNoShowAutoCancellationMinutes: 60,
        ticketArchiveRetentionDays: 45,
        isConfigured: true,
        rowVersion: 'v2',
        message: null,
      } satisfies BranchConfigurationResponse),
    );

    component.configForm.patchValue({
      minutes: 45,
      maximumTicketCallAttempts: 6,
      ticketNoShowAutoCancellationMinutes: 60,
      ticketArchiveRetentionDays: 45,
    });
    component.save();

    expect(mockBranchConfigurationApi.updateBranchConfiguration).toHaveBeenCalledWith(1, {
      allowedTime: '00:45:00',
      maximumTicketCallAttempts: 6,
      maxCallAttempts: 6,
      ticketNoShowAutoCancellationMinutes: 60,
      noShowAutoCancellationMinutes: 60,
      noShowReturnStatus: 'Waiting',
      ticketArchiveRetentionDays: 45,
      ticketHistoricalUsageHours: 1080,
      rowVersion: 'v1',
    });
    expect(component.rowVersion()).toBe('v2');
  });

  it('Scenario 3: Validation rejects 0, negative values, and non-integers for ticket settings', () => {
    fixture.detectChanges();

    // Set maximumTicketCallAttempts to 0 (invalid)
    component.configForm.patchValue({ maximumTicketCallAttempts: 0 });
    expect(component.configForm.controls.maximumTicketCallAttempts.invalid).toBe(true);
    expect(component.configForm.invalid).toBe(true);

    // Set ticketNoShowAutoCancellationMinutes to negative (invalid)
    component.configForm.patchValue({ maximumTicketCallAttempts: 3, ticketNoShowAutoCancellationMinutes: -5 });
    expect(component.configForm.controls.ticketNoShowAutoCancellationMinutes.invalid).toBe(true);
    expect(component.configForm.invalid).toBe(true);

    // Set ticketArchiveRetentionDays to decimal (invalid)
    component.configForm.patchValue({ ticketNoShowAutoCancellationMinutes: 30, ticketArchiveRetentionDays: 2.5 });
    expect(component.configForm.controls.ticketArchiveRetentionDays.invalid).toBe(true);
    expect(component.configForm.invalid).toBe(true);

    // Attempt to save should not trigger API call
    component.save();
    expect(mockBranchConfigurationApi.updateBranchConfiguration).not.toHaveBeenCalled();
    expect(mockBranchConfigurationApi.createBranchConfiguration).not.toHaveBeenCalled();
  });

  it('Scenario 4: Duplicate create (POST 409 conflict) displays conflict message and reloads state', () => {
    mockBranchConfigurationApi.getBranchConfiguration.mockReturnValueOnce(
      of({
        branchId: 1,
        allowedTime: '00:00:00',
        maximumTicketCallAttempts: 3,
        ticketNoShowAutoCancellationMinutes: 30,
        ticketArchiveRetentionDays: 30,
        isConfigured: false,
        rowVersion: null,
        message: null,
      } satisfies BranchConfigurationResponse),
    );
    fixture.detectChanges();

    mockBranchConfigurationApi.createBranchConfiguration.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict' })),
    );

    mockBranchConfigurationApi.getBranchConfiguration.mockReturnValueOnce(
      of({
        branchId: 1,
        allowedTime: '00:15:00',
        maximumTicketCallAttempts: 5,
        ticketNoShowAutoCancellationMinutes: 20,
        ticketArchiveRetentionDays: 60,
        isConfigured: true,
        rowVersion: 'v-conflict',
        message: null,
      } satisfies BranchConfigurationResponse),
    );

    component.configForm.patchValue({ minutes: 30 });
    component.save();

    expect(component.message()?.tone).toBe('error');
    expect(component.message()?.text).toBe(mockTranslationsSignal().concurrencyConflictMessage);
    expect(component.isConfigured()).toBe(true);
    expect(component.rowVersion()).toBe('v-conflict');
    expect(component.configForm.value).toEqual({
      hours: 0,
      minutes: 15,
      seconds: 0,
      maximumTicketCallAttempts: 5,
      ticketNoShowAutoCancellationMinutes: 20,
      ticketArchiveRetentionDays: 60,
    });
  });

  it('Scenario 5: Concurrency conflict (PUT 409 conflict) displays warning and reloads latest RowVersion', () => {
    fixture.detectChanges();

    mockBranchConfigurationApi.updateBranchConfiguration.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict' })),
    );

    mockBranchConfigurationApi.getBranchConfiguration.mockReturnValueOnce(
      of({
        branchId: 1,
        allowedTime: '02:00:00',
        maximumTicketCallAttempts: 4,
        ticketNoShowAutoCancellationMinutes: 40,
        ticketArchiveRetentionDays: 50,
        isConfigured: true,
        rowVersion: 'v2-server',
        message: null,
      } satisfies BranchConfigurationResponse),
    );

    component.configForm.patchValue({ hours: 1 });
    component.save();

    expect(component.message()?.tone).toBe('error');
    expect(component.message()?.text).toBe(mockTranslationsSignal().concurrencyConflictMessage);
    expect(component.rowVersion()).toBe('v2-server');
    expect(component.configForm.value).toEqual({
      hours: 2,
      minutes: 0,
      seconds: 0,
      maximumTicketCallAttempts: 4,
      ticketNoShowAutoCancellationMinutes: 40,
      ticketArchiveRetentionDays: 50,
    });
  });

  it('Scenario 6: BranchAdmin accessing unauthorized branch (403 Forbidden)', () => {
    mockBranchConfigurationApi.getBranchConfiguration.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403, statusText: 'Forbidden' })),
    );

    fixture.detectChanges();
    expect(component.message()?.tone).toBe('error');
    expect(component.configLoading()).toBe(false);
  });
});
