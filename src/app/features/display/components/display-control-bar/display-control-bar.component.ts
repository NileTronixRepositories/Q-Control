import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DisplayStateService } from '../../services/display-state.service';

@Component({
  selector: 'app-display-control-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-control-bar.component.html',
  styleUrl: './display-control-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayControlBarComponent {
  protected readonly state = inject(DisplayStateService);
  private readonly router = inject(Router);

  readonly isCollapsed = signal<boolean>(false);
  readonly isFullscreen = signal<boolean>(false);

  readonly isAr = computed(() => this.state.language() === 'ar');
  readonly queueWindows = this.state.queueItems;

  toggleCollapse(): void {
    this.isCollapsed.update((v) => !v);
  }

  toggleSound(): void {
    this.state.toggleSound();
  }

  toggleLanguage(): void {
    this.state.toggleLanguage();
  }

  simulateCall(): void {
    this.state.callNextTicket();
  }

  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        this.isFullscreen.set(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        this.isFullscreen.set(false);
      }).catch(() => {});
    }
  }

  navigateTo(path: string): void {
    this.router.navigateByUrl(path);
  }

  onWindowSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const windowId = parseInt(select.value, 10);
    if (!isNaN(windowId)) {
      this.state.selectWindow(windowId);
      this.router.navigate(['/display/window', windowId]);
    }
  }
}
