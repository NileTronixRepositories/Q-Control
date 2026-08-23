import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { GeneralBrandApiService } from './general-brand-api.service';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import {
  CreateGeneralBrandRequest,
  GeneralBrandResponse,
  UpdateGeneralBrandRequest,
} from '../models/general-brand.model';

describe('GeneralBrandApiService', () => {
  let service: GeneralBrandApiService;
  let httpMock: HttpTestingController;
  let authSessionMock: { currentSession: () => { token: string } | null };
  let languageStoreMock: { language: () => 'ar' | 'en' };

  const createMockGeneralBrandResponse = (
    overrides?: Partial<GeneralBrandResponse>,
  ): GeneralBrandResponse => ({
    id: 1,
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
        GeneralBrandApiService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(GeneralBrandApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches general brand configuration (GET /api/general-brand)', () => {
    const mockBrand = createMockGeneralBrandResponse();

    service.getGeneralBrand().subscribe((res) => {
      expect(res.id).toBe(1);
      expect(res.headerColor).toBe('#1a365d');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/general-brand'));
    expect(req.request.method).toBe('GET');
    req.flush(mockBrand);
  });

  it('creates general brand (POST /api/general-brand)', () => {
    const createReq: CreateGeneralBrandRequest = {
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
    };

    const mockResponse = createMockGeneralBrandResponse({
      rowVersion: 'AAAAAAAAB9F=',
    });

    service.createGeneralBrand(createReq).subscribe((res) => {
      expect(res.id).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/general-brand'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(mockResponse);
  });

  it('updates general brand (PUT /api/general-brand)', () => {
    const updateReq: UpdateGeneralBrandRequest = {
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
      rowVersion: 'AAAAAAAAB9F=',
    };

    const mockResponse = createMockGeneralBrandResponse({
      headerColor: '#003366',
      rowVersion: 'AAAAAAAAB9G=',
    });

    service.updateGeneralBrand(updateReq).subscribe((res) => {
      expect(res.rowVersion).toBe('AAAAAAAAB9G=');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/general-brand'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9F=');
    req.flush(mockResponse);
  });
});
