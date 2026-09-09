import { AppLanguage } from '../../../../core/i18n/app-language.model';
import { LocalizedText } from '../language/language.model';
import { ServiceType } from '../service-type/service-type.model';
import { Specialty } from '../specialty/specialty.model';
import { PhysicalTicketPrintModel } from '@shared/models/ticket-print/ticket-print.model';

export interface ServiceRequestSelection {
  readonly language: AppLanguage;
  readonly serviceType: ServiceType;
  readonly specialty: Specialty | null;
  readonly subSpecialty: Specialty | null;
}

export interface QueueTicket {
  readonly id: string;
  readonly ticketNumber: string;
  readonly serviceTypeName: LocalizedText;
  readonly departmentName: LocalizedText | null;
  readonly subSpecialtyName: LocalizedText | null;
  readonly issuedAtIso: string;
  readonly estimatedWaitingMinutes: number;
  readonly counterHint: LocalizedText;
  readonly qrPayload?: string;
  readonly print?: PhysicalTicketPrintModel | null;
}
