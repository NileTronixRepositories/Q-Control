import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateTerminalRequest,
  CreateTerminalResponse,
  DeleteTerminalResponse,
  GetTerminalsParams,
  PaginationResponse,
  PermanentDeleteTerminalResponse,
  RestoreTerminalResponse,
  TerminalDetailsResponse,
  TerminalListItemResponse,
  DeletedTerminalListItemResponse,
  UpdateTerminalRequest,
  UpdateTerminalResponse,
} from '../models/terminal-management.model';

const TERMINALS_PATH = 'api/terminals';

@Injectable({
  providedIn: 'root'
})
export class TerminalManagementApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly terminalsEndpoint = new URL(TERMINALS_PATH, environment.apiBaseUrl).toString();

  getTerminals(params: GetTerminalsParams): Observable<PaginationResponse<TerminalListItemResponse>> {
    return this.httpClient.get<PaginationResponse<TerminalListItemResponse>>(this.terminalsEndpoint, {
      headers: this.createHeaders(),
      params: this.createParams(params),
    });
  }

  getDeletedTerminals(
    params: GetTerminalsParams
  ): Observable<PaginationResponse<DeletedTerminalListItemResponse>> {
    return this.httpClient.get<PaginationResponse<DeletedTerminalListItemResponse>>(
      this.createDeletedUrl(),
      {
        headers: this.createHeaders(),
        params: this.createParams(params),
      }
    );
  }

  getTerminalById(terminalId: number): Observable<TerminalDetailsResponse> {
    return this.httpClient.get<TerminalDetailsResponse>(this.createItemUrl(terminalId), {
      headers: this.createHeaders()
    });
  }

  createTerminal(request: CreateTerminalRequest): Observable<CreateTerminalResponse> {
    return this.httpClient.post<CreateTerminalResponse>(this.terminalsEndpoint, request, {
      headers: this.createHeaders()
    });
  }

  updateTerminal(
    terminalId: number,
    request: UpdateTerminalRequest
  ): Observable<UpdateTerminalResponse> {
    return this.httpClient.put<UpdateTerminalResponse>(this.createItemUrl(terminalId), request, {
      headers: this.createHeaders()
    });
  }

  softDeleteTerminal(terminalId: number): Observable<DeleteTerminalResponse> {
    return this.httpClient.delete<DeleteTerminalResponse>(this.createItemUrl(terminalId), {
      headers: this.createHeaders()
    });
  }

  restoreTerminal(terminalId: number): Observable<RestoreTerminalResponse> {
    return this.httpClient.post<RestoreTerminalResponse>(this.createRestoreUrl(terminalId), null, {
      headers: this.createHeaders()
    });
  }

  permanentlyDeleteTerminal(terminalId: number): Observable<PermanentDeleteTerminalResponse> {
    return this.httpClient.delete<PermanentDeleteTerminalResponse>(
      this.createPermanentDeleteUrl(terminalId),
      {
        headers: this.createHeaders(),
      }
    );
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

  private createParams(query: GetTerminalsParams): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber ?? 1)
      .set('pageSize', Math.min(query.pageSize ?? 10, 100));

    if (query.windowId) {
      params = params.set('windowId', query.windowId);
    }

    if (query.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    return params;
  }

  private createItemUrl(terminalId: number): string {
    return new URL(String(terminalId), `${this.terminalsEndpoint}/`).toString();
  }

  private createDeletedUrl(): string {
    return `${this.terminalsEndpoint}/deleted`;
  }

  private createRestoreUrl(terminalId: number): string {
    return `${this.createItemUrl(terminalId)}/restore`;
  }

  private createPermanentDeleteUrl(terminalId: number): string {
    return `${this.createItemUrl(terminalId)}/permanent`;
  }
}
