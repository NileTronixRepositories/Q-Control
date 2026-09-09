import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { AppLanguageStore, AuthSessionService } from '@core';
import { environment } from '../../../../../environments/environment';
import {
  SaveTicketConfigurationRequest,
  TicketConfiguration,
  UpdateTicketConfigurationRequest,
} from '../../models/ticket-template/ticket-template.model';

export interface TicketDesignerBranding {
  readonly logoUrl: string | null;
  readonly rowVersion: string | null;
}

@Injectable({ providedIn: 'root' })
export class TicketConfigurationApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSessionService);
  private readonly language = inject(AppLanguageStore);
  private readonly branchesUrl = new URL('api/branches', environment.apiBaseUrl)
    .toString()
    .replace(/\/$/, '');
  private readonly mediaOrigin = new URL(environment.apiBaseUrl).origin;

  get(branchId: number): Observable<TicketConfiguration> {
    return this.http.get<TicketConfiguration>(this.configurationUrl(branchId), {
      headers: this.headers(),
    });
  }

  create(
    branchId: number,
    request: SaveTicketConfigurationRequest,
  ): Observable<TicketConfiguration> {
    return this.http.post<TicketConfiguration>(this.configurationUrl(branchId), request, {
      headers: this.headers(),
    });
  }

  update(
    branchId: number,
    request: UpdateTicketConfigurationRequest,
  ): Observable<TicketConfiguration> {
    return this.http.put<TicketConfiguration>(this.configurationUrl(branchId), request, {
      headers: this.headers(),
    });
  }

  getBranding(branchId: number): Observable<TicketDesignerBranding> {
    return this.http.get<TicketDesignerBranding>(`${this.branchesUrl}/${branchId}/branding`, {
      headers: this.headers(),
    });
  }

  resolveMediaUrl(path: string | null): string | null {
    if (!path) return null;
    return path.startsWith('http://') || path.startsWith('https://')
      ? path
      : new URL(path.startsWith('/') ? path : `/${path}`, this.mediaOrigin).toString();
  }

  private configurationUrl(branchId: number): string {
    return `${this.branchesUrl}/${branchId}/ticket-configuration`;
  }

  private headers(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.language.language(),
      'Content-Type': 'application/json',
    });
    const token = this.auth.currentSession()?.token;
    return token ? headers.set('Authorization', `Bearer ${token}`) : headers;
  }
}
