import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  AssignServiceSegmentsRequest,
  AssignedBranchServiceSegmentsResponse,
  AvailableSegmentsResponse,
  CreateBranchSegmentRequest,
  CreateBranchSegmentResponse,
  CreateGlobalSegmentRequest,
  GlobalizationRequestQueryParameters,
  GlobalizationRequestsPaginatedResponse,
  RejectGlobalizationRequestPayload,
  Segment,
  SegmentDetails,
  SegmentGlobalizationRequest,
  SegmentListPaginatedResponse,
  SegmentQueryParameters,
  UpdateSegmentQuotaRequest,
  UpdateSegmentRequest,
} from '../models/segment.model';

const SEGMENTS_PATH = 'api/segments';
const BRANCHES_PATH = 'api/branches';
const SEGMENT_GLOB_REQUESTS_PATH = 'api/segment-globalization-requests';

@Injectable({ providedIn: 'root' })
export class SegmentApiService {
  private readonly http = inject(HttpClient);

  private readonly segmentsEndpoint = new URL(SEGMENTS_PATH, environment.apiBaseUrl).toString();
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();
  private readonly segmentGlobRequestsEndpoint = new URL(SEGMENT_GLOB_REQUESTS_PATH, environment.apiBaseUrl).toString();

  getSegments(params?: SegmentQueryParameters): Observable<SegmentListPaginatedResponse> {
    let httpParams = new HttpParams();
    if (params?.searchText) {
      httpParams = httpParams.set('searchText', params.searchText);
    }
    if (params?.scope) {
      httpParams = httpParams.set('scope', params.scope);
    }
    if (params?.ownerBranchId !== undefined && params.ownerBranchId !== null) {
      httpParams = httpParams.set('ownerBranchId', params.ownerBranchId.toString());
    }
    if (params?.priority !== undefined && params.priority !== null) {
      httpParams = httpParams.set('priority', params.priority.toString());
    }
    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.orderSort) {
      httpParams = httpParams.set('orderSort', params.orderSort);
    }

    return this.http.get<SegmentListPaginatedResponse>(this.segmentsEndpoint, { params: httpParams });
  }

  getSegmentDetails(segmentId: number): Observable<SegmentDetails> {
    return this.http.get<SegmentDetails>(`${this.segmentsEndpoint}/${segmentId}`);
  }

  createGlobalSegment(request: CreateGlobalSegmentRequest): Observable<Segment> {
    return this.http.post<Segment>(this.segmentsEndpoint, request);
  }

  createBranchSegment(
    branchId: number,
    request: CreateBranchSegmentRequest,
  ): Observable<CreateBranchSegmentResponse> {
    return this.http.post<CreateBranchSegmentResponse>(
      `${this.branchesEndpoint}/${branchId}/segments`,
      request,
    );
  }

  updateSegment(segmentId: number, request: UpdateSegmentRequest): Observable<Segment> {
    return this.http.put<Segment>(`${this.segmentsEndpoint}/${segmentId}`, request);
  }

  getAssignedSegments(
    branchId: number,
    leafServiceId: number,
  ): Observable<AssignedBranchServiceSegmentsResponse> {
    return this.http.get<AssignedBranchServiceSegmentsResponse>(
      `${this.branchesEndpoint}/${branchId}/services/${leafServiceId}/segments`,
    );
  }

  getAvailableSegments(
    branchId: number,
    leafServiceId: number,
    params?: SegmentQueryParameters,
  ): Observable<AvailableSegmentsResponse> {
    let httpParams = new HttpParams();
    if (params?.searchText) {
      httpParams = httpParams.set('searchText', params.searchText);
    }
    if (params?.scope) {
      httpParams = httpParams.set('scope', params.scope);
    }
    if (params?.priority !== undefined && params.priority !== null) {
      httpParams = httpParams.set('priority', params.priority.toString());
    }
    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }

    return this.http.get<AvailableSegmentsResponse>(
      `${this.branchesEndpoint}/${branchId}/services/${leafServiceId}/segments/available`,
      { params: httpParams },
    );
  }

  assignSegments(
    branchId: number,
    leafServiceId: number,
    request: AssignServiceSegmentsRequest,
  ): Observable<AssignedBranchServiceSegmentsResponse> {
    return this.http.post<AssignedBranchServiceSegmentsResponse>(
      `${this.branchesEndpoint}/${branchId}/services/${leafServiceId}/segments/assign`,
      request,
    );
  }

  updateSegmentQuota(
    branchId: number,
    leafServiceId: number,
    segmentId: number,
    request: UpdateSegmentQuotaRequest,
  ): Observable<AssignedBranchServiceSegmentsResponse> {
    return this.http.put<AssignedBranchServiceSegmentsResponse>(
      `${this.branchesEndpoint}/${branchId}/services/${leafServiceId}/segments/${segmentId}/quota`,
      request,
    );
  }

  unassignSegment(
    branchId: number,
    leafServiceId: number,
    segmentId: number,
    rowVersion: string,
  ): Observable<AssignedBranchServiceSegmentsResponse | void> {
    const headers = new HttpHeaders().set('If-Match', rowVersion);
    return this.http.delete<AssignedBranchServiceSegmentsResponse | void>(
      `${this.branchesEndpoint}/${branchId}/services/${leafServiceId}/segments/${segmentId}`,
      { headers },
    );
  }

  getTechnicalGlobalizationRequests(
    params?: GlobalizationRequestQueryParameters,
  ): Observable<GlobalizationRequestsPaginatedResponse> {
    let httpParams = new HttpParams();
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.branchId !== undefined && params.branchId !== null) {
      httpParams = httpParams.set('branchId', params.branchId.toString());
    }
    if (params?.searchText) {
      httpParams = httpParams.set('searchText', params.searchText);
    }
    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.orderSort) {
      httpParams = httpParams.set('orderSort', params.orderSort);
    }

    return this.http.get<GlobalizationRequestsPaginatedResponse>(
      this.segmentGlobRequestsEndpoint,
      { params: httpParams },
    );
  }

  getGlobalizationRequestDetails(
    requestId: number,
  ): Observable<SegmentGlobalizationRequest> {
    return this.http.get<SegmentGlobalizationRequest>(
      `${this.segmentGlobRequestsEndpoint}/${requestId}`,
    );
  }

  approveGlobalizationRequest(
    requestId: number,
    rowVersion: string,
  ): Observable<SegmentGlobalizationRequest> {
    const headers = new HttpHeaders().set('If-Match', rowVersion);
    return this.http.post<SegmentGlobalizationRequest>(
      `${this.segmentGlobRequestsEndpoint}/${requestId}/approve`,
      {},
      { headers },
    );
  }

  rejectGlobalizationRequest(
    requestId: number,
    rowVersion: string,
    payload?: RejectGlobalizationRequestPayload,
  ): Observable<SegmentGlobalizationRequest> {
    const headers = new HttpHeaders().set('If-Match', rowVersion);
    return this.http.post<SegmentGlobalizationRequest>(
      `${this.segmentGlobRequestsEndpoint}/${requestId}/reject`,
      payload ?? {},
      { headers },
    );
  }

  getBranchGlobalizationRequests(
    branchId: number,
    params?: GlobalizationRequestQueryParameters,
  ): Observable<GlobalizationRequestsPaginatedResponse> {
    let httpParams = new HttpParams();
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.searchText) {
      httpParams = httpParams.set('searchText', params.searchText);
    }
    if (params?.pageNumber) {
      httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    }
    if (params?.pageSize) {
      httpParams = httpParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.orderSort) {
      httpParams = httpParams.set('orderSort', params.orderSort);
    }

    return this.http.get<GlobalizationRequestsPaginatedResponse>(
      `${this.branchesEndpoint}/${branchId}/segment-globalization-requests`,
      { params: httpParams },
    );
  }
}
