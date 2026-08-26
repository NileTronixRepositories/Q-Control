import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore, AuthSessionService } from '@core';
import {
  AvailableDisplayWindowResponse,
  CreateDisplayRequest,
  CreateDisplayResponse,
  DisplayDetailsResponse,
  DisplayLifecycleResponse,
  DisplayListItemResponse,
  DisplayWindowListItemResponse,
  GetAvailableDisplayWindowsParams,
  GetDisplaysParams,
  PaginationResponse,
  PermanentDeleteDisplayResponse,
  UpdateDisplayRequest,
  UpdateDisplayResponse,
} from '../../models/display-management/display-management.model';

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

  deactivateDisplay(displayId: number, rowVersion: string): Observable<DisplayLifecycleResponse> {
    return this.httpClient.post<DisplayLifecycleResponse>(
      this.createLifecycleUrl(displayId, 'deactivate'),
      null,
      {
        headers: this.createHeaders(rowVersion),
      },
    );
  }

  reactivateDisplay(displayId: number, rowVersion: string): Observable<DisplayLifecycleResponse> {
    return this.httpClient.post<DisplayLifecycleResponse>(
      this.createLifecycleUrl(displayId, 'reactivate'),
      null,
      {
        headers: this.createHeaders(rowVersion),
      },
    );
  }

  permanentlyDeleteDisplay(
    displayId: number,
    rowVersion: string,
  ): Observable<PermanentDeleteDisplayResponse> {
    return this.httpClient.delete<PermanentDeleteDisplayResponse>(
      this.createLifecycleUrl(displayId, 'permanent'),
      { headers: this.createHeaders(rowVersion) },
    );
  }

  getLinkedWindows(displayId: number): Observable<readonly DisplayWindowListItemResponse[]> {
    return this.httpClient.get<readonly DisplayWindowListItemResponse[]>(
      this.createDisplayWindowsUrl(displayId),
      {
        headers: this.createHeaders(),
      },
    );
  }

  getAvailableWindows(
    displayId: number,
    params: GetAvailableDisplayWindowsParams,
  ): Observable<PaginationResponse<AvailableDisplayWindowResponse>> {
    return this.httpClient.get<PaginationResponse<AvailableDisplayWindowResponse>>(
      this.createAvailableWindowsUrl(displayId),
      {
        headers: this.createHeaders(),
        params: this.createAvailableWindowParams(params),
      },
    );
  }

  assignWindow(displayId: number, windowId: number): Observable<void> {
    return this.httpClient.post<void>(this.createDisplayWindowUrl(displayId, windowId), null, {
      headers: this.createHeaders(),
    });
  }

  unassignWindow(displayId: number, windowId: number): Observable<void> {
    return this.httpClient.delete<void>(this.createDisplayWindowUrl(displayId, windowId), {
      headers: this.createHeaders(),
    });
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

    if (query.isActive !== undefined && query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    return params;
  }

  private createAvailableWindowParams(query: GetAvailableDisplayWindowsParams): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber ?? 1)
      .set('pageSize', Math.min(query.pageSize ?? 10, 100));

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query.isActive !== undefined && query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    return params;
  }

  private createItemUrl(displayId: number): string {
    return new URL(String(displayId), `${this.displaysEndpoint}/`).toString();
  }

  private createLifecycleUrl(
    displayId: number,
    action: 'deactivate' | 'reactivate' | 'permanent',
  ): string {
    return `${this.createItemUrl(displayId)}/${action}`;
  }

  private createDisplayWindowsUrl(displayId: number): string {
    return `${this.createItemUrl(displayId)}/windows`;
  }

  private createAvailableWindowsUrl(displayId: number): string {
    return `${this.createItemUrl(displayId)}/available-windows`;
  }

  private createDisplayWindowUrl(displayId: number, windowId: number): string {
    return `${this.createDisplayWindowsUrl(displayId)}/${windowId}`;
  }
}
