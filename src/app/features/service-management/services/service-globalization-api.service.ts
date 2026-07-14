import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  ApproveServiceGlobalizationRequestResponse,
  PagedServiceGlobalizationRequestsResponse,
  RejectServiceGlobalizationRequestRequest,
  RejectServiceGlobalizationRequestResponse,
  ServiceGlobalizationRequestDetails,
  ServiceGlobalizationRequestQuery,
  TechnicalServiceGlobalizationRequestQuery,
} from '../models/service-globalization.model';

const REQUESTS_PATH = 'api/service-globalization-requests';
const BRANCHES_PATH = 'api/branches';

@Injectable({ providedIn: 'root' })
export class ServiceGlobalizationApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly requestsEndpoint = new URL(REQUESTS_PATH, environment.apiBaseUrl).toString();
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  getRequests(query: TechnicalServiceGlobalizationRequestQuery): Observable<PagedServiceGlobalizationRequestsResponse> {
    return this.httpClient.get<PagedServiceGlobalizationRequestsResponse>(this.requestsEndpoint, {
      headers: this.createReadHeaders(),
      params: this.createParams(query, true),
    });
  }

  getBranchRequests(branchId: number, query: ServiceGlobalizationRequestQuery): Observable<PagedServiceGlobalizationRequestsResponse> {
    const branchUrl = new URL(String(branchId), `${this.branchesEndpoint}/`).toString();
    return this.httpClient.get<PagedServiceGlobalizationRequestsResponse>(
      `${branchUrl}/service-globalization-requests`,
      { headers: this.createReadHeaders(), params: this.createParams(query, false) },
    );
  }

  getRequestDetails(requestId: number): Observable<ServiceGlobalizationRequestDetails> {
    return this.httpClient.get<ServiceGlobalizationRequestDetails>(this.createRequestUrl(requestId), {
      headers: this.createReadHeaders(),
    });
  }

  approveRequest(requestId: number, rowVersion: string): Observable<ApproveServiceGlobalizationRequestResponse> {
    return this.httpClient.post<ApproveServiceGlobalizationRequestResponse>(
      `${this.createRequestUrl(requestId)}/approve`,
      null,
      { headers: this.createHeaders(rowVersion) },
    );
  }

  rejectRequest(
    requestId: number,
    rowVersion: string,
    request: RejectServiceGlobalizationRequestRequest,
  ): Observable<RejectServiceGlobalizationRequestResponse> {
    return this.httpClient.post<RejectServiceGlobalizationRequestResponse>(
      `${this.createRequestUrl(requestId)}/reject`,
      request,
      { headers: this.createHeaders(rowVersion) },
    );
  }

  private createRequestUrl(requestId: number): string {
    return new URL(String(requestId), `${this.requestsEndpoint}/`).toString();
  }

  private createParams(
    query: ServiceGlobalizationRequestQuery | TechnicalServiceGlobalizationRequestQuery,
    includeBranchId: boolean,
  ): HttpParams {
    let params = new HttpParams()
      .set('orderSort', query.orderSort)
      .set('pageNumber', Math.max(1, query.pageNumber))
      .set('pageSize', Math.min(100, Math.max(1, query.pageSize)));

    if (query.status) params = params.set('status', query.status);
    if (query.requestType) params = params.set('requestType', query.requestType);
    if (query.searchText.trim()) params = params.set('searchText', query.searchText.trim());
    if (includeBranchId && 'branchId' in query && query.branchId) {
      params = params.set('branchId', query.branchId);
    }
    return params;
  }

  private createHeaders(rowVersion?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });
    const token = this.authSessionService.currentSession()?.token;
    if (token) headers = headers.set('Authorization', `Bearer ${token}`);
    if (rowVersion) headers = headers.set('If-Match', rowVersion);
    return headers;
  }

  private createReadHeaders(): HttpHeaders {
    return this.createHeaders()
      .set('Cache-Control', 'no-cache')
      .set('Pragma', 'no-cache');
  }
}
