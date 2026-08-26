import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-mobile-record-card',
  standalone: true,
  templateUrl: './mobile-record-card.component.html',
  styleUrl: './mobile-record-card.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileRecordCardComponent {
  readonly eyebrow = input('');
  readonly title = input.required<string>();
  readonly icon = input('bi bi-card-list');
  readonly recordId = input<string | number | null>(null);
}
