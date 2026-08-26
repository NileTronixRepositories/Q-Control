import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore, AuthSessionService } from '@core';
import {
  CreateDisplayConfigurationRequest,
  CreateDisplayMessageRequest,
  DisplayConfigurationResponse,
  DisplayMessageResponse,
  DisplayMessageStateResponse,
  ReorderDisplayMessagesRequest,
  UpdateDisplayConfigurationRequest,
  UpdateDisplayMessageRequest,
} from '../../models/display-configuration/display-configuration.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class DisplayConfigurationApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString().replace(/\/$/, '');

  getDisplayConfiguration(branchId: number): Observable<DisplayConfigurationResponse> {
    return this.httpClient.get<DisplayConfigurationResponse>(
      this.createDisplayConfigUrl(branchId),
      { headers: this.createHeaders() },
    );
  }

  createDisplayConfiguration(
    branchId: number,
    request: CreateDisplayConfigurationRequest,
  ): Observable<DisplayConfigurationResponse> {
    return this.httpClient.post<DisplayConfigurationResponse>(
      this.createDisplayConfigUrl(branchId),
      request,
      { headers: this.createHeaders() },
    );
  }

  updateDisplayConfiguration(
    branchId: number,
    request: UpdateDisplayConfigurationRequest,
  ): Observable<DisplayConfigurationResponse> {
    return this.httpClient.put<DisplayConfigurationResponse>(
      this.createDisplayConfigUrl(branchId),
      request,
      { headers: this.createHeaders() },
    );
  }

  getDisplayMessages(branchId: number): Observable<readonly DisplayMessageResponse[]> {
    return this.httpClient.get<readonly DisplayMessageResponse[]>(
      this.createMessagesUrl(branchId),
      { headers: this.createHeaders() },
    );
  }

  createDisplayMessage(
    branchId: number,
    request: CreateDisplayMessageRequest,
  ): Observable<DisplayMessageResponse> {
    return this.httpClient.post<DisplayMessageResponse>(
      this.createMessagesUrl(branchId),
      request,
      { headers: this.createHeaders() },
    );
  }

  updateDisplayMessage(
    branchId: number,
    messageId: number,
    request: UpdateDisplayMessageRequest,
  ): Observable<DisplayMessageResponse> {
    return this.httpClient.put<DisplayMessageResponse>(
      `${this.createMessagesUrl(branchId)}/${messageId}`,
      request,
      { headers: this.createHeaders() },
    );
  }

  reorderDisplayMessages(
    branchId: number,
    request: ReorderDisplayMessagesRequest,
  ): Observable<readonly DisplayMessageResponse[]> {
    return this.httpClient.put<readonly DisplayMessageResponse[]>(
      `${this.createMessagesUrl(branchId)}/order`,
      request,
      { headers: this.createHeaders() },
    );
  }

  deactivateDisplayMessage(
    branchId: number,
    messageId: number,
    rowVersion: string,
  ): Observable<DisplayMessageStateResponse> {
    return this.httpClient.post<DisplayMessageStateResponse>(
      `${this.createMessagesUrl(branchId)}/${messageId}/deactivate`,
      null,
      { headers: this.createHeaders(rowVersion) },
    );
  }

  reactivateDisplayMessage(
    branchId: number,
    messageId: number,
    rowVersion: string,
  ): Observable<DisplayMessageStateResponse> {
    return this.httpClient.post<DisplayMessageStateResponse>(
      `${this.createMessagesUrl(branchId)}/${messageId}/reactivate`,
      null,
      { headers: this.createHeaders(rowVersion) },
    );
  }

  private createDisplayConfigUrl(branchId: number): string {
    return `${this.branchesEndpoint}/${branchId}/display-configuration`;
  }

  private createMessagesUrl(branchId: number): string {
    return `${this.branchesEndpoint}/${branchId}/display-messages`;
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
}
