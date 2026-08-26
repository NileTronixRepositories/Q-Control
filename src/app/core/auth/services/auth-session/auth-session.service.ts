import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AppLanguageStore } from '../../../i18n/app-language.store';
import { decodeJwtPayload } from '../../utils/auth-permissions.util';

import {
  AuthenticatedBranch,
  AuthenticatedSession,
  AuthenticatedUserType,
  ChangeInitialPasswordSubmissionResult,
  LoginCredentials,
  LoginSubmissionResult,
} from '../../models/auth-session/auth-session.model';

const LOGIN_PATH = 'api/auth/login';
const CHANGE_INITIAL_PASSWORD_PATH = 'api/auth/change-initial-password';

interface LoginApiRequest {
  readonly userNameOrEmail: string;
  readonly password: string;
}

interface ChangeInitialPasswordApiRequest {
  readonly newPassword: string;
}

interface UserTokenApiResult {
  readonly isSuccess?: boolean;
  readonly value?: UserTokenApiValue;
  readonly token?: string;
  readonly userType?: string;
  readonly displayName?: string | null;
  readonly userName?: string | null;
  readonly email?: string | null;
  readonly requiresBranchSelection?: boolean;
  readonly activeBranchId?: number | string | null;
  readonly branches?: readonly LoginBranchApiValue[];
  readonly firstLoginFlag?: boolean;
  readonly passwordExpiredFlag?: boolean;
  readonly passwordChangedOnUtc?: string | null;
  readonly passwordExpiresOnUtc?: string | null;
}

interface UserTokenApiValue {
  readonly token: string;
  readonly userType: string;
  readonly displayName?: string | null;
  readonly userName?: string | null;
  readonly email?: string | null;
  readonly requiresBranchSelection: boolean;
  readonly activeBranchId: number | string | null;
  readonly branches?: readonly LoginBranchApiValue[];
  readonly firstLoginFlag?: boolean;
  readonly passwordExpiredFlag?: boolean;
  readonly passwordChangedOnUtc?: string | null;
  readonly passwordExpiresOnUtc?: string | null;
}

interface LoginBranchApiValue {
  readonly branchId: number | string;
  readonly englishName: string;
  readonly arabicName: string;
  readonly isActive: boolean;
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
  private readonly changeInitialPasswordEndpoint = new URL(
    CHANGE_INITIAL_PASSWORD_PATH,
    environment.apiBaseUrl,
  ).toString();
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

  isFirstLoginSession(): boolean {
    return this.activeSession()?.firstLoginFlag === true;
  }

  shouldClearSessionForHttpStatus(status: number): boolean {
    return status === 401 || (status === 403 && this.isCurrentSessionExpired());
  }

  submitLogin(credentials: LoginCredentials): Observable<LoginSubmissionResult> {
    const request: LoginApiRequest = {
      userNameOrEmail: credentials.username.trim(),
      password: credentials.password,
    };

    return this.httpClient
      .post<UserTokenApiResult>(this.loginEndpoint, request, { headers: this.createJsonHeaders() })
      .pipe(
        map((response) =>
          this.mapTokenResponse(response, credentials.rememberSession, credentials.username.trim()),
        ),
        catchError((error: HttpErrorResponse) => of(this.resolveAuthError(error))),
      );
  }

  changeInitialPassword(
    newPassword: string,
  ): Observable<ChangeInitialPasswordSubmissionResult> {
    const request: ChangeInitialPasswordApiRequest = { newPassword };

    return this.httpClient
      .post<UserTokenApiResult>(this.changeInitialPasswordEndpoint, request, {
        headers: this.createJsonHeaders(),
      })
      .pipe(
        map((response) =>
          this.mapTokenResponse(response, this.shouldRememberCurrentSession(), this.currentIdentityFallback()),
        ),
        catchError((error: HttpErrorResponse) => of(this.resolveAuthError(error))),
      );
  }

  clearSession(): void {
    this.currentSessionSignal.set(null);
    this.removeStorageItem(localStorage);
    this.removeStorageItem(sessionStorage);
  }

  private mapTokenResponse(
    response: UserTokenApiResult,
    rememberSession: boolean,
    identityFallback?: string,
  ): LoginSubmissionResult {
    const tokenValue = this.resolveTokenValue(response);

    if (!tokenValue) {
      return {
        accepted: false,
        message: 'Invalid username or password.',
      };
    }

    const session = this.createSession(tokenValue, identityFallback);
    this.storeSession(session, rememberSession);

    return {
      accepted: true,
      message: 'Login accepted.',
      session,
    };
  }

  private resolveTokenValue(response: UserTokenApiResult): UserTokenApiValue | null {
    if (this.isTokenApiValue(response)) {
      return response;
    }

    if (response.isSuccess === false || !response.value) {
      return null;
    }

    return this.isTokenApiValue(response.value) ? response.value : null;
  }

  private isTokenApiValue(value: unknown): value is UserTokenApiValue {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const record = value as Record<string, unknown>;

    return (
      typeof record['token'] === 'string' &&
      !this.isLegacyLocalFallbackToken(record['token']) &&
      typeof record['userType'] === 'string' &&
      typeof record['requiresBranchSelection'] === 'boolean' &&
      (record['activeBranchId'] === null ||
        typeof record['activeBranchId'] === 'number' ||
        typeof record['activeBranchId'] === 'string')
    );
  }

  private createSession(value: UserTokenApiValue, identityFallback?: string): AuthenticatedSession {
    const identity = this.resolveSessionIdentity(value, identityFallback);

    return {
      token: value.token,
      userType: this.resolveUserType(value.userType),
      ...identity,
      requiresBranchSelection: value.requiresBranchSelection,
      activeBranchId: this.toNullableNumber(value.activeBranchId),
      branches: this.resolveBranches(value.branches),
      firstLoginFlag: value.firstLoginFlag ?? this.resolvePasswordChangeRequired(value.token),
      passwordExpiredFlag: value.passwordExpiredFlag ?? false,
      passwordChangedOnUtc: value.passwordChangedOnUtc ?? null,
      passwordExpiresOnUtc: value.passwordExpiresOnUtc ?? null,
    };
  }

  private resolveSessionIdentity(
    value: UserTokenApiValue,
    identityFallback?: string,
  ): Pick<AuthenticatedSession, 'displayName' | 'userName' | 'email'> {
    const payload = decodeJwtPayload(value.token) ?? {};
    const givenName = this.firstString(payload['given_name']);
    const familyName = this.firstString(payload['family_name']);
    const composedName = [givenName, familyName].filter(Boolean).join(' ');
    const fallback = this.firstString(identityFallback);
    const email = this.firstString(
      value.email,
      payload['email'],
      payload['emailaddress'],
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'],
      fallback?.includes('@') ? fallback : undefined,
    );
    const userName = this.firstString(
      value.userName,
      payload['preferred_username'],
      payload['unique_name'],
      payload['username'],
      payload['nameid'],
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'],
      fallback && !fallback.includes('@') ? fallback : undefined,
    );
    const displayName = this.firstString(
      value.displayName,
      payload['name'],
      payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'],
      composedName,
      userName,
      email,
      fallback,
      payload['sub'],
    );

    return { displayName, userName, email };
  }

  private currentIdentityFallback(): string | undefined {
    const session = this.currentSessionSignal();
    return this.firstString(session?.displayName, session?.userName, session?.email);
  }

  private firstString(...values: readonly unknown[]): string | undefined {
    for (const value of values) {
      if (typeof value !== 'string') {
        continue;
      }

      const trimmedValue = value.trim();
      if (trimmedValue.length > 0) {
        return trimmedValue;
      }
    }

    return undefined;
  }

  private resolveBranches(value: readonly LoginBranchApiValue[] | undefined): readonly AuthenticatedBranch[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((branch) => ({
        branchId: this.toNullableNumber(branch.branchId),
        englishName: branch.englishName,
        arabicName: branch.arabicName,
        isActive: branch.isActive,
      }))
      .filter((branch): branch is AuthenticatedBranch => branch.branchId !== null);
  }

  private resolveAuthError(error: HttpErrorResponse): LoginSubmissionResult {
    const apiError = this.extractApiError(error);

    if (apiError.message) {
      return {
        accepted: false,
        message: apiError.message,
        errorCode: apiError.code,
      };
    }

    if (error.status === 0) {
      return {
        accepted: false,
        message: this.translateFallback('unavailable'),
        errorCode: apiError.code,
      };
    }

    if (error.status === 404) {
      return {
        accepted: false,
        message: this.translateFallback('notFound'),
        errorCode: apiError.code,
      };
    }

    return {
      accepted: false,
      message: this.translateFallback('invalid'),
      errorCode: apiError.code,
    };
  }

  private createJsonHeaders(): HttpHeaders {
    let headers = new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });

    const token = this.currentSessionSignal()?.token;

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private extractApiError(error: HttpErrorResponse): { readonly code?: string; readonly message?: string } {
    const body = error.error as LoginProblemDetails | string | null;

    if (typeof body === 'string') {
      const message = body.trim();
      return { message: message.length > 0 ? message : undefined };
    }

    if (!body || typeof body !== 'object') {
      return {};
    }

    const firstError = body.errors?.find((item) => item.message?.trim().length || item.code?.trim().length);

    if (firstError) {
      return {
        code: firstError.code,
        message: firstError.message,
      };
    }

    if (body.detail?.trim().length) {
      return { message: body.detail };
    }

    if (body.title?.trim().length) {
      return { message: body.title };
    }

    return {};
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
    if (userType === 'TechnicalAdmin' || userType === 'BranchAdmin') {
      return userType;
    }

    return 'OrganizationAdmin';
  }

  private storeSession(session: AuthenticatedSession, rememberSession: boolean): void {
    this.currentSessionSignal.set(session);
    const targetStorage = rememberSession ? localStorage : sessionStorage;
    const staleStorage = rememberSession ? sessionStorage : localStorage;

    this.removeStorageItem(staleStorage);
    targetStorage.setItem(this.sessionStorageKey, JSON.stringify(session));
  }

  private shouldRememberCurrentSession(): boolean {
    return localStorage.getItem(this.sessionStorageKey) !== null;
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
      (record['userType'] === 'TechnicalAdmin' ||
        record['userType'] === 'OrganizationAdmin' ||
        record['userType'] === 'BranchAdmin') &&
      this.isOptionalStoredString(record['displayName']) &&
      this.isOptionalStoredString(record['userName']) &&
      this.isOptionalStoredString(record['email']) &&
      typeof record['requiresBranchSelection'] === 'boolean' &&
      (record['activeBranchId'] === null || typeof record['activeBranchId'] === 'number') &&
      Array.isArray(record['branches']) &&
      typeof record['firstLoginFlag'] === 'boolean' &&
      typeof record['passwordExpiredFlag'] === 'boolean' &&
      (record['passwordChangedOnUtc'] === null || typeof record['passwordChangedOnUtc'] === 'string') &&
      (record['passwordExpiresOnUtc'] === null || typeof record['passwordExpiresOnUtc'] === 'string')
    );
  }

  private isOptionalStoredString(value: unknown): boolean {
    return value === undefined || typeof value === 'string';
  }

  private isCurrentSessionExpired(): boolean {
    const session = this.currentSessionSignal();
    return !!session && this.isJwtExpired(session.token);
  }

  private isJwtExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    const expiresAt = payload?.['exp'];
    const expiresAtSeconds = typeof expiresAt === 'number' ? expiresAt : Number(expiresAt);

    if (!Number.isFinite(expiresAtSeconds)) {
      return false;
    }

    return Date.now() >= expiresAtSeconds * 1000;
  }

  private resolvePasswordChangeRequired(token: string): boolean {
    const payload = decodeJwtPayload(token);

    if (!payload) {
      return false;
    }

    return this.toBoolean(payload['password_change_required']) || this.toBoolean(payload['firstLoginFlag']);
  }

  private toBoolean(value: unknown): boolean {
    return value === true || value === 'true' || value === 'True' || value === '1' || value === 1;
  }

  private toNullableNumber(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private isLegacyLocalFallbackToken(token: string): boolean {
    return token === 'technical-admin-local-token' || token === 'organization-admin-local-token';
  }

  private removeStorageItem(storage: Storage): void {
    storage.removeItem(this.sessionStorageKey);
  }
}
