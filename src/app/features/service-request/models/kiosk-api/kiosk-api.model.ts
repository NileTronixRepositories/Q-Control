import { PhysicalTicketPrintModel } from '@shared/models/ticket-print/ticket-print.model';

export interface KioskCustomInputValue {
  readonly serviceCustomInputId: number;
  readonly value: string;
}

export interface CreateKioskTicketRequest {
  readonly serviceId: number;
  readonly segmentId?: number | null;
  readonly field?: string | null;
  readonly customInputs?: readonly KioskCustomInputValue[];
}

export interface SearchKioskReservationRequest {
  readonly serviceId: number;
  readonly field?: string | null;
  readonly customInputs?: readonly KioskCustomInputValue[];
}

export interface KioskReservationSearchItemResponse {
  readonly reservationId: number;
  readonly serviceId: number;
  readonly serviceArabicName?: string | null;
  readonly serviceEnglishName?: string | null;
  readonly segmentId: number;
  readonly segmentArabicName?: string | null;
  readonly segmentEnglishName?: string | null;
  readonly scheduledOnUtc: string;
  readonly status: string;
  readonly field?: string | null;
}

export interface KioskTicketResponse {
  readonly id: number;
  readonly ticketNumber: string;
  readonly businessDate?: string;
  readonly status: string;
  readonly branchId: number;
  readonly serviceId: number;
  readonly serviceNameAr?: string | null;
  readonly serviceNameEn?: string | null;
  readonly segmentId: number;
  readonly segmentNameAr?: string | null;
  readonly segmentNameEn?: string | null;
  readonly currentQueueEnteredOnUtc?: string | null;
  readonly reservationId?: number | null;
  readonly field?: string | null;
  readonly waitingAheadCount?: number | null;
  readonly estimatedWaitMinutes?: number | null;
  readonly rowVersion?: string;
  readonly print?: PhysicalTicketPrintModel | null;
}
