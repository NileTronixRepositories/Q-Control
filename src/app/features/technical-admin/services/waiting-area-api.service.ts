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
  WaitingAreaListItem,
  WaitingAreaListQuery,
  WaitingAreaMutationResponse
} from '../models/waiting-area.model';

const WAITING_AREAS_PATH = 'api/waiting-areas';

@Injectable({
  providedIn: 'root'
})
export class WaitingAreaApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly waitingAreasEndpoint = new URL(WAITING_AREAS_PATH, environment.apiBaseUrl).toString();

  getWaitingAreas(query: WaitingAreaListQuery): Observable<Pagination<WaitingAreaListItem>> {
    return this.httpClient.get<Pagination<WaitingAreaListItem>>(this.waitingAreasEndpoint, {
      headers: this.createHeaders(),
      params: this.createListParams(query)
    });
  }

  getWaitingAreaDetails(waitingAreaId: number): Observable<WaitingAreaDetails> {
    return this.httpClient.get<WaitingAreaDetails>(this.createItemUrl(waitingAreaId), {
      headers: this.createHeaders()
    });
  }

  createWaitingArea(request: CreateWaitingAreaRequest): Observable<WaitingAreaMutationResponse> {
    return this.httpClient.post<WaitingAreaMutationResponse>(this.waitingAreasEndpoint, request, {
      headers: this.createHeaders()
    });
  }

  updateWaitingArea(
    waitingAreaId: number,
    request: UpdateWaitingAreaRequest
  ): Observable<WaitingAreaMutationResponse> {
    return this.httpClient.put<WaitingAreaMutationResponse>(this.createItemUrl(waitingAreaId), request, {
      headers: this.createHeaders()
    });
  }

  deleteWaitingArea(waitingAreaId: number): Observable<WaitingAreaMutationResponse> {
    return this.httpClient.delete<WaitingAreaMutationResponse>(this.createItemUrl(waitingAreaId), {
      headers: this.createHeaders()
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

    return params;
  }

  private createHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json'
    });
    const token = this.authSessionService.currentSession()?.token;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private createItemUrl(waitingAreaId: number): string {
    return new URL(String(waitingAreaId), this.waitingAreasEndpoint + '/').toString();
  }
}

