import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore, AuthSessionService } from '@core';
import {
  BranchDisplayPlaylistResponse,
  BranchVideoDeleteResponse,
  BranchVideoResponse,
  BranchVideoStateResponse,
  ReorderBranchVideosRequest,
} from '@features/branch-management/models/branch-video/branch-video.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class BranchVideosApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);

  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  getBranchVideos(branchId: number, isActive?: boolean): Observable<readonly BranchVideoResponse[]> {
    let params = new HttpParams();
    if (typeof isActive === 'boolean') {
      params = params.set('isActive', String(isActive));
    }

    return this.httpClient.get<readonly BranchVideoResponse[]>(
      `${this.branchesEndpoint}/${branchId}/display-videos`,
      {
        headers: this.createHeaders(),
        params,
      },
    );
  }

  uploadBranchVideo(
    branchId: number,
    videoFile: File,
    displayOrder: number,
  ): Observable<BranchVideoResponse> {
    const formData = new FormData();
    formData.append('Video', videoFile);
    formData.append('DisplayOrder', displayOrder.toString());

    return this.httpClient.post<BranchVideoResponse>(
      `${this.branchesEndpoint}/${branchId}/display-videos`,
      formData,
      {
        headers: this.createHeaders(undefined, false),
      },
    );
  }

  getBranchPlaylist(branchId: number): Observable<BranchDisplayPlaylistResponse> {
    return this.httpClient.get<BranchDisplayPlaylistResponse>(
      `${this.branchesEndpoint}/${branchId}/display-videos/playlist`,
      {
        headers: this.createHeaders(),
      },
    );
  }

  reorderBranchVideos(
    branchId: number,
    request: ReorderBranchVideosRequest,
  ): Observable<readonly BranchVideoResponse[]> {
    return this.httpClient.put<readonly BranchVideoResponse[]>(
      `${this.branchesEndpoint}/${branchId}/display-videos/order`,
      request,
      {
        headers: this.createHeaders(),
      },
    );
  }

  deactivateBranchVideo(
    branchId: number,
    videoId: number,
    rowVersion: string,
  ): Observable<BranchVideoStateResponse> {
    const headers = this.createHeaders().set('If-Match', rowVersion);
    return this.httpClient.post<BranchVideoStateResponse>(
      `${this.branchesEndpoint}/${branchId}/display-videos/${videoId}/deactivate`,
      {},
      { headers },
    );
  }

  reactivateBranchVideo(
    branchId: number,
    videoId: number,
    rowVersion: string,
  ): Observable<BranchVideoStateResponse> {
    const headers = this.createHeaders().set('If-Match', rowVersion);
    return this.httpClient.post<BranchVideoStateResponse>(
      `${this.branchesEndpoint}/${branchId}/display-videos/${videoId}/reactivate`,
      {},
      { headers },
    );
  }

  deleteBranchVideoPermanently(
    branchId: number,
    videoId: number,
    rowVersion: string,
  ): Observable<BranchVideoDeleteResponse> {
    const headers = this.createHeaders().set('If-Match', rowVersion);
    return this.httpClient.delete<BranchVideoDeleteResponse>(
      `${this.branchesEndpoint}/${branchId}/display-videos/${videoId}/permanent`,
      { headers },
    );
  }

  resolveMediaUrl(streamUrl: string | null): string {
    if (!streamUrl) return '';
    if (/^https?:\/\//i.test(streamUrl)) {
      return streamUrl;
    }
    const origin = new URL(environment.apiBaseUrl).origin;
    const cleanPath = streamUrl.startsWith('/') ? streamUrl : `/${streamUrl}`;
    return `${origin}${cleanPath}`;
  }

  private createHeaders(customContentType?: string, setJsonContentType = true): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
    });

    const token = this.authSessionService.currentSession()?.token;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    if (customContentType) {
      headers = headers.set('Content-Type', customContentType);
    } else if (setJsonContentType) {
      headers = headers.set('Content-Type', 'application/json');
    }

    return headers;
  }
}
