import { computed, inject, Injectable, signal } from '@angular/core';
import { take } from 'rxjs';

import { LoginCredentials } from '../models/login-credentials.model';
import { AuthSessionService } from '../services/auth-session.service';

export type LoginStatus = 'idle' | 'submitting' | 'success' | 'error';

@Injectable()
export class LoginStore {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly statusSignal = signal<LoginStatus>('idle');
  private readonly messageSignal = signal<string>('');
  private readonly userTypeSignal = signal<string | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();
  readonly userType = this.userTypeSignal.asReadonly();
  readonly isSubmitting = computed(() => this.statusSignal() === 'submitting');

  submit(credentials: LoginCredentials): void {
    this.statusSignal.set('submitting');
    this.userTypeSignal.set(null);

    this.authSessionService
      .submitLogin(credentials)
      .pipe(take(1))
      .subscribe((result) => {
        this.statusSignal.set(result.accepted ? 'success' : 'error');
        this.messageSignal.set(result.message);
        this.userTypeSignal.set(result.session?.userType ?? null);
      });
  }
}
