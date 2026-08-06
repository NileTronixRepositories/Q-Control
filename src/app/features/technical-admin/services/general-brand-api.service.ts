import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateGeneralBrandRequest,
  GeneralBrandResponse,
  UpdateGeneralBrandRequest,
} from '../models/general-brand.model';

const GENERAL_BRAND_PATH = 'api/general-brand';

@Injectable({
  providedIn: 'root',
})
export class GeneralBrandApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly generalBrandEndpoint = new URL(
    GENERAL_BRAND_PATH,
    environment.apiBaseUrl,
  ).toString();

  getGeneralBrand(): Observable<GeneralBrandResponse> {
    return this.httpClient.get<GeneralBrandResponse>(this.generalBrandEndpoint, {
      headers: this.createHeaders(),
    });
  }

  createGeneralBrand(
    request: CreateGeneralBrandRequest,
  ): Observable<GeneralBrandResponse> {
    return this.httpClient.post<GeneralBrandResponse>(
      this.generalBrandEndpoint,
      request,
      {
        headers: this.createHeaders(),
      },
    );
  }

  updateGeneralBrand(
    request: UpdateGeneralBrandRequest,
  ): Observable<GeneralBrandResponse> {
    return this.httpClient.put<GeneralBrandResponse>(
      this.generalBrandEndpoint,
      request,
      {
        headers: this.createHeaders(request.rowVersion ?? undefined),
      },
    );
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
