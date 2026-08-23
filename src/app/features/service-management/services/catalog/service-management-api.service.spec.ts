import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { ServiceManagementApiService } from './service-management-api.service';

describe('ServiceManagementApiService lifecycle requests', () => {
  let service: ServiceManagementApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
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

  it('trims service tree searchText and preserves existing filters', () => {
    service
      .getServiceTree({
        includeInactive: true,
        includeDeleted: false,
        scope: 'BranchScoped',
        ownerBranchId: 7,
        isAssignedToCurrentBranch: true,
        searchText: '  certificate  ',
      })
      .subscribe();

    const endpoint = new URL('api/services/tree', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne((candidate) => candidate.url === endpoint);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('includeInactive')).toBe('true');
    expect(request.request.params.get('includeDeleted')).toBe('false');
    expect(request.request.params.get('scope')).toBe('BranchScoped');
    expect(request.request.params.get('ownerBranchId')).toBe('7');
    expect(request.request.params.get('isAssignedToCurrentBranch')).toBe('true');
    expect(request.request.params.get('searchText')).toBe('certificate');
    request.flush([]);
  });

  it('omits empty service tree searchText', () => {
    service
      .getServiceTree({ includeInactive: false, includeDeleted: true, searchText: '   ' })
      .subscribe();

    const endpoint = new URL('api/services/tree', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne((candidate) => candidate.url === endpoint);

    expect(request.request.params.has('searchText')).toBe(false);
    expect(request.request.params.get('includeInactive')).toBe('false');
    expect(request.request.params.get('includeDeleted')).toBe('true');
    request.flush([]);
  });
  it('updates a service through the shared service endpoint with language and auth headers', () => {
    const body = {
      parentServiceId: null,
      arabicName: 'خدمة',
      englishName: 'Service',
      arabicUserMessage: null,
      englishUserMessage: null,
      serviceCode: 'SVC-1',
      isServiceCodeRequired: true,
      isTicketIssuable: true,
      isClientInputRequired: false,
      hasReservation: false,
      orderNo: 1,
      priority: 2,
      weight: 0,
      rangePrefix: 'S',
      rangeStartNumber: 1,
      rangeEndNumber: 99,
      waitingDuration: 0,
      noOfTicketCopies: 1,
      rowVersion: 'service-rv-1',
    };

    service.updateService(122, body).subscribe();

    const endpoint = new URL('api/services/122', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(body);
    expect(request.request.headers.get('Authorization')).toBe('Bearer branch-admin-token');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');
    request.flush({ id: 122, rowVersion: 'service-rv-2', message: 'Updated' });
  });
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

  it('sends permanent delete with no body and the current row version', () => {
    service.permanentlyDeleteService(100, 'row-version-3').subscribe();

    const endpoint = new URL('api/services/100/permanent', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);

    expect(request.request.method).toBe('DELETE');
    expect(request.request.body).toBeNull();
    expect(request.request.headers.get('If-Match')).toBe('row-version-3');
    expect(request.request.headers.get('Authorization')).toBe('Bearer branch-admin-token');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    request.flush({ serviceId: 100, message: 'Deleted permanently' });
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

  it('loads service images with an optional image type filter', () => {
    service.getServiceImages(12, 'Logo').subscribe();

    const endpoint = new URL('api/services/12/images', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne((candidate) => candidate.url === endpoint);

    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('imageType')).toBe('Logo');
    expect(request.request.headers.get('Accept-Language')).toBe('en');
    request.flush([]);
  });

  it('uploads service logo and icon using image field and service row version', () => {
    const logo = new File(['logo'], 'logo.png', { type: 'image/png' });
    const icon = new File(['icon'], 'icon.webp', { type: 'image/webp' });

    service.uploadServiceLogo(12, logo, 'service-rv-1').subscribe();
    service.uploadServiceIcon(12, icon, 'service-rv-2').subscribe();

    const logoEndpoint = new URL('api/services/12/images/logo', environment.apiBaseUrl).toString();
    const iconEndpoint = new URL('api/services/12/images/icon', environment.apiBaseUrl).toString();
    const logoRequest = httpTestingController.expectOne(logoEndpoint);
    const iconRequest = httpTestingController.expectOne(iconEndpoint);

    expect(logoRequest.request.method).toBe('POST');
    expect(logoRequest.request.body.get('Image')).toBe(logo);
    expect(logoRequest.request.body.get('RowVersion')).toBe('service-rv-1');
    expect(logoRequest.request.headers.has('Content-Type')).toBe(false);
    expect(iconRequest.request.method).toBe('POST');
    expect(iconRequest.request.body.get('Image')).toBe(icon);
    expect(iconRequest.request.body.get('RowVersion')).toBe('service-rv-2');
    logoRequest.flush(createImageResponse(1, 'Logo'));
    iconRequest.flush(createImageResponse(2, 'Icon'));
  });

  it('uploads advertisement images using repeated Images fields', () => {
    const first = new File(['a'], 'ad-1.jpg', { type: 'image/jpeg' });
    const second = new File(['b'], 'ad-2.webp', { type: 'image/webp' });

    service.uploadServiceAds(12, [first, second], 'service-rv-3').subscribe();

    const endpoint = new URL('api/services/12/images/ads', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);

    expect(request.request.method).toBe('POST');
    expect(request.request.body.getAll('Images')).toEqual([first, second]);
    expect(request.request.body.get('RowVersion')).toBe('service-rv-3');
    request.flush([createImageResponse(3, 'Ads')]);
  });

  it('deletes a service image with the image row version', () => {
    service.deleteServiceImage(12, 99, 'image-rv').subscribe();

    const endpoint = new URL('api/services/12/images/99', environment.apiBaseUrl).toString();
    const request = httpTestingController.expectOne(endpoint);

    expect(request.request.method).toBe('DELETE');
    expect(request.request.headers.get('If-Match')).toBe('image-rv');
    request.flush({ id: 99, serviceId: 12, imageType: 'Ads', message: 'Deleted' });
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
function createImageResponse(id: number, imageType: 'Logo' | 'Icon' | 'Ads') {
  return {
    id,
    serviceId: 12,
    imageUrl: `/Media/Services/12/${imageType}/${id}.webp`,
    imageType,
    displayOrder: id,
    isActive: true,
    rowVersion: `image-rv-${id}`,
    message: null,
  };
}
