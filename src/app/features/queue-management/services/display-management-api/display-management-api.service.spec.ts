import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DisplayManagementApiService } from './display-management-api.service';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import {
  AvailableDisplayWindowResponse,
  CreateDisplayRequest,
  CreateDisplayResponse,
  DisplayDetailsResponse,
  DisplayLifecycleResponse,
  DisplayListItemResponse,
  DisplayWindowListItemResponse,
  PaginationResponse,
  PermanentDeleteDisplayResponse,
  UpdateDisplayRequest,
  UpdateDisplayResponse,
} from '../../models/display-management/display-management.model';

describe('DisplayManagementApiService', () => {
  let service: DisplayManagementApiService;
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
        DisplayManagementApiService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(DisplayManagementApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches displays list (GET /api/displays)', () => {
    const mockPaged: PaginationResponse<DisplayListItemResponse> = {
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
          number: 'DISP-01',
          ipAddress: '192.168.1.50',
          serialNo: 'SN-12345',
          type: 'LED',
          isActive: true,
          effectiveIsActive: true,
          rowVersion: 'AAAAAAAAB9E=',
        },
      ],
    };

    service
      .getDisplays({
        branchId: 5,
        pageNumber: 1,
        pageSize: 10,
        search: 'DISP',
        isActive: true,
      })
      .subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].number).toBe('DISP-01');
      });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('branchId')).toBe('5');
    expect(req.request.params.get('search')).toBe('DISP');
    req.flush(mockPaged);
  });

  it('fetches display details by ID (GET /api/displays/{id})', () => {
    const mockDetails: DisplayDetailsResponse = {
      id: 1,
      branchId: 5,
      branchArabicName: 'فرع القاهرة',
      branchEnglishName: 'Cairo Branch',
      number: 'DISP-01',
      ipAddress: '192.168.1.50',
      serialNo: 'SN-12345',
      type: 'LED',
      createdOnUtc: '2026-08-23T12:00:00Z',
      modifiedOnUtc: null,
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9E=',
    };

    service.getDisplayById(1).subscribe((res) => {
      expect(res.id).toBe(1);
      expect(res.number).toBe('DISP-01');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockDetails);
  });

  it('creates a display (POST /api/displays)', () => {
    const createReq: CreateDisplayRequest = {
      branchId: 5,
      number: 'DISP-02',
      ipAddress: '192.168.1.51',
      serialNo: 'SN-12346',
      type: 'LCD',
    };

    const mockResponse: CreateDisplayResponse = {
      id: 2,
      branchId: 5,
      number: 'DISP-02',
      ipAddress: '192.168.1.51',
      serialNo: 'SN-12346',
      type: 'LCD',
      createdByApplicationUserId: 'guid-admin',
      createdOnUtc: '2026-08-23T12:00:00Z',
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9F=',
      message: 'Created successfully',
    };

    service.createDisplay(createReq).subscribe((res) => {
      expect(res.id).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createReq);
    req.flush(mockResponse);
  });

  it('updates a display (PUT /api/displays/{id})', () => {
    const updateReq: UpdateDisplayRequest = {
      number: 'DISP-02-UPDATED',
      ipAddress: '192.168.1.52',
      serialNo: 'SN-12346',
      type: 'LCD',
      rowVersion: 'AAAAAAAAB9F=',
    };

    const mockResponse: UpdateDisplayResponse = {
      id: 2,
      branchId: 5,
      number: 'DISP-02-UPDATED',
      ipAddress: '192.168.1.52',
      serialNo: 'SN-12346',
      type: 'LCD',
      lastModifiedByApplicationUserId: 'guid-admin',
      modifiedOnUtc: '2026-08-23T13:00:00Z',
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9G=',
      message: 'Updated successfully',
    };

    service.updateDisplay(2, updateReq).subscribe((res) => {
      expect(res.rowVersion).toBe('AAAAAAAAB9G=');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays/2'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateReq);
    req.flush(mockResponse);
  });

  it('deactivates a display (POST /api/displays/{id}/deactivate)', () => {
    const mockState: DisplayLifecycleResponse = {
      id: 2,
      isActive: false,
      effectiveIsActive: false,
      rowVersion: 'AAAAAAAAB9H=',
      message: 'Deactivated',
    };

    service.deactivateDisplay(2, 'AAAAAAAAB9G=').subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays/2/deactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9G=');
    req.flush(mockState);
  });

  it('reactivates a display (POST /api/displays/{id}/reactivate)', () => {
    const mockState: DisplayLifecycleResponse = {
      id: 2,
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9I=',
      message: 'Reactivated',
    };

    service.reactivateDisplay(2, 'AAAAAAAAB9H=').subscribe((res) => {
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays/2/reactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9H=');
    req.flush(mockState);
  });

  it('permanently deletes a display (DELETE /api/displays/{id}/permanent)', () => {
    const mockDelete: PermanentDeleteDisplayResponse = {
      id: 2,
      message: 'Deleted permanently',
    };

    service.permanentlyDeleteDisplay(2, 'AAAAAAAAB9I=').subscribe((res) => {
      expect(res.id).toBe(2);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays/2/permanent'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9I=');
    req.flush(mockDelete);
  });

  it('fetches linked windows for a display (GET /api/displays/{id}/windows)', () => {
    const mockWindows: readonly DisplayWindowListItemResponse[] = [
      {
        id: 1,
        windowId: 10,
        windowNumber: '1',
        waitingAreaId: 1,
        waitingAreaNumber: 1,
        descriptiveName: 'شباك 1',
        isActive: true,
        effectiveIsActive: true,
        rowVersion: 'v1',
      },
    ];

    service.getLinkedWindows(1).subscribe((res) => {
      expect(res.length).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays/1/windows'));
    expect(req.request.method).toBe('GET');
    req.flush(mockWindows);
  });

  it('fetches available windows for a display (GET /api/displays/{id}/available-windows)', () => {
    const mockAvailable: PaginationResponse<AvailableDisplayWindowResponse> = {
      currentPage: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      data: [
        {
          id: 11,
          windowId: 11,
          windowNumber: '2',
          waitingAreaId: 1,
          waitingAreaNumber: 1,
          descriptiveName: 'شباك 2',
          isActive: true,
          effectiveIsActive: true,
          rowVersion: 'v1',
        },
      ],
    };

    service.getAvailableWindows(1, { pageNumber: 1, pageSize: 10 }).subscribe((res) => {
      expect(res.data.length).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/displays/1/available-windows'));
    expect(req.request.method).toBe('GET');
    req.flush(mockAvailable);
  });

  it('assigns and unassigns a window to a display (POST / DELETE /api/displays/{id}/windows/{windowId})', () => {
    service.assignWindow(1, 11).subscribe();
    const postReq = httpMock.expectOne((r) => r.url.endsWith('/api/displays/1/windows/11'));
    expect(postReq.request.method).toBe('POST');
    postReq.flush(null);

    service.unassignWindow(1, 11).subscribe();
    const delReq = httpMock.expectOne((r) => r.url.endsWith('/api/displays/1/windows/11'));
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);
  });
});
