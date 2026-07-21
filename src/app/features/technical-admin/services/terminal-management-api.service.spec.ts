import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { TerminalManagementApiService } from './terminal-management-api.service';

describe('TerminalManagementApiService', () => {
  let service: TerminalManagementApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TerminalManagementApiService,
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

    service = TestBed.inject(TerminalManagementApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('passes branchId with the existing terminal filters', () => {
    service
      .getTerminals({ branchId: 7, windowId: 21, pageNumber: 2, pageSize: 25, isActive: false })
      .subscribe();

    const endpoint = new URL('api/terminals', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne((candidate) => candidate.url === endpoint);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('branchId')).toBe('7');
    expect(request.request.params.get('windowId')).toBe('21');
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