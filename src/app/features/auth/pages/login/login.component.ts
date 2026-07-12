import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { LanguageHeaderComponent } from '../../../../shared/components/language-header/language-header.component';
import { LoginCredentials } from '../../models/login-credentials.model';
import { LoginLanguage } from '../../models/login-translations.model';
import { AuthNavigationService } from '../../services/auth-navigation.service';
import { LoginI18nStore } from '../../store/login-i18n.store';
import { LoginStore } from '../../store/login.store';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, LanguageHeaderComponent],
  providers: [LoginStore, LoginI18nStore],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authNavigationService = inject(AuthNavigationService);
  protected readonly loginStore = inject(LoginStore);
  protected readonly i18nStore = inject(LoginI18nStore);
  protected readonly translations = this.i18nStore.translations;
  protected readonly passwordVisible = signal(false);
  protected readonly toastDismissed = signal(false);

  private readonly navigationEffect = effect(() => {
    if (this.loginStore.status() !== 'success') {
      return;
    }

    const session = this.loginStore.session();

    if (!session) {
      return;
    }

    void this.router.navigateByUrl(this.authNavigationService.resolvePostLoginUrl(session));
  });

  protected readonly loginFeedback = computed(() => {
    const status = this.loginStore.status();
    const translations = this.translations();

    if (this.toastDismissed()) {
      return '';
    }

    if (status === 'success') {
      return translations.loginReadyMessage;
    }

    if (status === 'error') {
      return this.loginStore.message() || translations.requiredCredentialsMessage;
    }

    return '';
  });

  protected readonly loginForm = this.formBuilder.group({
    username: ['', [Validators.required, Validators.maxLength(80)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]],
    rememberSession: [false],
  });

  protected readonly usernameControl = this.loginForm.controls.username;
  protected readonly passwordControl = this.loginForm.controls.password;

  protected readonly hasUsernameError = computed(
    () => this.usernameControl.touched && this.usernameControl.invalid,
  );
  protected readonly hasPasswordError = computed(
    () => this.passwordControl.touched && this.passwordControl.invalid,
  );

  protected readonly usernameErrorMessage = computed(() => {
    if (!this.hasUsernameError()) {
      return '';
    }

    return this.usernameControl.hasError('required') ? this.translations().usernameRequired : '';
  });

  protected readonly passwordErrorMessage = computed(() => {
    if (!this.hasPasswordError()) {
      return '';
    }

    if (this.passwordControl.hasError('required')) {
      return this.translations().passwordRequired;
    }

    if (this.passwordControl.hasError('minlength')) {
      return this.translations().passwordMinLength;
    }

    return '';
  });

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((isVisible) => !isVisible);
  }

  protected dismissToast(): void {
    this.toastDismissed.set(true);
  }

  protected setLanguage(language: LoginLanguage): void {
    this.i18nStore.setLanguage(language);
  }

  protected submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.toastDismissed.set(false);

    const credentials: LoginCredentials = this.loginForm.getRawValue();
    this.loginStore.submit(credentials);
  }
}
