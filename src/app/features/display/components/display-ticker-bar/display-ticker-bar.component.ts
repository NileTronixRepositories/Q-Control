import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisplayStateService } from '../../services/display-state.service';

@Component({
  selector: 'app-display-ticker-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-ticker-bar.component.html',
  styleUrl: './display-ticker-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayTickerBarComponent implements OnInit, OnDestroy {
  protected readonly state = inject(DisplayStateService);

  readonly currentTime = signal<string>('');
  readonly currentDate = signal<string>('');
  private timeIntervalId: ReturnType<typeof setInterval> | null = null;

  readonly isAr = computed(() => this.state.language() === 'ar');

  // Dynamic config signals
  readonly tickerBgColor = computed(() => this.state.runtimeConfig().tickerBackgroundColor);
  readonly tickerTextColor = computed(() => this.state.runtimeConfig().tickerTextColor);
  readonly tickerFontSize = computed(() => this.state.runtimeConfig().tickerFontSize);
  readonly showClock = computed(() => this.state.runtimeConfig().showClock);
  readonly clockBgColor = computed(() => this.state.runtimeConfig().clockBackgroundColor);
  readonly clockTextColor = computed(() => this.state.runtimeConfig().clockTextColor);

  readonly combinedNewsText = computed(() => {
    const isArabic = this.isAr();
    const newsList = this.state.tickerNews();
    return newsList
      .map((item) => (isArabic ? item.textAr : item.textEn))
      .join('   ✦   ');
  });

  ngOnInit(): void {
    this.updateClock();
    this.timeIntervalId = setInterval(() => {
      this.updateClock();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timeIntervalId) {
      clearInterval(this.timeIntervalId);
    }
  }

  private updateClock(): void {
    const now = new Date();
    const isArabic = this.isAr();

    // Time: HH:mm:ss
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    this.currentTime.set(`${hours}:${minutes}:${seconds}`);

    // Date
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    this.currentDate.set(now.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', options));
  }
}
