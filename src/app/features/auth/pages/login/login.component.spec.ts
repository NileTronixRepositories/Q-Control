import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../services/auth-session.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  const submitLogin = vi.fn<AuthSessionService['submitLogin']>(() =>
    of({ accepted: false, message: 'Invalid credentials' }),
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    const language = signal<AppLanguage>('en');
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        {
          provide: AppLanguageStore,
          useValue: {
            language: language.asReadonly(),
            direction: computed<AppDirection>(() => 'ltr'),
            setLanguage: vi.fn<AppLanguageStore['setLanguage']>(),
          } satisfies Pick<AppLanguageStore, 'language' | 'direction' | 'setLanguage'>,
        },
        { provide: AuthSessionService, useValue: { submitLogin } },
        {
          provide: Router,
          useValue: {
            navigateByUrl: vi.fn<Router['navigateByUrl']>().mockResolvedValue(true),
          } satisfies Pick<Router, 'navigateByUrl'>,
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('shows validation errors without submitting an invalid form', () => {
    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(submitLogin).not.toHaveBeenCalled();
    expect((fixture.nativeElement.querySelector('#username') as HTMLInputElement).validity.valid).toBe(false);
    expect((fixture.nativeElement.querySelector('#password') as HTMLInputElement).validity.valid).toBe(false);
  });

  it('toggles password visibility and submits valid credentials', () => {
    const username = fixture.nativeElement.querySelector('#username') as HTMLInputElement;
    const password = fixture.nativeElement.querySelector('#password') as HTMLInputElement;
    username.value = 'admin';
    username.dispatchEvent(new Event('input'));
    password.value = 'secret1';
    password.dispatchEvent(new Event('input'));
    (fixture.nativeElement.querySelector('.password-toggle') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(password.type).toBe('text');

    (fixture.nativeElement.querySelector('form') as HTMLFormElement).dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(submitLogin).toHaveBeenCalledWith({
      username: 'admin',
      password: 'secret1',
      rememberSession: true,
    });
    expect(fixture.nativeElement.textContent).toContain('Invalid credentials');
  });
});
