import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BranchAdminsApiService } from '@features/branch-management/services/branch-admins-api/branch-admins-api.service';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import {
  CreateBranchAdminRequest,
  CreateBranchAdminResponse,
} from '@features/branch-management/models/branch-admin/branch-admin.model';

describe('BranchAdminsApiService', () => {
  let service: BranchAdminsApiService;
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
        BranchAdminsApiService,
        { provide: AuthSessionService, useValue: authSessionMock },
        { provide: AppLanguageStore, useValue: languageStoreMock },
      ],
    });

    service = TestBed.inject(BranchAdminsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates branch admin (POST /api/branches/{branchId}/admins)', () => {
    const branchId = 5;
    const requestPayload: CreateBranchAdminRequest = {
      userName: 'branch.admin.cairo',
      email: 'admin.cairo@qcontrol.com',
      nameEn: 'Cairo Branch Admin',
      nameAr: 'مدير فرع القاهرة',
      temporaryPassword: 'StrongPassword123!',
      phoneNumber: '01012345678',
    };

    const mockResponse: CreateBranchAdminResponse = {
      applicationUserId: 'guid-user-123',
      branchAdminId: 'guid-admin-123',
      branchId: 5,
      userName: 'branch.admin.cairo',
      email: 'admin.cairo@qcontrol.com',
      nameEn: 'Cairo Branch Admin',
      nameAr: 'مدير فرع القاهرة',
      phoneNumber: '01012345678',
      userType: 'BranchAdmin',
      roleName: 'Branch Administrator',
      isActive: true,
      isFirstLogin: true,
      createdByApplicationUserId: 'guid-super-admin',
      createdOnUtc: '2026-08-23T12:00:00Z',
      message: 'Created successfully',
    };

    service.createBranchAdmin(branchId, requestPayload).subscribe((res) => {
      expect(res.applicationUserId).toBe('guid-user-123');
      expect(res.branchId).toBe(5);
      expect(res.userName).toBe('branch.admin.cairo');
    });

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/5/admins'));
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-xyz');
    expect(req.request.headers.get('Accept-Language')).toBe('ar');
    expect(req.request.body).toEqual(requestPayload);
    req.flush(mockResponse);
  });
});
