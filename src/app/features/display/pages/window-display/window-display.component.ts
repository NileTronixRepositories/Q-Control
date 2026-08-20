import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DisplayHeaderComponent } from '../../components/display-header/display-header.component';
import { DisplayTickerBarComponent } from '../../components/display-ticker-bar/display-ticker-bar.component';
import { DisplayStateService } from '../../services/display-state.service';
import { DisplayQueueItem } from '../../models/display.model';

@Component({
  selector: 'app-window-display',
  standalone: true,
  imports: [
    CommonModule,
    DisplayHeaderComponent,
    DisplayTickerBarComponent,
  ],
  templateUrl: './window-display.component.html',
  styleUrl: './window-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowDisplayComponent implements OnInit {
  protected readonly state = inject(DisplayStateService);
  private readonly route = inject(ActivatedRoute);

  readonly isAr = computed(() => this.state.language() === 'ar');
  readonly currentWindow = this.state.selectedWindow;

  ngOnInit(): void {
    const windowIdParam = this.route.snapshot.paramMap.get('windowId');
    if (windowIdParam) {
      const id = parseInt(windowIdParam, 10);
      if (!isNaN(id)) {
        this.state.selectWindow(id);
      }
    }
  }

  @HostListener('click')
  toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  getWindowLabel(item: DisplayQueueItem): string {
    return this.isAr() ? item.windowNameAr : item.windowName;
  }

  getServiceName(item: DisplayQueueItem): string {
    return this.isAr() ? item.serviceNameAr : item.serviceName;
  }

  getDoctorName(item: DisplayQueueItem): string | undefined {
    return this.isAr() ? (item.doctorNameAr ?? item.doctorName) : (item.doctorName ?? item.doctorNameAr);
  }
}
