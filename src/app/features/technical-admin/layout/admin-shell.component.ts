import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AppShellComponent } from '../../../shared/layouts/app-shell/app-shell.component';
import { AppBreadcrumbItem } from '../../../shared/models/breadcrumb.model';
import { AppNavigationItem } from '../../../shared/models/navigation.model';
import { AuthenticatedUserType } from '../../auth/models/login-credentials.model';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceManagementPermissionService } from '../../service-management/services/service-management-permission.service';
import { resolveJwtPermissions } from '../../auth/utils/auth-permissions.util';
import { TechnicalAdminI18nStore } from '../store/technical-admin-i18n.store';

@Component({
  selector: 'app-admin-shell',
  imports: [AppShellComponent, RouterOutlet],
  templateUrl: './admin-shell.component.html',
  styleUrls: [
    './admin-shell.component.css',
    './admin-responsive.component.css'
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminShellComponent {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly servicePermissionService = inject(ServiceManagementPermissionService);
  private readonly currentUrl = signal(this.normalizeUrl(this.router.url));

  protected readonly i18nStore = inject(TechnicalAdminI18nStore);
  protected readonly translations = this.i18nStore.translations;
  protected readonly currentUserDisplayName = computed(() => {
    const session = this.authSessionService.currentSession();

    if (!session) {
      return '';
    }

    return (
      session.displayName?.trim() ||
      session.userName?.trim() ||
      session.email?.trim() ||
      this.currentUserRoleLabel()
    );
  });
  protected readonly currentUserRoleLabel = computed(() => {
    const session = this.authSessionService.currentSession();
    return session ? this.roleLabel(session.userType) : '';
  });
  private readonly routerUrlSubscription = this.router.events
    .pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntilDestroyed(),
    )
    .subscribe((event) => this.currentUrl.set(this.normalizeUrl(event.urlAfterRedirects)));
  protected readonly breadcrumbs = computed<readonly AppBreadcrumbItem[]>(() => {
    const translations = this.translations();
    const navigationPath = this.findNavigationPath(this.navigationItems(), this.currentUrl());
    const root: AppBreadcrumbItem = {
      label: translations.topbarEyebrow,
      route: '/admin/branch-editor',
      icon: 'bi-speedometer2',
    };

    if (navigationPath.length === 0) {
      return [root];
    }

    return [
      root,
      ...navigationPath.map((item, index) => ({
        label: item.label,
        route:
          index === navigationPath.length - 1 ? undefined : item.route ?? this.firstChildRoute(item),
        icon: item.icon,
      })),
    ];
  });
  protected readonly navigationItems = computed<readonly AppNavigationItem[]>(() => {
    const translations = this.translations();
    const serviceNavChildren: AppNavigationItem[] = [];

    if (this.canShow(['Services.ViewAll']) && this.servicePermissionService.canViewAll()) {
      serviceNavChildren.push({
        label: translations.serviceManagementLabel,
        route: '/admin/services/catalog',
        icon: 'bi-list-check',
      });
    }

    if (
      this.canShow(['BranchServices.View']) &&
      this.servicePermissionService.canViewBranchServices()
    ) {
      serviceNavChildren.push({
        label: translations.branchServicesLabel,
        route: '/admin/services/branch-services',
        icon: 'bi-diagram-2',
      });
    }
    if (
      this.canShow(['ServiceWorkflows.ViewAll']) &&
      this.servicePermissionService.canViewWorkflows()
    ) {
      serviceNavChildren.push({
        label: translations.serviceWorkflowsLabel,
        route: '/admin/services/workflows',
        icon: 'bi-diagram-3',
      });
    }

    if (this.canShowScheduleNavigation()) {
      serviceNavChildren.push({
        label: translations.serviceSchedulesLabel,
        route: '/admin/services/schedules',
        icon: 'bi-calendar-week',
      });
    }

    if (
      this.canShow(['ServiceGlobalizationRequests.ViewAll']) &&
      this.servicePermissionService.canViewGlobalizationRequests()
    ) {
      serviceNavChildren.push({
        label: translations.globalizationRequestsLabel,
        route: '/admin/services/globalization-requests',
        icon: 'bi-patch-check',
      });
    }

    if (
      this.canShow(['Services.ViewCentralTree']) &&
      this.servicePermissionService.canViewCentralTree()
    ) {
      serviceNavChildren.push({
        label: translations.centralServiceTreeLabel,
        route: '/admin/services/central-tree',
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
        route: '/admin/branch-editor',
        icon: 'bi-building-gear',
      });
    }

    if (this.canShow(['Branches.ViewDetails', 'Branches.Update'])) {
      branchChildren.push({
        label: translations.branchBrandingLabel,
        route: '/admin/branch-branding',
        icon: 'bi-brush',
      });
    }

    if (serviceNavChildren.length) {
      branchChildren.push({
        label: translations.servicesLabel,
        icon: 'bi-ui-checks-grid',
        expanded: this.currentUrl().startsWith('/admin/services'),
        children: serviceNavChildren,
      });
    }

    if (this.canShow(['WaitingAreas.ViewAll'])) {
      branchChildren.push({
        label: translations.waitingAreasLabel,
        route: '/admin/waiting-areas',
        icon: 'bi-hourglass-split',
      });
    }

    if (this.canShow(['Windows.ViewAll'])) {
      branchChildren.push({
        label: translations.windowsManagementLabel,
        route: '/admin/windows',
        icon: 'bi-window',
      });
    }

    if (this.canShow(['Terminals.ViewAll'])) {
      branchChildren.push({
        label: translations.terminalsManagementLabel,
        route: '/admin/terminals',
        icon: 'bi-terminal',
      });
    }

    if (this.canShow(['Displays.ViewAll'])) {
      branchChildren.push({
        label: translations.displaysManagementLabel,
        route: '/admin/displays',
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

  private canShowScheduleNavigation(): boolean {
    if (!this.canShow(['ServiceSchedules.View'])) {
      return false;
    }

    return (
      this.authSessionService.currentSession()?.userType === 'TechnicalAdmin' ||
      this.servicePermissionService.canViewSchedules()
    );
  }

  private roleLabel(userType: AuthenticatedUserType): string {
    const translations = this.translations();

    switch (userType) {
      case 'TechnicalAdmin':
        return translations.technicalAdminRoleLabel;
      case 'BranchAdmin':
        return translations.branchAdminRoleLabel;
      case 'OrganizationAdmin':
        return translations.organizationAdminRoleLabel;
    }
  }

  protected toggleLanguage(): void {
    this.i18nStore.toggleLanguage();
  }

  private findNavigationPath(
    items: readonly AppNavigationItem[],
    currentUrl: string,
    ancestors: readonly AppNavigationItem[] = [],
  ): readonly AppNavigationItem[] {
    const normalizedUrl = this.resolveCanonicalAdminUrl(currentUrl);

    for (const item of items) {
      const nextPath = [...ancestors, item];

      if (item.route && this.normalizeUrl(item.route) === normalizedUrl) {
        return nextPath;
      }

      if (item.children) {
        const childPath = this.findNavigationPath(item.children, normalizedUrl, nextPath);

        if (childPath.length > 0) {
          return childPath;
        }
      }
    }

    return [];
  }

  private resolveCanonicalAdminUrl(url: string): string {
    const normalizedUrl = this.normalizeUrl(url);

    if (/^\/admin\/services\/branches\/[^/]+\/services\/[^/]+\/schedule$/.test(normalizedUrl)) {
      return '/admin/services/schedules';
    }

    if (/^\/admin\/services\/branches\/[^/]+\/services\/[^/]+\/workflows$/.test(normalizedUrl)) {
      return '/admin/services/workflows';
    }

    return normalizedUrl;
  }

  private normalizeUrl(url: string): string {
    const [path] = url.split(/[?#]/);
    return path.replace(/\/$/, '') || '/';
  }

  private firstChildRoute(item: AppNavigationItem): string | undefined {
    if (item.route) {
      return item.route;
    }

    return item.children?.map((child) => this.firstChildRoute(child)).find(Boolean);
  }

  protected logout(): void {
    this.authSessionService.clearSession();
    void this.router.navigateByUrl('/login');
  }
}


