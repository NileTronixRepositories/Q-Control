import { AppLanguage } from '../../../shared/models/app-language.model';
import { LocalizedText } from './language.model';
import { ServiceType } from './service-type.model';
import { Specialty } from './specialty.model';

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
  readonly qrPayload: string;
}
