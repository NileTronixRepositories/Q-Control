import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisplayStateService } from '../../services/display-state.service';
import { DisplayQueueItem } from '../../models/display.model';

@Component({
  selector: 'app-display-queue-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-queue-board.component.html',
  styleUrl: './display-queue-board.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayQueueBoardComponent {
  protected readonly state = inject(DisplayStateService);

  readonly queueItems = this.state.queueItems;
  readonly isAr = computed(() => this.state.language() === 'ar');

  // Dynamic config signals
  readonly tableHeaderBgColor = computed(() => this.state.runtimeConfig().tableHeaderBackgroundColor);
  readonly tableHeaderTextColor = computed(() => this.state.runtimeConfig().tableHeaderTextColor);
  readonly tableRowBgColor = computed(() => this.state.runtimeConfig().tableRowBackgroundColor);
  readonly tableRowTextColor = computed(() => this.state.runtimeConfig().tableRowTextColor);
  readonly ticketBadgeBgColor = computed(() => this.state.runtimeConfig().ticketNumberBackgroundColor);
  readonly ticketBadgeTextColor = computed(() => this.state.runtimeConfig().ticketNumberTextColor);

  readonly windowColumnTitle = computed(() => {
    const config = this.state.runtimeConfig();
    return this.isAr() ? config.windowColumnTitleAr : config.windowColumnTitleEn;
  });

  readonly serviceColumnTitle = computed(() => {
    const config = this.state.runtimeConfig();
    return this.isAr() ? config.serviceColumnTitleAr : config.serviceColumnTitleEn;
  });

  readonly ticketColumnTitle = computed(() => {
    const config = this.state.runtimeConfig();
    return this.isAr() ? config.ticketColumnTitleAr : config.ticketColumnTitleEn;
  });

  getWindowName(item: DisplayQueueItem): string {
    return this.isAr() ? item.windowNameAr : item.windowName;
  }

  getDoctorAndService(item: DisplayQueueItem): string {
    const doc = this.isAr() ? (item.doctorNameAr ?? item.doctorName) : (item.doctorName ?? item.doctorNameAr);
    const srv = this.isAr() ? item.serviceNameAr : item.serviceName;
    if (doc && srv) {
      return `${doc} - ${srv}`;
    }
    return doc || srv || '';
  }
}

