import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { computed, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppDirection, AppLanguage } from '../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { LoginSubmissionResult } from '../models/login-credentials.model';
import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService session identity', () => {
  let service: AuthSessionService;
  let http: HttpTestingController;
  const language = signal<AppLanguage>('en');

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AppLanguageStore,
          useValue: {
            language: language.asReadonly(),
            direction: computed<AppDirection>(() => (language() === 'ar' ? 'rtl' : 'ltr')),
          } satisfies Pick<AppLanguageStore, 'language' | 'direction'>,
        },
      ],
    });

    service = TestBed.inject(AuthSessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('extracts the current user identity from JWT claims', () => {
    let result: LoginSubmissionResult | undefined;

    service
      .submitLogin({ username: 'login-input', password: 'password123', rememberSession: false })
      .subscribe((response) => {
        result = response;
      });

    const request = http.expectOne((item) => item.url.endsWith('/api/auth/login'));
    request.flush({
      token: createJwt({
        name: 'Nour Admin',
        preferred_username: 'nour.admin',
        email: 'nour@example.com',
      }),
      userType: 'TechnicalAdmin',
      requiresBranchSelection: false,
      activeBranchId: null,
    });

    expect(result?.accepted).toBe(true);
    expect(result?.session?.displayName).toBe('Nour Admin');
    expect(result?.session?.userName).toBe('nour.admin');
    expect(result?.session?.email).toBe('nour@example.com');
  });

  it('falls back to the login identifier when the JWT has no identity claims', () => {
    let result: LoginSubmissionResult | undefined;

    service
      .submitLogin({ username: 'admin@example.com', password: 'password123', rememberSession: false })
      .subscribe((response) => {
        result = response;
      });

    const request = http.expectOne((item) => item.url.endsWith('/api/auth/login'));
    request.flush({
      token: createJwt({}),
      userType: 'TechnicalAdmin',
      requiresBranchSelection: false,
      activeBranchId: null,
    });

    expect(result?.accepted).toBe(true);
    expect(result?.session?.displayName).toBe('admin@example.com');
    expect(result?.session?.email).toBe('admin@example.com');
    expect(result?.session?.userName).toBeUndefined();
  });
});

function createJwt(payload: Record<string, unknown>): string {
  const encodedPayload = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `header.${encodedPayload}.signature`;
}