import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceSchedule } from '../models/service-schedule.model';
import { ServiceScheduleApiService } from './service-schedule-api.service';

describe('ServiceScheduleApiService', () => {
  let service: ServiceScheduleApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ServiceScheduleApiService,
        { provide: AuthSessionService, useValue: { currentSession: signal({ token: 'token' }).asReadonly() } },
        { provide: AppLanguageStore, useValue: { language: signal<'ar' | 'en'>('en').asReadonly() } },
      ],
    });

    service = TestBed.inject(ServiceScheduleApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('normalizes schedule days and ordered time slots from the new response contract', () => {
    let result: ServiceSchedule | undefined;

    service.getSchedule(1, 122).subscribe((schedule) => {
      result = schedule;
    });

    const request = http.expectOne(scheduleEndpoint(1, 122));
    expect(request.request.method).toBe('GET');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    expect(request.request.headers.get('Authorization')).toBe('Bearer token');

    request.flush({
      scheduleId: 2,
      branchId: 1,
      serviceId: 122,
      days: [
        {
          dayOfWeek: 'Saturday',
          timeSlots: [
            { startTime: '09:00:00', endTime: '11:59:00' },
            { startTime: '03:00:00', endTime: '06:00:00' },
          ],
        },
        {
          dayOfWeek: 'Sunday',
          timeSlots: [{ startTime: '08:00:00', endTime: '12:00:00' }],
        },
      ],
      isSlotCodeRequired: true,
      slotCode: 'LAB-01',
      isCurrentlyOperational: true,
      rowVersion: 'rv-1',
      message: null,
    });

    expect(result?.days).toEqual([
      { dayOfWeek: 'Sunday', timeSlots: [{ startTime: '08:00:00', endTime: '12:00:00' }] },
      {
        dayOfWeek: 'Saturday',
        timeSlots: [
          { startTime: '03:00:00', endTime: '06:00:00' },
          { startTime: '09:00:00', endTime: '11:59:00' },
        ],
      },
    ]);
  });

  it('creates a schedule using days and time slots without legacy fields', () => {
    const body = {
      days: [{ dayOfWeek: 'Sunday' as const, timeSlots: [{ startTime: '08:00:00', endTime: '12:00:00' }] }],
      isSlotCodeRequired: false,
      slotCode: null,
    };

    service.createSchedule(1, 122, body).subscribe();

    const request = http.expectOne(scheduleEndpoint(1, 122));
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    expect(request.request.body).not.toHaveProperty('startTime');
    expect(request.request.body).not.toHaveProperty('endTime');
    expect(request.request.body).not.toHaveProperty('workDays');
    request.flush({ scheduleId: 3, branchId: 1, serviceId: 122, days: body.days, isCurrentlyOperational: true, rowVersion: 'rv-2' });
  });

  it('updates a schedule with rowVersion inside the request body', () => {
    const body = {
      days: [{ dayOfWeek: 'Tuesday' as const, timeSlots: [{ startTime: '10:00:00', endTime: '13:00:00' }] }],
      isSlotCodeRequired: true,
      slotCode: 'A1',
      rowVersion: 'rv-current',
    };

    service.updateSchedule(1, 122, body).subscribe();

    const request = http.expectOne(scheduleEndpoint(1, 122));
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.has('If-Match')).toBe(false);
    request.flush({ scheduleId: 3, branchId: 1, serviceId: 122, days: body.days, isCurrentlyOperational: true, rowVersion: 'rv-next' });
  });
});

function scheduleEndpoint(branchId: number, leafServiceId: number): string {
  return new URL(
    `api/branches/${branchId}/services/${leafServiceId}/schedule`,
    environment.apiBaseUrl,
  ).toString();
}
