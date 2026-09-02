import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { AppLanguageStore, AuthSessionService } from '@core'; 
import { environment } from '../../../../../environments/environment';
import {
  CancelRequest,
  CreateReservationRequest,
  CreateTicketRequest,
  HistoryEvent,
  ManualTransferRequest,
  Page,
  ReservationDetails,
  ReservationListItem,
  ReservationQuery,
  TicketDetails,
  TicketListItem,
  TicketQuery,
} from '../../models/ticket-reservation/ticket-reservation.model';

@Injectable({ providedIn: 'root' })
export class TicketReservationApiService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthSessionService);
  private readonly language = inject(AppLanguageStore);
  private readonly branchesUrl = new URL('api/branches', environment.apiBaseUrl).toString();

  getTickets(
    branchId: number,
    query: TicketQuery,
    archive = false,
  ): Observable<Page<TicketListItem>> {
    return this.http.get<Page<TicketListItem>>(
      `${this.branchesUrl}/${branchId}/tickets${archive ? '/archive' : ''}`,
      { headers: this.headers(), params: this.params(query) },
    );
  }
  getTicket(branchId: number, id: number, archive = false): Observable<TicketDetails> {
    return this.http.get<TicketDetails>(
      `${this.branchesUrl}/${branchId}/tickets${archive ? '/archive' : ''}/${id}`,
      { headers: this.headers() },
    );
  }
  getTicketHistory(branchId: number, id: number): Observable<readonly HistoryEvent[]> {
    return this.http.get<readonly HistoryEvent[]>(
      `${this.branchesUrl}/${branchId}/tickets/${id}/history`,
      { headers: this.headers() },
    );
  }
  createTicket(branchId: number, request: CreateTicketRequest): Observable<TicketDetails> {
    return this.http.post<TicketDetails>(`${this.branchesUrl}/${branchId}/tickets`, request, {
      headers: this.headers(),
    });
  }
  cancelTicket(branchId: number, id: number, request: CancelRequest): Observable<TicketDetails> {
    return this.http.post<TicketDetails>(
      `${this.branchesUrl}/${branchId}/tickets/${id}/cancel`,
      request,
      { headers: this.headers() },
    );
  }
  returnToWaiting(branchId: number, id: number): Observable<TicketDetails> {
    return this.http.post<TicketDetails>(
      `${this.branchesUrl}/${branchId}/tickets/${id}/return-to-waiting`,
      null,
      { headers: this.headers() },
    );
  }
  startService(branchId: number, id: number): Observable<TicketDetails> {
    return this.http.post<TicketDetails>(
      `${this.branchesUrl}/${branchId}/tickets/${id}/start-service`,
      null,
      { headers: this.headers() },
    );
  }
  completeService(branchId: number, id: number): Observable<TicketDetails> {
    return this.http.post<TicketDetails>(
      `${this.branchesUrl}/${branchId}/tickets/${id}/complete-service`,
      null,
      { headers: this.headers() },
    );
  }
  manualTransfer(
    branchId: number,
    id: number,
    request: ManualTransferRequest,
  ): Observable<TicketDetails> {
    return this.http.post<TicketDetails>(
      `${this.branchesUrl}/${branchId}/tickets/${id}/manual-transfer`,
      request,
      { headers: this.headers() },
    );
  }

  getReservations(
    branchId: number,
    query: ReservationQuery,
    archive = false,
  ): Observable<Page<ReservationListItem>> {
    return this.http.get<Page<ReservationListItem>>(
      `${this.branchesUrl}/${branchId}/reservations${archive ? '/archive' : ''}`,
      { headers: this.headers(), params: this.params(query) },
    );
  }
  getReservation(branchId: number, id: number, archive = false): Observable<ReservationDetails> {
    return this.http.get<ReservationDetails>(
      `${this.branchesUrl}/${branchId}/reservations${archive ? '/archive' : ''}/${id}`,
      { headers: this.headers() },
    );
  }
  getReservationHistory(branchId: number, id: number): Observable<readonly HistoryEvent[]> {
    return this.http.get<readonly HistoryEvent[]>(
      `${this.branchesUrl}/${branchId}/reservations/${id}/history`,
      { headers: this.headers() },
    );
  }
  createReservation(
    branchId: number,
    request: CreateReservationRequest,
  ): Observable<ReservationDetails> {
    return this.http.post<ReservationDetails>(
      `${this.branchesUrl}/${branchId}/reservations`,
      request,
      { headers: this.headers() },
    );
  }
  cancelReservation(
    branchId: number,
    id: number,
    request: CancelRequest,
  ): Observable<ReservationDetails> {
    return this.http.post<ReservationDetails>(
      `${this.branchesUrl}/${branchId}/reservations/${id}/cancel`,
      request,
      { headers: this.headers() },
    );
  }
  convertReservation(branchId: number, id: number): Observable<TicketDetails> {
    return this.http.post<TicketDetails>(
      `${this.branchesUrl}/${branchId}/reservations/${id}/ticket`,
      null,
      { headers: this.headers() },
    );
  }

  private headers(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.language.language(),
      'Content-Type': 'application/json',
    });
    const token = this.auth.currentSession()?.token;
    return token ? headers.set('Authorization', `Bearer ${token}`) : headers;
  }
  private params(query: TicketQuery | ReservationQuery): HttpParams {
    let params = new HttpParams()
      .set('pageNumber', query.pageNumber ?? 1)
      .set('pageSize', Math.min(query.pageSize ?? 20, 100));
    for (const [key, value] of Object.entries(query))
      if (
        key !== 'pageNumber' &&
        key !== 'pageSize' &&
        value !== undefined &&
        value !== null &&
        value !== ''
      )
        params = params.set(key, String(value).trim());
    return params;
  }
}
