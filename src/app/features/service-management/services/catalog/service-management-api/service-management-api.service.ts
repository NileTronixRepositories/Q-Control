import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../../environments/environment';
import { AppLanguageStore } from '../../../../../core/i18n/app-language.store';
import { AuthSessionService } from '../../../../auth/services/auth-session/auth-session.service';
import {
  CreateServiceRequest,
  PagedServiceResponse,
  ServiceDeleteResponse,
  ServiceDetails,
  ServiceListItem,
  ServiceListQuery,
  ServiceImageDeleteResponse,
  ServiceImageResponse,
  ServiceImageType,
  ServiceMutationResponse,
  ServiceParentOption,
  ServicePermanentDeleteResponse,
  ServiceParentQuery,
  ServiceRestoreResponse,
  ServiceSelectionOptionsResponse,
  ServiceTreeNode,
  ServiceTreeQuery,
  UpdateServiceRequest,
} from '../../../models/service-management/service-management.model';

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

  getCentralServiceTree(
    query: Pick<ServiceTreeQuery, 'includeInactive' | 'includeDeleted'>,
  ): Observable<readonly ServiceTreeNode[]> {
    return this.httpClient.get<readonly ServiceTreeNode[]>(`${this.servicesEndpoint}/central-tree`, {
      headers: this.createJsonHeaders(),
      params: new HttpParams()
        .set('includeInactive', query.includeInactive)
        .set('includeDeleted', query.includeDeleted),
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

  getServiceImages(
    serviceId: number,
    imageType?: ServiceImageType,
  ): Observable<readonly ServiceImageResponse[]> {
    let params = new HttpParams();

    if (imageType) {
      params = params.set('imageType', imageType);
    }

    return this.httpClient.get<readonly ServiceImageResponse[]>(
      `${this.createItemUrl(serviceId)}/images`,
      { headers: this.createJsonHeaders(), params },
    );
  }

  uploadServiceLogo(
    serviceId: number,
    image: File,
    serviceRowVersion: string,
  ): Observable<ServiceImageResponse> {
    return this.uploadSingleServiceImage(serviceId, 'logo', image, serviceRowVersion);
  }

  uploadServiceIcon(
    serviceId: number,
    image: File,
    serviceRowVersion: string,
  ): Observable<ServiceImageResponse> {
    return this.uploadSingleServiceImage(serviceId, 'icon', image, serviceRowVersion);
  }

  uploadServiceAds(
    serviceId: number,
    images: readonly File[],
    serviceRowVersion: string,
  ): Observable<readonly ServiceImageResponse[]> {
    const formData = new FormData();
    images.forEach((image) => formData.append('Images', image));
    formData.append('RowVersion', serviceRowVersion);

    return this.httpClient.post<readonly ServiceImageResponse[]>(
      `${this.createItemUrl(serviceId)}/images/ads`,
      formData,
      { headers: this.createMultipartHeaders() },
    );
  }

  deleteServiceImage(
    serviceId: number,
    imageId: number,
    imageRowVersion: string,
  ): Observable<ServiceImageDeleteResponse> {
    return this.httpClient.delete<ServiceImageDeleteResponse>(
      `${this.createItemUrl(serviceId)}/images/${imageId}`,
      { headers: this.createJsonHeaders(imageRowVersion) },
    );
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

  permanentlyDeleteService(
    serviceId: number,
    rowVersion: string,
  ): Observable<ServicePermanentDeleteResponse> {
    return this.httpClient.delete<ServicePermanentDeleteResponse>(
      `${this.createItemUrl(serviceId)}/permanent`,
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

  private uploadSingleServiceImage(
    serviceId: number,
    kind: 'logo' | 'icon',
    image: File,
    serviceRowVersion: string,
  ): Observable<ServiceImageResponse> {
    const formData = new FormData();
    formData.append('Image', image);
    formData.append('RowVersion', serviceRowVersion);

    return this.httpClient.post<ServiceImageResponse>(
      `${this.createItemUrl(serviceId)}/images/${kind}`,
      formData,
      { headers: this.createMultipartHeaders() },
    );
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

    if (query.searchText?.trim()) {
      params = params.set('searchText', query.searchText.trim());
    }

    return params;
  }

  private resolveMediaOrigin(apiBaseUrl: string): string {
    const apiUrl = new URL(apiBaseUrl);
    return `${apiUrl.protocol}//${apiUrl.host}`;
  }
}
