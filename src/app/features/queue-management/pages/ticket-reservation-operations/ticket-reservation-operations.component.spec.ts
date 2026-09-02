import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { AppLanguageStore, AuthSessionService } from '@core';
import { AdminBranchContextStore } from '../../../../layout/admin-shell/store/admin-branch-context.store';
import { BranchServicesApiService } from '../../../service-management/services/branch/branch-services-api/branch-services-api.service';
import { ServiceManagementApiService } from '../../../service-management/services/catalog/service-management-api/service-management-api.service';
import { ServiceScheduleApiService } from '../../../service-management/services/schedule/service-schedule-api/service-schedule-api.service';
import { SegmentApiService } from '../../../segment-management/services/segment-api/segment-api.service';
import { TicketReservationApiService } from '../../services/ticket-reservation-api/ticket-reservation-api.service';
import { TicketReservationOperationsComponent } from './ticket-reservation-operations.component';
import {
  Page,
  ReservationDetails,
  ReservationListItem,
  TicketDetails,
  TicketListItem,
} from '../../models/ticket-reservation/ticket-reservation.model';

describe('TicketReservationOperationsComponent', () => {
  let component: TicketReservationOperationsComponent;
  let fixture: ComponentFixture<TicketReservationOperationsComponent>;

  const mockBranchIdSignal = signal<number | null>(5);
  const mockLanguageSignal = signal<'en' | 'ar'>('en');
  const allPermissions = [
    'Tickets.Create',
    'Tickets.View',
    'Tickets.ViewHistory',
    'Tickets.Cancel',
    'Tickets.ReturnNoShowToWaiting',
    'Tickets.StartService',
    'Tickets.CompleteService',
    'Tickets.ManualTransfer',
    'Tickets.ViewArchive',
    'Reservations.Create',
    'Reservations.View',
    'Reservations.ViewHistory',
    'Reservations.Cancel',
    'Reservations.ConvertToTicket',
    'Reservations.ViewArchive',
  ];
  const validMockToken = `eyJhbGciOiJIUzI1NiJ9.${btoa(JSON.stringify({ permissions: allPermissions }))}.signature`;

  const mockSessionSignal = signal<any>({
    userType: 'TechnicalAdmin',
    token: validMockToken,
    permissions: allPermissions,
  });

  const mockTicketList: Page<TicketListItem> = {
    currentPage: 1,
    pageSize: 20,
    totalItems: 1,
    data: [
      {
        id: 101,
        ticketNumber: 'A15',
        businessDate: '2026-08-31',
        status: 'Waiting',
        issuingServiceId: 10,
        currentServiceId: 10,
        segmentId: 2,
        currentQueueEnteredOnUtc: '2026-08-31T10:00:00Z',
      },
    ],
  };

  const mockReservationList: Page<ReservationListItem> = {
    currentPage: 1,
    pageSize: 20,
    totalItems: 1,
    data: [
      {
        id: 301,
        scheduledOnUtc: '2026-09-01T12:00:00Z',
        status: 'Active',
        serviceId: 10,
        segmentId: 2,
      },
    ],
  };

  const mockTicketDetails: TicketDetails = {
    id: 101,
    branchId: 5,
    ticketNumber: 'A15',
    businessDate: '2026-08-31',
    status: 'Waiting',
    issuingServiceId: 10,
    currentServiceId: 10,
    segmentId: 2,
    reservationId: null,
    currentWindowId: null,
    currentQueueEnteredOnUtc: '2026-08-31T10:00:00Z',
    currentServiceStartedOnUtc: null,
    completedOnUtc: null,
    cancelledOnUtc: null,
    cancellationReason: null,
    boundWorkflowId: null,
    currentWorkflowStepOrder: null,
    customInputs: [],
    journeys: [],
    rowVersion: 'rv-1',
    isArchived: false,
  };

  const mockReservationDetails: ReservationDetails = {
    id: 301,
    branchId: 5,
    serviceId: 10,
    segmentId: 2,
    scheduledOnUtc: '2026-09-01T12:00:00Z',
    status: 'Active',
    customInputs: [],
    rowVersion: 'rv-res',
    isArchived: false,
  };

  const mockApi = {
    getTickets: vi.fn().mockReturnValue(of(mockTicketList)),
    getTicket: vi.fn().mockReturnValue(of(mockTicketDetails)),
    getTicketHistory: vi.fn().mockReturnValue(of([])),
    createTicket: vi
      .fn()
      .mockReturnValue(of({ ...mockTicketDetails, id: 102, ticketNumber: 'A16' })),
    cancelTicket: vi.fn().mockReturnValue(of({ ...mockTicketDetails, status: 'Cancelled' })),
    returnToWaiting: vi.fn().mockReturnValue(of({ ...mockTicketDetails, status: 'Waiting' })),
    startService: vi.fn().mockReturnValue(of({ ...mockTicketDetails, status: 'InProgress' })),
    completeService: vi.fn().mockReturnValue(of({ ...mockTicketDetails, status: 'Completed' })),
    manualTransfer: vi
      .fn()
      .mockReturnValue(of({ ...mockTicketDetails, currentServiceId: 20, status: 'Waiting' })),
    getReservations: vi.fn().mockReturnValue(of(mockReservationList)),
    getReservation: vi.fn().mockReturnValue(of(mockReservationDetails)),
    getReservationHistory: vi.fn().mockReturnValue(of([])),
    createReservation: vi.fn().mockReturnValue(of({ ...mockReservationDetails, id: 302 })),
    cancelReservation: vi
      .fn()
      .mockReturnValue(of({ ...mockReservationDetails, status: 'Cancelled' })),
    convertReservation: vi
      .fn()
      .mockReturnValue(
        of({ ...mockTicketDetails, id: 105, ticketNumber: 'A20', reservationId: 301 }),
      ),
  };

  const mockBranchServicesApi = {
    getBranchServicesTree: vi.fn().mockReturnValue(
      of([
        {
          id: 10,
          arabicName: 'عيادة الباطنة',
          englishName: 'Internal Medicine',
          isTicketIssuable: true,
        },
        {
          id: 20,
          arabicName: 'العيادات الخارجية',
          englishName: 'Outpatient Clinic',
          isTicketIssuable: true,
        },
      ]),
    ),
  };

  const mockServiceManagementApi = {
    getServiceDetails: vi.fn().mockReturnValue(
      of({
        id: 10,
        customInputs: [
          {
            serviceCustomInputId: 8,
            name: 'Phone',
            labelAr: 'الهاتف',
            labelEn: 'Phone',
            type: 'String',
          },
          {
            serviceCustomInputId: 9,
            name: 'NationalId',
            labelAr: 'الرقم القومي',
            labelEn: 'National ID',
            type: 'String',
          },
        ],
      }),
    ),
  };

  const mockServiceScheduleApi = {
    getSchedule: vi.fn().mockReturnValue(
      of({
        branchId: 5,
        leafServiceId: 10,
        days: [
          {
            dayOfWeek: 'Sunday',
            timeSlots: [{ startTime: '08:00', endTime: '16:00' }],
          },
        ],
      }),
    ),
  };

  const mockSegmentApi = {
    getSegments: vi.fn().mockReturnValue(
      of({
        data: [{ id: 2, nameAr: 'شريحة كبار السن', nameEn: 'Elderly' }],
      }),
    ),
    getAssignedSegments: vi.fn().mockReturnValue(
      of({
        branchId: 5,
        leafServiceId: 10,
        segments: [{ segmentId: 2, arabicName: 'شريحة كبار السن', englishName: 'Elderly' }],
      }),
    ),
  };

  beforeEach(async () => {
    mockBranchIdSignal.set(5);
    mockLanguageSignal.set('en');
    vi.clearAllMocks();

    await TestBed.configureTestingModule({
      imports: [TicketReservationOperationsComponent],
      providers: [
        { provide: TicketReservationApiService, useValue: mockApi },
        { provide: AuthSessionService, useValue: { currentSession: mockSessionSignal } },
        { provide: AppLanguageStore, useValue: { language: mockLanguageSignal } },
        { provide: AdminBranchContextStore, useValue: { selectedBranchId: mockBranchIdSignal } },
        { provide: BranchServicesApiService, useValue: mockBranchServicesApi },
        { provide: ServiceManagementApiService, useValue: mockServiceManagementApi },
        { provide: ServiceScheduleApiService, useValue: mockServiceScheduleApi },
        { provide: SegmentApiService, useValue: mockSegmentApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TicketReservationOperationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('1. should create and load tickets on initialization', () => {
    expect(component).toBeTruthy();
    expect(mockApi.getTickets).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ pageNumber: 1 }),
      false,
    );
    expect(component['ticketPage']().data.length).toBe(1);
    expect(component['ticketPage']().data[0].ticketNumber).toBe('A15');
  });

  it('2. should switch tabs and load corresponding data', () => {
    component['switchTab']('reservations');
    expect(mockApi.getReservations).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ pageNumber: 1 }),
      false,
    );
    expect(component['activeTab']()).toBe('reservations');

    component['switchTab']('archive');
    expect(component['activeTab']()).toBe('archive');
    expect(mockApi.getTickets).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ pageNumber: 1 }),
      true,
    );

    component['switchArchiveSubTab']('archived-reservations');
    expect(component['archiveSubTab']()).toBe('archived-reservations');
    expect(mockApi.getReservations).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ pageNumber: 1 }),
      true,
    );
  });

  it('3. should open ticket details and load history', () => {
    component['openTicket'](mockTicketList.data[0]);
    expect(mockApi.getTicket).toHaveBeenCalledWith(5, 101, false);
    expect(mockApi.getTicketHistory).toHaveBeenCalledWith(5, 101);
    expect(component['selectedTicket']()?.ticketNumber).toBe('A15');
    expect(component['drawerOpen']()).toBe(true);

    component['closeDrawer']();
    expect(component['selectedTicket']()).toBeNull();
    expect(component['drawerOpen']()).toBe(false);
  });

  it('4. should open reservation details and load history', () => {
    component['openReservation'](mockReservationList.data[0]);
    expect(mockApi.getReservation).toHaveBeenCalledWith(5, 301, false);
    expect(mockApi.getReservationHistory).toHaveBeenCalledWith(5, 301);
    expect(component['selectedReservation']()?.id).toBe(301);
    expect(component['drawerOpen']()).toBe(true);
  });

  it('5. should issue a new ticket successfully', () => {
    component['openCreateTicketModal']();
    expect(component['showCreateTicketModal']()).toBe(true);

    component['createServiceId'].set(10);
    component['createSegmentId'].set(2);
    component['submitCreateTicket']();

    expect(mockApi.createTicket).toHaveBeenCalledWith(5, {
      serviceId: 10,
      segmentId: 2,
      field: null,
      customInputs: [],
    });
    expect(component['createdTicketSuccess']()?.ticketNumber).toBe('A16');
  });

  it('6. should create a scheduled reservation with UTC conversion and custom inputs', () => {
    component['openCreateReservationModal']();
    expect(component['showCreateReservationModal']()).toBe(true);

    component['onServiceSelected'](10);
    expect(mockServiceManagementApi.getServiceDetails).toHaveBeenCalledWith(10);
    expect(mockSegmentApi.getAssignedSegments).toHaveBeenCalledWith(5, 10);
    expect(mockServiceScheduleApi.getSchedule).toHaveBeenCalledWith(5, 10);
    component['createSegmentId'].set(2);
    component['createReservationDate'].set('2026-09-01T15:30');

    // Fill in custom inputs
    const inputs = component['createCustomInputs']();
    if (inputs.length >= 2) {
      inputs[0].value = '01012345678';
      inputs[1].value = '29801011234567';
    }

    component['submitCreateReservation']();

    expect(mockApi.createReservation).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        serviceId: 10,
        segmentId: 2,
        field: null,
        scheduledOnUtc: expect.any(String),
        customInputs: [
          { serviceCustomInputId: 8, value: '01012345678' },
          { serviceCustomInputId: 9, value: '29801011234567' },
        ],
      }),
    );
    expect(component['createdReservationSuccess']()?.id).toBe(302);
  });

  it('7. should cancel a ticket with required reason', () => {
    component['openTicket'](mockTicketList.data[0]);
    component['openCancelModal']('ticket');
    component['cancelReason'].set('Customer left');
    component['submitCancel']();

    expect(mockApi.cancelTicket).toHaveBeenCalledWith(5, 101, { reason: 'Customer left' });
    expect(component['showCancelModal']()).toBe(false);
    expect(component['selectedTicket']()?.status).toBe('Cancelled');
  });

  it('8. should cancel a reservation with reason', () => {
    component['openReservation'](mockReservationList.data[0]);
    component['openCancelModal']('reservation');
    component['cancelReason'].set('Schedule conflict');
    component['submitCancel']();

    expect(mockApi.cancelReservation).toHaveBeenCalledWith(5, 301, { reason: 'Schedule conflict' });
    expect(component['showCancelModal']()).toBe(false);
    expect(component['selectedReservation']()?.status).toBe('Cancelled');
  });

  it('9. should start service for called ticket', () => {
    component['openTicket']({ ...mockTicketList.data[0], status: 'Called' });
    component['openConfirmModal']('startService');
    component['executeConfirmedAction']();

    expect(mockApi.startService).toHaveBeenCalledWith(5, 101);
    expect(component['selectedTicket']()?.status).toBe('InProgress');
    expect(component['showConfirmModal']()).toBe(false);
  });

  it('10. should complete service for in-progress ticket', () => {
    component['openTicket']({ ...mockTicketList.data[0], status: 'InProgress' });
    component['openConfirmModal']('completeService');
    component['executeConfirmedAction']();

    expect(mockApi.completeService).toHaveBeenCalledWith(5, 101);
    expect(component['selectedTicket']()?.status).toBe('Completed');
    expect(component['showConfirmModal']()).toBe(false);
  });

  it('11. should return NoShow ticket to waiting', () => {
    component['openTicket']({ ...mockTicketList.data[0], status: 'NoShow' });
    component['openConfirmModal']('returnToWaiting');
    component['executeConfirmedAction']();

    expect(mockApi.returnToWaiting).toHaveBeenCalledWith(5, 101);
    expect(component['selectedTicket']()?.status).toBe('Waiting');
    expect(component['showConfirmModal']()).toBe(false);
  });

  it('12. should perform manual transfer with target service and reason', () => {
    component['openTicket']({ ...mockTicketList.data[0], status: 'InProgress' });
    component['openTransferModal']();
    component['transferTargetServiceId'].set(20);
    component['transferReason'].set('Transferred to Outpatient');
    component['submitTransfer']();

    expect(mockApi.manualTransfer).toHaveBeenCalledWith(5, 101, {
      targetServiceId: 20,
      reason: 'Transferred to Outpatient',
    });
    expect(component['showTransferModal']()).toBe(false);
  });

  it('13. should convert reservation to live ticket', () => {
    component['openReservation'](mockReservationList.data[0]);
    component['openConfirmModal']('convertToTicket');
    component['executeConfirmedAction']();

    expect(mockApi.convertReservation).toHaveBeenCalledWith(5, 301);
    expect(component['selectedReservation']()).toBeNull();
    expect(component['selectedTicket']()?.ticketNumber).toBe('A20');
    expect(component['showConfirmModal']()).toBe(false);
  });

  it('14. should recover gracefully on 409 concurrency conflict by reloading entity', () => {
    component['openTicket'](mockTicketList.data[0]);
    mockApi.cancelTicket.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 409, statusText: 'Conflict' })),
    );

    component['openCancelModal']('ticket');
    component['cancelReason'].set('Late cancel');
    component['submitCancel']();

    expect(mockApi.getTicket).toHaveBeenCalledTimes(2); // Initial open + Concurrency reload
    expect(component['alertMessage']()?.tone).toBe('warning');
  });

  it('15. should flatten service tree hierarchy and filter only leaf issuable services', () => {
    const complexTree = [
      {
        id: 4,
        arabicName: 'العيادات الخارجية',
        englishName: 'Outpatient Clinics',
        isTicketIssuable: false,
        hasChildren: true,
        children: [
          {
            id: 21,
            arabicName: 'الباطنة العامة والتخصصية',
            englishName: 'Internal Medicine',
            isTicketIssuable: false,
            hasChildren: true,
            children: [
              {
                id: 122,
                arabicName: 'عيادة الباطنة العامة',
                englishName: 'General Internal Medicine Clinic',
                isTicketIssuable: true,
                hasChildren: false,
                children: [],
              },
            ],
          },
        ],
      },
    ];

    mockBranchServicesApi.getBranchServicesTree.mockReturnValueOnce(of(complexTree));
    component['loadLookups'](5);

    expect(component['servicesLookup']().length).toBe(3);
    const issuable = component['issuableServices']();
    expect(issuable.length).toBe(1);
    expect(issuable[0].id).toBe(122);
    expect(issuable[0].fullPathAr).toBe(
      'العيادات الخارجية › الباطنة العامة والتخصصية › عيادة الباطنة العامة',
    );
    expect(issuable[0].fullPathEn).toBe(
      'Outpatient Clinics › Internal Medicine › General Internal Medicine Clinic',
    );
  });
});
