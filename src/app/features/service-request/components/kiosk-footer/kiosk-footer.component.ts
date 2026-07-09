import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-service-request-kiosk-footer',
  templateUrl: './kiosk-footer.component.html',
  styleUrl: './kiosk-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KioskFooterComponent {
  readonly caption = input.required<string>();
}