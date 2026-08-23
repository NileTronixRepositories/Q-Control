import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SegmentApiService } from './segment-api.service';

describe('SegmentApiService', () => {
  let service: SegmentApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SegmentApiService],
    });
    service = TestBed.inject(SegmentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches segments with query parameters', () => {
    service
      .getSegments({ searchText: 'كشف', scope: 'Global', pageNumber: 1, pageSize: 10 })
      .subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/segments'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('searchText')).toBe('كشف');
    expect(req.request.params.get('scope')).toBe('Global');
    req.flush({ currentPage: 1, pageSize: 10, totalItems: 0, totalPages: 0, data: [] });
  });

  it('sends Create Global Segment POST request', () => {
    const payload = { arabicName: 'كشف', englishName: 'Exam', priority: 3 };
    service.createGlobalSegment(payload).subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/segments'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 1, ...payload, scope: 'Global' });
  });

  it('sends unassign segment DELETE request with If-Match header', () => {
    service.unassignSegment(7, 20, 5, 'AAAAAAAAB9E=').subscribe();

    const req = httpMock.expectOne((r) => r.url.endsWith('/api/branches/7/services/20/segments/5'));
    expect(req.request.method).toBe('DELETE');
    expect(req.request.headers.get('If-Match')).toBe('AAAAAAAAB9E=');
    req.flush(null);
  });

  it('sends approve request POST with If-Match header', () => {
    service.approveGlobalizationRequest(15, 'ROW_VERSION_123').subscribe();

    const req = httpMock.expectOne((r) =>
      r.url.endsWith('/api/segment-globalization-requests/15/approve'),
    );
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('If-Match')).toBe('ROW_VERSION_123');
    req.flush({ id: 15, status: 'Approved' });
  });
});
