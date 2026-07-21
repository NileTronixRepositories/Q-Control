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
import { TechnicalAdminBranchContextStore, TechnicalAdminBranchContext } from '../store/technical-admin-branch-context.store';
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
  const selectedBranchId = signal<number | null>(null);
  const selectedBranch = signal<TechnicalAdminBranchContext | null>(null);
  const clearBranchContext = vi.fn(() => {
    selectedBranchId.set(null);
    selectedBranch.set(null);
  });
  const activateBranchContext = vi.fn((branchId: number) => selectedBranchId.set(branchId));

  beforeEach(async () => {
    vi.clearAllMocks();
    language.set('en');
    session.set(createSession('TechnicalAdmin'));
    canViewSchedules.set(true);
    selectedBranchId.set(null);
    selectedBranch.set(null);

    await TestBed.configureTestingModule({
      imports: [AdminShellComponent],
      providers: [
        provideRouter([]),
        TechnicalAdminI18nStore,
        {
          provide: TechnicalAdminBranchContextStore,
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
    expect(text).toContain('Branding & Advertisements');
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
      arabicName: 'فرع القاهرة',
      englishName: 'Cairo Branch',
      isActive: true,
      effectiveIsActive: true,
    });
    fixture.detectChanges();

    const mainSidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;
    const contextSidebar = fixture.nativeElement.querySelector('.context-sidebar') as HTMLElement;

    expect(mainSidebar.textContent).not.toContain('Waiting Areas');
    expect(contextSidebar.textContent).toContain('Cairo Branch');
    expect(contextSidebar.textContent).toContain('Waiting Areas');
    expect(contextSidebar.textContent).toContain('Service Locations');
    expect(contextSidebar.textContent).toContain('Terminals');
    expect(contextSidebar.textContent).toContain('Displays');
    expect(contextSidebar.querySelector('a')?.getAttribute('href')).toContain('branchId=1');
  });

  it('collapses the branch sidebar without clearing context and exits only from the back action', async () => {
    selectedBranchId.set(1);
    selectedBranch.set({
      branchId: 1,
      arabicName: 'Cairo Branch',
      englishName: 'Cairo Branch',
      isActive: true,
      effectiveIsActive: true,
    });
    fixture.detectChanges();
    clearBranchContext.mockClear();
    vi.mocked(router.navigate).mockClear();

    const closeButton = fixture.nativeElement.querySelector('.context-sidebar-close') as HTMLButtonElement;
    closeButton.click();
    fixture.detectChanges();
    await Promise.resolve();

    expect(selectedBranchId()).toBe(1);
    expect(clearBranchContext).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.context-reopen-edge')).not.toBeNull();

    const reopenButton = fixture.nativeElement.querySelector('.context-reopen-edge') as HTMLButtonElement;
    reopenButton.click();
    fixture.detectChanges();

    const backButton = fixture.nativeElement.querySelector('.context-back-button') as HTMLButtonElement;
    backButton.click();

    expect(clearBranchContext).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/branch-editor']);
  });
  it('keeps branch operations in the main sidebar for a permitted branch admin', () => {
    session.set(
      createSession(
        'BranchAdmin',
        createPermissionToken([
          'WaitingAreas.ViewAll',
          'Windows.ViewAll',
          'Terminals.ViewAll',
          'Displays.ViewAll',
        ]),
      ),
    );
    fixture.detectChanges();

    const mainSidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;

    expect(mainSidebar.textContent).toContain('Waiting Areas');
    expect(mainSidebar.textContent).toContain('Service Locations');
    expect(mainSidebar.textContent).toContain('Terminals');
    expect(mainSidebar.textContent).toContain('Displays');
    expect(fixture.nativeElement.querySelector('.context-sidebar')).toBeNull();
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
    const user = fixture.nativeElement.querySelector('.workspace-user') as HTMLElement;

    expect(shell.getAttribute('dir')).toBe('rtl');
    expect(shell.getAttribute('lang')).toBe('ar');
    expect(shell.classList.contains('app-shell-rtl')).toBe(true);
    expect(breadcrumb.getAttribute('dir')).toBe('rtl');
    expect(sidebar.getAttribute('dir')).toBe('rtl');
    expect(user).not.toBeNull();
  });

  it('renders translated breadcrumbs for the service schedules route', () => {
    fixture.destroy();
    Object.defineProperty(router, 'url', {
      configurable: true,
      value: '/admin/services/schedules',
    });
    fixture = TestBed.createComponent(AdminShellComponent);
    fixture.detectChanges();

    const breadcrumb = fixture.nativeElement.querySelector('app-breadcrumb') as HTMLElement;
    const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;

    expect(breadcrumb).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Operations Dashboard');
    expect(fixture.nativeElement.textContent).toContain('Services');
    expect(current.textContent).toContain('Service Schedules');
  });

  it('renders the current logged-in user in the workspace header', () => {
    session.set({ ...createSession('TechnicalAdmin'), displayName: 'Nour Admin' });
    fixture.detectChanges();

    const user = fixture.nativeElement.querySelector('.workspace-user') as HTMLElement;

    expect(user).not.toBeNull();
    expect(user.textContent).toContain('Current user');
    expect(user.textContent).toContain('Nour Admin');
    expect(user.textContent).toContain('Technical Admin');
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

function createPermissionToken(permissions: readonly string[]): string {
  const payload = btoa(JSON.stringify({ permissions }));
  return `header.${payload}.signature`;
}
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

