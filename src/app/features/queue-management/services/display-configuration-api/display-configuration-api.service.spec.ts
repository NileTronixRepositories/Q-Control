import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DisplayConfigurationApiService } from './display-configuration-api.service';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import {
  CreateDisplayConfigurationRequest,
  CreateDisplayMessageRequest,
  DisplayConfigurationResponse,
  DisplayMessageResponse,
  DisplayMessageStateResponse,
  ReorderDisplayMessagesRequest,
  UpdateDisplayConfigurationRequest,
  UpdateDisplayMessageRequest,
} from '../../models/display-configuration/display-configuration.model';

describe('DisplayConfigurationApiService', () => {
  let service: DisplayConfigurationApiService;
  let httpMock: HttpTestingController;
  let authSessionMock: { currentSession: () => { token: string } | null };
  let languageStoreMock: { language: () => 'ar' | 'en' };

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
        DisplayConfigurationApiService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(DisplayConfigurationApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches display configuration (GET /api/branches/{id}/display-configuration)', () => {
    const mockConfig: DisplayConfigurationResponse = {
      id: 1,
      branchId: 5,
      mainTitleAr: 'مستشفى الشفاء',
      mainTitleEn: 'Al-Shifa Hospital',
      displayBackgroundColor: '#0a1128',
      headerBackgroundColor: '#001f54',
      mainTitleTextColor: '#ffffff',
      mainTitleFontSize: 28,
      tableHeaderBackgroundColor: '#0b8aa8',
      tableHeaderTextColor: '#ffffff',
      tableRowBackgroundColor: '#0a1128',
      tableRowTextColor: '#ffffff',
      ticketNumberBackgroundColor: '#0b8aa8',
      ticketNumberTextColor: '#ffffff',
      ticketColumnTitleAr: 'رقم التذكرة',
      ticketColumnTitleEn: 'Ticket',
      serviceColumnTitleAr: 'الخدمة',
      serviceColumnTitleEn: 'Service',
      windowColumnTitleAr: 'الشباك',
      windowColumnTitleEn: 'Window',
      tickerBackgroundColor: '#0b8aa8',
      tickerTextColor: '#ffffff',
      tickerFontSize: 18,
      showClock: true,
      clockBackgroundColor: '#034078',
      clockTextColor: '#ffffff',
      rowVersion: 'AAAAAAAAB9E=',
    };

    service.getDisplayConfiguration(5).subscribe((res) => {
      expect(res.branchId).toBe(5);
      expect(res.mainTitleAr).toBe('مستشفى الشفاء');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/display-configuration'));
    expect(req.request.method).toBe('GET');
    req.flush(mockConfig);
  });

  it('creates display configuration (POST /api/branches/{id}/display-configuration)', () => {
    const createReq: CreateDisplayConfigurationRequest = {
      mainTitleAr: 'مستشفى الشفاء',
      mainTitleEn: 'Al-Shifa Hospital',
      displayBackgroundColor: '#0a1128',
      headerBackgroundColor: '#001f54',
      mainTitleTextColor: '#ffffff',
      mainTitleFontSize: 28,
      tableHeaderBackgroundColor: '#0b8aa8',
      tableHeaderTextColor: '#ffffff',
      tableRowBackgroundColor: '#0a1128',
      tableRowTextColor: '#ffffff',
      ticketNumberBackgroundColor: '#0b8aa8',
      ticketNumberTextColor: '#ffffff',
      ticketColumnTitleAr: 'رقم التذكرة',
      ticketColumnTitleEn: 'Ticket',
      serviceColumnTitleAr: 'الخدمة',
      serviceColumnTitleEn: 'Service',
      windowColumnTitleAr: 'الشباك',
      windowColumnTitleEn: 'Window',
      tickerBackgroundColor: '#0b8aa8',
      tickerTextColor: '#ffffff',
      tickerFontSize: 18,
      showClock: true,
      clockBackgroundColor: '#034078',
      clockTextColor: '#ffffff',
    };

    const mockResponse: DisplayConfigurationResponse = {
      id: 1,
      branchId: 5,
      ...createReq,
      rowVersion: 'AAAAAAAAB9F=',
    };

    service.createDisplayConfiguration(5, createReq).subscribe((res) => {
      expect(res.id).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/display-configuration'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(mockResponse);
  });

  it('updates display configuration (PUT /api/branches/{id}/display-configuration)', () => {
    const updateReq: UpdateDisplayConfigurationRequest = {
      mainTitleAr: 'مستشفى الشفاء - رئيسي',
      mainTitleEn: 'Al-Shifa Hospital Main',
      displayBackgroundColor: '#0a1128',
      headerBackgroundColor: '#001f54',
      mainTitleTextColor: '#ffffff',
      mainTitleFontSize: 30,
      tableHeaderBackgroundColor: '#0b8aa8',
      tableHeaderTextColor: '#ffffff',
      tableRowBackgroundColor: '#0a1128',
      tableRowTextColor: '#ffffff',
      ticketNumberBackgroundColor: '#0b8aa8',
      ticketNumberTextColor: '#ffffff',
      ticketColumnTitleAr: 'رقم التذكرة',
      ticketColumnTitleEn: 'Ticket',
      serviceColumnTitleAr: 'الخدمة',
      serviceColumnTitleEn: 'Service',
      windowColumnTitleAr: 'الشباك',
      windowColumnTitleEn: 'Window',
      tickerBackgroundColor: '#0b8aa8',
      tickerTextColor: '#ffffff',
      tickerFontSize: 18,
      showClock: true,
      clockBackgroundColor: '#034078',
      clockTextColor: '#ffffff',
      rowVersion: 'AAAAAAAAB9F=',
    };

    const mockResponse: DisplayConfigurationResponse = {
      id: 1,
      branchId: 5,
      ...updateReq,
      rowVersion: 'AAAAAAAAB9G=',
    };

    service.updateDisplayConfiguration(5, updateReq).subscribe((res) => {
      expect(res.rowVersion).toBe('AAAAAAAAB9G=');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/display-configuration'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush(mockResponse);
  });

  it('fetches display messages (GET /api/branches/{id}/display-messages)', () => {
    const mockMessages: readonly DisplayMessageResponse[] = [
      {
        id: 1,
        branchId: 5,
        textAr: 'أهلاً بكم',
        textEn: 'Welcome',
        displayOrder: 1,
        isActive: true,
        rowVersion: 'AAAAAAAAB9E=',
      },
    ];

    service.getDisplayMessages(5).subscribe((res) => {
      expect(res.length).toBe(1);
      expect(res[0].textAr).toBe('أهلاً بكم');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/display-messages'));
    expect(req.request.method).toBe('GET');
    req.flush(mockMessages);
  });

  it('creates a display message (POST /api/branches/{id}/display-messages)', () => {
    const createReq: CreateDisplayMessageRequest = {
      textAr: 'رجاء الالتزام بالدور',
      textEn: 'Please wait for your turn',
      displayOrder: 2,
    };

    const mockMessage: DisplayMessageResponse = {
      id: 2,
      branchId: 5,
      textAr: 'رجاء الالتزام بالدور',
      textEn: 'Please wait for your turn',
      displayOrder: 2,
      isActive: true,
      rowVersion: 'AAAAAAAAB9E=',
    };

    service.createDisplayMessage(5, createReq).subscribe((res) => {
      expect(res.id).toBe(2);
      expect(res.displayOrder).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/display-messages'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(mockMessage);
  });

  it('updates a display message (PUT /api/branches/{id}/display-messages/{messageId})', () => {
    const updateReq: UpdateDisplayMessageRequest = {
      textAr: 'رجاء الالتزام بالدور المعدل',
      textEn: 'Please wait for your turn updated',
      displayOrder: 2,
      rowVersion: 'AAAAAAAAB9E=',
    };

    const mockMessage: DisplayMessageResponse = {
      id: 2,
      branchId: 5,
      textAr: 'رجاء الالتزام بالدور المعدل',
      textEn: 'Please wait for your turn updated',
      displayOrder: 2,
      isActive: true,
      rowVersion: 'AAAAAAAAB9F=',
    };

    service.updateDisplayMessage(5, 2, updateReq).subscribe((res) => {
      expect(res.rowVersion).toBe('AAAAAAAAB9F=');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/display-messages/2'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush(mockMessage);
  });

  it('reorders display messages (PUT /api/branches/{id}/display-messages/order)', () => {
    const reorderReq: ReorderDisplayMessagesRequest = {
      items: [
        { messageId: 2, displayOrder: 1, rowVersion: 'v1' },
        { messageId: 1, displayOrder: 2, rowVersion: 'v2' },
      ],
    };

    const mockResponse: readonly DisplayMessageResponse[] = [
      {
        id: 2,
        branchId: 5,
        textAr: 'Message 2',
        textEn: 'Message 2',
        displayOrder: 1,
        isActive: true,
        rowVersion: 'v1_new',
      },
      {
        id: 1,
        branchId: 5,
        textAr: 'Message 1',
        textEn: 'Message 1',
        displayOrder: 2,
        isActive: true,
        rowVersion: 'v2_new',
      },
    ];

    service.reorderDisplayMessages(5, reorderReq).subscribe((res) => {
      expect(res[0].id).toBe(2);
      expect(res[0].displayOrder).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/display-messages/order'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(reorderReq);
    req.flush(mockResponse);
  });

  it('deactivates a display message (POST /api/branches/{id}/display-messages/{messageId}/deactivate)', () => {
    const mockState: DisplayMessageStateResponse = {
      messageId: 2,
      branchId: 5,
      isActive: false,
      rowVersion: 'v_deact',
      message: 'Deactivated',
    };

    service.deactivateDisplayMessage(5, 2, 'v1').subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/branches/5/display-messages/2/deactivate'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('v1');
    req.flush(mockState);
  });

  it('reactivates a display message (POST /api/branches/{id}/display-messages/{messageId}/reactivate)', () => {
    const mockState: DisplayMessageStateResponse = {
      messageId: 2,
      branchId: 5,
      isActive: true,
      rowVersion: 'v_react',
      message: 'Reactivated',
    };

    service.reactivateDisplayMessage(5, 2, 'v_deact').subscribe((res) => {
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/branches/5/display-messages/2/reactivate'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('v_deact');
    req.flush(mockState);
  });
});
