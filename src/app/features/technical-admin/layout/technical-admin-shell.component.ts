import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AppShellComponent } from '../../../shared/layouts/app-shell/app-shell.component';
import { AppNavigationItem } from '../../../shared/models/navigation.model';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceManagementPermissionService } from '../../service-management/services/service-management-permission.service';
import { resolveJwtPermissions } from '../../auth/utils/auth-permissions.util';
import { TechnicalAdminI18nStore } from '../store/technical-admin-i18n.store';

@Component({
  selector: 'app-technical-admin-shell',
  imports: [AppShellComponent, RouterOutlet],
  templateUrl: './technical-admin-shell.component.html',
  styleUrls: [
    './technical-admin-shell.component.css',
    './technical-admin-responsive.component.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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

    if (this.canShow(['Services.ViewAll']) && this.servicePermissionService.canViewAll()) {
      serviceNavChildren.push({
        label: translations.serviceManagementLabel,
        route: '/technical-admin/services/catalog',
        icon: 'bi-list-check',
      });
    }

    if (
      this.canShow(['BranchServices.View']) &&
      this.servicePermissionService.canViewBranchServices()
    ) {
      serviceNavChildren.push({
        label: translations.branchServicesLabel,
        route: '/technical-admin/services/branch-services',
        icon: 'bi-diagram-2',
      });
    }
    if (
      this.canShow(['ServiceWorkflows.ViewAll']) &&
      this.servicePermissionService.canViewWorkflows()
    ) {
      serviceNavChildren.push({
        label: translations.serviceWorkflowsLabel,
        route: '/technical-admin/services/workflows',
        icon: 'bi-diagram-3',
      });
    }

    if (
      this.canShow(['ServiceGlobalizationRequests.ViewAll']) &&
      this.servicePermissionService.canViewGlobalizationRequests()
    ) {
      serviceNavChildren.push({
        label: translations.globalizationRequestsLabel,
        route: '/technical-admin/services/globalization-requests',
        icon: 'bi-patch-check',
      });
    }

    if (
      this.canShow(['Services.ViewCentralTree']) &&
      this.servicePermissionService.canViewCentralTree()
    ) {
      serviceNavChildren.push({
        label: translations.centralServiceTreeLabel,
        route: '/technical-admin/services/central-tree',
        icon: 'bi-diagram-3-fill',
      });
    }

    const branchChildren: AppNavigationItem[] = [];

    if (
      this.canShow([
        'Branches.ViewAll',
        'Branches.ViewDetails',
        'Branches.Create',
        'Branches.Update',
        'BranchAdmins.Create',
      ])
    ) {
      branchChildren.push({
        label: translations.branchEditorLabel,
        route: '/technical-admin/branch-editor',
        icon: 'bi-building-gear',
      });
    }

    if (this.canShow(['Branches.ViewDetails', 'Branches.Update'])) {
      branchChildren.push({
        label: translations.branchBrandingLabel,
        route: '/technical-admin/branch-branding',
        icon: 'bi-brush',
      });
    }

    if (serviceNavChildren.length) {
      branchChildren.push({
        label: translations.servicesLabel,
        icon: 'bi-ui-checks-grid',
        expanded: this.router.url.startsWith('/technical-admin/services'),
        children: serviceNavChildren,
      });
    }

    if (this.canShow(['WaitingAreas.ViewAll'])) {
      branchChildren.push({
        label: translations.waitingAreasLabel,
        route: '/technical-admin/waiting-areas',
        icon: 'bi-hourglass-split',
      });
    }

    if (this.canShow(['Windows.ViewAll'])) {
      branchChildren.push({
        label: translations.windowsManagementLabel,
        route: '/technical-admin/windows',
        icon: 'bi-window',
      });
    }

    if (this.canShow(['Terminals.ViewAll'])) {
      branchChildren.push({
        label: translations.terminalsManagementLabel,
        route: '/technical-admin/terminals',
        icon: 'bi-terminal',
      });
    }

    if (this.canShow(['Displays.ViewAll'])) {
      branchChildren.push({
        label: translations.displaysManagementLabel,
        route: '/technical-admin/displays',
        icon: 'bi-display',
      });
    }

    return branchChildren.length
      ? [
          {
            label: translations.branchManagementLabel,
            icon: 'bi-diagram-3',
            expanded: true,
            children: branchChildren,
          },
        ]
      : [];
  });

  private canShow(requiredPermissions: readonly string[]): boolean {
    const session = this.authSessionService.currentSession();

    if (!session || session.userType === 'TechnicalAdmin') {
      return true;
    }

    const permissions = resolveJwtPermissions(session.token);
    return requiredPermissions.some((permission) => permissions.has(permission));
  }
  protected toggleLanguage(): void {
    this.i18nStore.toggleLanguage();
  }

  protected logout(): void {
    this.authSessionService.clearSession();
    void this.router.navigateByUrl('/login');
  }
}
