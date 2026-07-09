import { LocalizedText } from './language.model';

export type ServiceRequestCardTone = 'blue' | 'cyan' | 'green' | 'orange' | 'red' | 'purple';

export interface ServiceType {
  readonly id: string;
  readonly code: string;
  readonly ticketPrefix: string;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly icon: string;
  readonly tone: ServiceRequestCardTone;
  readonly estimatedWaitingMinutes: number;
  readonly specialtyIds: readonly string[];
}
