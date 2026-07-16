import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import {
  CreateServiceScheduleRequest,
  DayOfWeek,
  SERVICE_SCHEDULE_DAYS,
  ServiceSchedule,
  UpdateServiceScheduleRequest,
} from '../models/service-schedule.model';

type UnknownRecord = Record<string, unknown>;
const BRANCHES_PATH = 'api/branches';
const DAY_VALUES = new Set<string>(SERVICE_SCHEDULE_DAYS);

@Injectable({ providedIn: 'root' })
export class ServiceScheduleApiService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString();

  getSchedule(branchId: number, leafServiceId: number): Observable<ServiceSchedule> {
    return this.httpClient
      .get<unknown>(this.createScheduleUrl(branchId, leafServiceId), {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeSchedule(response, branchId, leafServiceId)));
  }

  createSchedule(
    branchId: number,
    leafServiceId: number,
    request: CreateServiceScheduleRequest,
  ): Observable<ServiceSchedule> {
    return this.httpClient
      .post<unknown>(this.createScheduleUrl(branchId, leafServiceId), request, {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeSchedule(response, branchId, leafServiceId)));
  }

  updateSchedule(
    branchId: number,
    leafServiceId: number,
    request: UpdateServiceScheduleRequest,
  ): Observable<ServiceSchedule> {
    return this.httpClient
      .put<unknown>(this.createScheduleUrl(branchId, leafServiceId), request, {
        headers: this.createJsonHeaders(),
      })
      .pipe(map((response) => this.normalizeSchedule(response, branchId, leafServiceId)));
  }

  private createScheduleUrl(branchId: number, leafServiceId: number): string {
    return `${new URL(String(branchId), `${this.branchesEndpoint}/`).toString()}/services/${leafServiceId}/schedule`;
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

  private normalizeSchedule(
    source: unknown,
    branchId: number,
    leafServiceId: number,
  ): ServiceSchedule {
    const record = this.asRecord(this.unwrapResponse(source));

    return {
      scheduleId: this.readNumber(record, ['scheduleId', 'id']) ?? 0,
      branchId: this.readNumber(record, ['branchId']) ?? branchId,
      serviceId: this.readNumber(record, ['serviceId', 'leafServiceId']) ?? leafServiceId,
      startTime: this.readString(record, ['startTime']) ?? '',
      endTime: this.readString(record, ['endTime']) ?? '',
      workDays: this.normalizeWorkDays(record['workDays']),
      isSlotCodeRequired: this.readBoolean(record, ['isSlotCodeRequired']) ?? false,
      slotCode: this.readString(record, ['slotCode']) ?? null,
      isCurrentlyOperational: this.readBoolean(record, ['isCurrentlyOperational']) ?? true,
      rowVersion: this.readString(record, ['rowVersion', 'version']) ?? '',
      createdByApplicationUserId:
        this.readString(record, ['createdByApplicationUserId', 'createdBy']) ?? null,
      createdOnUtc: this.readString(record, ['createdOnUtc', 'createdAt']) ?? null,
      lastModifiedByApplicationUserId:
        this.readString(record, ['lastModifiedByApplicationUserId', 'modifiedBy']) ?? null,
      lastModifiedOnUtc:
        this.readString(record, ['lastModifiedOnUtc', 'modifiedOnUtc', 'updatedAt']) ?? null,
      message: this.readString(record, ['message']) ?? null,
    };
  }

  private normalizeWorkDays(value: unknown): readonly DayOfWeek[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return [...new Set(value)].filter(
      (item): item is DayOfWeek => typeof item === 'string' && DAY_VALUES.has(item),
    );
  }

  private unwrapResponse(source: unknown): unknown {
    let current = source;

    for (let depth = 0; depth < 4; depth += 1) {
      const record = this.asRecord(current);
      const nested = record['result'] ?? record['value'];

      if (!this.isRecord(nested)) {
        break;
      }

      current = nested;
    }

    return current;
  }

  private readString(record: UnknownRecord, keys: readonly string[]): string | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
    }

    return null;
  }

  private readNumber(record: UnknownRecord, keys: readonly string[]): number | null {
    for (const key of keys) {
      const value = record[key];
      const numberValue = typeof value === 'number' ? value : Number(value);
      if (value !== null && value !== '' && Number.isFinite(numberValue)) {
        return numberValue;
      }
    }

    return null;
  }

  private readBoolean(record: UnknownRecord, keys: readonly string[]): boolean | null {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'boolean') {
        return value;
      }
      if (value === 'true' || value === 'True' || value === 1) {
        return true;
      }
      if (value === 'false' || value === 'False' || value === 0) {
        return false;
      }
    }

    return null;
  }

  private asRecord(value: unknown): UnknownRecord {
    return this.isRecord(value) ? value : {};
  }

  private isRecord(value: unknown): value is UnknownRecord {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }
}
