import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceManagementApiService } from './service-management-api.service';

describe('ServiceManagementApiService lifecycle requests', () => {
  let service: ServiceManagementApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ServiceManagementApiService,
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: signal({ token: 'branch-admin-token' }).asReadonly(),
          },
        },
        {
          provide: AppLanguageStore,
          useValue: { language: signal<'ar' | 'en'>('en').asReadonly() },
        },
      ],
    });

    service = TestBed.inject(ServiceManagementApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTestingController.verify());

  it('sends soft delete with the current row version', () => {
    service.deleteService(100, 'row-version-1').subscribe();

    const endpoint = new URL('api/services/100', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);

    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    expect(request.request.headers.get('If-Match')).toBe('row-version-1');
    expect(request.request.headers.get('Authorization')).toBe('Bearer branch-admin-token');
    request.flush({
      id: 100,
      isDeleted: true,
      isActive: false,
      rowVersion: 'row-version-2',
      message: 'Deleted',
    });
  });

  it('sends restore with a null body and the current row version', () => {
    service.restoreService(100, 'row-version-2').subscribe();

    const endpoint = new URL('api/services/100/restore', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBeNull();
    expect(request.request.headers.get('If-Match')).toBe('row-version-2');
    request.flush({
      id: 100,
      isDeleted: false,
      isActive: true,
      effectiveIsActive: true,
      canIssueTicket: true,
      rowVersion: 'row-version-3',
      message: 'Restored',
    });
  });

  it('loads the dedicated central tree endpoint with its visibility flags', () => {
    service.getCentralServiceTree({ includeInactive: true, includeDeleted: false }).subscribe();
    const endpoint = new URL('api/services/central-tree', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne((candidate) => candidate.url === endpoint);
    expect(request.request.method).toBe('GET');
    expect(request.request.url).not.toContain('/tree');
    expect(request.request.params.get('includeInactive')).toBe('true');
    expect(request.request.params.get('includeDeleted')).toBe('false');
    request.flush([]);
  });
});
