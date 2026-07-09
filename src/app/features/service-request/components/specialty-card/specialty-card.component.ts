import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { SelectionCardViewModel } from '../../shared/selection-card-view.model';

@Component({
  selector: 'app-service-request-specialty-card',
  templateUrl: './specialty-card.component.html',
  styleUrl: './specialty-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialtyCardComponent {
  readonly card = input.required<SelectionCardViewModel>();
  readonly selected = output<string>();

  protected readonly cardClass = computed(() => `specialty-card tone-${this.card().tone}`);

  protected selectCard(): void {
    this.selected.emit(this.card().id);
  }
}
