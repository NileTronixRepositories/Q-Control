import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import {
  AppDirection,
  AppLanguage,
  AppLanguageStore,
  AuthenticatedSession,
  AuthenticatedUserType,
  AuthSessionService,
} from '@core';
import { SegmentPermissionService } from '@features/segment-management/public-api';
import { ServiceManagementPermissionService } from '@features/service-management/public-api';
import {
  AdminBranchContextStore,
  AdminBranchContext,
} from './store/admin-branch-context.store';
import { AdminI18nStore } from './store/admin-i18n.store';
import { AdminShellComponent } from './admin-shell.component';

describe('AdminShellComponent', () => {
  let fixture: ComponentFixture<AdminShellComponent>;
  let router: Router;
  const language = signal<AppLanguage>('en');
  const session = signal<AuthenticatedSession | null>(createSession('TechnicalAdmin'));
  const toggleLanguage = vi.fn();
  const clearSession = vi.fn();
  const canViewSchedules = signal(true);
  const canViewSegments = signal(true);
  const selectedBranchId = signal<number | null>(null);
  const selectedBranch = signal<AdminBranchContext | null>(null);
  const clearBranchContext = vi.fn(() => {
    selectedBranchId.set(null);
    selectedBranch.set(null);
  });
  const activateBranchContext = vi.fn((branchId: number) => selectedBranchId.set(branchId));

  beforeEach(async () => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    language.set('en');
    session.set(createSession('TechnicalAdmin'));
    canViewSchedules.set(true);
    canViewSegments.set(true);
    selectedBranchId.set(null);
    selectedBranch.set(null);

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideRouter([]),
        AdminI18nStore,
        {
          provide: AdminBranchContextStore,
          useValue: {
            selectedBranchId: selectedBranchId.asReadonly(),
            selectedBranch: selectedBranch.asReadonly(),
            activate: activateBranchContext,
            clear: clearBranchContext,
          },
        },
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
        {
          provide: SegmentPermissionService,
          useValue: {
            canViewAllSegments: canViewSegments.asReadonly(),
            canViewAllGlobalizationRequests: signal(false).asReadonly(),
            canViewOwnGlobalizationRequests: signal(false).asReadonly(),
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(AdminShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('shows the technical administration navigation for a technical admin', () => {
    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Branch Editor');
    expect(text).toContain('General Brand');
    expect(text).not.toContain('Waiting Areas');
    expect(text).not.toContain('Service Locations');
    expect(text).not.toContain('Terminals');
    expect(text).not.toContain('Displays');
    expect(text).toContain('Service Schedules');
  });

  it('moves branch operations into the selected-branch sidebar for a technical admin', () => {
    selectedBranchId.set(1);
    selectedBranch.set({
      branchId: 1,
      arabicName: 'الفرع الرئيسي',
      englishName: 'Main Branch',
      isActive: true,
      effectiveIsActive: true,
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Waiting Areas');
    expect(text).toContain('Service Locations');
    expect(text).toContain('Terminals');
    expect(text).toContain('Displays');
    expect(text).toContain('Main Branch');
  });

  it('closes the branch context from the close button', () => {
    selectedBranchId.set(1);
    selectedBranch.set({
      branchId: 1,
      arabicName: 'الفرع الرئيسي',
      englishName: 'Main Branch',
      isActive: true,
      effectiveIsActive: true,
    });
    fixture.detectChanges();

    const toggleButton = fixture.nativeElement.querySelector(
      '.context-sidebar-close',
    ) as HTMLButtonElement;
    toggleButton.click();
    fixture.detectChanges();

    expect(clearBranchContext).toHaveBeenCalled();
  });

  it('keeps branch operations in the main sidebar for a permitted branch admin', () => {
    session.set(createSession('BranchAdmin', 'valid-token'));
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;

    expect(text).toContain('Waiting Areas');
    expect(text).toContain('Service Locations');
    expect(text).toContain('Terminals');
    expect(text).toContain('Displays');
  });

  it('shows service schedules navigation for a technical admin even before the JWT includes the new permission', () => {
    canViewSchedules.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Service Schedules');
  });

  it('hides service schedules navigation for a scoped user without schedule permission', () => {
    session.set(createSession('BranchAdmin', 'invalid-token'));
    canViewSchedules.set(false);
    canViewSegments.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Service Schedules');
  });

  it('hides protected navigation when a scoped user has no matching permissions', () => {
    session.set(createSession('BranchAdmin', 'invalid-token'));
    canViewSchedules.set(false);
    canViewSegments.set(false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Branch Editor');
    expect(fixture.nativeElement.textContent).not.toContain('Waiting Areas');
    expect(fixture.nativeElement.querySelectorAll('nav.sidebar-nav a').length).toBe(0);
  });

  it('passes English direction and language to the app shell by default', () => {
    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    const breadcrumb = fixture.nativeElement.querySelector('nav.app-breadcrumb') as HTMLElement;
    const sidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;

    expect(shell.getAttribute('dir')).toBe('ltr');
    expect(shell.getAttribute('lang')).toBe('en');
    expect(shell.classList.contains('app-shell-ltr')).toBe(true);
    expect(breadcrumb.getAttribute('dir')).toBe('ltr');
    expect(sidebar.getAttribute('dir')).toBe('ltr');
  });

  it('passes Arabic direction and language to the app shell', () => {
    language.set('ar');
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    const breadcrumb = fixture.nativeElement.querySelector('nav.app-breadcrumb') as HTMLElement;
    const sidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;

    expect(shell.getAttribute('dir')).toBe('rtl');
    expect(shell.getAttribute('lang')).toBe('ar');
    expect(shell.classList.contains('app-shell-rtl')).toBe(true);
    expect(breadcrumb.getAttribute('dir')).toBe('rtl');
    expect(sidebar.getAttribute('dir')).toBe('rtl');
  });

  it('renders translated breadcrumbs for the service schedules route', () => {
    fixture.componentInstance['syncRouterState']('/admin/services/schedules');
    fixture.detectChanges();

    const breadcrumbText = fixture.nativeElement.querySelector('nav.app-breadcrumb')
      ?.textContent as string;

    expect(breadcrumbText).toContain('Operations Dashboard');
    expect(breadcrumbText).toContain('Services');
    expect(breadcrumbText).toContain('Service Schedules');
  });

  it('renders deep contextual breadcrumbs for branch service workflows', () => {
    fixture.componentInstance['syncRouterState'](
      '/admin/services/branches/5/services/25/workflows',
    );
    fixture.detectChanges();

    const breadcrumbText = fixture.nativeElement.querySelector('nav.app-breadcrumb')
      ?.textContent as string;

    expect(breadcrumbText).toContain('Operations Dashboard');
    expect(breadcrumbText).toContain('Services');
    expect(breadcrumbText).toContain('Branch Services');
    expect(breadcrumbText).toContain('Service Workflows');
  });

  it('renders the current logged-in user in the workspace header', () => {
    session.set({
      ...createSession('TechnicalAdmin'),
      displayName: 'System Lead',
    });
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.workspace-user') as HTMLElement;

    expect(header.textContent).toContain('System Lead');
    expect(header.textContent).toContain('Technical Admin');
  });

  it('forwards language and logout actions to their services', () => {
    const languageButton = fixture.nativeElement.querySelector(
      '.sidebar-actions button.sidebar-action-button',
    ) as HTMLButtonElement;
    const logoutButton = fixture.nativeElement.querySelector(
      '.sidebar-logout-button',
    ) as HTMLButtonElement;

    languageButton.click();
    logoutButton.click();

    expect(toggleLanguage).toHaveBeenCalled();
    expect(clearSession).toHaveBeenCalled();
  });
});

function createSession(
  userType: AuthenticatedUserType,
  token = 'technical-admin-token',
): AuthenticatedSession {
  const permissions =
    token === 'valid-token'
      ? ['WaitingAreas.ViewAll', 'Windows.ViewAll', 'Terminals.ViewAll', 'Displays.ViewAll']
      : [];
  const payload = btoa(JSON.stringify({ permissions }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return {
    token: token === 'technical-admin-token' ? 'technical-admin-token' : `header.${payload}.sig`,
    userType,
    userName: userType === 'TechnicalAdmin' ? 'tech.admin' : 'branch.admin',
    displayName: userType === 'TechnicalAdmin' ? 'Technical Admin' : 'Branch Admin',
    email: `${userType.toLowerCase()}@qcontrol.local`,
    requiresBranchSelection: false,
    activeBranchId: 1,
    branches: [
      {
        branchId: 1,
        arabicName: 'الفرع الرئيسي',
        englishName: 'Main Branch',
        isActive: true,
      },
    ],
    firstLoginFlag: false,
    passwordExpiredFlag: false,
    passwordChangedOnUtc: null,
    passwordExpiresOnUtc: null,
  };
}
