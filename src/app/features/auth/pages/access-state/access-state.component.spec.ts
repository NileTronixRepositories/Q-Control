import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthNavigationService } from '../../services/auth-navigation/auth-navigation.service';
import { AuthSessionService } from '../../services/auth-session/auth-session.service';
import { AccessStateComponent } from './access-state.component';

describe('AccessStateComponent', () => {
  let fixture: ComponentFixture<AccessStateComponent>;
  let router: Router;
  const clearSession = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    const language = signal<AppLanguage>('en');
    await TestBed.configureTestingModule({
      imports: [AccessStateComponent],
      providers: [
        provideRouter([]),
        AuthNavigationService,
        {
          provide: AppLanguageStore,
          useValue: {
            language: language.asReadonly(),
            direction: computed<AppDirection>(() => 'ltr'),
            setLanguage: vi.fn<AppLanguageStore['setLanguage']>(),
          } satisfies Pick<AppLanguageStore, 'language' | 'direction' | 'setLanguage'>,
        },
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: signal(null).asReadonly(),
            clearSession,
          } satisfies Pick<AuthSessionService, 'currentSession' | 'clearSession'>,
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    fixture = TestBed.createComponent(AccessStateComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders the no-access state with a login fallback route', () => {
    expect(fixture.nativeElement.textContent).toContain('No available access');
    expect((fixture.nativeElement.querySelector('a') as HTMLAnchorElement).getAttribute('href')).toBe('/auth/login');
  });

  it('clears the session and returns to login', () => {
    (fixture.nativeElement.querySelector('.secondary-action') as HTMLButtonElement).click();
    expect(clearSession).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth/login');
  });
});
