import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BranchManagementApiService } from '@features/branch-management/services/branch-management-api/branch-management-api.service';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import {
  BranchDetails,
  BranchLifecycleResponse,
  BranchListItem,
  BranchMutationResponse,
  BranchPermanentDeleteResponse,
  CreateBranchRequest,
  PagedBranchResponse,
  UpdateBranchRequest,
} from '@features/branch-management/models/branch-management/branch-management.model';

describe('BranchManagementApiService', () => {
  let service: BranchManagementApiService;
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
        BranchManagementApiService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(BranchManagementApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches branches with pagination and filters (GET /api/branches)', () => {
    const mockPagedResponse: PagedBranchResponse<BranchListItem> = {
      currentPage: 1,
      pageSize: 10,
      totalItems: 1,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
      data: [
        {
          branchId: 1,
          arabicName: 'فرع القاهرة',
          englishName: 'Cairo Branch',
          ipAddress: '192.168.1.1',
          governorate: 'Cairo',
          city: 'Nasr City',
          createdBy: null,
          createdOnUtc: '2026-08-23T12:00:00Z',
          lastModifiedBy: null,
          modifiedOnUtc: null,
          isActive: true,
          effectiveIsActive: true,
          rowVersion: 'AAAAAAAAB9E=',
        },
      ],
    };

    service
      .getBranches({
        pageNumber: 1,
        pageSize: 10,
        orderSort: 'Newest',
        searchText: 'القاهرة',
        isActive: true,
      })
      .subscribe((res) => {
        expect(res.data.length).toBe(1);
        expect(res.data[0].arabicName).toBe('فرع القاهرة');
      });

    const req = httpMock.expectOne((request) => request.url.endsWith('/api/branches'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('PageNumber')).toBe('1');
    expect(req.request.params.get('PageSize')).toBe('10');
    expect(req.request.params.get('SearchText')).toBe('القاهرة');
    expect(req.request.params.get('IsActive')).toBe('true');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-xyz');
    req.flush(mockPagedResponse);
  });

  it('fetches branch details by id (GET /api/branches/{id})', () => {
    const mockDetails: BranchDetails = {
      branchId: 1,
      arabicName: 'فرع القاهرة',
      englishName: 'Cairo Branch',
      ipAddress: '192.168.1.1',
      governorate: 'Cairo',
      city: 'Nasr City',
      createdBy: null,
      createdOnUtc: '2026-08-23T12:00:00Z',
      lastModifiedBy: null,
      modifiedOnUtc: null,
      license: 'LIC-12345',
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9E=',
      location: {
        governorate: 'Cairo',
        city: 'Nasr City',
        area: 'Zone 1',
        address: 'Street 9',
        latitude: 30.0444,
        longitude: 31.2357,
      },
    };

    service.getBranchDetails(1).subscribe((res) => {
      expect(res.branchId).toBe(1);
      expect(res.arabicName).toBe('فرع القاهرة');
      expect(res.location?.governorate).toBe('Cairo');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1'));
    expect(req.request.method).toBe('GET');
    req.flush(mockDetails);
  });

  it('creates a new branch (POST /api/branches)', () => {
    const createPayload: CreateBranchRequest = {
      arabicName: 'فرع الإسكندرية',
      englishName: 'Alexandria Branch',
      ipAddress: '192.168.2.1',
      license: null,
      location: {
        governorate: 'Alexandria',
        city: 'Sidi Gaber',
        area: 'Corniche',
        address: 'Fleet St',
        latitude: 31.2001,
        longitude: 29.9187,
      },
    };

    const mockMutationResponse: BranchMutationResponse = {
      branchId: 2,
      arabicName: 'فرع الإسكندرية',
      englishName: 'Alexandria Branch',
      ipAddress: '192.168.2.1',
      license: null,
      location: createPayload.location,
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9F=',
      message: 'Created successfully',
    };

    service.createBranch(createPayload).subscribe((res) => {
      expect(res.branchId).toBe(2);
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(createPayload);
    req.flush(mockMutationResponse);
  });

  it('updates an existing branch (PUT /api/branches/{id})', () => {
    const updatePayload: UpdateBranchRequest = {
      arabicName: 'فرع القاهرة المحدث',
      englishName: 'Cairo Updated Branch',
      ipAddress: '192.168.1.20',
      license: 'LIC-999',
      rowVersion: 'AAAAAAAAB9E=',
      location: {
        governorate: 'Cairo',
        city: 'Nasr City',
        area: 'Zone 1',
        address: 'Street 9',
        latitude: 30.0444,
        longitude: 31.2357,
      },
    };

    const mockMutationResponse: BranchMutationResponse = {
      branchId: 1,
      arabicName: 'فرع القاهرة المحدث',
      englishName: 'Cairo Updated Branch',
      ipAddress: '192.168.1.20',
      license: 'LIC-999',
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9G=',
      message: 'Updated successfully',
    };

    service.updateBranch(1, updatePayload).subscribe((res) => {
      expect(res.rowVersion).toBe('AAAAAAAAB9G=');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1'));
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updatePayload);
    req.flush(mockMutationResponse);
  });

  it('deactivates a branch (POST /api/branches/{id}/deactivate)', () => {
    const mockLifecycle: BranchLifecycleResponse = {
      id: 1,
      isActive: false,
      effectiveIsActive: false,
      rowVersion: 'AAAAAAAAB9H=',
      message: 'Branch deactivated successfully',
    };

    service.deactivateBranch(1, 'AAAAAAAAB9E=').subscribe((res) => {
      expect(res.isActive).toBe(false);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/deactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9E=');
    req.flush(mockLifecycle);
  });

  it('reactivates a branch (POST /api/branches/{id}/reactivate)', () => {
    const mockLifecycle: BranchLifecycleResponse = {
      id: 1,
      isActive: true,
      effectiveIsActive: true,
      rowVersion: 'AAAAAAAAB9I=',
      message: 'Branch reactivated successfully',
    };

    service.reactivateBranch(1, 'AAAAAAAAB9H=').subscribe((res) => {
      expect(res.isActive).toBe(true);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/reactivate'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9H=');
    req.flush(mockLifecycle);
  });

  it('permanently deletes a branch (DELETE /api/branches/{id}/permanent)', () => {
    const mockPermanent: BranchPermanentDeleteResponse = {
      id: 1,
      message: 'Branch deleted permanently',
    };

    service.permanentlyDeleteBranch(1, 'AAAAAAAAB9I=').subscribe((res) => {
      expect(res.id).toBe(1);
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/1/permanent'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9I=');
    req.flush(mockPermanent);
  });
});
