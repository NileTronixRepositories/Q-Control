import { ChangeDetectionStrategy, Component, computed, effect, input, output, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import {
  BRANCH_ADMINS_TRANSLATIONS,
  BranchAdminsTranslations,
} from '../../i18n/branch-admins.translations';
import {
  CreateBranchAdminField,
  CreateBranchAdminRequest,
} from '../../models/branch-admin.model';
import { CreateBranchAdminStore } from '../../store/create-branch-admin.store';

@Component({
  selector: 'app-create-branch-admin-dialog',
  imports: [ReactiveFormsModule],
  providers: [CreateBranchAdminStore],
  templateUrl: './create-branch-admin-dialog.component.html',
  styleUrl: './create-branch-admin-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBranchAdminDialogComponent {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  protected readonly store = inject(CreateBranchAdminStore);

  readonly open = input(false);
  readonly branchId = input<number | null>(null);
  readonly branchLabel = input('');
  readonly language = input<AppLanguage>('en');
  readonly direction = input<AppDirection>('ltr');

  readonly closed = output<void>();
  readonly created = output<string>();

  protected readonly copy = computed<BranchAdminsTranslations>(
    () => BRANCH_ADMINS_TRANSLATIONS[this.language()],
  );

  protected readonly branchAdminForm = this.formBuilder.group({
    userName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    nameEn: ['', [Validators.required, Validators.maxLength(200)]],
    nameAr: ['', [Validators.maxLength(200)]],
    phoneNumber: ['', [Validators.maxLength(30)]],
    temporaryPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(120)]],
    confirmTemporaryPassword: ['', [Validators.required, Validators.maxLength(120)]],
  });

  private readonly successEffect = effect(() => {
    const message = this.store.successMessage();

    if (!message) {
      return;
    }

    this.resetForm();
    this.created.emit(message);
    queueMicrotask(() => this.store.reset());
  });

  private readonly closedStateEffect = effect(() => {
    if (!this.open()) {
      this.resetForm();
      queueMicrotask(() => this.store.reset());
    }
  });

  private readonly backendErrorsEffect = effect(() => {
    const errors = this.store.fieldErrors();
    this.clearBackendControlErrors();

    for (const [fieldName, message] of Object.entries(errors)) {
      if (!message) {
        continue;
      }

      const controlName = fieldName as CreateBranchAdminField;
      const control = this.branchAdminForm.controls[controlName];

      if (!control) {
        continue;
      }

      control.setErrors({ ...(control.errors ?? {}), backend: true });
      control.markAsTouched();
    }
  });

  protected closeDialog(): void {
    this.resetForm();
    this.store.reset();
    this.closed.emit();
  }

  protected submitBranchAdmin(): void {
    this.clearBackendControlErrors();

    if (!this.isFormValid()) {
      this.branchAdminForm.markAllAsTouched();
      return;
    }

    const branchId = this.branchId();

    if (!branchId) {
      return;
    }

    this.store.create(branchId, this.createRequest(), this.defaultSuccessMessage());
  }

  protected hasControlError(controlName: CreateBranchAdminField): boolean {
    const control = this.branchAdminForm.controls[controlName];

    return (
      control.touched &&
      (control.invalid ||
        !!this.store.fieldErrors()[controlName] ||
        (controlName === 'confirmTemporaryPassword' && this.passwordsMismatch()))
    );
  }

  protected controlErrorMessage(controlName: CreateBranchAdminField): string {
    const backendMessage = this.store.fieldErrors()[controlName];

    if (backendMessage) {
      return backendMessage;
    }

    const control = this.branchAdminForm.controls[controlName];
    const copy = this.copy();

    if (control.hasError('required')) {
      return copy.requiredField;
    }

    if (control.hasError('email')) {
      return copy.invalidEmail;
    }

    if (control.hasError('minlength')) {
      return copy.passwordMinLength;
    }

    if (control.hasError('maxlength')) {
      if (controlName === 'phoneNumber') {
        return copy.max30;
      }

      if (controlName === 'userName') {
        return copy.max100;
      }

      if (controlName === 'temporaryPassword' || controlName === 'confirmTemporaryPassword') {
        return copy.max120;
      }

      return copy.max200;
    }

    if (controlName === 'confirmTemporaryPassword' && this.passwordsMismatch()) {
      return copy.branchAdminPasswordMismatch;
    }

    return '';
  }

  protected formMessage(): string {
    return this.store.status() === 'error' ? this.store.message() || this.copy().fallbackError : '';
  }

  private isFormValid(): boolean {
    return this.branchAdminForm.valid && !this.passwordsMismatch();
  }

  private passwordsMismatch(): boolean {
    const value = this.branchAdminForm.getRawValue();

    return (
      value.temporaryPassword.length > 0 &&
      value.confirmTemporaryPassword.length > 0 &&
      value.temporaryPassword !== value.confirmTemporaryPassword
    );
  }

  private createRequest(): CreateBranchAdminRequest {
    const value = this.branchAdminForm.getRawValue();

    return {
      userName: value.userName.trim(),
      email: value.email.trim(),
      nameEn: value.nameEn.trim(),
      nameAr: this.toOptionalString(value.nameAr),
      phoneNumber: this.toOptionalString(value.phoneNumber),
      temporaryPassword: value.temporaryPassword,
    };
  }

  private resetForm(): void {
    this.branchAdminForm.reset({
      userName: '',
      email: '',
      nameEn: '',
      nameAr: '',
      phoneNumber: '',
      temporaryPassword: '',
      confirmTemporaryPassword: '',
    });
  }

  private clearBackendControlErrors(): void {
    for (const control of Object.values(this.branchAdminForm.controls)) {
      const errors = control.errors;

      if (!errors?.['backend']) {
        continue;
      }

      const { backend, ...remainingErrors } = errors;
      control.setErrors(Object.keys(remainingErrors).length > 0 ? remainingErrors : null);
    }
  }

  private toOptionalString(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private defaultSuccessMessage(): string {
    return `${this.copy().branchAdminCreated} ${this.copy().branchAdminHandoffNote}`;
  }
}
