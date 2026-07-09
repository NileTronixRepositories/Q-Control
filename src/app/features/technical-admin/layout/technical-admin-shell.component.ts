import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AppShellComponent } from '../../../shared/layouts/app-shell/app-shell.component';
import { AppNavigationItem } from '../../../shared/models/navigation.model';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceManagementPermissionService } from '../../service-management/services/service-management-permission.service';
import { TechnicalAdminI18nStore } from '../store/technical-admin-i18n.store';

@Component({
  selector: 'app-technical-admin-shell',
  imports: [AppShellComponent, RouterOutlet],
  templateUrl: './technical-admin-shell.component.html',
  styleUrl: './technical-admin-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalAdminShellComponent {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly servicePermissionService = inject(ServiceManagementPermissionService);

  protected readonly i18nStore = inject(TechnicalAdminI18nStore);
  protected readonly translations = this.i18nStore.translations;
  protected readonly navigationItems = computed<readonly AppNavigationItem[]>(() => {
    const translations = this.translations();
    const serviceNavChildren: AppNavigationItem[] = [];

    if (this.servicePermissionService.canViewAll()) {
      serviceNavChildren.push({
        label: translations.serviceManagementLabel,
        route: '/technical-admin/services/catalog',
        icon: 'bi-list-check',
      });
    }

    if (this.servicePermissionService.canViewWorkflows()) {
      serviceNavChildren.push({
        label: translations.serviceWorkflowsLabel,
        route: '/technical-admin/services/workflows',
        icon: 'bi-diagram-3',
      });
    }

    const serviceChildren: AppNavigationItem[] = serviceNavChildren.length
      ? [
          {
            label: translations.servicesLabel,
            icon: 'bi-ui-checks-grid',
            expanded: this.router.url.startsWith('/technical-admin/services'),
            children: serviceNavChildren,
          },
        ]
      : [];

    return [
      {
        label: translations.branchManagementLabel,
        icon: 'bi-diagram-3',
        expanded: true,
        children: [
          {
            label: translations.branchEditorLabel,
            route: '/technical-admin/branch-editor',
            icon: 'bi-building-gear',
          },
          {
            label: translations.branchBrandingLabel,
            route: '/technical-admin/branch-branding',
            icon: 'bi-brush',
          },
          ...serviceChildren,
          {
            label: translations.waitingAreasLabel,
            route: '/technical-admin/waiting-areas',
            icon: 'bi-hourglass-split',
          },
          {
            label: translations.windowsManagementLabel,
            route: '/technical-admin/windows',
            icon: 'bi-window',
          },
          {
            label: translations.terminalsManagementLabel,
            route: '/technical-admin/terminals',
            icon: 'bi-terminal',
          },
          {
            label: translations.displaysManagementLabel,
            route: '/technical-admin/displays',
            icon: 'bi-display',
          },
        ],
      },
    ];
  });

  protected toggleLanguage(): void {
    this.i18nStore.toggleLanguage();
  }

  protected logout(): void {
    this.authSessionService.clearSession();
    void this.router.navigateByUrl('/login');
  }
}

