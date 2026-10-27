import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { LanguageHeaderComponent } from '../../../../shared/components/language-header/language-header.component';
import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AuthNavigationService } from '../../services/auth-navigation/auth-navigation.service';
import { AuthSessionService } from '../../services/auth-session/auth-session.service';
import { LoginI18nStore } from '../../store/login-i18n.store';

type ChangePasswordStatus = 'idle' | 'submitting' | 'success' | 'error';

interface ChangeInitialPasswordCopy {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly newPasswordLabel: string;
  readonly newPasswordPlaceholder: string;
  readonly confirmPasswordLabel: string;
  readonly confirmPasswordPlaceholder: string;
  readonly required: string;
  readonly minLength: string;
  readonly mismatch: string;
  readonly submit: string;
  readonly submitting: string;
  readonly logout: string;
  readonly success: string;
  readonly fallbackError: string;
  readonly welcomeEyebrow: string;
  readonly welcomeHeading: string;
  readonly welcomeDescription: string;
}

const COPY: Record<AppLanguage, ChangeInitialPasswordCopy> = {
  ar: {
    welcomeEyebrow: 'أمان الحساب',
    welcomeHeading: 'تأمين وصولك إلى لوحة التحكم المركزية.',
    welcomeDescription:
      'لحماية بيانات المرضى والعمليات التشغيلية، يرجى تعيين كلمة مرور قوية وخاصة بك للمتابعة.',
    eyebrow: 'أول تسجيل دخول',
    title: 'تغيير كلمة المرور المؤقتة',
    description: 'أدخل كلمة مرور جديدة ومؤكدة لتفعيل حسابك والمتابعة إلى لوحة التحكم.',
    newPasswordLabel: 'كلمة المرور الجديدة',
    newPasswordPlaceholder: 'أدخل كلمة المرور الجديدة',
    confirmPasswordLabel: 'تأكيد كلمة المرور',
    confirmPasswordPlaceholder: 'أعد إدخال كلمة المرور للتأكيد',
    required: 'هذا الحقل مطلوب.',
    minLength: 'كلمة المرور يجب ألا تقل عن 6 أحرف.',
    mismatch: 'كلمتا المرور غير متطابقتين.',
    submit: 'تأكيد وحفظ كلمة المرور',
    submitting: 'جارٍ الحفظ والتفعيل...',
    logout: 'تسجيل الخروج',
    success: 'تم تغيير كلمة المرور بنجاح. جارٍ التحويل...',
    fallbackError: 'تعذر تغيير كلمة المرور. يرجى المحاولة مرة أخرى.',
  },
  en: {
    welcomeEyebrow: 'Account Security',
    welcomeHeading: 'Securing your access to the central dashboard.',
    welcomeDescription:
      'To safeguard patient records and hospital operations, please set a strong private password to continue.',
    eyebrow: 'First login',
    title: 'Change temporary password',
    description: 'Enter and confirm a new password to activate your account and proceed.',
    newPasswordLabel: 'New password',
    newPasswordPlaceholder: 'Enter your new password',
    confirmPasswordLabel: 'Confirm new password',
    confirmPasswordPlaceholder: 'Re-enter your password to confirm',
    required: 'This field is required.',
    minLength: 'Password must be at least 6 characters.',
    mismatch: 'Passwords do not match.',
    submit: 'Confirm and save password',
    submitting: 'Saving and activating...',
    logout: 'Logout',
    success: 'Password changed successfully. Redirecting...',
    fallbackError: 'Password could not be changed. Please try again.',
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
  protected readonly toastDismissed = signal(false);

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

  protected readonly formFeedback = computed(() => {
    if (this.toastDismissed()) {
      return '';
    }
    return this.formMessage();
  });

  protected dismissToast(): void {
    this.toastDismissed.set(true);
  }

  protected setLanguage(language: AppLanguage): void {
    this.i18nStore.setLanguage(language);
  }

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
    this.toastDismissed.set(false);
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
