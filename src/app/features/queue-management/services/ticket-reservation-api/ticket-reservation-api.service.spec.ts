import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { AppLanguageStore, AuthSessionService } from '@core';
import { environment } from '../../../../../environments/environment';
import { TicketReservationApiService } from './ticket-reservation-api.service';
import {
  CancelRequest,
  CreateReservationRequest,
  CreateTicketRequest,
  HistoryEvent,
  ManualTransferRequest,
  Page,
  ReservationDetails,
  ReservationListItem,
  TicketDetails,
  TicketListItem,
} from '../../models/ticket-reservation/ticket-reservation.model';

describe('TicketReservationApiService', () => {
  let service: TicketReservationApiService;
  let httpTestingController: HttpTestingController;
  const mockSessionSignal = signal<any>(null);
  const mockLanguageSignal = signal<'en' | 'ar'>('en');

  const mockAuthSessionService = {
    currentSession: mockSessionSignal,
    activeSession: mockSessionSignal,
  };

  const mockAppLanguageStore = {
    language: mockLanguageSignal,
  };

  const branchesUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/api/branches`;

  beforeEach(() => {
    mockSessionSignal.set({
      userType: 'TechnicalAdmin',
      token: 'jwt-token-xyz',
      userId: 1,
      userName: 'admin',
      email: 'admin@test.com',
      displayName: 'Admin',
      expiresAt: new Date(Date.now() + 10000),
      firstLoginFlag: false,
    });
    mockLanguageSignal.set('en');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        TicketReservationApiService,
        { provide: AuthSessionService, useValue: mockAuthSessionService },
        { provide: AppLanguageStore, useValue: mockAppLanguageStore },
      ],
    });

    service = TestBed.inject(TicketReservationApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('1. getTickets (operational) sends GET with query params and headers', () => {
    const mockPage: Page<TicketListItem> = {
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

    service
      .getTickets(5, { pageNumber: 1, pageSize: 20, status: 'Waiting', ticketNumber: 'A1' })
      .subscribe((res) => expect(res).toEqual(mockPage));

    const req = httpTestingController.expectOne(
      (r) =>
        r.url.startsWith(`${branchesUrl}/5/tickets`) &&
        r.params.get('status') === 'Waiting' &&
        r.params.get('ticketNumber') === 'A1',
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token-xyz');
    req.flush(mockPage);
  });

  it('2. getTickets (archive) sends GET to /archive with query params', () => {
    const mockPage: Page<TicketListItem> = {
      currentPage: 1,
      pageSize: 20,
      totalItems: 0,
      data: [],
    };

    service.getTickets(5, { pageNumber: 1, pageSize: 20 }, true).subscribe((res) => {
      expect(res).toEqual(mockPage);
    });

    const req = httpTestingController.expectOne((r) =>
      r.url.endsWith('/api/branches/5/tickets/archive'),
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('3. getTicket (operational) sends GET to /tickets/{ticketId}', () => {
    const mockTicket: TicketDetails = {
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

    service.getTicket(5, 101).subscribe((res) => expect(res).toEqual(mockTicket));

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/101`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTicket);
  });

  it('4. getTicket (archive) sends GET to /tickets/archive/{ticketId}', () => {
    const mockTicket: TicketDetails = {
      id: 101,
      branchId: 5,
      ticketNumber: 'A15',
      businessDate: '2026-08-31',
      status: 'Completed',
      issuingServiceId: 10,
      currentServiceId: 10,
      segmentId: 2,
      reservationId: null,
      currentWindowId: 1,
      currentQueueEnteredOnUtc: '2026-08-31T10:00:00Z',
      currentServiceStartedOnUtc: '2026-08-31T10:15:00Z',
      completedOnUtc: '2026-08-31T10:30:00Z',
      cancelledOnUtc: null,
      cancellationReason: null,
      boundWorkflowId: null,
      currentWorkflowStepOrder: null,
      customInputs: [],
      journeys: [],
      rowVersion: 'rv-arch',
      isArchived: true,
    };

    service.getTicket(5, 101, true).subscribe((res) => expect(res).toEqual(mockTicket));

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/archive/101`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTicket);
  });

  it('5. getTicketHistory sends GET to /tickets/{ticketId}/history', () => {
    const mockEvents: HistoryEvent[] = [
      {
        id: 1,
        eventType: 'Created',
        toStatus: 'Waiting',
        occurredOnUtc: '2026-08-31T10:00:00Z',
      },
    ];

    service.getTicketHistory(5, 101).subscribe((res) => expect(res).toEqual(mockEvents));

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/101/history`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEvents);
  });

  it('6. createTicket sends POST to /tickets with payload', () => {
    const payload: CreateTicketRequest = {
      serviceId: 10,
      segmentId: 2,
      customInputs: [{ serviceCustomInputId: 1, value: '12345' }],
    };

    service.createTicket(5, payload).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 102, ticketNumber: 'A16' });
  });

  it('7. cancelTicket sends POST to /tickets/{ticketId}/cancel with reason', () => {
    const payload: CancelRequest = { reason: 'Customer changed mind' };

    service.cancelTicket(5, 101, payload).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/101/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 101, status: 'Cancelled' });
  });

  it('8. returnToWaiting sends POST to /tickets/{ticketId}/return-to-waiting', () => {
    service.returnToWaiting(5, 101).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/101/return-to-waiting`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 101, status: 'Waiting' });
  });

  it('9. startService sends POST to /tickets/{ticketId}/start-service', () => {
    service.startService(5, 101).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/101/start-service`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 101, status: 'InProgress' });
  });

  it('10. completeService sends POST to /tickets/{ticketId}/complete-service', () => {
    service.completeService(5, 101).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/101/complete-service`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 101, status: 'Completed' });
  });

  it('11. manualTransfer sends POST to /tickets/{ticketId}/manual-transfer with payload', () => {
    const payload: ManualTransferRequest = {
      targetServiceId: 20,
      reason: 'Transferred for billing',
    };

    service.manualTransfer(5, 101, payload).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/tickets/101/manual-transfer`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 101, currentServiceId: 20, status: 'Waiting' });
  });

  it('12. getReservations (operational) sends GET with query params and headers', () => {
    const mockPage: Page<ReservationListItem> = {
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

    service
      .getReservations(5, { pageNumber: 1, pageSize: 20, status: 'Active' })
      .subscribe((res) => expect(res).toEqual(mockPage));

    const req = httpTestingController.expectOne(
      (r) =>
        r.url.startsWith(`${branchesUrl}/5/reservations`) && r.params.get('status') === 'Active',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('13. getReservations (archive) sends GET to /reservations/archive', () => {
    const mockPage: Page<ReservationListItem> = {
      currentPage: 1,
      pageSize: 20,
      totalItems: 0,
      data: [],
    };

    service.getReservations(5, {}, true).subscribe((res) => expect(res).toEqual(mockPage));

    const req = httpTestingController.expectOne((r) =>
      r.url.endsWith('/api/branches/5/reservations/archive'),
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('14. getReservation (operational) sends GET to /reservations/{reservationId}', () => {
    const mockReservation: ReservationDetails = {
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

    service.getReservation(5, 301).subscribe((res) => expect(res).toEqual(mockReservation));

    const req = httpTestingController.expectOne(`${branchesUrl}/5/reservations/301`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReservation);
  });

  it('15. getReservation (archive) sends GET to /reservations/archive/{reservationId}', () => {
    const mockReservation: ReservationDetails = {
      id: 301,
      branchId: 5,
      serviceId: 10,
      segmentId: 2,
      scheduledOnUtc: '2026-09-01T12:00:00Z',
      status: 'ConvertedToTicket',
      customInputs: [],
      rowVersion: 'rv-res-arch',
      isArchived: true,
    };

    service.getReservation(5, 301, true).subscribe((res) => expect(res).toEqual(mockReservation));

    const req = httpTestingController.expectOne(`${branchesUrl}/5/reservations/archive/301`);
    expect(req.request.method).toBe('GET');
    req.flush(mockReservation);
  });

  it('16. getReservationHistory sends GET to /reservations/{reservationId}/history', () => {
    const mockEvents: HistoryEvent[] = [
      {
        id: 1,
        eventType: 'Created',
        toStatus: 'Active',
        occurredOnUtc: '2026-08-31T10:00:00Z',
      },
    ];

    service.getReservationHistory(5, 301).subscribe((res) => expect(res).toEqual(mockEvents));

    const req = httpTestingController.expectOne(`${branchesUrl}/5/reservations/301/history`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEvents);
  });

  it('17. createReservation sends POST to /reservations with payload', () => {
    const payload: CreateReservationRequest = {
      serviceId: 10,
      segmentId: 2,
      scheduledOnUtc: '2026-09-01T12:00:00Z',
      customInputs: [],
    };

    service.createReservation(5, payload).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/reservations`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 302, status: 'Active' });
  });

  it('18. cancelReservation sends POST to /reservations/{reservationId}/cancel with reason', () => {
    const payload: CancelRequest = { reason: 'No longer needed' };

    service.cancelReservation(5, 301, payload).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/reservations/301/cancel`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 301, status: 'Cancelled' });
  });

  it('19. convertReservation sends POST to /reservations/{reservationId}/ticket and returns TicketDetails', () => {
    service.convertReservation(5, 301).subscribe();

    const req = httpTestingController.expectOne(`${branchesUrl}/5/reservations/301/ticket`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 105, ticketNumber: 'A20', status: 'Waiting', reservationId: 301 });
  });
});
