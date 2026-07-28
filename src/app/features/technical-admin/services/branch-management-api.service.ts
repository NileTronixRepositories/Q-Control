import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  BranchDetails,
  BranchLifecycleResponse,
  BranchListItem,
  BranchListQuery,
  BranchMutationResponse,
  BranchPermanentDeleteResponse,
  CreateBranchRequest,
  PagedBranchResponse,
  UpdateBranchRequest,
} from '../models/branch-management.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class BranchManagementApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  getBranches(query: BranchListQuery): Observable<PagedBranchResponse<BranchListItem>> {
    return this.httpClient.get<PagedBranchResponse<BranchListItem>>(this.branchesEndpoint, {
      headers: this.createHeaders(),
      params: this.createParams(query),
    });
  }

  getBranchDetails(branchId: number): Observable<BranchDetails> {
    return this.httpClient.get<BranchDetails>(this.createItemUrl(branchId), {
      headers: this.createHeaders(),
    });
  }

  createBranch(request: CreateBranchRequest): Observable<BranchMutationResponse> {
    return this.httpClient.post<BranchMutationResponse>(this.branchesEndpoint, request, {
      headers: this.createHeaders(),
    });
  }

  updateBranch(branchId: number, request: UpdateBranchRequest): Observable<BranchMutationResponse> {
    return this.httpClient.put<BranchMutationResponse>(this.createItemUrl(branchId), request, {
      headers: this.createHeaders(),
    });
  }

  deactivateBranch(branchId: number, rowVersion: string): Observable<BranchLifecycleResponse> {
    return this.httpClient.post<BranchLifecycleResponse>(this.createLifecycleUrl(branchId, 'deactivate'), null, {
      headers: this.createHeaders(rowVersion),
    });
  }

  reactivateBranch(branchId: number, rowVersion: string): Observable<BranchLifecycleResponse> {
    return this.httpClient.post<BranchLifecycleResponse>(this.createLifecycleUrl(branchId, 'reactivate'), null, {
      headers: this.createHeaders(rowVersion),
    });
  }

  permanentlyDeleteBranch(branchId: number, rowVersion: string): Observable<BranchPermanentDeleteResponse> {
    return this.httpClient.delete<BranchPermanentDeleteResponse>(this.createLifecycleUrl(branchId, 'permanent'), {
      headers: this.createHeaders(rowVersion),
    });
  }

  private createItemUrl(branchId: number): string {
    return new URL(String(branchId), this.branchesEndpoint + '/').toString();
  }

  private createLifecycleUrl(branchId: number, action: 'deactivate' | 'reactivate' | 'permanent'): string {
    return `${this.createItemUrl(branchId)}/${action}`;
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

  private createParams(query: BranchListQuery): HttpParams {
    let params = new HttpParams()
      .set('OrderSort', query.orderSort)
      .set('PageNumber', query.pageNumber)
      .set('PageSize', query.pageSize);

    if (query.searchText?.trim()) {
      params = params.set('SearchText', query.searchText.trim());
    }

    if (query.isActive !== null && query.isActive !== undefined) {
      params = params.set('IsActive', query.isActive);
    }

    return params;
  }
}
