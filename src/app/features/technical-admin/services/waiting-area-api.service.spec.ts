import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { WaitingAreaApiService } from './waiting-area-api.service';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import {
  CreateWaitingAreaRequest,
  Pagination,
  UpdateWaitingAreaRequest,
  WaitingAreaDetails,
  WaitingAreaLifecycleResponse,
  WaitingAreaListItem,
  WaitingAreaMutationResponse,
  WaitingAreaPermanentDeleteResponse,
} from '../models/waiting-area.model';

describe('WaitingAreaApiService', () => {
  let service: WaitingAreaApiService;
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
        WaitingAreaApiService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(WaitingAreaApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches waiting areas (GET /api/waiting-areas)', () => {
    const mockPaged: Pagination<WaitingAreaListItem> = {
      currentPage: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      data: [
        {
          id: 1,
          branchId: 5,
          branchArabicName: 'فرع القاهرة',
          branchEnglishName: 'Cairo Branch',
          number: 1,
          descriptiveName: 'صالة الاستقبال الرئيسية',
          audioDevice: null,
          controlDevice: null,
          windowsCount: 5,
          isActive: true,
          effectiveIsActive: true,
          rowVersion: 'AAAAAAAAB9E=',
        },
      ],
    };

    service
      .getWaitingAreas({
        branchId: 5,
        pageNumber: 1,
        pageSize: 10,
        search: 'استقبال',
        isActive: true,
      })
      .subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].descriptiveName).toBe('صالة الاستقبال الرئيسية');
      });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/waiting-areas'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('branchId')).toBe('5');
    expect(req.request.params.get('search')).toBe('استقبال');
    req.flush(mockPaged);
  });

  it('fetches waiting area details (GET /api/waiting-areas/{id})', () => {
    const mockDetails: WaitingAreaDetails = {
      id: 1,
      branchId: 5,
      branchArabicName: 'فرع القاهرة',
      branchEnglishName: 'Cairo Branch',
      number: 1,
      descriptiveName: 'صالة الاستقبال الرئيسية',
      audioDevice: null,
      controlDevice: null,
      windowsCount: 5,
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9E=',
    };

    service.getWaitingAreaDetails(1).subscribe((res) => {
      expect(res.id).toBe(1);
      expect(res.descriptiveName).toBe('صالة الاستقبال الرئيسية');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/waiting-areas/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockDetails);
  });

  it('creates waiting area (POST /api/waiting-areas)', () => {
    const createReq: CreateWaitingAreaRequest = {
      branchId: 5,
      number: 2,
      descriptiveName: 'صالة كبار السن',
    };

    const mockMutation: WaitingAreaMutationResponse = {
      id: 2,
      branchId: 5,
      number: 2,
      descriptiveName: 'صالة كبار السن',
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9F=',
      message: 'Created successfully',
    };

    service.createWaitingArea(createReq).subscribe((res) => {
      expect(res.id).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/waiting-areas'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(mockMutation);
  });

  it('updates waiting area (PUT /api/waiting-areas/{id})', () => {
    const updateReq: UpdateWaitingAreaRequest = {
      number: 2,
      descriptiveName: 'صالة كبار السن المحدثة',
      rowVersion: 'AAAAAAAAB9F=',
    };

    const mockMutation: WaitingAreaMutationResponse = {
      id: 2,
      branchId: 5,
      number: 2,
      descriptiveName: 'صالة كبار السن المحدثة',
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9G=',
      message: 'Updated successfully',
    };

    service.updateWaitingArea(2, updateReq).subscribe((res) => {
      expect(res.rowVersion).toBe('AAAAAAAAB9G=');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/waiting-areas/2'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush(mockMutation);
  });

  it('deactivates waiting area (POST /api/waiting-areas/{id}/deactivate)', () => {
    const mockLifecycle: WaitingAreaLifecycleResponse = {
      id: 2,
      isActive: false,
      effectiveIsActive: false,
      rowVersion: 'AAAAAAAAB9H=',
      message: 'Deactivated',
    };

    service.deactivateWaitingArea(2, 'AAAAAAAAB9G=').subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/waiting-areas/2/deactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9G=');
    req.flush(mockLifecycle);
  });

  it('reactivates waiting area (POST /api/waiting-areas/{id}/reactivate)', () => {
    const mockLifecycle: WaitingAreaLifecycleResponse = {
      id: 2,
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9I=',
      message: 'Reactivated',
    };

    service.reactivateWaitingArea(2, 'AAAAAAAAB9H=').subscribe((res) => {
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/waiting-areas/2/reactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9H=');
    req.flush(mockLifecycle);
  });

  it('permanently deletes waiting area (DELETE /api/waiting-areas/{id}/permanent)', () => {
    const mockDelete: WaitingAreaPermanentDeleteResponse = {
      id: 2,
      message: 'Deleted permanently',
    };

    service.permanentlyDeleteWaitingArea(2, 'AAAAAAAAB9I=').subscribe((res) => {
      expect(res.id).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/waiting-areas/2/permanent'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9I=');
    req.flush(mockDelete);
  });
});
