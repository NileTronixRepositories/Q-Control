import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DisplayRuntimeApiService } from './display-runtime-api.service';
import {
  DisplayRuntimeConfigurationResponse,
  DisplayRuntimePlaylistResponse,
} from '@features/queue-management/public-api';

describe('DisplayRuntimeApiService', () => {
  let service: DisplayRuntimeApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DisplayRuntimeApiService],
    });
    service = TestBed.inject(DisplayRuntimeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches display runtime configuration anonymously for a branch', () => {
    const branchId = 5;
    const mockResponse: DisplayRuntimeConfigurationResponse = {
      branchId: 5,
      branding: {
        logoUrl: '/uploads/branches/5/logo.png',
      },
      displayConfiguration: {
        displayBackgroundColor: '#0a1128',
        mainTitleAr: 'مستشفى الشفاء',
        mainTitleEn: 'Al-Shifa Hospital',
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
      },
      messages: [
        {
          id: 1,
          textAr: 'أهلاً بكم',
          textEn: 'Welcome',
          displayOrder: 1,
        },
      ],
    };

    service.getRuntimeConfiguration(branchId).subscribe((res) => {
      expect(res).toEqual(mockResponse);
      expect(res.branchId).toBe(5);
      expect(res.displayConfiguration?.mainTitleAr).toBe('مستشفى الشفاء');
      expect(res.messages?.length).toBe(1);
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/branches/5/display-runtime-configuration'),
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush(mockResponse);
  });

  it('fetches display runtime playlist anonymously for a branch', () => {
    const branchId = 5;
    const mockPlaylist: DisplayRuntimePlaylistResponse = {
      branchId: 5,
      videos: [
        {
          videoId: 10,
          displayOrder: 1,
          streamUrl: '/media/branches/5/video1/manifest.m3u8',
        },
        {
          videoId: 11,
          displayOrder: 2,
          streamUrl: '/media/branches/5/video2/manifest.m3u8',
        },
      ],
    };

    service.getRuntimePlaylist(branchId).subscribe((res) => {
      expect(res).toEqual(mockPlaylist);
      expect(res.videos.length).toBe(2);
      expect(res.videos[0].streamUrl).toContain('manifest.m3u8');
    });

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/branches/5/display-runtime-playlist'),
    );
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Accept')).toBe('application/json');
    req.flush(mockPlaylist);
  });

  it('resolves absolute and relative media URLs correctly', () => {
    expect(service.resolveMediaUrl('')).toBe('');
    expect(service.resolveMediaUrl(null)).toBe('');
    expect(service.resolveMediaUrl('https://cdn.example.com/video.m3u8')).toBe(
      'https://cdn.example.com/video.m3u8',
    );
    expect(service.resolveMediaUrl('/uploads/logo.png')).toContain('/uploads/logo.png');
    expect(service.resolveMediaUrl('uploads/logo.png')).toContain('/uploads/logo.png');
  });
});
