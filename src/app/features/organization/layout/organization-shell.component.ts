import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AppShellComponent } from '../../../shared/layouts/app-shell/app-shell.component';
import { AppNavigationItem } from '../../../shared/models/navigation.model';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { OrganizationShellStore } from '../store/organization-shell.store';

@Component({
  selector: 'app-organization-shell',
  imports: [AppShellComponent, RouterOutlet],
  templateUrl: './organization-shell.component.html',
  styleUrl: './organization-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganizationShellComponent {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);

  protected readonly shellStore = inject(OrganizationShellStore);

  protected readonly organizationItems = computed<AppNavigationItem[]>(() => {
    const translations = this.shellStore.translations();

    return [
      {
        label: translations.organizationLabel,
        icon: 'bi-building-gear',
        expanded: true,
        children: [
          {
            label: translations.globalConfigurationsLabel,
            route: '/organization/global-configurations',
            caption: 'Brand and tenant defaults',
            icon: 'bi-globe'
          },
          {
            label: translations.ticketCallingManagementLabel,
            route: '/organization/ticket-calling-management',
            caption: 'Queue timing and lookup',
            icon: 'bi-megaphone'
          },
          {
            label: translations.audioAnnouncementLabel,
            route: '/organization/audio-announcement',
            caption: 'Voice and tone rules',
            icon: 'bi-volume-up'
          },
          {
            label: translations.ticketStatusManagementLabel,
            route: '/organization/ticket-status-management',
            caption: 'Closing status catalog',
            icon: 'bi-tags'
          }
        ]
      }
    ];
  });

  protected toggleLanguage(): void {
    this.shellStore.toggleLanguage();
  }

  protected logout(): void {
    this.authSessionService.clearSession();
    void this.router.navigateByUrl('/login');
  }
}
