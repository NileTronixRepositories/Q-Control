import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BranchBrandingApiService } from './branch-branding-api.service';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import {
  BranchAdvertisementDeleteResponse,
  BranchAdvertisementResponse,
  BranchAdvertisementStateResponse,
  BranchBrandingResponse,
  ReorderBranchAdvertisementsRequest,
  UpdateBranchThemeRequest,
} from '../models/branch-branding.model';

describe('BranchBrandingApiService', () => {
  let service: BranchBrandingApiService;
  let httpMock: HttpTestingController;
  let authSessionMock: { currentSession: () => { token: string } | null };
  let languageStoreMock: { language: () => 'ar' | 'en' };

  const createMockBrandingResponse = (
    overrides?: Partial<BranchBrandingResponse>,
  ): BranchBrandingResponse => ({
    branchId: 1,
    logoUrl: '/uploads/branches/1/logo.png',
    mainColor: '#1a365d',
    secondaryColor: '#2d3748',
    backgroundColor: '#ffffff',
    headerColor: '#1a365d',
    footerColor: '#2d3748',
    mainTextColor: '#000000',
    showLanguagePage: true,
    defaultLanguageIsArabic: true,
    alwaysRequireUserInput: false,
    showServiceNavigationPath: true,
    allowOperatorSelection: false,
    allowRequestMoreServices: false,
    languageButtonBackgroundColor: '#1a365d',
    languageButtonTextColor: '#ffffff',
    languageButtonWidth: 120,
    languageButtonHeight: 45,
    languageButtonText: null,
    serviceButtonBackgroundColor: '#1a365d',
    serviceButtonTextColor: '#ffffff',
    serviceButtonWidth: 140,
    serviceButtonHeight: 60,
    serviceButtonSpace: 10,
    serviceButtonFontSize: 16,
    serviceButtonText: null,
    keypadButtonBackgroundColor: '#1a365d',
    keypadButtonTextColor: '#ffffff',
    keypadButtonWidth: 60,
    keypadButtonHeight: 60,
    keypadButtonText: null,
    footerButtonBackgroundColor: '#1a365d',
    footerButtonTextColor: '#ffffff',
    footerButtonWidth: 120,
    footerButtonHeight: 45,
    footerButtonText: null,
    isConfigured: true,
    rowVersion: 'AAAAAAAAB9E=',
    message: null,
    ...overrides,
  });

  beforeEach(() => {
    TestBed.resetTestingModule();
    authSessionMock = {
      currentSession: () => ({ token: 'mock-token-xyz' }),
    };
    languageStoreMock = {
      language: () => 'ar',
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BranchBrandingApiService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(BranchBrandingApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches branch branding (GET /api/branches/{id}/branding)', () => {
    const mockBranding = createMockBrandingResponse();

    service.getBranchBranding(1).subscribe((res) => {
      expect(res.branchId).toBe(1);
      expect(res.headerColor).toBe('#1a365d');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/branding'));
    expect(req.request.method).toBe('GET');
    req.flush(mockBranding);
  });

  it('updates branch theme (PUT /api/branches/{id}/branding/theme)', () => {
    const updateThemeRequest: UpdateBranchThemeRequest = {
      mainColor: '#003366',
      secondaryColor: '#112233',
      backgroundColor: '#f8fafc',
      headerColor: '#003366',
      footerColor: '#112233',
      mainTextColor: '#0f172a',
      showLanguagePage: true,
      defaultLanguageIsArabic: true,
      alwaysRequireUserInput: false,
      showServiceNavigationPath: true,
      allowOperatorSelection: false,
      allowRequestMoreServices: false,
      rowVersion: 'AAAAAAAAB9E=',
    };

    const mockResponse = createMockBrandingResponse({
      headerColor: '#003366',
      rowVersion: 'AAAAAAAAB9F=',
    });

    service.updateBranchTheme(1, updateThemeRequest).subscribe((res) => {
      expect(res.headerColor).toBe('#003366');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/branding/theme'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateThemeRequest);
    req.flush(mockResponse);
  });

  it('uploads branch logo using FormData (PUT /api/branches/{id}/branding/logo)', () => {
    const file = new File(['dummy logo'], 'logo.png', { type: 'image/png' });
    const mockResponse = createMockBrandingResponse({
      logoUrl: '/uploads/branches/1/logo-new.png',
      rowVersion: 'AAAAAAAAB9G=',
    });

    service.uploadBranchLogo(1, file, 'AAAAAAAAB9F=').subscribe((res) => {
      expect(res.logoUrl).toContain('logo-new.png');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/branding/logo'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResponse);
  });

  it('fetches advertisements (GET /api/branches/{id}/advertisements)', () => {
    const mockAds: readonly BranchAdvertisementResponse[] = [
      {
        id: 1,
        branchId: 1,
        imageUrl: '/ads/ad1.png',
        displayOrder: 1,
        isActive: true,
        rowVersion: 'AAAAAAAAB9E=',
      },
    ];

    service.getBranchAdvertisements(1, true).subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].displayOrder).toBe(1);
    });

    const req = httpMock.expectOne(
      (r) =>
        r.url.endsWith('/api/branches/1/advertisements') && r.params.get('isActive') === 'true',
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockAds);
  });

  it('reorders advertisements (PUT /api/branches/{id}/advertisements/order)', () => {
    const reorderPayload: ReorderBranchAdvertisementsRequest = {
      items: [
        { advertisementId: 2, displayOrder: 1, rowVersion: 'v1' },
        { advertisementId: 1, displayOrder: 2, rowVersion: 'v2' },
      ],
    };

    const mockAdsResponse: readonly BranchAdvertisementResponse[] = [
      {
        id: 2,
        branchId: 1,
        imageUrl: '/ads/ad2.png',
        displayOrder: 1,
        isActive: true,
        rowVersion: 'v1_new',
      },
      {
        id: 1,
        branchId: 1,
        imageUrl: '/ads/ad1.png',
        displayOrder: 2,
        isActive: true,
        rowVersion: 'v2_new',
      },
    ];

    service.reorderBranchAdvertisements(1, reorderPayload).subscribe((res) => {
      expect(res[0].id).toBe(2);
      expect(res[0].displayOrder).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/advertisements/order'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(reorderPayload);
    req.flush(mockAdsResponse);
  });

  it('deactivates an advertisement (POST /api/branches/{id}/advertisements/{adId}/deactivate)', () => {
    const mockState: BranchAdvertisementStateResponse = {
      advertisementId: 5,
      branchId: 1,
      isActive: false,
      displayOrder: 1,
      rowVersion: 'v_deactivated',
      message: 'Deactivated',
    };

    service.deactivateBranchAdvertisement(1, 5, 'v_current').subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/advertisements/5/deactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('v_current');
    req.flush(mockState);
  });

  it('reactivates an advertisement (POST /api/branches/{id}/advertisements/{adId}/reactivate)', () => {
    const mockState: BranchAdvertisementStateResponse = {
      advertisementId: 5,
      branchId: 1,
      isActive: true,
      displayOrder: 1,
      rowVersion: 'v_reactivated',
      message: 'Reactivated',
    };

    service.reactivateBranchAdvertisement(1, 5, 'v_current').subscribe((res) => {
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/advertisements/5/reactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('v_current');
    req.flush(mockState);
  });

  it('deletes an advertisement (DELETE /api/branches/{id}/advertisements/{adId})', () => {
    const mockDelete: BranchAdvertisementDeleteResponse = {
      advertisementId: 5,
      branchId: 1,
      message: 'Deleted successfully',
    };

    service.deleteBranchAdvertisement(1, 5, 'v_current').subscribe((res) => {
      expect(res.message).toContain('Deleted');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/advertisements/5'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('If-Match')).toBe('v_current');
    req.flush(mockDelete);
  });
});
