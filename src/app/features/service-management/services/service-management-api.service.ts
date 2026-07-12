import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateServiceRequest,
  PagedServiceResponse,
  ServiceDeleteResponse,
  ServiceDetails,
  ServiceListItem,
  ServiceListQuery,
  ServiceLogoResponse,
  ServiceMutationResponse,
  ServiceParentOption,
  ServiceParentQuery,
  ServiceRestoreResponse,
  ServiceSelectionOptionsResponse,
  ServiceTreeNode,
  ServiceTreeQuery,
  UpdateServiceRequest,
} from '../models/service-management.model';

const SERVICES_PATH = 'api/services';

@Injectable({
  providedIn: 'root',
})
export class ServiceManagementApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly servicesEndpoint = new URL(SERVICES_PATH, environment.apiBaseUrl).toString();
  private readonly mediaOrigin = this.resolveMediaOrigin(environment.apiBaseUrl);

  getServices(query: ServiceListQuery): Observable<PagedServiceResponse<ServiceListItem>> {
    return this.httpClient.get<PagedServiceResponse<ServiceListItem>>(this.servicesEndpoint, {
      headers: this.createJsonHeaders(),
      params: this.createListParams(query),
    });
  }

  getServiceDetails(serviceId: number): Observable<ServiceDetails> {
    return this.httpClient.get<ServiceDetails>(this.createItemUrl(serviceId), {
      headers: this.createJsonHeaders(),
    });
  }

  getServiceTree(query: ServiceTreeQuery): Observable<readonly ServiceTreeNode[]> {
    return this.httpClient.get<readonly ServiceTreeNode[]>(`${this.servicesEndpoint}/tree`, {
      headers: this.createJsonHeaders(),
      params: this.createTreeParams(query),
    });
  }

  getServiceSelectionOptions(
    serviceId?: number,
  ): Observable<ServiceSelectionOptionsResponse> {
    let params = new HttpParams();

    if (serviceId) {
      params = params.set('serviceId', serviceId);
    }

    return this.httpClient.get<ServiceSelectionOptionsResponse>(
      `${this.servicesEndpoint}/selection-options`,
      {
        headers: this.createJsonHeaders(),
        params,
      },
    );
  }

  getAvailableParents(query: ServiceParentQuery = {}): Observable<readonly ServiceParentOption[]> {
    let params = new HttpParams();

    if (query.excludeServiceId) {
      params = params.set('excludeServiceId', query.excludeServiceId);
    }

    if (query.searchText?.trim()) {
      params = params.set('searchText', query.searchText.trim());
    }

    return this.httpClient.get<readonly ServiceParentOption[]>(
      `${this.servicesEndpoint}/available-parents`,
      {
        headers: this.createJsonHeaders(),
        params,
      },
    );
  }

  createService(request: CreateServiceRequest): Observable<ServiceMutationResponse> {
    return this.httpClient.post<ServiceMutationResponse>(this.servicesEndpoint, request, {
      headers: this.createJsonHeaders(),
    });
  }

  updateService(
    serviceId: number,
    request: UpdateServiceRequest,
  ): Observable<ServiceMutationResponse> {
    return this.httpClient.put<ServiceMutationResponse>(this.createItemUrl(serviceId), request, {
      headers: this.createJsonHeaders(),
    });
  }

  uploadLogo(serviceId: number, logo: File, rowVersion: string): Observable<ServiceLogoResponse> {
    const formData = new FormData();
    formData.append('logo', logo);
    formData.append('rowVersion', rowVersion);

    return this.httpClient.put<ServiceLogoResponse>(
      `${this.createItemUrl(serviceId)}/logo`,
      formData,
      { headers: this.createMultipartHeaders() },
    );
  }

  removeLogo(serviceId: number, rowVersion: string): Observable<ServiceLogoResponse> {
    return this.httpClient.delete<ServiceLogoResponse>(`${this.createItemUrl(serviceId)}/logo`, {
      headers: this.createJsonHeaders(rowVersion),
    });
  }

  deleteService(serviceId: number, rowVersion: string): Observable<ServiceDeleteResponse> {
    return this.httpClient.delete<ServiceDeleteResponse>(this.createItemUrl(serviceId), {
      headers: this.createJsonHeaders(rowVersion),
    });
  }

  restoreService(serviceId: number, rowVersion: string): Observable<ServiceRestoreResponse> {
    return this.httpClient.post<ServiceRestoreResponse>(
      `${this.createItemUrl(serviceId)}/restore`,
      null,
      { headers: this.createJsonHeaders(rowVersion) },
    );
  }

  resolveMediaUrl(url: string | null): string | null {
    if (!url) {
      return null;
    }

    try {
      return new URL(url, this.mediaOrigin).toString();
    } catch {
      return url;
    }
  }

  private createItemUrl(serviceId: number): string {
    return new URL(String(serviceId), `${this.servicesEndpoint}/`).toString();
  }

  private createJsonHeaders(rowVersion?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });

    return this.attachAuthHeaders(headers, rowVersion);
  }

  private createMultipartHeaders(): HttpHeaders {
    return this.attachAuthHeaders(
      new HttpHeaders({
        'Accept-Language': this.appLanguageStore.language(),
      }),
    );
  }

  private attachAuthHeaders(headers: HttpHeaders, rowVersion?: string): HttpHeaders {
    let nextHeaders = headers;
    const token = this.authSessionService.currentSession()?.token;

    if (token) {
      nextHeaders = nextHeaders.set('Authorization', `Bearer ${token}`);
    }

    if (rowVersion) {
      nextHeaders = nextHeaders.set('If-Match', rowVersion);
    }

    return nextHeaders;
  }

  private createListParams(query: ServiceListQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber)
      .set('pageSize', Math.min(query.pageSize, 100));

    if (query.searchText.trim()) {
      params = params.set('searchText', query.searchText.trim());
    }

    if (query.orderSort?.trim()) {
      params = params.set('orderSort', query.orderSort.trim());
    }

    if (query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    if (query.isDeleted !== null) {
      params = params.set('isDeleted', query.isDeleted);
    }

    if (query.isTicketIssuable !== null) {
      params = params.set('isTicketIssuable', query.isTicketIssuable);
    }

    if (query.parentServiceId) {
      params = params.set('parentServiceId', query.parentServiceId);
    }

    if (query.scope) {
      params = params.set('scope', query.scope);
    }

    if (query.ownerBranchId) {
      params = params.set('ownerBranchId', query.ownerBranchId);
    }

    if (query.isAssignedToCurrentBranch !== null) {
      params = params.set('isAssignedToCurrentBranch', query.isAssignedToCurrentBranch);
    }

    return params;
  }

  private createTreeParams(query: ServiceTreeQuery): HttpParams {
    let params = new HttpParams()
      .set('includeInactive', query.includeInactive)
      .set('includeDeleted', query.includeDeleted);

    if (query.scope) {
      params = params.set('scope', query.scope);
    }

    if (query.ownerBranchId) {
      params = params.set('ownerBranchId', query.ownerBranchId);
    }

    if (query.isAssignedToCurrentBranch !== undefined && query.isAssignedToCurrentBranch !== null) {
      params = params.set('isAssignedToCurrentBranch', query.isAssignedToCurrentBranch);
    }

    return params;
  }
  private resolveMediaOrigin(apiBaseUrl: string): string {
    const apiUrl = new URL(apiBaseUrl);
    return `${apiUrl.protocol}//${apiUrl.host}`;
  }
}
