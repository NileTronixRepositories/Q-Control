import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { AppLanguageStore } from '../../../shared/store/app-language.store';

import {
  AuthenticatedSession,
  AuthenticatedUserType,
  LoginCredentials,
  LoginSubmissionResult,
} from '../models/login-credentials.model';

const LOGIN_PATH = 'api/auth/login';

interface LoginApiRequest {
  readonly userNameOrEmail: string;
  readonly password: string;
}

interface LoginApiResult {
  readonly isSuccess?: boolean;
  readonly value?: LoginApiValue;
  readonly token?: string;
  readonly userType?: string;
  readonly requiresBranchSelection?: boolean;
  readonly activeBranchId?: string | null;
}

interface LoginApiValue {
  readonly token: string;
  readonly userType: string;
  readonly requiresBranchSelection: boolean;
  readonly activeBranchId: string | null;
}
interface LoginApiError {
  readonly code?: string;
  readonly message?: string;
  readonly type?: string;
  readonly retryAfter?: number | null;
}

interface LoginProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly traceId?: string;
  readonly errors?: readonly LoginApiError[];
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly httpClient = inject(HttpClient);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly loginEndpoint = new URL(LOGIN_PATH, environment.apiBaseUrl).toString();
  private readonly sessionStorageKey = 'q-system.auth.session';

  private readonly currentSessionSignal = signal<AuthenticatedSession | null>(
    this.readStoredSession(),
  );

  readonly currentSession = this.currentSessionSignal.asReadonly();

  activeSession(): AuthenticatedSession | null {
    const session = this.currentSessionSignal();

    if (!session) {
      return null;
    }

    if (this.isJwtExpired(session.token)) {
      this.clearSession();
      return null;
    }

    return session;
  }

  shouldClearSessionForHttpStatus(status: number): boolean {
    return status === 401 || (status === 403 && this.isCurrentSessionExpired());
  }

  private isCurrentSessionExpired(): boolean {
    const session = this.currentSessionSignal();
    return !!session && this.isJwtExpired(session.token);
  }

  submitLogin(credentials: LoginCredentials): Observable<LoginSubmissionResult> {
    const request: LoginApiRequest = {
      userNameOrEmail: credentials.username.trim(),
      password: credentials.password,
    };

    return this.httpClient
      .post<LoginApiResult>(this.loginEndpoint, request, { headers: this.createHeaders() })
      .pipe(
        map((response) => this.mapLoginResponse(response, credentials.rememberSession)),
        catchError((error: HttpErrorResponse) => of(this.resolveLoginError(error))),
      );
  }

  clearSession(): void {
    this.currentSessionSignal.set(null);
    this.removeStorageItem(localStorage);
    this.removeStorageItem(sessionStorage);
  }

  private mapLoginResponse(
    response: LoginApiResult,
    rememberSession: boolean,
  ): LoginSubmissionResult {
    const loginValue = this.resolveLoginValue(response);

    if (!loginValue) {
      return {
        accepted: false,
        message: 'Invalid username or password.',
      };
    }

    const session: AuthenticatedSession = {
      token: loginValue.token,
      userType: this.resolveUserType(loginValue.userType),
      requiresBranchSelection: loginValue.requiresBranchSelection,
      activeBranchId: loginValue.activeBranchId,
    };

    this.storeSession(session, rememberSession);

    return {
      accepted: true,
      message: 'Login accepted.',
      session,
    };
  }

  private resolveLoginValue(response: LoginApiResult): LoginApiValue | null {
    if (this.isLoginApiValue(response)) {
      return response;
    }

    if (response.isSuccess === false || !response.value) {
      return null;
    }

    return this.isLoginApiValue(response.value) ? response.value : null;
  }

  private isLoginApiValue(value: unknown): value is LoginApiValue {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      typeof record['token'] === 'string' &&
      !this.isLegacyLocalFallbackToken(record['token']) &&
      typeof record['userType'] === 'string' &&
      typeof record['requiresBranchSelection'] === 'boolean' &&
      (record['activeBranchId'] === null || typeof record['activeBranchId'] === 'string')
    );
  }

  private resolveLoginError(error: HttpErrorResponse): LoginSubmissionResult {
    const apiMessage = this.extractApiMessage(error);

    if (apiMessage) {
      return {
        accepted: false,
        message: apiMessage,
      };
    }

    if (error.status === 0) {
      return {
        accepted: false,
        message: this.translateFallback('unavailable'),
      };
    }

    if (error.status === 404) {
      return {
        accepted: false,
        message: this.translateFallback('notFound'),
      };
    }

    return {
      accepted: false,
      message: this.translateFallback('invalid'),
    };
  }
  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });
  }

  private extractApiMessage(error: HttpErrorResponse): string | null {
    const body = error.error as LoginProblemDetails | string | null;

    if (typeof body === 'string') {
      const message = body.trim();
      return message.length > 0 ? message : null;
    }

    if (!body || typeof body !== 'object') {
      return null;
    }

    const firstError = body.errors?.find((item) => item.message?.trim().length);

    if (firstError?.message) {
      return firstError.message;
    }

    if (body.detail?.trim().length) {
      return body.detail;
    }

    if (body.title?.trim().length) {
      return body.title;
    }

    return null;
  }

  private translateFallback(key: 'unavailable' | 'notFound' | 'invalid'): string {
    const language = this.appLanguageStore.language();

    if (language === 'ar') {
      const arabicMessages: Record<typeof key, string> = {
        unavailable:
          '\u062e\u062f\u0645\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629.',
        notFound:
          '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0646\u0642\u0637\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644.',
        invalid:
          '\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.',
      };

      return arabicMessages[key];
    }

    const englishMessages: Record<typeof key, string> = {
      unavailable: 'Authentication service is unavailable.',
      notFound: 'Login endpoint was not found.',
      invalid: 'Invalid username or password.',
    };

    return englishMessages[key];
  }
  private resolveUserType(userType: string): AuthenticatedUserType {
    return userType === 'TechnicalAdmin' ? 'TechnicalAdmin' : 'OrganizationAdmin';
  }

  private storeSession(session: AuthenticatedSession, rememberSession: boolean): void {
    this.currentSessionSignal.set(session);
    const targetStorage = rememberSession ? localStorage : sessionStorage;
    const staleStorage = rememberSession ? sessionStorage : localStorage;

    this.removeStorageItem(staleStorage);
    targetStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
  }

  private readStoredSession(): AuthenticatedSession | null {
    const session =
      this.parseStoredSession(localStorage.getItem(this.sessionStorageKey)) ??
      this.parseStoredSession(sessionStorage.getItem(this.sessionStorageKey));

    if (session && this.isJwtExpired(session.token)) {
      this.removeStorageItem(localStorage);
      this.removeStorageItem(sessionStorage);
      return null;
    }

    return session;
  }

  private parseStoredSession(value: string | null): AuthenticatedSession | null {
    if (!value) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(value) as unknown;

      if (!this.isStoredSession(parsedValue)) {
        return null;
      }

      return parsedValue;
    } catch {
      return null;
    }
  }

  private isStoredSession(value: unknown): value is AuthenticatedSession {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      typeof record['token'] === 'string' &&
      !this.isLegacyLocalFallbackToken(record['token']) &&
      (record['userType'] === 'TechnicalAdmin' || record['userType'] === 'OrganizationAdmin') &&
      typeof record['requiresBranchSelection'] === 'boolean' &&
      (record['activeBranchId'] === null || typeof record['activeBranchId'] === 'string')
    );
  }

  private isJwtExpired(token: string): boolean {
    const payload = this.readJwtPayload(token);
    const expiresAt = payload?.['exp'];
    const expiresAtSeconds = typeof expiresAt === 'number' ? expiresAt : Number(expiresAt);

    if (!Number.isFinite(expiresAtSeconds)) {
      return false;
    }

    return Date.now() >= expiresAtSeconds * 1000;
  }

  private readJwtPayload(token: string): Record<string, unknown> | null {
    const [, payload] = token.split('.');

    if (!payload) {
      return null;
    }

    try {
      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=');
      const decodedPayload = globalThis.atob(paddedPayload);
      const parsedPayload = JSON.parse(decodedPayload) as unknown;

      return parsedPayload && typeof parsedPayload === 'object'
        ? (parsedPayload as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private isLegacyLocalFallbackToken(token: string): boolean {
    return token === 'technical-admin-local-token' || token === 'organization-admin-local-token';
  }

  private removeStorageItem(storage: Storage): void {
    storage.removeItem(this.sessionStorageKey);
  }
}
