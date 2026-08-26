import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { BranchVideosApiService } from '@features/branch-management/services/branch-videos-api/branch-videos-api.service';
import {
  BranchDisplayPlaylistResponse,
  BranchVideoDeleteResponse,
  BranchVideoResponse,
  BranchVideoStateResponse,
  ReorderBranchVideosRequest,
} from '@features/branch-management/models/branch-video/branch-video.model';

describe('BranchVideosApiService', () => {
  let service: BranchVideosApiService;
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
        BranchVideosApiService,
        { provide: AuthSessionService, useValue: mockAuthSessionService },
        { provide: AppLanguageStore, useValue: mockAppLanguageStore },
      ],
    });

    service = TestBed.inject(BranchVideosApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should get branch display videos list', () => {
    const mockVideos: BranchVideoResponse[] = [
      {
        id: 1,
        branchId: 10,
        originalFileName: 'intro.mp4',
        displayOrder: 1,
        isActive: true,
        processingStatus: 'Ready',
        streamUrl: '/Media/Branches/10/Videos/1/hls/master.m3u8',
        rowVersion: 'AAAAAAAAB9E=',
      },
    ];

    service.getBranchVideos(10).subscribe((videos) => {
      expect(videos).toEqual(mockVideos);
    });

    const expectedUrl = new URL('api/branches/10/display-videos', environment.apiBaseUrl).toString();
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-jwt');
    expect(req.request.headers.get('Accept-Language')).toBe('en');
    req.flush(mockVideos);
  });

  it('should upload video with multipart/form-data', () => {
    const mockFile = new File(['content'], 'sample.mp4', { type: 'video/mp4' });
    const mockResponse: BranchVideoResponse = {
      id: 2,
      branchId: 10,
      originalFileName: 'sample.mp4',
      displayOrder: 2,
      isActive: true,
      processingStatus: 'Processing',
      streamUrl: null,
      rowVersion: 'AAAAAAAAB9F=',
    };

    service.uploadBranchVideo(10, mockFile, 2).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const expectedUrl = new URL('api/branches/10/display-videos', environment.apiBaseUrl).toString();
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    req.flush(mockResponse);
  });

  it('should get branch playlist', () => {
    const mockPlaylist: BranchDisplayPlaylistResponse = {
      branchId: 10,
      videos: [
        {
          videoId: 1,
          displayOrder: 1,
          streamUrl: '/Media/Branches/10/Videos/1/hls/master.m3u8',
        },
      ],
    };

    service.getBranchPlaylist(10).subscribe((res) => {
      expect(res).toEqual(mockPlaylist);
    });

    const expectedUrl = new URL('api/branches/10/display-videos/playlist', environment.apiBaseUrl).toString();
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockPlaylist);
  });

  it('should reorder branch videos', () => {
    const payload: ReorderBranchVideosRequest = {
      items: [
        { videoId: 2, displayOrder: 1, rowVersion: 'AAAAAAAAB9F=' },
        { videoId: 1, displayOrder: 2, rowVersion: 'AAAAAAAAB9E=' },
      ],
    };

    const mockResponse: BranchVideoResponse[] = [];

    service.reorderBranchVideos(10, payload).subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const expectedUrl = new URL('api/branches/10/display-videos/order', environment.apiBaseUrl).toString();
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush(mockResponse);
  });

  it('should deactivate branch video with If-Match header', () => {
    const mockState: BranchVideoStateResponse = {
      videoId: 1,
      branchId: 10,
      displayOrder: 1,
      isActive: false,
      processingStatus: 'Ready',
      rowVersion: 'AAAAAAAAB9G=',
      message: 'Video deactivated',
    };

    service.deactivateBranchVideo(10, 1, 'AAAAAAAAB9E=').subscribe((res) => {
      expect(res).toEqual(mockState);
    });

    const expectedUrl = new URL('api/branches/10/display-videos/1/deactivate', environment.apiBaseUrl).toString();
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9E=');
    req.flush(mockState);
  });

  it('should reactivate branch video with If-Match header', () => {
    const mockState: BranchVideoStateResponse = {
      videoId: 1,
      branchId: 10,
      displayOrder: 1,
      isActive: true,
      processingStatus: 'Ready',
      rowVersion: 'AAAAAAAAB9H=',
      message: 'Video reactivated',
    };

    service.reactivateBranchVideo(10, 1, 'AAAAAAAAB9G=').subscribe((res) => {
      expect(res).toEqual(mockState);
    });

    const expectedUrl = new URL('api/branches/10/display-videos/1/reactivate', environment.apiBaseUrl).toString();
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9G=');
    req.flush(mockState);
  });

  it('should permanently delete branch video with If-Match header', () => {
    const mockDelete: BranchVideoDeleteResponse = {
      videoId: 1,
      branchId: 10,
      message: 'Video deleted permanently',
    };

    service.deleteBranchVideoPermanently(10, 1, 'AAAAAAAAB9G=').subscribe((res) => {
      expect(res).toEqual(mockDelete);
    });

    const expectedUrl = new URL('api/branches/10/display-videos/1/permanent', environment.apiBaseUrl).toString();
    const req = httpTestingController.expectOne(expectedUrl);
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9G=');
    req.flush(mockDelete);
  });

  it('should resolve stream media URL correctly', () => {
    expect(service.resolveMediaUrl(null)).toBe('');
    expect(service.resolveMediaUrl('https://example.com/live.m3u8')).toBe('https://example.com/live.m3u8');
    const origin = new URL(environment.apiBaseUrl).origin;
    expect(service.resolveMediaUrl('/Media/test.m3u8')).toBe(`${origin}/Media/test.m3u8`);
  });
});
