export interface GetTerminalsParams {
  readonly windowId?: number;
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

export interface TerminalListItemResponse {
  readonly id: number;
  readonly windowId: number;
  readonly windowNumber: string;
  readonly waitingAreaId: number;
  readonly waitingAreaNumber: number;
  readonly branchId: number;
  readonly branchArabicName: string | null;
  readonly branchEnglishName: string | null;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
}

export interface DeletedTerminalListItemResponse extends TerminalListItemResponse {
  readonly deletedOnUtc: string | null;
}

export interface TerminalDetailsResponse extends TerminalListItemResponse {
  readonly createdOnUtc: string;
  readonly modifiedOnUtc: string | null;
}

export interface CreateTerminalRequest {
  readonly windowId: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
}

export interface CreateTerminalResponse {
  readonly id: number;
  readonly windowId: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
  readonly createdByApplicationUserId: string;
  readonly createdOnUtc: string;
  readonly message: string;
}

export interface UpdateTerminalRequest {
  readonly id: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
}

export interface UpdateTerminalResponse {
  readonly id: number;
  readonly windowId: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
  readonly lastModifiedByApplicationUserId: string;
  readonly modifiedOnUtc: string;
  readonly message: string;
}

export interface DeleteTerminalResponse {
  readonly id: number;
  readonly message: string;
}

export interface RestoreTerminalResponse {
  readonly id: number;
  readonly message: string;
}

export interface PermanentDeleteTerminalResponse {
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

export type TerminalPermission =
  | 'Terminals.ViewAll'
  | 'Terminals.ViewDetails'
  | 'Terminals.Create'
  | 'Terminals.Update'
  | 'Terminals.Delete'
  | 'Terminals.ViewDeleted'
  | 'Terminals.Restore'
  | 'Terminals.DeletePermanent';
