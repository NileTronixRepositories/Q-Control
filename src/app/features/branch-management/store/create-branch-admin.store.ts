import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs';

import { AuthSessionService } from '../../auth/services/auth-session/auth-session.service';
import { formatApiError } from '@shared/utils/api-error-message.util';
import {
  BranchAdminApiProblemDetails,
  CreateBranchAdminField,
  CreateBranchAdminRequest,
} from '@features/branch-management/models/branch-admin/branch-admin.model';
import { BranchAdminsApiService } from '@features/branch-management/services/branch-admins-api/branch-admins-api.service';

export type CreateBranchAdminStatus = 'idle' | 'submitting' | 'success' | 'error';

@Injectable()
export class CreateBranchAdminStore {
  private readonly branchAdminsApiService = inject(BranchAdminsApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);

  private readonly statusSignal = signal<CreateBranchAdminStatus>('idle');
  private readonly messageSignal = signal('');
  private readonly fieldErrorsSignal = signal<Partial<Record<CreateBranchAdminField, string>>>({});

  readonly status = this.statusSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();
  readonly fieldErrors = this.fieldErrorsSignal.asReadonly();
  readonly isSubmitting = computed(() => this.statusSignal() === 'submitting');
  readonly successMessage = computed(() =>
    this.statusSignal() === 'success' ? this.messageSignal() : '',
  );

  create(branchId: number, request: CreateBranchAdminRequest, fallbackSuccessMessage: string): void {
    this.statusSignal.set('submitting');
    this.messageSignal.set('');
    this.fieldErrorsSignal.set({});

    this.branchAdminsApiService
      .createBranchAdmin(branchId, request)
      .pipe(take(1))
      .subscribe({
        next: (response) => {
          this.messageSignal.set(
            response.message?.trim().length ? response.message : fallbackSuccessMessage,
          );
          this.statusSignal.set('success');
        },
        error: (error: HttpErrorResponse) => this.handleError(error),
      });
  }

  reset(): void {
    this.statusSignal.set('idle');
    this.messageSignal.set('');
    this.fieldErrorsSignal.set({});
  }

  private handleError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    this.fieldErrorsSignal.set(this.extractFieldErrors(error));
    this.messageSignal.set(formatApiError(error, 'Branch administrator could not be created.'));
    this.statusSignal.set('error');
  }

  private extractFieldErrors(error: HttpErrorResponse): Partial<Record<CreateBranchAdminField, string>> {
    const fieldErrors: Partial<Record<CreateBranchAdminField, string>> = {};
    const body = error.error as BranchAdminApiProblemDetails | null;

    if (!body || typeof body !== 'object' || !Array.isArray(body.errors)) {
      return fieldErrors;
    }

    for (const item of body.errors) {
      const fieldName = this.resolveErrorField(item.code);

      if (fieldName && item.message?.trim().length) {
        fieldErrors[fieldName] = item.message;
      }
    }

    return fieldErrors;
  }

  private resolveErrorField(code: string | undefined): CreateBranchAdminField | null {
    if (!code) {
      return null;
    }

    if (code.includes('UserName')) {
      return 'userName';
    }

    if (code.includes('Email')) {
      return 'email';
    }

    if (code.includes('TemporaryPassword') || code.includes('Password')) {
      return 'temporaryPassword';
    }

    return null;
  }
}
