import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ServiceRequestTranslations } from '../../models/language/language.model';

@Component({
  selector: 'app-service-request-kiosk-flow-choice',
  standalone: true,
  templateUrl: './kiosk-flow-choice.component.html',
  styleUrl: './kiosk-flow-choice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KioskFlowChoiceComponent {
  public readonly translations = input.required<ServiceRequestTranslations>();
  public readonly isRtl = input<boolean>(false);

  public readonly choiceSelected = output<'reservation' | 'direct'>();

  public onSelectChoice(choice: 'reservation' | 'direct'): void {
    this.choiceSelected.emit(choice);
  }
}
