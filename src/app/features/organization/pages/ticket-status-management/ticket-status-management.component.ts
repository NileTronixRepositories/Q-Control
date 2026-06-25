import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { OrganizationStore } from '../../store/organization.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';

@Component({
  selector: 'app-ticket-status-management',
  templateUrl: './ticket-status-management.component.html',
  styleUrl: './ticket-status-management.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TicketStatusManagementComponent {
  private readonly organizationStore = inject(OrganizationStore);
  private readonly shellStore = inject(OrganizationShellStore);

  protected readonly translations = this.shellStore.translations;
  protected readonly statuses = this.organizationStore.ticketStatuses;
  protected readonly hasStatuses = this.organizationStore.hasTicketStatuses;
  protected readonly saved = computed(
    () => this.organizationStore.savedSection() === 'Ticket-Status Management'
  );

  protected addStatus(): void {
    const translations = this.translations();
    this.organizationStore.addTicketStatus(
      translations.defaultStatusName,
      translations.defaultStatusDescription
    );
  }

  protected updateStatusName(statusId: number, event: Event): void {
    this.organizationStore.updateTicketStatus(statusId, {
      name: this.readInputValue(event)
    });
  }

  protected updateStatusDescription(statusId: number, event: Event): void {
    this.organizationStore.updateTicketStatus(statusId, {
      description: this.readInputValue(event)
    });
  }

  protected updateStatusColor(statusId: number, event: Event): void {
    this.organizationStore.updateTicketStatus(statusId, {
      color: this.readInputValue(event)
    });
  }

  protected updateStatusActive(statusId: number, event: Event): void {
    this.organizationStore.updateTicketStatus(statusId, {
      active: (event.target as HTMLInputElement).checked
    });
  }

  protected save(): void {
    this.organizationStore.markSectionSaved('Ticket-Status Management');
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}



