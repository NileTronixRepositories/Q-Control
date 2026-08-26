import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore, AuthSessionService } from '@core';
import {
  CreateWindowRequest,
  CreateWindowResponse,
  GetWindowsParams,
  PaginationResponse,
  PermanentDeleteWindowResponse,
  UpdateWindowRequest,
  UpdateWindowResponse,
  WindowDetailsResponse,
  WindowLifecycleResponse,
  WindowListItemResponse,
} from '../../models/window-management/window-management.model';

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

  deactivateWindow(windowId: number, rowVersion: string): Observable<WindowLifecycleResponse> {
    return this.httpClient.post<WindowLifecycleResponse>(this.createLifecycleUrl(windowId, 'deactivate'), null, {
      headers: this.createHeaders(rowVersion),
    });
  }

  reactivateWindow(windowId: number, rowVersion: string): Observable<WindowLifecycleResponse> {
    return this.httpClient.post<WindowLifecycleResponse>(this.createLifecycleUrl(windowId, 'reactivate'), null, {
      headers: this.createHeaders(rowVersion),
    });
  }

  permanentlyDeleteWindow(windowId: number, rowVersion: string): Observable<PermanentDeleteWindowResponse> {
    return this.httpClient.delete<PermanentDeleteWindowResponse>(
      this.createLifecycleUrl(windowId, 'permanent'),
      { headers: this.createHeaders(rowVersion) },
    );
  }

  private createItemUrl(windowId: number): string {
    return new URL(String(windowId), `${this.windowsEndpoint}/`).toString();
  }

  private createLifecycleUrl(windowId: number, action: 'deactivate' | 'reactivate' | 'permanent'): string {
    return `${this.createItemUrl(windowId)}/${action}`;
  }

  private createHeaders(rowVersion?: string): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });
    const token = this.authSessionService.currentSession()?.token;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (rowVersion) {
      headers = headers.set('If-Match', rowVersion);
    }

    return headers;
  }

  private createParams(query: GetWindowsParams): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber ?? 1)
      .set('pageSize', Math.min(query.pageSize ?? 10, 100));

    if (query.branchId) {
      params = params.set('branchId', query.branchId);
    }

    if (query.waitingAreaId) {
      params = params.set('waitingAreaId', query.waitingAreaId);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.isActive !== undefined && query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    return params;
  }
}
