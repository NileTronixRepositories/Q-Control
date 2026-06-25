export interface GetWindowsParams {
  readonly waitingAreaId?: number;
  readonly search?: string;
  readonly pageNumber?: number;
  readonly pageSize?: number;
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

export interface WindowListItemResponse {
  readonly id: number;
  readonly waitingAreaId: number;
  readonly waitingAreaNumber: number;
  readonly waitingAreaDescriptiveName: string | null;
  readonly number: string;
  readonly descriptiveName: string | null;
  readonly ipAddress: string | null;
  readonly enableTicketBooking: boolean;
  readonly enableDirectCall: boolean;
}

export interface DeletedWindowListItemResponse extends WindowListItemResponse {
  readonly deletedOnUtc: string | null;
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

export interface CreateWindowResponse {
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
  readonly id: number;
  readonly number: string;
  readonly descriptiveName: string | null;
  readonly ipAddress: string | null;
  readonly enableTicketBooking: boolean;
  readonly enableDirectCall: boolean;
}

export interface UpdateWindowResponse {
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

export interface DeleteWindowResponse {
  readonly id: number;
  readonly message: string;
}

export interface PermanentDeleteWindowResponse {
  readonly id: number;
  readonly message: string;
}

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
  | 'Windows.Delete'
  | 'Windows.ViewDeleted'
  | 'Windows.DeletePermanent';
