import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { WindowManagementApiService } from './window-management-api.service';

describe('WindowManagementApiService', () => {
  let service: WindowManagementApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        WindowManagementApiService,
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal({ token: 'technical-admin-token' }).asReadonly() },
        },
        {
          provide: AppLanguageStore,
          useValue: { language: signal<'ar' | 'en'>('en').asReadonly() },
        },
      ],
    });

    service = TestBed.inject(WindowManagementApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('passes branchId with the existing window filters', () => {
    service
      .getWindows({ branchId: 7, waitingAreaId: 12, pageNumber: 2, pageSize: 25, isActive: true })
      .subscribe();

    const endpoint = new URL('api/windows', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne((candidate) => candidate.url === endpoint);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('branchId')).toBe('7');
    expect(request.request.params.get('waitingAreaId')).toBe('12');
    expect(request.request.params.get('pageNumber')).toBe('2');
    expect(request.request.headers.get('Authorization')).toBe('Bearer technical-admin-token');
    request.flush({
      currentPage: 2,
      pageSize: 25,
      totalPages: 0,
      totalItems: 0,
      data: [],
      hasPreviousPage: false,
      hasNextPage: false,
    });
  });
});