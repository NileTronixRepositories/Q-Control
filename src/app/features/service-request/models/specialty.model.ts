import { LocalizedText } from './language.model';
import { ServiceRequestCardTone } from './service-type.model';

export interface Specialty {
  readonly id: string;
  readonly code: string;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly icon: string;
  readonly tone: ServiceRequestCardTone;
  readonly estimatedWaitingMinutes: number;
  readonly subSpecialties: readonly Specialty[];
  readonly ticketPrefix?: string;
  readonly isTicketIssuable?: boolean;
}
