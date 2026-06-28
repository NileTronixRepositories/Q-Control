import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateWaitingAreaRequest,
  Pagination,
  UpdateWaitingAreaRequest,
  WaitingAreaDetails,
  WaitingAreaLifecycleResponse,
  WaitingAreaListItem,
  WaitingAreaListQuery,
  WaitingAreaMutationResponse,
  WaitingAreaPermanentDeleteResponse,
} from '../models/waiting-area.model';

const WAITING_AREAS_PATH = 'api/waiting-areas';

@Injectable({
  providedIn: 'root',
})
export class WaitingAreaApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly waitingAreasEndpoint = new URL(WAITING_AREAS_PATH, environment.apiBaseUrl).toString();

  getWaitingAreas(query: WaitingAreaListQuery): Observable<Pagination<WaitingAreaListItem>> {
    return this.httpClient.get<Pagination<WaitingAreaListItem>>(this.waitingAreasEndpoint, {
      headers: this.createHeaders(),
      params: this.createListParams(query),
    });
  }

  getWaitingAreaDetails(waitingAreaId: number): Observable<WaitingAreaDetails> {
    return this.httpClient.get<WaitingAreaDetails>(this.createItemUrl(waitingAreaId), {
      headers: this.createHeaders(),
    });
  }

  createWaitingArea(request: CreateWaitingAreaRequest): Observable<WaitingAreaMutationResponse> {
    return this.httpClient.post<WaitingAreaMutationResponse>(this.waitingAreasEndpoint, request, {
      headers: this.createHeaders(),
    });
  }

  updateWaitingArea(waitingAreaId: number, request: UpdateWaitingAreaRequest): Observable<WaitingAreaMutationResponse> {
    return this.httpClient.put<WaitingAreaMutationResponse>(this.createItemUrl(waitingAreaId), request, {
      headers: this.createHeaders(),
    });
  }

  deactivateWaitingArea(waitingAreaId: number, rowVersion: string): Observable<WaitingAreaLifecycleResponse> {
    return this.httpClient.post<WaitingAreaLifecycleResponse>(this.createLifecycleUrl(waitingAreaId, 'deactivate'), null, {
      headers: this.createHeaders(rowVersion),
    });
  }

  reactivateWaitingArea(waitingAreaId: number, rowVersion: string): Observable<WaitingAreaLifecycleResponse> {
    return this.httpClient.post<WaitingAreaLifecycleResponse>(this.createLifecycleUrl(waitingAreaId, 'reactivate'), null, {
      headers: this.createHeaders(rowVersion),
    });
  }

  permanentlyDeleteWaitingArea(waitingAreaId: number, rowVersion: string): Observable<WaitingAreaPermanentDeleteResponse> {
    return this.httpClient.delete<WaitingAreaPermanentDeleteResponse>(this.createLifecycleUrl(waitingAreaId, 'permanent'), {
      headers: this.createHeaders(rowVersion),
    });
  }

  private createListParams(query: WaitingAreaListQuery): HttpParams {
    let params = new HttpParams()
      .set('search', query.search)
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);

    if (query.branchId !== null) {
      params = params.set('branchId', query.branchId);
    }

    if (query.isActive !== null) {
      params = params.set('isActive', query.isActive);
    }

    return params;
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

  private createItemUrl(waitingAreaId: number): string {
    return new URL(String(waitingAreaId), this.waitingAreasEndpoint + '/').toString();
  }

  private createLifecycleUrl(waitingAreaId: number, action: 'deactivate' | 'reactivate' | 'permanent'): string {
    return `${this.createItemUrl(waitingAreaId)}/${action}`;
  }
}