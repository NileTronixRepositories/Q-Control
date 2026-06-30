import { ChangeDetectionStrategy, Component, ElementRef, HostListener, inject, signal } from '@angular/core';

import { AdminThemeId } from '../../models/admin-theme.model';
import { AdminThemeStore } from '../../store/admin-theme.store';

interface ThemePanelPosition {
  top: string;
  left: string;
  width: string;
}

@Component({
  selector: 'app-theme-switcher',
  templateUrl: './theme-switcher.component.html',
  styleUrl: './theme-switcher.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitcherComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly themeStore = inject(AdminThemeStore);
  protected readonly isOpen = signal(false);
  protected readonly panelPosition = signal<ThemePanelPosition>({
    top: '0',
    left: '0',
    width: '220px',
  });

  @HostListener('document:click', ['$event'])
  protected closeOnOutsideClick(event: MouseEvent): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (!this.elementRef.nativeElement.contains(target)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    this.isOpen.set(false);
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  protected refreshPanelPosition(): void {
    if (!this.isOpen()) {
      return;
    }

    this.updatePanelPosition();
  }

  protected togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    const shouldOpen = !this.isOpen();

    this.isOpen.set(shouldOpen);

    if (shouldOpen) {
      requestAnimationFrame(() => this.updatePanelPosition());
    }
  }

  protected selectTheme(themeId: AdminThemeId): void {
    this.themeStore.setTheme(themeId);
    this.isOpen.set(false);
  }

  private updatePanelPosition(): void {
    const trigger = this.elementRef.nativeElement.querySelector<HTMLElement>('.theme-trigger');
    const panel = this.elementRef.nativeElement.querySelector<HTMLElement>('.theme-panel');

    if (!trigger || !panel) {
      return;
    }

    const viewportGap = 10;
    const triggerGap = 10;
    const triggerRect = trigger.getBoundingClientRect();
    const maxPanelWidth = Math.max(0, window.innerWidth - viewportGap * 2);
    const panelWidth = Math.min(220, maxPanelWidth);
    const panelHeight = panel.offsetHeight;
    let left = triggerRect.right - panelWidth;
    let top = triggerRect.bottom + triggerGap;

    if (left < viewportGap) {
      left = triggerRect.right + triggerGap;
    }

    if (left + panelWidth > window.innerWidth - viewportGap) {
      left = window.innerWidth - panelWidth - viewportGap;
    }

    if (top + panelHeight > window.innerHeight - viewportGap) {
      top = triggerRect.top - panelHeight - triggerGap;
    }

    this.panelPosition.set({
      top: `${Math.max(viewportGap, top)}px`,
      left: `${Math.max(viewportGap, left)}px`,
      width: `${panelWidth}px`,
    });
  }
}


