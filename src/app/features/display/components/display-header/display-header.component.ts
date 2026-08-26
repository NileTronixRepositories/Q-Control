import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisplayStateService } from '../../services/display-state/display-state.service';

@Component({
  selector: 'app-display-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-header.component.html',
  styleUrl: './display-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayHeaderComponent {
  protected readonly state = inject(DisplayStateService);

  readonly showTableHeaders = input<boolean>(true);

  readonly branchTitle = computed(() => {
    const config = this.state.runtimeConfig();
    return this.state.language() === 'ar' ? config.mainTitleAr : config.mainTitleEn;
  });

  readonly isAr = computed(() => this.state.language() === 'ar');

  readonly headerBgColor = computed(() => this.state.runtimeConfig().headerBackgroundColor);
  readonly titleTextColor = computed(() => this.state.runtimeConfig().mainTitleTextColor);
  readonly titleFontSize = computed(() => this.state.runtimeConfig().mainTitleFontSize);
  readonly logoUrl = computed(() => this.state.runtimeLogoUrl());
}
