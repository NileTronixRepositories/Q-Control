import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthNavigationService } from '../../services/auth-navigation/auth-navigation.service';
import { AuthSessionService } from '../../services/auth-session/auth-session.service';
import { LoginI18nStore } from '../../store/login-i18n.store';

@Component({
  selector: 'app-access-state',
  imports: [RouterLink],
  providers: [LoginI18nStore],
  templateUrl: './access-state.component.html',
  styleUrl: './access-state.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessStateComponent {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly authNavigationService = inject(AuthNavigationService);

  protected readonly i18nStore = inject(LoginI18nStore);

  private readonly firstLoginRedirectEffect = effect(() => {
    if (this.authSessionService.currentSession()?.firstLoginFlag) {
      void this.router.navigateByUrl('/auth/change-initial-password');
    }
  });
  protected readonly isDenied = computed(() => this.router.url.startsWith('/access-denied'));
  protected readonly copy = computed(() => {
    const isArabic = this.i18nStore.language() === 'ar';
    const denied = this.isDenied();

    return {
      title: isArabic
        ? denied
          ? '\u0644\u0627 \u062a\u0645\u0644\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0648\u0635\u0648\u0644'
          : '\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0645\u062a\u0627\u062d\u0629'
        : denied
          ? 'Access denied'
          : 'No available access',
      description: isArabic
        ? denied
          ? '\u0627\u0644\u062d\u0633\u0627\u0628 \u0627\u0644\u062d\u0627\u0644\u064a \u0644\u0627 \u064a\u0633\u0645\u062d \u0628\u0641\u062a\u062d \u0647\u0630\u0647 \u0627\u0644\u0635\u0641\u062d\u0629.'
          : '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644\u060c \u0644\u0643\u0646 \u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0644\u0627\u062d\u064a\u0627\u062a \u062a\u0634\u063a\u064a\u0644\u064a\u0629 \u0645\u062a\u0627\u062d\u0629 \u062d\u0627\u0644\u064a\u0627.'
        : denied
          ? 'The current account cannot open this page.'
          : 'You are signed in, but no operational permissions are available yet.',
      home: isArabic ? '\u0627\u0644\u0630\u0647\u0627\u0628 \u0644\u0644\u0648\u062c\u0647\u0629 \u0627\u0644\u0645\u062a\u0627\u062d\u0629' : 'Go to available page',
      logout: isArabic ? '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c' : 'Logout',
    };
  });

  protected readonly availableRoute = computed(() => {
    const session = this.authSessionService.currentSession();
    return session ? this.authNavigationService.resolvePostLoginUrl(session) : '/auth/login';
  });

  protected logout(): void {
    this.authSessionService.clearSession();
    void this.router.navigateByUrl('/auth/login');
  }
}
