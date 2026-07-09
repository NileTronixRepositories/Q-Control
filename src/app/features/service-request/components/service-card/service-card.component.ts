import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { SelectionCardViewModel } from '../../shared/selection-card-view.model';

@Component({
  selector: 'app-service-request-service-card',
  templateUrl: './service-card.component.html',
  styleUrl: './service-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCardComponent {
  readonly card = input.required<SelectionCardViewModel>();
  readonly selected = output<string>();

  protected readonly cardClass = computed(() => `service-card tone-${this.card().tone}`);

  protected selectCard(): void {
    this.selected.emit(this.card().id);
  }
}
