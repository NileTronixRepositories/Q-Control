import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore, AuthSessionService } from '@core';
import {
  CreateKioskTicketRequest,
  KioskReservationSearchItemResponse,
  KioskTicketResponse,
  SearchKioskReservationRequest,
} from '../../models/kiosk-api/kiosk-api.model';

const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class KioskApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl)
    .toString()
    .replace(/\/$/, '');
  private readonly mediaOrigin = new URL(environment.apiBaseUrl).origin;

  createTicket(
    branchId: number,
    request: CreateKioskTicketRequest,
  ): Observable<KioskTicketResponse> {
    const url = `${this.branchesEndpoint}/${branchId}/kiosk/tickets`;
    return this.httpClient
      .post<KioskTicketResponse>(url, request, { headers: this.createHeaders() })
      .pipe(map((ticket) => this.resolvePrintMedia(ticket)));
  }

  searchReservations(
    branchId: number,
    request: SearchKioskReservationRequest,
  ): Observable<readonly KioskReservationSearchItemResponse[]> {
    const url = `${this.branchesEndpoint}/${branchId}/kiosk/reservations/search`;
    return this.httpClient.post<readonly KioskReservationSearchItemResponse[]>(url, request, {
      headers: this.createHeaders(),
    });
  }

  convertReservationToTicket(
    branchId: number,
    reservationId: number,
  ): Observable<KioskTicketResponse> {
    const url = `${this.branchesEndpoint}/${branchId}/kiosk/reservations/${reservationId}/ticket`;
    return this.httpClient
      .post<KioskTicketResponse>(url, null, { headers: this.createHeaders() })
      .pipe(map((ticket) => this.resolvePrintMedia(ticket)));
  }

  private resolvePrintMedia(ticket: KioskTicketResponse): KioskTicketResponse {
    if (!ticket.print) return ticket;
    return {
      ...ticket,
      print: {
        ...ticket.print,
        elements: ticket.print.elements.map((element) => ({
          ...element,
          imageUrl: this.resolveMediaUrl(element.imageUrl),
        })),
      },
    };
  }

  private resolveMediaUrl(path: string | null): string | null {
    if (!path || path.startsWith('http://') || path.startsWith('https://')) return path;
    return new URL(path.startsWith('/') ? path : `/${path}`, this.mediaOrigin).toString();
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
