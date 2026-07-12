import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateBranchAdminRequest,
  CreateBranchAdminResponse,
} from '../models/branch-admin.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class BranchAdminsApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  createBranchAdmin(
    branchId: number,
    request: CreateBranchAdminRequest,
  ): Observable<CreateBranchAdminResponse> {
    return this.httpClient.post<CreateBranchAdminResponse>(this.createAdminsUrl(branchId), request, {
      headers: this.createHeaders(),
    });
  }

  private createAdminsUrl(branchId: number): string {
    return `${new URL(String(branchId), `${this.branchesEndpoint}/`).toString()}/admins`;
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
