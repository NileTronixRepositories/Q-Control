import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

import { AppShellComponent } from '../../../shared/layouts/app-shell/app-shell.component';
import { AppBreadcrumbItem } from '../../../shared/models/breadcrumb.model';
import { AppNavigationItem } from '../../../shared/models/navigation.model';
import { AuthenticatedUserType } from '../../auth/models/login-credentials.model';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceManagementPermissionService } from '../../service-management/services/catalog/service-management-permission.service';
import { SegmentPermissionService } from '../../segment-management/services/segment-permission.service';
import { resolveJwtPermissions } from '../../auth/utils/auth-permissions.util';
import { TechnicalAdminBranchContextStore } from '../store/technical-admin-branch-context.store';
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
  private readonly segmentPermissionService = inject(SegmentPermissionService);
  private readonly branchContextStore = inject(TechnicalAdminBranchContextStore);
  private readonly currentUrl = signal(this.normalizeUrl(this.router.url));

  protected readonly i18nStore = inject(TechnicalAdminI18nStore);
  protected readonly isTechnicalAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin',
  );
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
    .subscribe((event) => this.syncRouterState(event.urlAfterRedirects));

  constructor() {
    this.syncRouterState(this.router.url);
  }
  private readonly branchOperationalNavigationItems = computed<readonly AppNavigationItem[]>(() => {
    const translations = this.translations();
    const items: AppNavigationItem[] = [];

    if (this.canShow(['WaitingAreas.ViewAll'])) {
      items.push({
        label: translations.waitingAreasLabel,
        route: '/admin/waiting-areas',
        icon: 'bi-hourglass-split',
      });
    }

    if (this.canShow(['Windows.ViewAll'])) {
      items.push({
        label: translations.windowsManagementLabel,
        route: '/admin/windows',
        icon: 'bi-window',
      });
    }

    if (this.canShow(['Terminals.ViewAll'])) {
      items.push({
        label: translations.terminalsManagementLabel,
        route: '/admin/terminals',
        icon: 'bi-terminal',
      });
    }

    if (this.canShow(['Displays.ViewAll'])) {
      items.push({
        label: translations.displaysManagementLabel,
        route: '/admin/displays',
        icon: 'bi-display',
      });
    }

    if (this.canShow(['Branches.ViewDetails', 'Branches.Update'])) {
      items.push({
        label: translations.branchBrandingLabel,
        route: '/admin/branch-branding',
        icon: 'bi-brush',
      });
    }

    if (this.canShow(['BranchConfigurations.View', 'BranchConfigurations.Create', 'BranchConfigurations.Update'])) {
      items.push({
        label: translations.branchConfigurationLabel,
        route: '/admin/branch-configuration',
        icon: 'bi-clock-history',
      });
    }

    return items;
  });
  protected readonly contextNavigationItems = computed<readonly AppNavigationItem[]>(() => {
    const branchId = this.branchContextStore.selectedBranchId();

    if (!this.isTechnicalAdmin() || branchId === null) {
      return [];
    }

    return this.branchOperationalNavigationItems().map((item) => ({
      ...item,
      queryParams: { branchId },
    }));
  });
  protected readonly contextNavigationTitle = computed(() => {
    const branch = this.branchContextStore.selectedBranch();
    const branchId = this.branchContextStore.selectedBranchId();

    if (!branch) {
      return branchId === null ? '' : `BR-${branchId}`;
    }

    const localizedName = this.i18nStore.language() === 'ar' ? branch.arabicName : branch.englishName;
    return localizedName.trim() || `BR-${branch.branchId}`;
  });
  protected readonly contextNavigationMeta = computed(() => {
    const branchId = this.branchContextStore.selectedBranchId();
    return branchId === null ? '' : `BR-${branchId}`;
  });
  protected readonly contextNavigationStatusLabel = computed(() => {
    const branch = this.branchContextStore.selectedBranch();

    if (!branch) {
      return '';
    }

    return branch.isActive
      ? this.translations().activeBranchLabel
      : this.translations().inactiveBranchLabel;
  });
  protected readonly contextNavigationStatusTone = computed<'active' | 'inactive'>(() =>
    this.branchContextStore.selectedBranch()?.isActive ? 'active' : 'inactive',
  );
  protected readonly breadcrumbs = computed<readonly AppBreadcrumbItem[]>(() => {
    const translations = this.translations();
    const currentUrl = this.currentUrl();
    const branchId = this.branchContextStore.selectedBranchId();
    const root: AppBreadcrumbItem = {
      label: translations.topbarEyebrow,
      route: '/admin/branch-editor',
      icon: 'bi-speedometer2',
    };

    if (this.isTechnicalAdmin() && branchId !== null) {
      const branchItem: AppBreadcrumbItem = {
        label: this.contextNavigationTitle(),
        route: '/admin/branch-editor',
        queryParams: { branchId },
        icon: 'bi-building',
      };
      const contextItem = this.contextNavigationItems().find(
        (item) => item.route && this.normalizeUrl(item.route) === currentUrl,
      );

      if (contextItem) {
        return [
          root,
          {
            label: translations.branchManagementLabel,
            route: '/admin/branch-editor',
            icon: 'bi-diagram-3',
          },
          branchItem,
          { label: contextItem.label, icon: contextItem.icon },
        ];
      }

      if (currentUrl === '/admin/branch-editor') {
        return [
          root,
          {
            label: translations.branchManagementLabel,
            route: '/admin/branch-editor',
            icon: 'bi-diagram-3',
          },
          branchItem,
        ];
      }
    }

    const navigationPath = this.findNavigationPath(this.navigationItems(), currentUrl);

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
        queryParams: item.queryParams,
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


    const segmentNavChildren: AppNavigationItem[] = [];

    if (this.segmentPermissionService.canViewAllSegments()) {
      segmentNavChildren.push({
        label: this.i18nStore.language() === 'ar' ? 'إدارة الشرائح' : 'Segment Management',
        route: '/admin/segments',
        icon: 'bi-tags-fill',
      });
    }

    if (this.segmentPermissionService.canViewAllGlobalizationRequests()) {
      segmentNavChildren.push({
        label: this.i18nStore.language() === 'ar' ? 'طلبات تعميم الشرائح' : 'Globalization Requests',
        route: '/admin/segment-globalization-requests',
        icon: 'bi-patch-check-fill',
      });
    }

    if (this.segmentPermissionService.canViewOwnGlobalizationRequests()) {
      segmentNavChildren.push({
        label: this.i18nStore.language() === 'ar' ? 'طلبات شرائح الفرع' : 'Branch Segment Requests',
        route: '/admin/branch-segment-requests',
        icon: 'bi-send-check-fill',
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

    if (this.canShow(['GeneralBrand.View', 'GeneralBrand.Create', 'GeneralBrand.Update'])) {
      branchChildren.push({
        label: translations.generalBrandLabel,
        route: '/admin/general-brand',
        icon: 'bi-palette',
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

    if (segmentNavChildren.length) {
      branchChildren.push({
        label: this.i18nStore.language() === 'ar' ? 'الشرائح' : 'Segments',
        icon: 'bi-tags',
        expanded:
          this.currentUrl().startsWith('/admin/segments') ||
          this.currentUrl().startsWith('/admin/segment-globalization-requests') ||
          this.currentUrl().startsWith('/admin/branch-segment-requests'),
        children: segmentNavChildren,
      });
    }

    if (!this.isTechnicalAdmin()) {
      branchChildren.push(...this.branchOperationalNavigationItems());
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

  protected closeBranchContext(): void {
    this.branchContextStore.clear();
    void this.router.navigate(['/admin/branch-editor']);
  }

  private syncRouterState(url: string): void {
    this.currentUrl.set(this.normalizeUrl(url));

    if (!this.isTechnicalAdmin()) {
      this.branchContextStore.clear();
      return;
    }

    const branchId = Number(this.router.parseUrl(url).queryParams['branchId']);

    if (Number.isInteger(branchId) && branchId > 0) {
      this.branchContextStore.activate(branchId);
      return;
    }

    this.branchContextStore.clear();
  }
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

     if (/^\/admin\/segments\/[^/]+/.test(normalizedUrl)) {
      return '/admin/segments';
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


