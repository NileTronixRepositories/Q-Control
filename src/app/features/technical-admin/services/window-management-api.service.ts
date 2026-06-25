import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateWindowRequest,
  CreateWindowResponse,
  DeleteWindowResponse,
  GetWindowsParams,
  PaginationResponse,
  PermanentDeleteWindowResponse,
  UpdateWindowRequest,
  UpdateWindowResponse,
  WindowDetailsResponse,
  WindowListItemResponse,
  DeletedWindowListItemResponse,
} from '../models/window-management.model';

const WINDOWS_PATH = 'api/windows';

@Injectable({
  providedIn: 'root',
})
export class WindowManagementApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly windowsEndpoint = new URL(WINDOWS_PATH, environment.apiBaseUrl).toString();

  getWindows(params: GetWindowsParams): Observable<PaginationResponse<WindowListItemResponse>> {
    return this.httpClient.get<PaginationResponse<WindowListItemResponse>>(this.windowsEndpoint, {
      headers: this.createHeaders(),
      params: this.createParams(params),
    });
  }

  getDeletedWindows(
    params: GetWindowsParams,
  ): Observable<PaginationResponse<DeletedWindowListItemResponse>> {
    return this.httpClient.get<PaginationResponse<DeletedWindowListItemResponse>>(
      this.createDeletedUrl(),
      {
        headers: this.createHeaders(),
        params: this.createParams(params),
      },
    );
  }

  getWindowById(windowId: number): Observable<WindowDetailsResponse> {
    return this.httpClient.get<WindowDetailsResponse>(this.createItemUrl(windowId), {
      headers: this.createHeaders(),
    });
  }

  createWindow(request: CreateWindowRequest): Observable<CreateWindowResponse> {
    return this.httpClient.post<CreateWindowResponse>(this.windowsEndpoint, request, {
      headers: this.createHeaders(),
    });
  }

  updateWindow(windowId: number, request: UpdateWindowRequest): Observable<UpdateWindowResponse> {
    return this.httpClient.put<UpdateWindowResponse>(this.createItemUrl(windowId), request, {
      headers: this.createHeaders(),
    });
  }

  softDeleteWindow(windowId: number): Observable<DeleteWindowResponse> {
    return this.httpClient.delete<DeleteWindowResponse>(this.createItemUrl(windowId), {
      headers: this.createHeaders(),
    });
  }

  permanentlyDeleteWindow(windowId: number): Observable<PermanentDeleteWindowResponse> {
    return this.httpClient.delete<PermanentDeleteWindowResponse>(
      this.createPermanentDeleteUrl(windowId),
      { headers: this.createHeaders() },
    );
  }

  private createItemUrl(windowId: number): string {
    return new URL(String(windowId), `${this.windowsEndpoint}/`).toString();
  }

  private createDeletedUrl(): string {
    return `${this.windowsEndpoint}/deleted`;
  }

  private createPermanentDeleteUrl(windowId: number): string {
    return `${this.createItemUrl(windowId)}/permanent`;
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

  private createParams(query: GetWindowsParams): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber ?? 1)
      .set('pageSize', Math.min(query.pageSize ?? 10, 100));

    if (query.waitingAreaId) {
      params = params.set('waitingAreaId', query.waitingAreaId);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return params;
  }
}
