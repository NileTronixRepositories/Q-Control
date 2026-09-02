import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { ServiceRequestTranslations } from '../../models/language/language.model';
import { QueueTicket } from '../../models/ticket/ticket.model';

@Component({
  selector: 'app-service-request-ticket-preview',
  templateUrl: './ticket-preview.component.html',
  styleUrl: './ticket-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketPreviewComponent {
  readonly ticket = input.required<QueueTicket>();
  readonly language = input.required<AppLanguage>();
  readonly translations = input.required<ServiceRequestTranslations>();
  readonly branchLogoUrl = input<string | null>(null);
  readonly allowRequestMoreServices = input<boolean>(false);
  readonly requestMoreServices = output<void>();

  protected readonly logoLoadFailed = signal<boolean>(false);
  readonly niletronixUrl = 'https://www.niletronix.com/';

  protected readonly serviceType = computed(() => this.ticket().serviceTypeName[this.language()]);
  protected readonly department = computed(
    () => this.ticket().departmentName?.[this.language()] ?? null,
  );
  protected readonly subSpecialty = computed(
    () => this.ticket().subSpecialtyName?.[this.language()] ?? null,
  );
  protected readonly counterHint = computed(() => this.ticket().counterHint[this.language()]);
  protected readonly issuedAt = computed(() => this.formatIssuedAt());

  private formatIssuedAt(): string {
    const issuedAt = new Date(this.ticket().issuedAtIso);

    if (Number.isNaN(issuedAt.getTime())) {
      return this.ticket().issuedAtIso;
    }

    return new Intl.DateTimeFormat(this.language(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(issuedAt);
  }

  protected printTicket(): void {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}
