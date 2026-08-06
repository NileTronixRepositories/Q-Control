import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  BranchAdvertisementDeleteResponse,
  BranchAdvertisementResponse,
  BranchAdvertisementStateResponse,
  BranchBrandingResponse,
  ReorderBranchAdvertisementsRequest,
  UpdateBranchThemeRequest,
} from '../models/branch-branding.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class BranchBrandingApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();
  private readonly mediaOrigin = this.resolveMediaOrigin(environment.apiBaseUrl);

  getBranchBranding(branchId: number): Observable<BranchBrandingResponse> {
    return this.httpClient.get<BranchBrandingResponse>(this.createBrandingUrl(branchId), {
      headers: this.createHeaders(),
    });
  }

  updateBranchTheme(
    branchId: number,
    request: UpdateBranchThemeRequest,
  ): Observable<BranchBrandingResponse> {
    return this.httpClient.put<BranchBrandingResponse>(`${this.createBrandingUrl(branchId)}/theme`, request, {
      headers: this.createHeaders(),
    });
  }

  uploadBranchLogo(
    branchId: number,
    logo: File,
    rowVersion: string | null,
  ): Observable<BranchBrandingResponse> {
    const formData = new FormData();
    formData.append('Logo', logo);

    if (rowVersion) {
      formData.append('RowVersion', rowVersion);
    }

    return this.httpClient.put<BranchBrandingResponse>(`${this.createBrandingUrl(branchId)}/logo`, formData, {
      headers: this.createHeaders(undefined, false),
    });
  }

  getBranchAdvertisements(
    branchId: number,
    isActive?: boolean,
  ): Observable<readonly BranchAdvertisementResponse[]> {
    const options = {
      headers: this.createHeaders(),
      params: isActive === undefined ? undefined : new HttpParams().set('isActive', isActive),
    };

    return this.httpClient.get<readonly BranchAdvertisementResponse[]>(
      this.createAdvertisementsUrl(branchId),
      options,
    );
  }

  addBranchAdvertisements(
    branchId: number,
    images: readonly File[],
  ): Observable<readonly BranchAdvertisementResponse[]> {
    const formData = new FormData();

    for (const image of images) {
      formData.append('Images', image);
    }

    return this.httpClient.post<readonly BranchAdvertisementResponse[]>(
      this.createAdvertisementsUrl(branchId),
      formData,
      { headers: this.createHeaders(undefined, false) },
    );
  }

  reorderBranchAdvertisements(
    branchId: number,
    request: ReorderBranchAdvertisementsRequest,
  ): Observable<readonly BranchAdvertisementResponse[]> {
    return this.httpClient.put<readonly BranchAdvertisementResponse[]>(
      `${this.createAdvertisementsUrl(branchId)}/order`,
      request,
      { headers: this.createHeaders() },
    );
  }

  deactivateBranchAdvertisement(
    branchId: number,
    advertisementId: number,
    rowVersion: string,
  ): Observable<BranchAdvertisementStateResponse> {
    return this.httpClient.post<BranchAdvertisementStateResponse>(
      `${this.createAdvertisementUrl(branchId, advertisementId)}/deactivate`,
      null,
      { headers: this.createHeaders(rowVersion) },
    );
  }

  reactivateBranchAdvertisement(
    branchId: number,
    advertisementId: number,
    rowVersion: string,
  ): Observable<BranchAdvertisementStateResponse> {
    return this.httpClient.post<BranchAdvertisementStateResponse>(
      `${this.createAdvertisementUrl(branchId, advertisementId)}/reactivate`,
      null,
      { headers: this.createHeaders(rowVersion) },
    );
  }

  deleteBranchAdvertisement(
    branchId: number,
    advertisementId: number,
    rowVersion: string,
  ): Observable<BranchAdvertisementDeleteResponse> {
    return this.httpClient.delete<BranchAdvertisementDeleteResponse>(
      this.createAdvertisementUrl(branchId, advertisementId),
      { headers: this.createHeaders(rowVersion) },
    );
  }

  resolveMediaUrl(mediaPath: string | null, rowVersion?: string | null): string | null {
    if (!mediaPath) {
      return null;
    }

    const baseUrl = mediaPath.startsWith('http://') || mediaPath.startsWith('https://')
      ? new URL(mediaPath)
      : new URL(mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`, this.mediaOrigin);

    if (rowVersion) {
      baseUrl.searchParams.set('v', rowVersion);
    } else {
      baseUrl.searchParams.set('t', String(Date.now()));
    }

    return baseUrl.toString();
  }


  private createBrandingUrl(branchId: number): string {
    return `${this.createBranchUrl(branchId)}/branding`;
  }

  private createAdvertisementsUrl(branchId: number): string {
    return `${this.createBranchUrl(branchId)}/advertisements`;
  }

  private createAdvertisementUrl(branchId: number, advertisementId: number): string {
    return `${this.createAdvertisementsUrl(branchId)}/${advertisementId}`;
  }

  private createBranchUrl(branchId: number): string {
    return new URL(String(branchId), `${this.branchesEndpoint}/`).toString();
  }

  private createHeaders(rowVersion?: string, includeJsonContentType = true): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
    });

    if (includeJsonContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }

    const token = this.authSessionService.currentSession()?.token;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (rowVersion) {
      headers = headers.set('If-Match', rowVersion);
    }

    return headers;
  }

  private resolveMediaOrigin(apiBaseUrl: string): string {
    const apiUrl = new URL(apiBaseUrl);
    const normalizedPath = apiUrl.pathname.replace(/\/$/, '');

    if (normalizedPath.toLowerCase().endsWith('/api')) {
      apiUrl.pathname = `${normalizedPath.slice(0, -4)}/`;
      apiUrl.search = '';
      apiUrl.hash = '';
      return apiUrl.toString().replace(/\/$/, '');
    }

    return apiUrl.origin;
  }
}