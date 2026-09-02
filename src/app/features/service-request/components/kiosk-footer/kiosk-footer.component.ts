import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ServiceRequestStore } from '../../store/service-request.store';

@Component({
  selector: 'app-service-request-kiosk-footer',
  templateUrl: './kiosk-footer.component.html',
  styleUrl: './kiosk-footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KioskFooterComponent {
  protected readonly store = inject(ServiceRequestStore);

  readonly caption = input.required<string>();

  protected readonly footerText = computed(() => {
    if (this.store.language() === 'en') {
      return this.caption() || 'Please touch the screen to choose your service';
    }
    return this.store.footerButton()?.text || this.caption();
  });
}