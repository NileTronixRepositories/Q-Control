export interface GetDisplaysParams {
  readonly branchId?: number;
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

export interface DisplayListItemResponse {
  readonly id: number;
  readonly branchId: number;
  readonly branchArabicName: string | null;
  readonly branchEnglishName: string | null;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
}

export interface DeletedDisplayListItemResponse extends DisplayListItemResponse {
  readonly deletedOnUtc: string | null;
  readonly restoredOnUtc: string | null;
}

export interface DisplayDetailsResponse extends DisplayListItemResponse {
  readonly createdOnUtc: string;
  readonly modifiedOnUtc: string | null;
}

export interface CreateDisplayRequest {
  readonly branchId: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
}

export interface CreateDisplayResponse {
  readonly id: number;
  readonly branchId: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
  readonly createdByApplicationUserId: string;
  readonly createdOnUtc: string;
  readonly message: string;
}

export interface UpdateDisplayRequest {
  readonly id: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
}

export interface UpdateDisplayResponse {
  readonly id: number;
  readonly branchId: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
  readonly lastModifiedByApplicationUserId: string | null;
  readonly modifiedOnUtc: string | null;
  readonly message: string;
}

export interface DeleteDisplayResponse {
  readonly id: number;
  readonly message: string;
}

export interface RestoreDisplayResponse {
  readonly id: number;
  readonly branchId: number;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
  readonly restoredOnUtc: string;
  readonly message: string;
}

export interface PermanentDeleteDisplayResponse {
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

export type DisplayPermission =
  | 'Displays.ViewAll'
  | 'Displays.ViewDetails'
  | 'Displays.Create'
  | 'Displays.Update'
  | 'Displays.Delete'
  | 'Displays.ViewDeleted'
  | 'Displays.Restore'
  | 'Displays.DeletePermanent';