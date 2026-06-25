import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { OrganizationStore } from '../../store/organization.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';

@Component({
  selector: 'app-ticket-calling-management',
  templateUrl: './ticket-calling-management.component.html',
  styleUrl: './ticket-calling-management.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketCallingManagementComponent {
  private readonly organizationStore = inject(OrganizationStore);
  private readonly shellStore = inject(OrganizationShellStore);

  protected readonly configuration = this.organizationStore.ticketCallingConfiguration;
  protected readonly translations = this.shellStore.translations;
  protected readonly saved = computed(
    () => this.organizationStore.savedSection() === 'Ticket Calling Management'
  );

  protected updateNoShowSeconds(event: Event): void {
    this.organizationStore.updateTicketCallingConfiguration({
      noShowSeconds: this.readPositiveNumber(event)
    });
  }

  protected updateTicketLookupCount(event: Event): void {
    this.organizationStore.updateTicketCallingConfiguration({
      ticketLookupCount: this.readPositiveNumber(event)
    });
  }

  protected increaseNoShowSeconds(): void {
    this.organizationStore.updateTicketCallingConfiguration({
      noShowSeconds: this.configuration().noShowSeconds + 1
    });
  }

  protected decreaseNoShowSeconds(): void {
    this.organizationStore.updateTicketCallingConfiguration({
      noShowSeconds: Math.max(0, this.configuration().noShowSeconds - 1)
    });
  }

  protected increaseTicketLookupCount(): void {
    this.organizationStore.updateTicketCallingConfiguration({
      ticketLookupCount: this.configuration().ticketLookupCount + 1
    });
  }

  protected decreaseTicketLookupCount(): void {
    this.organizationStore.updateTicketCallingConfiguration({
      ticketLookupCount: Math.max(0, this.configuration().ticketLookupCount - 1)
    });
  }

  protected updateQueueName(event: Event): void {
    this.organizationStore.updateTicketCallingConfiguration({
      queueName: (event.target as HTMLInputElement).value
    });
  }

  protected updatePriorityCalling(event: Event): void {
    this.organizationStore.updateTicketCallingConfiguration({
      priorityCallingEnabled: (event.target as HTMLInputElement).checked
    });
  }

  protected save(): void {
    this.organizationStore.markSectionSaved('Ticket Calling Management');
  }

  private readPositiveNumber(event: Event): number {
    const value = Number((event.target as HTMLInputElement).value);
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }
}

