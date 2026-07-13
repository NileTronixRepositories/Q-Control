import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceGlobalizationApiService } from './service-globalization-api.service';

describe('ServiceGlobalizationApiService', () => {
  let service: ServiceGlobalizationApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ServiceGlobalizationApiService,
        { provide: AuthSessionService, useValue: { currentSession: signal({ token: 'token' }).asReadonly() } },
        { provide: AppLanguageStore, useValue: { language: signal<'ar' | 'en'>('ar').asReadonly() } },
      ],
    });
    service = TestBed.inject(ServiceGlobalizationApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes technical list filters', () => {
    service.getRequests({
      status: 'Pending', requestType: 'LeafUnderGlobalParent', branchId: 12,
      searchText: ' Medical ', orderSort: 'Newest', pageNumber: 1, pageSize: 20,
    }).subscribe();
    const endpoint = new URL('api/service-globalization-requests', environment.apiBaseUrl).toString();
    const request = http.expectOne((candidate) => candidate.url === endpoint);
    expect(request.request.params.get('status')).toBe('Pending');
    expect(request.request.params.get('requestType')).toBe('LeafUnderGlobalParent');
    expect(request.request.params.get('branchId')).toBe('12');
    expect(request.request.params.get('searchText')).toBe('Medical');
    request.flush({ currentPage: 1, pageSize: 20, totalItems: 0, data: [] });
  });

  it('loads the branch list without a branchId query parameter', () => {
    service.getBranchRequests(12, {
      status: null, requestType: null, searchText: '', orderSort: 'Oldest', pageNumber: 1, pageSize: 10,
    }).subscribe();
    const endpoint = new URL('api/branches/12/service-globalization-requests', environment.apiBaseUrl).toString();
    const request = http.expectOne((candidate) => candidate.url === endpoint);
    expect(request.request.params.has('branchId')).toBe(false);
    expect(request.request.headers.get('Accept-Language')).toBe('ar');
    request.flush({ currentPage: 1, pageSize: 10, totalItems: 0, data: [] });
  });

  it('approves with If-Match and no body', () => {
    service.approveRequest(46, 'row-version').subscribe();
    const endpoint = new URL('api/service-globalization-requests/46/approve', environment.apiBaseUrl).toString();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.headers.get('If-Match')).toBe('row-version');
    request.flush({ requestId: 46, status: 'Approved', branchId: 12, promotedServiceIds: [311], reviewedByApplicationUserId: 'user', reviewedOnUtc: '2026-07-13T10:00:00Z', rowVersion: 'next', message: 'Approved' });
  });

  it('rejects with If-Match and a JSON object when the reason is null', () => {
    service.rejectRequest(46, 'row-version', { rejectionReason: null }).subscribe();
    const endpoint = new URL('api/service-globalization-requests/46/reject', environment.apiBaseUrl).toString();
    const request = http.expectOne(endpoint);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ rejectionReason: null });
    expect(request.request.headers.get('If-Match')).toBe('row-version');
    request.flush({ requestId: 46, status: 'Rejected', branchId: 12, rejectionReason: null, reviewedByApplicationUserId: 'user', reviewedOnUtc: '2026-07-13T10:00:00Z', rowVersion: 'next', message: 'Rejected' });
  });
});
