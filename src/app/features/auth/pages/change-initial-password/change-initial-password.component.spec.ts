import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthenticatedSession } from '../../models/login-credentials/login-credentials.model';
import { AuthNavigationService } from '../../services/auth-navigation/auth-navigation.service';
import { AuthSessionService } from '../../services/auth-session/auth-session.service';
import { ChangeInitialPasswordComponent } from './change-initial-password.component';

describe('ChangeInitialPasswordComponent', () => {
  let fixture: ComponentFixture<ChangeInitialPasswordComponent>;
  const session = signal<AuthenticatedSession | null>(createSession(true));
  const changeInitialPassword = vi.fn<AuthSessionService['changeInitialPassword']>(() =>
    of({ accepted: true, message: 'Changed', session: createSession(false) }),
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    session.set(createSession(true));
    const language = signal<AppLanguage>('en');
    await TestBed.configureTestingModule({
      imports: [ChangeInitialPasswordComponent],
      providers: [
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
            currentSession: session.asReadonly(),
            changeInitialPassword,
            clearSession: vi.fn(),
          } satisfies Pick<
            AuthSessionService,
            'currentSession' | 'changeInitialPassword' | 'clearSession'
          >,
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: vi.fn<Router['navigateByUrl']>().mockResolvedValue(true),
          } satisfies Pick<Router, 'navigateByUrl'>,
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ChangeInitialPasswordComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('rejects mismatched passwords before calling the API', () => {
    setInput('#new-password', 'secret1');
    setInput('#confirm-new-password', 'secret2');
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(changeInitialPassword).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match');
  });

  it('submits matching passwords and shows success', () => {
    setInput('#new-password', 'secret1');
    setInput('#confirm-new-password', 'secret1');
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(changeInitialPassword).toHaveBeenCalledWith('secret1');
    expect(fixture.nativeElement.textContent).toContain('Password changed successfully');
  });

  function setInput(selector: string, value: string): void {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});

function createSession(firstLoginFlag: boolean): AuthenticatedSession {
  return {
    token: 'token',
    userType: 'TechnicalAdmin',
    requiresBranchSelection: false,
    activeBranchId: null,
    branches: [],
    firstLoginFlag,
    passwordExpiredFlag: false,
    passwordChangedOnUtc: null,
    passwordExpiresOnUtc: null,
  };
}
