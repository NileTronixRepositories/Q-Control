import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { AppLanguageStore, AuthSessionService } from '@core';
import {
  CreateKioskTicketRequest,
  KioskReservationSearchItemResponse,
  KioskTicketResponse,
  SearchKioskReservationRequest,
} from '../../models/kiosk-api/kiosk-api.model';
import { KioskApiService } from './kiosk-api.service';

describe('KioskApiService', () => {
  let service: KioskApiService;
  let httpMock: HttpTestingController;

  const mockAuthSession = {
    currentSession: () => ({
      token: 'valid-test-jwt-token',
      activeBranchId: 5,
    }),
  };

  const mockLanguageStore = {
    language: () => 'ar' as const,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        KioskApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthSessionService, useValue: mockAuthSession },
        { provide: AppLanguageStore, useValue: mockLanguageStore },
      ],
    });

    service = TestBed.inject(KioskApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should post direct ticket creation to /api/branches/{branchId}/kiosk/tickets', () => {
    const branchId = 5;
    const request: CreateKioskTicketRequest = {
      serviceId: 10,
      segmentId: 1,
      field: '01012345678',
      customInputs: [{ serviceCustomInputId: 2, value: '01012345678' }],
    };

    const mockResponse: KioskTicketResponse = {
      id: 101,
      ticketNumber: 'A-012',
      status: 'Waiting',
      branchId: 5,
      serviceId: 10,
      serviceNameAr: 'عيادة الباطنة',
      serviceNameEn: 'Internal Medicine',
      segmentId: 1,
      currentQueueEnteredOnUtc: '2026-09-01T10:00:00Z',
    };

    service.createTicket(branchId, request).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.ticketNumber).toBe('A-012');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/kiosk/tickets'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-test-jwt-token');
    expect(req.request.headers.get('Accept-Language')).toBe('ar');

    req.flush(mockResponse);
  });

  it('should post search reservations to /api/branches/{branchId}/kiosk/reservations/search', () => {
    const branchId = 5;
    const request: SearchKioskReservationRequest = {
      serviceId: 10,
      field: '01012345678',
    };

    const mockResults: KioskReservationSearchItemResponse[] = [
      {
        reservationId: 55,
        serviceId: 10,
        serviceArabicName: 'عيادة الباطنة',
        segmentId: 1,
        scheduledOnUtc: '2026-09-01T11:00:00Z',
        status: 'Active',
        field: '01012345678',
      },
    ];

    service.searchReservations(branchId, request).subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].reservationId).toBe(55);
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/branches/5/kiosk/reservations/search'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);

    req.flush(mockResults);
  });

  it('should post convert reservation to ticket to /api/branches/{branchId}/kiosk/reservations/{reservationId}/ticket', () => {
    const branchId = 5;
    const reservationId = 55;

    const mockResponse: KioskTicketResponse = {
      id: 102,
      ticketNumber: 'A-013',
      status: 'Waiting',
      branchId: 5,
      serviceId: 10,
      segmentId: 1,
      reservationId: 55,
    };

    service.convertReservationToTicket(branchId, reservationId).subscribe((res) => {
      expect(res.id).toBe(102);
      expect(res.ticketNumber).toBe('A-013');
      expect(res.reservationId).toBe(55);
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/branches/5/kiosk/reservations/55/ticket'),
    );
    expect(req.request.method).toBe('POST');

    req.flush(mockResponse);
  });
});
