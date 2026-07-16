import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AppDirection, AppLanguage } from '../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import {
  AuthenticatedSession,
  AuthenticatedUserType,
} from '../../auth/models/login-credentials.model';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceManagementPermissionService } from '../../service-management/services/service-management-permission.service';
import { TechnicalAdminI18nStore } from '../store/technical-admin-i18n.store';
import { AdminShellComponent } from './admin-shell.component';

describe('AdminShellComponent', () => {
  let fixture: ComponentFixture<AdminShellComponent>;
  let router: Router;
  const language = signal<AppLanguage>('en');
  const session = signal<AuthenticatedSession | null>(createSession('TechnicalAdmin'));
  const toggleLanguage = vi.fn();
  const clearSession = vi.fn();
  const canViewSchedules = signal(true);

  beforeEach(async () => {
    vi.clearAllMocks();
    language.set('en');
    session.set(createSession('TechnicalAdmin'));
    canViewSchedules.set(true);

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideRouter([]),
        TechnicalAdminI18nStore,
        {
          provide: AppLanguageStore,
          useValue: {
            language: language.asReadonly(),
            direction: computed<AppDirection>(() => (language() === 'ar' ? 'rtl' : 'ltr')),
            toggleLanguage,
          } satisfies Pick<AppLanguageStore, 'language' | 'direction' | 'toggleLanguage'>,
        },
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: session.asReadonly(),
            clearSession,
          } satisfies Pick<AuthSessionService, 'currentSession' | 'clearSession'>,
        },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewAll: signal(true).asReadonly(),
            canViewBranchServices: signal(true).asReadonly(),
            canViewWorkflows: signal(true).asReadonly(),
            canViewSchedules: canViewSchedules.asReadonly(),
            canViewGlobalizationRequests: signal(true).asReadonly(),
            canViewCentralTree: signal(true).asReadonly(),
          } satisfies Pick<
            ServiceManagementPermissionService,
            | 'canViewAll'
            | 'canViewBranchServices'
            | 'canViewWorkflows'
            | 'canViewSchedules'
            | 'canViewGlobalizationRequests'
            | 'canViewCentralTree'
          >,
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(AdminShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('shows the technical administration navigation for a technical admin', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Branch Editor');
    expect(text).toContain('Branding & Advertisements');
    expect(text).toContain('Waiting Areas');
    expect(text).toContain('Windows');
    expect(text).toContain('Terminals');
    expect(text).toContain('Displays');
    expect(text).toContain('Service Schedules');
  });

  it('shows service schedules navigation for a technical admin even before the JWT includes the new permission', () => {
    canViewSchedules.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Service Schedules');
  });

  it('hides service schedules navigation for a scoped user without schedule permission', () => {
    session.set(createSession('BranchAdmin', 'invalid-token'));
    canViewSchedules.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Service Schedules');
  });

  it('hides protected navigation when a scoped user has no matching permissions', () => {
    session.set(createSession('BranchAdmin', 'invalid-token'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Branch Editor');
    expect(fixture.nativeElement.textContent).not.toContain('Waiting Areas');
    expect(fixture.nativeElement.querySelectorAll('nav a').length).toBe(0);
  });

  it('forwards language and logout actions to their services', () => {
    const languageButton = fixture.nativeElement.querySelector(
      '.sidebar-action-button:not(.sidebar-logout-button)',
    ) as HTMLButtonElement;
    const logoutButton = fixture.nativeElement.querySelector(
      '.sidebar-logout-button',
    ) as HTMLButtonElement;

    languageButton.click();
    logoutButton.click();

    expect(toggleLanguage).toHaveBeenCalledOnce();
    expect(clearSession).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});

function createSession(
  userType: AuthenticatedUserType,
  token = 'technical-admin-token',
): AuthenticatedSession {
  return {
    token,
    userType,
    requiresBranchSelection: false,
    activeBranchId: null,
    branches: [],
    firstLoginFlag: false,
    passwordExpiredFlag: false,
    passwordChangedOnUtc: null,
    passwordExpiresOnUtc: null,
  };
}

