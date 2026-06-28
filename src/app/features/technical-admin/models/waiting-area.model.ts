import { LifecycleMutationResponse, OperationalEntityState, OperationalStatusFilter, PermanentDeleteResponse } from './operational-lifecycle.model';

export interface WaitingAreaListQuery {
  readonly branchId: number | null;
  readonly search: string;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly isActive: OperationalStatusFilter;
}

export interface WaitingAreaListItem extends OperationalEntityState {
  readonly id: number;
  readonly branchId: number;
  readonly branchArabicName?: string | null;
  readonly branchEnglishName?: string | null;
  readonly number: number;
  readonly descriptiveName?: string | null;
  readonly audioDevice?: string | null;
  readonly controlDevice?: string | null;
  readonly windowsCount: number;
}

export interface WaitingAreaDetails extends WaitingAreaListItem {}

export interface CreateWaitingAreaRequest {
  readonly branchId: number;
  readonly number: number;
  readonly audioDevice?: string | null;
  readonly controlDevice?: string | null;
  readonly descriptiveName?: string | null;
}

export interface UpdateWaitingAreaRequest {
  readonly number: number;
  readonly audioDevice?: string | null;
  readonly controlDevice?: string | null;
  readonly descriptiveName?: string | null;
  readonly rowVersion: string;
}

export interface WaitingAreaMutationResponse extends OperationalEntityState {
  readonly id: number;
  readonly branchId?: number;
  readonly number?: number;
  readonly audioDevice?: string | null;
  readonly controlDevice?: string | null;
  readonly descriptiveName?: string | null;
  readonly message: string;
}

export type WaitingAreaLifecycleResponse = LifecycleMutationResponse;
export type WaitingAreaPermanentDeleteResponse = PermanentDeleteResponse;

export interface Pagination<TItem> {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly data: readonly TItem[];
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
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

export interface ApiError {
  readonly code: string;
  readonly message: string;
  readonly type: string;
  readonly retryAfter?: number | null;
}