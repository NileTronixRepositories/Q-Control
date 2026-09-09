import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppLanguageStore, AuthSessionService } from '@core';
import { createEmptyTicketElements } from '../../pages/ticket-template-builder/ticket-template-builder.data';
import { TicketConfigurationApiService } from './ticket-configuration-api.service';

describe('TicketConfigurationApiService', () => {
  let service: TicketConfigurationApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TicketConfigurationApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppLanguageStore, useValue: { language: signal('en').asReadonly() } },
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal({ token: 'token' }).asReadonly() },
        },
      ],
    });
    service = TestBed.inject(TicketConfigurationApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('uses GET, POST, and full-state PUT on the branch ticket configuration endpoint', () => {
    const body = { ticketWidthMm: 80, ticketHeightMm: 120, elements: createEmptyTicketElements() };
    service.get(7).subscribe();
    http
      .expectOne(
        (request) =>
          request.url.endsWith('/api/branches/7/ticket-configuration') && request.method === 'GET',
      )
      .flush({});

    service.create(7, body).subscribe();
    http
      .expectOne(
        (request) =>
          request.url.endsWith('/api/branches/7/ticket-configuration') && request.method === 'POST',
      )
      .flush({});

    service.update(7, { ...body, rowVersion: 'AAAA' }).subscribe();
    const update = http.expectOne(
      (request) =>
        request.url.endsWith('/api/branches/7/ticket-configuration') && request.method === 'PUT',
    );
    expect(update.request.body.elements).toHaveLength(8);
    expect(update.request.body.rowVersion).toBe('AAAA');
    update.flush({});
  });
});
