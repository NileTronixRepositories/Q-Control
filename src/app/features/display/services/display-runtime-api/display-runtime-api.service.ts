import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
  DisplayRuntimeConfigurationResponse,
  DisplayRuntimePlaylistResponse,
} from '@features/queue-management/public-api';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class DisplayRuntimeApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl)
    .toString()
    .replace(/\/$/, '');
  private readonly mediaOrigin = this.resolveMediaOrigin(environment.apiBaseUrl);

  getRuntimeConfiguration(branchId: number): Observable<DisplayRuntimeConfigurationResponse> {
    return this.httpClient.get<DisplayRuntimeConfigurationResponse>(
      `${this.branchesEndpoint}/${branchId}/display-runtime-configuration`,
      { headers: this.createHeaders() },
    );
  }

  getRuntimePlaylist(branchId: number): Observable<DisplayRuntimePlaylistResponse> {
    return this.httpClient.get<DisplayRuntimePlaylistResponse>(
      `${this.branchesEndpoint}/${branchId}/display-runtime-playlist`,
      { headers: this.createHeaders() },
    );
  }

  resolveMediaUrl(mediaPath: string | null): string {
    if (!mediaPath) {
      return '';
    }

    if (/^https?:\/\//i.test(mediaPath)) {
      return mediaPath;
    }

    const cleanPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
    return `${this.mediaOrigin}${cleanPath}`;
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      Accept: 'application/json',
    });
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
