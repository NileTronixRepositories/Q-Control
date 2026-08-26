import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore, AuthSessionService } from '@core';
import {
  BranchConfigurationResponse,
  CreateBranchConfigurationRequest,
  UpdateBranchConfigurationRequest,
} from '@features/branch-management/models/branch-configuration/branch-configuration.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class BranchConfigurationApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString().replace(/\/$/, '');

  getBranchConfiguration(branchId: number): Observable<BranchConfigurationResponse> {
    return this.httpClient.get<BranchConfigurationResponse>(this.createConfigurationUrl(branchId), {
      headers: this.createHeaders(),
    });
  }

  createBranchConfiguration(
    branchId: number,
    request: CreateBranchConfigurationRequest,
  ): Observable<BranchConfigurationResponse> {
    return this.httpClient.post<BranchConfigurationResponse>(
      this.createConfigurationUrl(branchId),
      request,
      { headers: this.createHeaders() },
    );
  }

  updateBranchConfiguration(
    branchId: number,
    request: UpdateBranchConfigurationRequest,
  ): Observable<BranchConfigurationResponse> {
    return this.httpClient.put<BranchConfigurationResponse>(
      this.createConfigurationUrl(branchId),
      request,
      { headers: this.createHeaders() },
    );
  }

  private createConfigurationUrl(branchId: number): string {
    return `${this.createBranchUrl(branchId)}/configuration`;
  }

  private createBranchUrl(branchId: number): string {
    return `${this.branchesEndpoint}/${branchId}`;
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
}
