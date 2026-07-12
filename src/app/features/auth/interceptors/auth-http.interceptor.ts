import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';

import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../services/auth-session.service';

const CHANGE_INITIAL_PASSWORD_PATH = '/api/auth/change-initial-password';
const LOGIN_PATH = '/api/auth/login';

export const authHttpInterceptor: HttpInterceptorFn = (request, next) => {
  const authSessionService = inject(AuthSessionService);
  const appLanguageStore = inject(AppLanguageStore);
  const session = authSessionService.activeSession();

  if (session?.firstLoginFlag && !isFirstLoginAllowedRequest(request.url)) {
    return throwError(
      () =>
        new HttpErrorResponse({
          status: 403,
          statusText: 'First Login Restricted',
          url: request.url,
          error: {
            title: 'First login password change is required.',
            detail: 'Operational API calls are blocked until the initial password is changed.',
          },
        }),
    );
  }

  let headers = request.headers;

  if (!headers.has('Accept-Language')) {
    headers = headers.set('Accept-Language', appLanguageStore.language());
  }

  if (session?.token && !headers.has('Authorization')) {
    headers = headers.set('Authorization', `Bearer ${session.token}`);
  }

  return next(request.clone({ headers }));
};

function isFirstLoginAllowedRequest(url: string): boolean {
  const normalizedUrl = normalizeUrl(url);
  return normalizedUrl.endsWith(LOGIN_PATH) || normalizedUrl.endsWith(CHANGE_INITIAL_PASSWORD_PATH);
}

function normalizeUrl(url: string): string {
  try {
    return new URL(url, window.location.origin).pathname;
  } catch {
    return url;
  }
}
