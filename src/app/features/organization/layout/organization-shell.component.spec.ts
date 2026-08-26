import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AppDirection, AppLanguage } from '../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session/auth-session.service';
import { OrganizationShellStore } from '../store/organization-shell.store';
import { OrganizationShellComponent } from './organization-shell.component';

describe('OrganizationShellComponent', () => {
  let fixture: ComponentFixture<OrganizationShellComponent>;
  let router: Router;
  const language = signal<AppLanguage>('en');
  const toggleLanguage = vi.fn();
  const clearSession = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    language.set('en');
    await TestBed.configureTestingModule({
      imports: [OrganizationShellComponent],
      providers: [
        provideRouter([]),
        OrganizationShellStore,
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
          useValue: { clearSession } satisfies Pick<AuthSessionService, 'clearSession'>,
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(OrganizationShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders all organization navigation entries', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Global Configurations');
    expect(text).toContain('Ticket Calling Management');
    expect(text).toContain('Audio Announcement');
    expect(text).toContain('Ticket-Status Management');
  });

  it('forwards language and logout actions', () => {
    (fixture.nativeElement.querySelector('.sidebar-action-button:not(.sidebar-logout-button)') as HTMLButtonElement).click();
    (fixture.nativeElement.querySelector('.sidebar-logout-button') as HTMLButtonElement).click();

    expect(toggleLanguage).toHaveBeenCalledOnce();
    expect(clearSession).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/login');
  });
});
