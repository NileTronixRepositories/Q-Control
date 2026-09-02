import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore, AuthSessionService } from '@core';
import { BranchConfigurationApiService } from '@features/branch-management/services/branch-configuration-api/branch-configuration-api.service';
import {
  BranchConfigurationResponse,
  CreateBranchConfigurationRequest,
  UpdateBranchConfigurationRequest,
} from '@features/branch-management/models/branch-configuration/branch-configuration.model';

describe('BranchConfigurationApiService', () => {
  let service: BranchConfigurationApiService;
  let httpTestingController: HttpTestingController;
  const mockSessionSignal = signal<any>(null);
  const mockLanguageSignal = signal<'en' | 'ar'>('en');

  const mockAuthSessionService = {
    currentSession: mockSessionSignal,
    activeSession: mockSessionSignal,
  };

  const mockAppLanguageStore = {
    language: mockLanguageSignal,
  };

  beforeEach(() => {
    mockSessionSignal.set({
      userType: 'TechnicalAdmin',
      token: 'test-token-jwt',
      userId: 1,
      userName: 'admin',
      email: 'admin@test.com',
      displayName: 'Admin',
      expiresAt: new Date(Date.now() + 10000),
      firstLoginFlag: false,
    });
    mockLanguageSignal.set('en');

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BranchConfigurationApiService,
        { provide: AuthSessionService, useValue: mockAuthSessionService },
        { provide: AppLanguageStore, useValue: mockAppLanguageStore },
      ],
    });

    service = TestBed.inject(BranchConfigurationApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should call GET /api/branches/{branchId}/configuration with authorization and language headers', () => {
    const mockResponse: BranchConfigurationResponse = {
      branchId: 1,
      allowedTime: '00:30:00',
      maximumTicketCallAttempts: 5,
      ticketNoShowAutoCancellationMinutes: 30,
      ticketArchiveRetentionDays: 30,
      isConfigured: true,
      rowVersion: 'AAAAAAAAB9E=',
      message: null,
    };

    service.getBranchConfiguration(1).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const expectedUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/api/branches/1/configuration`;
    const req = httpTestingController.expectOne(expectedUrl);

    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-jwt');
    expect(req.request.headers.get('Accept-Language')).toBe('en');
    req.flush(mockResponse);
  });

  it('should call POST /api/branches/{branchId}/configuration when creating configuration', () => {
    const payload: CreateBranchConfigurationRequest = {
      allowedTime: '00:30:00',
      maximumTicketCallAttempts: 5,
      ticketNoShowAutoCancellationMinutes: 30,
      ticketArchiveRetentionDays: 30,
    };
    const mockResponse: BranchConfigurationResponse = {
      branchId: 1,
      allowedTime: '00:30:00',
      maximumTicketCallAttempts: 5,
      ticketNoShowAutoCancellationMinutes: 30,
      ticketArchiveRetentionDays: 30,
      isConfigured: true,
      rowVersion: 'AAAAAAAAB9E=',
      message: 'Created successfully.',
    };

    service.createBranchConfiguration(1, payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const expectedUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/api/branches/1/configuration`;
    const req = httpTestingController.expectOne(expectedUrl);

    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should call PUT /api/branches/{branchId}/configuration with rowVersion in request body when updating', () => {
    const payload: UpdateBranchConfigurationRequest = {
      allowedTime: '00:45:00',
      maximumTicketCallAttempts: 6,
      ticketNoShowAutoCancellationMinutes: 45,
      ticketArchiveRetentionDays: 60,
      rowVersion: 'AAAAAAAAB9E=',
    };
    const mockResponse: BranchConfigurationResponse = {
      branchId: 1,
      allowedTime: '00:45:00',
      maximumTicketCallAttempts: 6,
      ticketNoShowAutoCancellationMinutes: 45,
      ticketArchiveRetentionDays: 60,
      isConfigured: true,
      rowVersion: 'AAAAAAAAB9F=',
      message: 'Updated successfully.',
    };

    service.updateBranchConfiguration(1, payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const expectedUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/api/branches/1/configuration`;
    const req = httpTestingController.expectOne(expectedUrl);

    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });
});
