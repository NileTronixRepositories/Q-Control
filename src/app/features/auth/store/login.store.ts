import { computed, inject, Injectable, signal } from '@angular/core';
import { take } from 'rxjs';

import { AuthenticatedSession, LoginCredentials } from '../models/login-credentials/login-credentials.model';
import { AuthSessionService } from '../services/auth-session/auth-session.service';

export type LoginStatus = 'idle' | 'submitting' | 'success' | 'error';

@Injectable()
export class LoginStore {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly statusSignal = signal<LoginStatus>('idle');
  private readonly messageSignal = signal<string>('');
  private readonly sessionSignal = signal<AuthenticatedSession | null>(null);

  readonly status = this.statusSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();
  readonly session = this.sessionSignal.asReadonly();
  readonly userType = computed(() => this.sessionSignal()?.userType ?? null);
  readonly isSubmitting = computed(() => this.statusSignal() === 'submitting');

  submit(credentials: LoginCredentials): void {
    this.statusSignal.set('submitting');
    this.messageSignal.set('');
    this.sessionSignal.set(null);

    this.authSessionService
      .submitLogin(credentials)
      .pipe(take(1))
      .subscribe((result) => {
        this.messageSignal.set(result.message);
        this.sessionSignal.set(result.session ?? null);
        this.statusSignal.set(result.accepted ? 'success' : 'error');
      });
  }
}
