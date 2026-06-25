import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AppShellComponent } from '../../../shared/layouts/app-shell/app-shell.component';
import { AppNavigationItem } from '../../../shared/models/navigation.model';
import { TechnicalAdminI18nStore } from '../store/technical-admin-i18n.store';

@Component({
  selector: 'app-technical-admin-shell',
  imports: [AppShellComponent, RouterOutlet],
  templateUrl: './technical-admin-shell.component.html',
  styleUrl: './technical-admin-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TechnicalAdminShellComponent {
  private readonly router = inject(Router);

  protected readonly i18nStore = inject(TechnicalAdminI18nStore);
  protected readonly translations = this.i18nStore.translations;
  protected readonly navigationItems = computed<readonly AppNavigationItem[]>(() => {
    const translations = this.translations();

    return [
      {
        label: translations.themeConfigurationLabel,
        icon: 'bi-pencil-square',
        expanded: true,
        children: [
          {
            label: translations.generalLabel,
            route: '/technical-admin/general',
            icon: 'bi-palette'
          },
          {
            label: translations.serviceRequestLabel,
            route: '/technical-admin/service-request',
            icon: 'bi-ui-checks-grid'
          }
        ]
      },
      {
        label: translations.branchManagementLabel,
        icon: 'bi-globe-americas',
        expanded: true,
        children: [
          {
            label: translations.branchEditorLabel,
            route: '/technical-admin/branch-editor',
            icon: 'bi-diagram-3'
          },
          {
            label: translations.waitingAreasLabel,
            route: '/technical-admin/waiting-areas',
            icon: 'bi-hourglass-split'
          },
          {
            label: translations.terminalsManagementLabel,
            route: '/technical-admin/terminals',
            icon: 'bi-terminal'
          },
          {
            label: translations.windowsManagementLabel,
            route: '/technical-admin/windows',
            icon: 'bi-window'
          },
          {
            label: translations.displaysManagementLabel,
            route: '/technical-admin/displays',
            icon: 'bi-display'
          },
          {
            label: translations.onlineMonitoringLabel,
            route: '/technical-admin/online-monitoring',
            icon: 'bi-activity'
          }
        ]
      }
    ];
  });

  protected toggleLanguage(): void {
    this.i18nStore.toggleLanguage();
  }

  protected logout(): void {
    void this.router.navigateByUrl('/login');
  }
}
