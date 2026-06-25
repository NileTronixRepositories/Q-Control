import { computed, Injectable, signal } from '@angular/core';

import {
  AudioAnnouncementConfiguration,
  GlobalConfiguration,
  TicketCallingConfiguration,
  TicketStatus
} from '../models/organization.model';

@Injectable()
export class OrganizationStore {
  private readonly globalConfigurationSignal = signal<GlobalConfiguration>({
    organizationName: 'Hayah Clinic',
    logoUrl: '/images/nile.png',
    timezone: 'Africa/Cairo',
    defaultLanguage: 'Arabic'
  });

  private readonly ticketCallingConfigurationSignal = signal<TicketCallingConfiguration>({
    noShowSeconds: 0,
    ticketLookupCount: 0,
    queueName: 'Main Queue',
    priorityCallingEnabled: true
  });

  private readonly audioAnnouncementConfigurationSignal =
    signal<AudioAnnouncementConfiguration>({
      voiceLanguage: 'Arabic',
      startingTone: 'Tone 1',
      customerType: 'Ticket',
      appendNumberWord: true
    });

  private readonly ticketStatusesSignal = signal<readonly TicketStatus[]>([]);
  private readonly savedSectionSignal = signal<string>('');

  readonly globalConfiguration = this.globalConfigurationSignal.asReadonly();
  readonly ticketCallingConfiguration = this.ticketCallingConfigurationSignal.asReadonly();
  readonly audioAnnouncementConfiguration =
    this.audioAnnouncementConfigurationSignal.asReadonly();
  readonly ticketStatuses = this.ticketStatusesSignal.asReadonly();
  readonly savedSection = this.savedSectionSignal.asReadonly();
  readonly hasTicketStatuses = computed(() => this.ticketStatusesSignal().length > 0);

  updateGlobalConfiguration(configuration: Partial<GlobalConfiguration>): void {
    this.globalConfigurationSignal.update((current) => ({
      ...current,
      ...configuration
    }));
  }

  updateTicketCallingConfiguration(
    configuration: Partial<TicketCallingConfiguration>
  ): void {
    this.ticketCallingConfigurationSignal.update((current) => ({
      ...current,
      ...configuration
    }));
  }

  updateAudioAnnouncementConfiguration(
    configuration: Partial<AudioAnnouncementConfiguration>
  ): void {
    this.audioAnnouncementConfigurationSignal.update((current) => ({
      ...current,
      ...configuration
    }));
  }

  addTicketStatus(
    name = 'New Status',
    description = 'Describe when this ticket status should be used.'
  ): void {
    this.ticketStatusesSignal.update((statuses) => [
      ...statuses,
      {
        id: this.createNextTicketStatusId(statuses),
        name: 'New Status',
        description: 'Describe when this ticket status should be used.',
        color: '#14b8a6',
        active: true
      }
    ]);
  }

  updateTicketStatus(statusId: number, changes: Partial<TicketStatus>): void {
    this.ticketStatusesSignal.update((statuses) =>
      statuses.map((status) =>
        status.id === statusId
          ? {
              ...status,
              ...changes
            }
          : status
      )
    );
  }

  markSectionSaved(sectionName: string): void {
    this.savedSectionSignal.set(sectionName);
  }

  private createNextTicketStatusId(statuses: readonly TicketStatus[]): number {
    const lastId = statuses.reduce((maxId, status) => Math.max(maxId, status.id), 0);
    return lastId + 1;
  }
}

