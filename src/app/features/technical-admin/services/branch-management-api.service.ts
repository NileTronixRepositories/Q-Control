import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  BranchDeleteResponse,
  BranchDetails,
  BranchListItem,
  BranchListQuery,
  BranchMutationRequest,
  BranchMutationResponse,
  PagedBranchResponse
} from '../models/branch-management.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root'
})
export class BranchManagementApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  getBranches(query: BranchListQuery): Observable<PagedBranchResponse<BranchListItem>> {
    return this.httpClient.get<PagedBranchResponse<BranchListItem>>(this.branchesEndpoint, {
      headers: this.createHeaders(),
      params: this.createParams(query)
    });
  }

  getBranchDetails(branchId: number): Observable<BranchDetails> {
    return this.httpClient.get<BranchDetails>(this.createItemUrl(branchId), {
      headers: this.createHeaders()
    });
  }

  createBranch(request: BranchMutationRequest): Observable<BranchMutationResponse> {
    return this.httpClient.post<BranchMutationResponse>(this.branchesEndpoint, request, {
      headers: this.createHeaders()
    });
  }

  updateBranch(branchId: number, request: BranchMutationRequest): Observable<BranchMutationResponse> {
    return this.httpClient.put<BranchMutationResponse>(this.createItemUrl(branchId), request, {
      headers: this.createHeaders()
    });
  }

  deleteBranch(branchId: number): Observable<BranchDeleteResponse> {
    return this.httpClient.delete<BranchDeleteResponse>(this.createItemUrl(branchId), {
      headers: this.createHeaders()
    });
  }
  private createItemUrl(branchId: number): string {
    return new URL(String(branchId), this.branchesEndpoint + '/').toString();
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

  private createParams(query: BranchListQuery): HttpParams {
    return new HttpParams()
      .set('searchText', query.searchText)
      .set('orderSort', query.orderSort)
      .set('pageNumber', query.pageNumber)
      .set('pageSize', query.pageSize);
  }
}


