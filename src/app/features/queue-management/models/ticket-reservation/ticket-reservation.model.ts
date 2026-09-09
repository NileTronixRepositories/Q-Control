import { TicketPrintModel } from '../ticket-template/ticket-template.model';

export type TicketStatus =
  | 'Waiting'
  | 'Called'
  | 'InProgress'
  | 'NoShow'
  | 'Completed'
  | 'Cancelled';
export type ReservationStatus = 'Active' | 'NoShow' | 'Cancelled' | 'Expired' | 'ConvertedToTicket';

export interface Page<T> {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly totalPages?: number;
  readonly hasPreviousPage?: boolean;
  readonly hasNextPage?: boolean;
  readonly data: readonly T[];
}

export interface CustomInputValue {
  readonly serviceCustomInputId: number;
  readonly name?: string;
  readonly labelEn?: string;
  readonly labelAr?: string;
  readonly type?: string;
  readonly value: string;
}

export interface Journey {
  readonly serviceId: number;
  readonly entryType?: string;
  readonly workflowStepOrder?: number | null;
  readonly enteredWaitingOnUtc?: string | null;
  readonly serviceStartedOnUtc?: string | null;
  readonly serviceEndedOnUtc?: string | null;
  readonly outcome?: string | null;
}

export interface HistoryEvent {
  readonly id: number;
  readonly eventType: string;
  readonly fromStatus?: string | null;
  readonly toStatus?: string | null;
  readonly serviceId?: number | null;
  readonly fromServiceId?: number | null;
  readonly toServiceId?: number | null;
  readonly windowId?: number | null;
  readonly performerApplicationUserId?: string | null;
  readonly reason?: string | null;
  readonly occurredOnUtc: string;
}

export interface TicketListItem {
  readonly id: number;
  readonly ticketNumber: string;
  readonly businessDate: string;
  readonly status: TicketStatus;
  readonly issuingServiceId: number;
  readonly currentServiceId: number;
  readonly segmentId: number;
  readonly currentQueueEnteredOnUtc: string | null;
}

export interface TicketDetails extends TicketListItem {
  readonly branchId: number;
  readonly reservationId: number | null;
  readonly currentWindowId: number | null;
  readonly currentServiceStartedOnUtc: string | null;
  readonly completedOnUtc: string | null;
  readonly cancelledOnUtc: string | null;
  readonly cancellationReason: string | null;
  readonly boundWorkflowId: number | null;
  readonly currentWorkflowStepOrder: number | null;
  readonly customInputs: readonly CustomInputValue[];
  readonly journeys: readonly Journey[];
  readonly rowVersion: string;
  readonly isArchived: boolean;
  readonly history?: readonly HistoryEvent[] | null;
  readonly callAttempts?: readonly unknown[] | null;
  readonly print?: TicketPrintModel | null;
}

export interface ReservationListItem {
  readonly id: number;
  readonly scheduledOnUtc: string;
  readonly status: ReservationStatus;
  readonly serviceId: number;
  readonly segmentId: number;
}

export interface ReservationDetails extends ReservationListItem {
  readonly branchId: number;
  readonly businessDate?: string;
  readonly customInputs: readonly CustomInputValue[];
  readonly rowVersion: string;
  readonly isArchived: boolean;
  readonly createdOnUtc?: string;
  readonly cancelledOnUtc?: string | null;
  readonly cancellationReason?: string | null;
  readonly expiredOnUtc?: string | null;
  readonly convertedTicketId?: number | null;
  readonly history?: readonly HistoryEvent[] | null;
}

export interface CreateTicketRequest {
  readonly serviceId: number;
  readonly segmentId: number;
  readonly field?: string | null;
  readonly customInputs: readonly { serviceCustomInputId: number; value: string }[];
}

export interface CreateReservationRequest extends CreateTicketRequest {
  readonly scheduledOnUtc: string;
}

export interface CancelRequest {
  readonly reason: string;
}
export interface ManualTransferRequest {
  readonly targetServiceId: number;
  readonly reason: string;
}

export interface TicketQuery {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: TicketStatus | '';
  readonly serviceId?: number | null;
  readonly segmentId?: number | null;
  readonly ticketNumber?: string;
  readonly businessDate?: string;
}

export interface ReservationQuery {
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly status?: ReservationStatus | '';
  readonly serviceId?: number | null;
  readonly segmentId?: number | null;
  readonly businessDate?: string;
}
