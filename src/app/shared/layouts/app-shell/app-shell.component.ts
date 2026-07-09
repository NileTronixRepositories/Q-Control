import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { ThemeSwitcherComponent } from '../../components/theme-switcher/theme-switcher.component';

import { AppDirection, AppLanguage } from '../../models/app-language.model';
import { AppNavigationItem } from '../../models/navigation.model';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, ThemeSwitcherComponent],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent implements OnInit {
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
  readonly showLanguageAction = input(true);

  readonly languageToggle = output<void>();
  readonly logout = output<void>();

  protected readonly sidebarExpanded = signal(true);

  protected readonly isMobile = signal(false);
  protected readonly logoutIconClass = computed(() =>
    this.direction() === 'rtl' ? 'bi bi-box-arrow-left' : 'bi bi-box-arrow-right',
  );

  ngOnInit(): void {
    this.checkBreakpoint();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkBreakpoint();
  }

  private checkBreakpoint(): void {
    const mobile = window.innerWidth <= 767.98;
    this.isMobile.set(mobile);

    if (mobile) {
      this.sidebarExpanded.set(false);
    }
  }

  protected toggleSidebar(): void {
    this.sidebarExpanded.update((v) => !v);
  }

  protected openSidebar(): void {
    this.sidebarExpanded.set(true);
  }

  protected closeSidebar(): void {
    this.sidebarExpanded.set(false);
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



