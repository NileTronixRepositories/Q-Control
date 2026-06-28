import { LifecycleMutationResponse, OperationalEntityState, OperationalStatusFilter, PermanentDeleteResponse } from './operational-lifecycle.model';

export interface GetDisplaysParams {
  readonly branchId?: number;
  readonly search?: string;
  readonly pageNumber?: number;
  readonly pageSize?: number;
  readonly isActive?: OperationalStatusFilter;
}

export interface GetAvailableDisplayWindowsParams {
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

export interface DisplayListItemResponse extends OperationalEntityState {
  readonly id: number;
  readonly branchId: number;
  readonly branchArabicName: string | null;
  readonly branchEnglishName: string | null;
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
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

export interface CreateDisplayResponse extends OperationalEntityState {
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
  readonly number: string;
  readonly ipAddress: string;
  readonly serialNo: string;
  readonly type: string;
  readonly rowVersion: string;
}

export interface UpdateDisplayResponse extends OperationalEntityState {
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

export type DisplayLifecycleResponse = LifecycleMutationResponse;
export type PermanentDeleteDisplayResponse = PermanentDeleteResponse;

export interface DisplayWindowListItemResponse extends OperationalEntityState {
  readonly id: number;
  readonly windowId: number;
  readonly windowNumber: string;
  readonly waitingAreaId: number;
  readonly waitingAreaNumber: number;
  readonly descriptiveName?: string | null;
}

export interface AvailableDisplayWindowResponse extends OperationalEntityState {
  readonly id: number;
  readonly windowId?: number;
  readonly windowNumber: string;
  readonly waitingAreaId: number;
  readonly waitingAreaNumber: number;
  readonly descriptiveName?: string | null;
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

export type DisplayWindowPermission =
  | 'DisplayWindows.ViewLinked'
  | 'DisplayWindows.ViewAvailable'
  | 'DisplayWindows.Assign'
  | 'DisplayWindows.Unassign';

export type DisplayPermission =
  | 'Displays.ViewAll'
  | 'Displays.ViewDetails'
  | 'Displays.Create'
  | 'Displays.Update'
  | 'Displays.Deactivate'
  | 'Displays.Reactivate'
  | 'Displays.DeletePermanent'
  | DisplayWindowPermission;