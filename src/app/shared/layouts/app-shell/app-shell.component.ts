import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  input,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AppBreadcrumbComponent } from '../../components/app-breadcrumb/app-breadcrumb.component';


import { AppDirection, AppLanguage } from '../../models/app-language.model';
import { AppBreadcrumbItem } from '../../models/breadcrumb.model';
import { AppNavigationItem } from '../../models/navigation.model';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, AppBreadcrumbComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit, OnDestroy, OnChanges {
  readonly navigationItems = input.required<readonly AppNavigationItem[]>();
  readonly direction = input<AppDirection>('ltr');
  readonly language = input<AppLanguage>('en');
  readonly closeSidebarLabel = input('Close sidebar');
  readonly openSidebarLabel = input('Open sidebar');
  readonly navigationLabel = input('Navigation');
  readonly accountActionsLabel = input('Account actions');
  readonly topbarEyebrow = input('Dashboard');
  readonly topbarTitle = input('Q-System');
  readonly topbarLogoAlt = input('Niletronix');
  readonly languageButtonLabel = input('Language');
  readonly logoutLabel = input('Logout');
  readonly breadcrumbs = input<readonly AppBreadcrumbItem[]>([]);
  readonly breadcrumbLabel = input('Breadcrumb');
  readonly currentUserDisplayName = input('');
  readonly currentUserRoleLabel = input('');
  readonly currentUserLabel = input('Current user');
  readonly showLanguageAction = input(true);
  readonly mobileNavigationMode = input<'rail' | 'overlay'>('rail');
  readonly contextNavigationItems = input<readonly AppNavigationItem[]>([]);
  readonly contextNavigationLabel = input('Branch navigation');
  readonly contextNavigationEyebrow = input('Selected branch');
  readonly contextNavigationTitle = input('');
  readonly contextNavigationMeta = input('');
  readonly contextNavigationStatusLabel = input('');
  readonly contextNavigationStatusTone = input<'active' | 'inactive'>('active');
  readonly openContextNavigationLabel = input('Open branch navigation');
  readonly closeContextNavigationLabel = input('Close branch navigation');
  readonly backToContextRootLabel = input('Back to branches');

  readonly languageToggle = output<void>();
  readonly logout = output<void>();
  readonly contextNavigationClose = output<void>();

  protected readonly sidebarExpanded = signal(true);
  protected readonly contextSidebarOpen = signal(false);

  protected readonly isMobile = signal(false);
  protected readonly usesContextOverlay = signal(false);
  protected readonly usesMobileOverlay = computed(
    () => this.isMobile() && this.mobileNavigationMode() === 'overlay',
  );
  protected readonly hasContextNavigation = computed(() => this.contextNavigationItems().length > 0);
  protected readonly logoutIconClass = computed(() =>
    this.direction() === 'rtl' ? 'bi bi-box-arrow-left' : 'bi bi-box-arrow-right',
  );
  protected readonly trimmedCurrentUserDisplayName = computed(() => this.currentUserDisplayName().trim());
  protected readonly trimmedCurrentUserRoleLabel = computed(() => this.currentUserRoleLabel().trim());
  protected readonly hasCurrentUser = computed(() => this.trimmedCurrentUserDisplayName().length > 0);
  protected readonly showsWorkspaceUser = computed(
    () => this.hasCurrentUser() && !(this.isMobile() && this.usesMobileOverlay()),
  );
  protected readonly hasWorkspaceHeader = computed(
    () => this.breadcrumbs().length > 0 || this.showsWorkspaceUser(),
  );

  private readonly mobileMenuButton = viewChild<ElementRef<HTMLButtonElement>>('mobileMenuButton');
  private readonly sidebarToggleButton = viewChild<ElementRef<HTMLButtonElement>>('sidebarToggleButton');
  private readonly contextReopenButton = viewChild<ElementRef<HTMLButtonElement>>('contextReopenButton');
  private readonly contextCloseButton = viewChild<ElementRef<HTMLButtonElement>>('contextCloseButton');
  private desktopSidebarExpanded = true;
  private bodyOverflowBeforeNavigation = '';
  private bodyScrollLocked = false;

  ngOnInit(): void {
    this.checkBreakpoint();
    if (this.hasContextNavigation()) {
      this.contextSidebarOpen.set(true);
      this.syncBodyScroll();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['contextNavigationItems']) {
      return;
    }

    if (!this.hasContextNavigation()) {
      this.contextSidebarOpen.set(false);
      this.syncBodyScroll();
      return;
    }

    this.contextSidebarOpen.set(true);
    this.syncBodyScroll();
  }

  ngOnDestroy(): void {
    this.releaseBodyScroll();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkBreakpoint();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.contextSidebarOpen()) {
      this.closeContextNavigation();
      return;
    }

    if (this.usesMobileOverlay() && this.sidebarExpanded()) {
      this.closeSidebar();
    }
  }

  private checkBreakpoint(): void {
    const mobile = window.innerWidth <= 767.98;
    const wasMobile = this.isMobile();

    if (mobile !== wasMobile) {
      if (mobile) {
        this.desktopSidebarExpanded = this.sidebarExpanded();
        this.sidebarExpanded.set(false);
      } else {
        this.sidebarExpanded.set(this.desktopSidebarExpanded);
      }
    }

    this.isMobile.set(mobile);
    this.usesContextOverlay.set(window.innerWidth < 1200);
    this.syncBodyScroll();
  }

  protected toggleSidebar(): void {
    const expanded = !this.sidebarExpanded();
    this.sidebarExpanded.set(expanded);
    if (!this.isMobile()) {
      this.desktopSidebarExpanded = expanded;
    }
    this.syncBodyScroll();
    this.focusNavigationControl(expanded);
  }

  protected openSidebar(): void {
    if (this.usesContextOverlay()) {
      this.contextSidebarOpen.set(false);
    }
    this.sidebarExpanded.set(true);
    this.syncBodyScroll();
    this.focusNavigationControl(true);
  }

  protected closeSidebar(): void {
    this.sidebarExpanded.set(false);
    this.syncBodyScroll();
    this.focusNavigationControl(false);
  }

  private focusNavigationControl(expanded: boolean): void {
    if (!this.usesMobileOverlay()) {
      return;
    }

    queueMicrotask(() => {
      const target = expanded ? this.sidebarToggleButton() : this.mobileMenuButton();
      target?.nativeElement.focus();
    });
  }

  private syncBodyScroll(): void {
    const shouldLock =
      (this.usesMobileOverlay() && this.sidebarExpanded()) ||
      (this.usesContextOverlay() && this.contextSidebarOpen());
    if (shouldLock && !this.bodyScrollLocked) {
      this.bodyOverflowBeforeNavigation = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      this.bodyScrollLocked = true;
    } else if (!shouldLock) {
      this.releaseBodyScroll();
    }
  }

  private releaseBodyScroll(): void {
    if (!this.bodyScrollLocked) {
      return;
    }

    document.body.style.overflow = this.bodyOverflowBeforeNavigation;
    this.bodyScrollLocked = false;
  }

  protected openContextNavigation(): void {
    if (!this.hasContextNavigation()) {
      return;
    }

    if (this.usesMobileOverlay()) {
      this.sidebarExpanded.set(false);
    }
    this.contextSidebarOpen.set(true);
    this.syncBodyScroll();
    queueMicrotask(() => this.contextCloseButton()?.nativeElement.focus());
  }

  protected closeContextNavigation(): void {
    this.contextSidebarOpen.set(false);
    this.syncBodyScroll();
    queueMicrotask(() => this.contextReopenButton()?.nativeElement.focus());
  }

  protected closeContextRequested(): void {
    this.closeContextNavigation();
    this.contextNavigationClose.emit();
  }

  protected contextNavigationSelected(): void {
    if (this.usesContextOverlay()) {
      this.closeContextNavigation();
    }
  }

  protected toggleGroup(item: AppNavigationItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }

  protected toggleLanguage(): void {
    this.languageToggle.emit();
  }

  protected logoutRequested(): void {
    this.logout.emit();
  }
}



