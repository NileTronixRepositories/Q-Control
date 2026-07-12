import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { LanguageHeaderComponent } from '../../../../shared/components/language-header/language-header.component';
import { AppLanguage } from '../../../../shared/models/app-language.model';
import { AuthNavigationService } from '../../services/auth-navigation.service';
import { AuthSessionService } from '../../services/auth-session.service';
import { LoginI18nStore } from '../../store/login-i18n.store';

type ChangePasswordStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ChangeInitialPasswordCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly newPasswordLabel: string;
  readonly confirmPasswordLabel: string;
  readonly required: string;
  readonly minLength: string;
  readonly mismatch: string;
  readonly submit: string;
  readonly submitting: string;
  readonly logout: string;
  readonly success: string;
  readonly fallbackError: string;
}

const COPY: Record<AppLanguage, ChangeInitialPasswordCopy> = {
  ar: {
    eyebrow: '\u0623\u0648\u0644 \u062a\u0633\u062c\u064a\u0644 \u062f\u062e\u0648\u0644',
    title: '\u062a\u063a\u064a\u064a\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0645\u0624\u0642\u062a\u0629',
    description: '\u0623\u062f\u062e\u0644 \u0643\u0644\u0645\u0629 \u0645\u0631\u0648\u0631 \u062c\u062f\u064a\u062f\u0629 \u0644\u062a\u0641\u0639\u064a\u0644 \u062d\u0633\u0627\u0628\u0643.',
    newPasswordLabel: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062c\u062f\u064a\u062f\u0629',
    confirmPasswordLabel: '\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
    required: '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.',
    minLength: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064a\u062c\u0628 \u0623\u0644\u0627 \u062a\u0642\u0644 \u0639\u0646 6 \u0623\u062d\u0631\u0641.',
    mismatch: '\u0643\u0644\u0645\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646.',
    submit: '\u062a\u063a\u064a\u064a\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
    submitting: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u063a\u064a\u064a\u0631...',
    logout: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c',
    success: '\u062a\u0645 \u062a\u063a\u064a\u064a\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0628\u0646\u062c\u0627\u062d.',
    fallbackError: '\u062a\u0639\u0630\u0631 \u062a\u063a\u064a\u064a\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.',
  },
  en: {
    eyebrow: 'First login',
    title: 'Change temporary password',
    description: 'Enter a new password to activate your account.',
    newPasswordLabel: 'New password',
    confirmPasswordLabel: 'Confirm new password',
    required: 'This field is required.',
    minLength: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.',
    submit: 'Change password',
    submitting: 'Changing password...',
    logout: 'Logout',
    success: 'Password changed successfully.',
    fallbackError: 'Password could not be changed.',
  },
};

@Component({
  selector: 'app-change-initial-password',
  imports: [ReactiveFormsModule, LanguageHeaderComponent],
  providers: [LoginI18nStore],
  templateUrl: './change-initial-password.component.html',
  styleUrl: './change-initial-password.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeInitialPasswordComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly authNavigationService = inject(AuthNavigationService);

  protected readonly i18nStore = inject(LoginI18nStore);
  protected readonly translations = this.i18nStore.translations;
  protected readonly copy = computed(() => COPY[this.i18nStore.language()]);
  protected readonly status = signal<ChangePasswordStatus>('idle');
  protected readonly backendMessage = signal('');
  protected readonly newPasswordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  private readonly routeProtectionEffect = effect(() => {
    const session = this.authSessionService.currentSession();

    if (!session) {
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (!session.firstLoginFlag) {
      void this.router.navigateByUrl(this.authNavigationService.resolvePostLoginUrl(session));
    }
  });

  protected readonly passwordForm = this.formBuilder.group({
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]],
    confirmNewPassword: ['', [Validators.required, Validators.maxLength(120)]],
  });

  protected readonly newPasswordControl = this.passwordForm.controls.newPassword;
  protected readonly confirmNewPasswordControl = this.passwordForm.controls.confirmNewPassword;
  protected readonly isSubmitting = computed(() => this.status() === 'submitting');
  protected readonly formMessage = computed(() => {
    if (this.status() === 'success') {
      return this.copy().success;
    }

    if (this.status() === 'error') {
      return this.backendMessage() || this.copy().fallbackError;
    }

    return '';
  });

  protected toggleNewPasswordVisibility(): void {
    this.newPasswordVisible.update((isVisible) => !isVisible);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((isVisible) => !isVisible);
  }

  protected logout(): void {
    this.authSessionService.clearSession();
    void this.router.navigateByUrl('/auth/login');
  }

  protected submitPassword(): void {
    this.backendMessage.set('');

    if (!this.isPasswordFormValid()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.status.set('submitting');

    this.authSessionService
      .changeInitialPassword(this.newPasswordControl.value)
      .pipe(take(1))
      .subscribe((result) => {
        if (result.accepted && result.session) {
          this.passwordForm.reset({ newPassword: '', confirmNewPassword: '' });
          this.status.set('success');
          void this.router.navigateByUrl(this.authNavigationService.resolvePostLoginUrl(result.session));
          return;
        }

        if (result.errorCode === 'Auth.ChangeInitialPassword.NotRequired') {
          this.authSessionService.clearSession();
          void this.router.navigateByUrl('/auth/login');
          return;
        }

        if (this.shouldAttachPasswordError(result.errorCode)) {
          this.newPasswordControl.setErrors({ backend: true });
        }

        this.backendMessage.set(result.message);
        this.status.set('error');
      });
  }

  protected hasNewPasswordError(): boolean {
    return this.newPasswordControl.touched && this.newPasswordControl.invalid;
  }

  protected hasConfirmPasswordError(): boolean {
    return (
      this.confirmNewPasswordControl.touched &&
      (this.confirmNewPasswordControl.invalid || this.passwordsMismatch())
    );
  }

  protected newPasswordErrorMessage(): string {
    if (!this.hasNewPasswordError()) {
      return '';
    }

    if (this.newPasswordControl.hasError('required')) {
      return this.copy().required;
    }

    if (this.newPasswordControl.hasError('minlength')) {
      return this.copy().minLength;
    }

    return this.backendMessage() || this.copy().fallbackError;
  }

  protected confirmPasswordErrorMessage(): string {
    if (!this.hasConfirmPasswordError()) {
      return '';
    }

    if (this.confirmNewPasswordControl.hasError('required')) {
      return this.copy().required;
    }

    return this.copy().mismatch;
  }

  private isPasswordFormValid(): boolean {
    return this.passwordForm.valid && !this.passwordsMismatch();
  }

  private passwordsMismatch(): boolean {
    return (
      this.newPasswordControl.value.length > 0 &&
      this.confirmNewPasswordControl.value.length > 0 &&
      this.newPasswordControl.value !== this.confirmNewPasswordControl.value
    );
  }

  private shouldAttachPasswordError(errorCode: string | undefined): boolean {
    return !!errorCode && (errorCode.includes('NewPassword') || errorCode.includes('Password'));
  }
}
