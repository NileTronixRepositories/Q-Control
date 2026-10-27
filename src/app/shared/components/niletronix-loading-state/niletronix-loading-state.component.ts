import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NiletronixLoadingVariant = 'page' | 'panel' | 'inline' | 'skeleton';
export type NiletronixLoadingSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-niletronix-loading-state',
  standalone: true,
  templateUrl: './niletronix-loading-state.component.html',
  styleUrl: './niletronix-loading-state.component.css',
  host: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NiletronixLoadingStateComponent {
  readonly title = input('Loading...');
  readonly description = input('');
  readonly icon = input('bi bi-arrow-repeat');
  readonly variant = input<NiletronixLoadingVariant>('panel');
  readonly size = input<NiletronixLoadingSize>('md');

  protected readonly classList = computed(() =>
    ['nt-loading-state', `nt-loading-state--${this.variant()}`, `nt-loading-state--${this.size()}`].join(' '),
  );
}