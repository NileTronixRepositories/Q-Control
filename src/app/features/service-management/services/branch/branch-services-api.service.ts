import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import {
  AssignBranchServicesRequest,
  AssignBranchServicesResponse,
  BranchServiceTreeNode,
  BranchServicesTreeQuery,
  CreateBranchServiceSubtreeResponse,
  CreateBranchServiceTreeRequest,
  CreateBranchServiceTreeResponse,
  UnassignBranchLeafServiceResponse,
} from '../../models/branch-services.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({ providedIn: 'root' })
export class BranchServicesApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  getBranchServicesTree(
    branchId: number,
    query: BranchServicesTreeQuery,
  ): Observable<readonly BranchServiceTreeNode[]> {
    let params = new HttpParams()
      .set('includeInactive', query.includeInactive)
      .set('includeDeleted', query.includeDeleted);

    if (query.searchText?.trim()) {
      params = params.set('searchText', query.searchText.trim());
    }

    return this.httpClient.get<readonly BranchServiceTreeNode[]>(
      `${this.createBranchUrl(branchId)}/services/tree`,
      {
        headers: this.createJsonHeaders(),
        params,
      },
    );
  }

  assignServices(
    branchId: number,
    request: AssignBranchServicesRequest,
  ): Observable<AssignBranchServicesResponse> {
    return this.httpClient.post<AssignBranchServicesResponse>(
      `${this.createBranchUrl(branchId)}/services/assign`,
      request,
      { headers: this.createJsonHeaders() },
    );
  }

  unassignLeafService(
    branchId: number,
    leafServiceId: number,
  ): Observable<UnassignBranchLeafServiceResponse> {
    return this.httpClient.delete<UnassignBranchLeafServiceResponse>(
      `${this.createBranchUrl(branchId)}/services/${leafServiceId}`,
      { headers: this.createJsonHeaders() },
    );
  }

  createBranchServiceTree(
    branchId: number,
    request: CreateBranchServiceTreeRequest,
  ): Observable<CreateBranchServiceTreeResponse> {
    return this.httpClient.post<CreateBranchServiceTreeResponse>(
      `${this.createBranchUrl(branchId)}/service-trees`,
      request,
      { headers: this.createJsonHeaders() },
    );
  }

  createBranchServiceSubtree(
    branchId: number,
    parentServiceId: number,
    request: CreateBranchServiceTreeRequest,
  ): Observable<CreateBranchServiceSubtreeResponse> {
    return this.httpClient.post<CreateBranchServiceSubtreeResponse>(
      `${this.createBranchUrl(branchId)}/services/${parentServiceId}/subtree`,
      request,
      { headers: this.createJsonHeaders() },
    );
  }

  private createBranchUrl(branchId: number): string {
    return new URL(String(branchId), `${this.branchesEndpoint}/`).toString();
  }

  private createJsonHeaders(): HttpHeaders {
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
