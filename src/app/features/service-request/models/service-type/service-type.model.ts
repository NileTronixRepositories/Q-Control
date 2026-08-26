import { ServiceCustomInput } from '../../../service-management/models/service-management/service-management.model';
import { LocalizedText } from '../language/language.model';

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
  readonly isTicketIssuable?: boolean;
  readonly isClientInputRequired?: boolean;
  readonly customInputs?: readonly ServiceCustomInput[];
}
