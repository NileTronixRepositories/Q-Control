import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ServiceRequestService } from './service-request.service';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { TicketIssuableServicesResponse } from '../../models/service-request-api/service-request-api.model';

describe('ServiceRequestService', () => {
  let service: ServiceRequestService;
  let httpMock: HttpTestingController;
  let authSessionMock: { currentSession: () => { token: string } | null };
  let languageStoreMock: { language: () => 'ar' | 'en' };

  beforeEach(() => {
    TestBed.resetTestingModule();
    authSessionMock = {
      currentSession: () => null,
    };
    languageStoreMock = {
      language: () => 'ar',
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ServiceRequestService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(ServiceRequestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches ticket-issuable services anonymously and maps hierarchical structure', () => {
    const branchId = 7;
    const mockApiResponse: TicketIssuableServicesResponse = {
      branchId: 7,
      branchBranding: {
        logoUrl: '/uploads/branches/7/logo.png',
        theme: {
          mainColor: '#1a365d',
          secondaryColor: '#2d3748',
          backgroundColor: '#ffffff',
          headerColor: '#1a365d',
          footerColor: '#2d3748',
          mainTextColor: '#000000',
        },
        behavior: {
          showLanguagePage: true,
          defaultLanguageIsArabic: true,
          alwaysRequireUserInput: false,
          showServiceNavigationPath: true,
          allowOperatorSelection: false,
          allowRequestMoreServices: false,
        },
        languageButton: {
          backgroundColor: '#1a365d',
          textColor: '#ffffff',
          width: 120,
          height: 45,
          text: null,
        },
        serviceButton: {
          backgroundColor: '#1a365d',
          textColor: '#ffffff',
          width: 140,
          height: 60,
          space: 10,
          fontSize: 16,
          text: null,
        },
        keypadButton: {
          backgroundColor: '#1a365d',
          textColor: '#ffffff',
          width: 60,
          height: 60,
          text: null,
        },
        footerButton: {
          backgroundColor: '#1a365d',
          textColor: '#ffffff',
          width: 120,
          height: 45,
          text: null,
        },
      },
      services: [
        {
          serviceId: 100,
          arabicName: 'العيادات الخارجية',
          englishName: 'Outpatient Clinics',
          arabicUserMessage: 'أهلاً بكم في العيادات',
          englishUserMessage: 'Welcome to OPD',
          rangePrefix: 'OPD',
          rangeStartNumber: 100,
          rangeEndNumber: 999,
          isTicketIssuable: false,
          isClientInputRequired: false,
          customInputs: null,
          children: [
            {
              serviceId: 101,
              arabicName: 'عيادة الباطنة',
              englishName: 'Internal Medicine',
              arabicUserMessage: null,
              englishUserMessage: null,
              rangePrefix: 'IM',
              rangeStartNumber: 100,
              rangeEndNumber: 999,
              isTicketIssuable: true,
              isClientInputRequired: true,
              customInputs: [
                {
                  name: 'NationalID',
                  labelAr: 'الرقم القومي',
                  labelEn: 'National ID',
                  type: 'Integer',
                  isRequired: true,
                  order: 1,
                  minLength: 14,
                  maxLength: 14,
                },
              ],
              children: [],
            },
          ],
        },
        {
          serviceId: 200,
          arabicName: 'معمل التحاليل',
          englishName: 'Laboratory',
          arabicUserMessage: null,
          englishUserMessage: null,
          rangePrefix: 'LAB',
          rangeStartNumber: 200,
          rangeEndNumber: 999,
          isTicketIssuable: true,
          isClientInputRequired: false,
          customInputs: null,
          children: [],
        },
      ],
    };

    service.loadBranchServices(branchId).subscribe((mapped) => {
      expect(mapped.branchId).toBe(7);
      expect(mapped.serviceTypes.length).toBe(2);
      expect(mapped.serviceTypes[0].name.ar).toBe('العيادات الخارجية');
      expect(mapped.serviceTypes[0].isTicketIssuable).toBe(false);
      expect(mapped.serviceTypes[1].name.ar).toBe('معمل التحاليل');
      expect(mapped.serviceTypes[1].isTicketIssuable).toBe(true);

      const specialties = mapped.specialtiesMap.get('100');
      expect(specialties).toBeDefined();
      expect(specialties?.length).toBe(1);
      expect(specialties?.[0].name.ar).toBe('عيادة الباطنة');
      expect(specialties?.[0].customInputs?.length).toBe(1);
      expect(specialties?.[0].customInputs?.[0].name).toBe('NationalID');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/7/ticket-issuable-services'));
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Accept-Language')).toBe('ar');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(mockApiResponse);
  });
});
