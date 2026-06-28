import { LifecycleMutationResponse, OperationalEntityState, OperationalStatusFilter, PermanentDeleteResponse } from './operational-lifecycle.model';

export interface GetWindowsParams {
  readonly waitingAreaId?: number;
  readonly search?: string;
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly isActive?: OperationalStatusFilter;
}

export interface PaginationResponse<TItem> {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly data: readonly TItem[];
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

export interface WindowListItemResponse extends OperationalEntityState {
  readonly id: number;
  readonly branchId: number;
  readonly waitingAreaId: number;
  readonly waitingAreaNumber: number;
  readonly waitingAreaDescriptiveName: string | null;
  readonly number: string;
  readonly descriptiveName: string | null;
  readonly ipAddress: string | null;
  readonly enableTicketBooking: boolean;
  readonly enableDirectCall: boolean;
}

export interface WindowDetailsResponse extends WindowListItemResponse {
  readonly createdOnUtc: string;
  readonly modifiedOnUtc: string | null;
}

export interface CreateWindowRequest {
  readonly waitingAreaId: number;
  readonly number: string;
  readonly descriptiveName: string | null;
  readonly ipAddress: string | null;
  readonly enableTicketBooking: boolean;
  readonly enableDirectCall: boolean;
}

export interface CreateWindowResponse extends OperationalEntityState {
  readonly id: number;
  readonly waitingAreaId: number;
  readonly number: string;
  readonly descriptiveName: string | null;
  readonly ipAddress: string | null;
  readonly enableTicketBooking: boolean;
  readonly enableDirectCall: boolean;
  readonly createdByApplicationUserId: string;
  readonly createdOnUtc: string;
  readonly message: string;
}

export interface UpdateWindowRequest {
  readonly number: string;
  readonly descriptiveName: string | null;
  readonly ipAddress: string | null;
  readonly enableTicketBooking: boolean;
  readonly enableDirectCall: boolean;
  readonly rowVersion: string;
}

export interface UpdateWindowResponse extends OperationalEntityState {
  readonly id: number;
  readonly waitingAreaId: number;
  readonly number: string;
  readonly descriptiveName: string | null;
  readonly ipAddress: string | null;
  readonly enableTicketBooking: boolean;
  readonly enableDirectCall: boolean;
  readonly lastModifiedByApplicationUserId: string;
  readonly modifiedOnUtc: string;
  readonly message: string;
}

export type WindowLifecycleResponse = LifecycleMutationResponse;
export type PermanentDeleteWindowResponse = PermanentDeleteResponse;

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly type: string;
  readonly retryAfter?: number | null;
}

export interface ApiProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly traceId?: string;
  readonly errors?: readonly ApiError[];
}

export type WindowPermission =
  | 'Windows.ViewAll'
  | 'Windows.ViewDetails'
  | 'Windows.Create'
  | 'Windows.Update'
  | 'Windows.Deactivate'
  | 'Windows.Reactivate'
  | 'Windows.DeletePermanent';