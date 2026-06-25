import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateDisplayRequest,
  CreateDisplayResponse,
  DeleteDisplayResponse,
  DeletedDisplayListItemResponse,
  DisplayDetailsResponse,
  DisplayListItemResponse,
  GetDisplaysParams,
  PaginationResponse,
  PermanentDeleteDisplayResponse,
  RestoreDisplayResponse,
  UpdateDisplayRequest,
  UpdateDisplayResponse,
} from '../models/display-management.model';

const DISPLAYS_PATH = 'api/displays';

@Injectable({
  providedIn: 'root',
})
export class DisplayManagementApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly displaysEndpoint = new URL(DISPLAYS_PATH, environment.apiBaseUrl).toString();

  getDisplays(params: GetDisplaysParams): Observable<PaginationResponse<DisplayListItemResponse>> {
    return this.httpClient.get<PaginationResponse<DisplayListItemResponse>>(this.displaysEndpoint, {
      headers: this.createHeaders(),
      params: this.createParams(params),
    });
  }

  getDeletedDisplays(
    params: GetDisplaysParams,
  ): Observable<PaginationResponse<DeletedDisplayListItemResponse>> {
    return this.httpClient.get<PaginationResponse<DeletedDisplayListItemResponse>>(
      this.createDeletedUrl(),
      {
        headers: this.createHeaders(),
        params: this.createParams(params),
      },
    );
  }

  getDisplayById(displayId: number): Observable<DisplayDetailsResponse> {
    return this.httpClient.get<DisplayDetailsResponse>(this.createItemUrl(displayId), {
      headers: this.createHeaders(),
    });
  }

  createDisplay(request: CreateDisplayRequest): Observable<CreateDisplayResponse> {
    return this.httpClient.post<CreateDisplayResponse>(this.displaysEndpoint, request, {
      headers: this.createHeaders(),
    });
  }

  updateDisplay(
    displayId: number,
    request: UpdateDisplayRequest,
  ): Observable<UpdateDisplayResponse> {
    return this.httpClient.put<UpdateDisplayResponse>(this.createItemUrl(displayId), request, {
      headers: this.createHeaders(),
    });
  }

  softDeleteDisplay(displayId: number): Observable<DeleteDisplayResponse> {
    return this.httpClient.delete<DeleteDisplayResponse>(this.createItemUrl(displayId), {
      headers: this.createHeaders(),
    });
  }

  restoreDisplay(displayId: number): Observable<RestoreDisplayResponse> {
    return this.httpClient.post<RestoreDisplayResponse>(this.createRestoreUrl(displayId), null, {
      headers: this.createHeaders(),
    });
  }

  permanentlyDeleteDisplay(displayId: number): Observable<PermanentDeleteDisplayResponse> {
    return this.httpClient.delete<PermanentDeleteDisplayResponse>(
      this.createPermanentDeleteUrl(displayId),
      { headers: this.createHeaders() },
    );
  }

  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });
    const token = this.authSessionService.currentSession()?.token;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private createParams(query: GetDisplaysParams): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber ?? 1)
      .set('pageSize', Math.min(query.pageSize ?? 10, 100));

    if (query.branchId) {
      params = params.set('branchId', query.branchId);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return params;
  }

  private createItemUrl(displayId: number): string {
    return new URL(String(displayId), `${this.displaysEndpoint}/`).toString();
  }

  private createDeletedUrl(): string {
    return `${this.displaysEndpoint}/deleted`;
  }

  private createRestoreUrl(displayId: number): string {
    return `${this.createItemUrl(displayId)}/restore`;
  }

  private createPermanentDeleteUrl(displayId: number): string {
    return `${this.createItemUrl(displayId)}/permanent`;
  }
}