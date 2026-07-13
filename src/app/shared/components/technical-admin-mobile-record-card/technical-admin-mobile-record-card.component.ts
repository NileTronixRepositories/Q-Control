import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-technical-admin-mobile-record-card',
  standalone: true,
  templateUrl: './technical-admin-mobile-record-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalAdminMobileRecordCardComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly icon = input('bi bi-card-list');
  readonly recordId = input<string | number | null>(null);
}
