import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

import { SelectionCardViewModel } from '../../shared/selection-card-view.model';
import { ServiceRequestStore } from '../../store/service-request.store';

@Component({
  selector: 'app-service-request-specialty-card',
  templateUrl: './specialty-card.component.html',
  styleUrl: './specialty-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpecialtyCardComponent {
  protected readonly store = inject(ServiceRequestStore);

  readonly card = input.required<SelectionCardViewModel>();
  readonly selected = output<string>();

  protected readonly cardClass = computed(() => `specialty-card tone-${this.card().tone}`);

  protected readonly promptText = computed(() => {
    return this.store.serviceButton()?.text || (this.store.language() === 'ar' ? 'المس الاختيار للمتابعة' : 'Tap to select');
  });

  protected readonly arrowIconClass = computed(() => {
    return this.store.direction() === 'rtl' ? 'bi-arrow-left-circle-fill' : 'bi-arrow-right-circle-fill';
  });

  protected selectCard(): void {
    this.selected.emit(this.card().id);
  }
}
