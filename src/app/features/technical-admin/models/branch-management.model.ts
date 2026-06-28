import { LifecycleMutationResponse, OperationalEntityState, OperationalStatusFilter, PermanentDeleteResponse } from './operational-lifecycle.model';

export type BranchOrderSort = 'Newest' | 'Oldest';

export interface BranchListQuery {
  readonly searchText: string;
  readonly orderSort: BranchOrderSort;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly isActive: OperationalStatusFilter;
}

export interface BranchAuditUser {
  readonly applicationUserId: string;
  readonly userName: string;
  readonly nameEn: string | null;
  readonly nameAr: string | null;
}

export interface BranchListItem extends OperationalEntityState {
  readonly branchId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly ipAddress: string;
  readonly governorate: string | null;
  readonly city: string | null;
  readonly createdBy: BranchAuditUser | null;
  readonly createdOnUtc: string | null;
  readonly lastModifiedBy: BranchAuditUser | null;
  readonly modifiedOnUtc: string | null;
}

export interface PagedBranchResponse<TItem> {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly data: readonly TItem[];
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

export interface BranchLocation {
  readonly id?: number;
  readonly governorate: string;
  readonly city: string;
  readonly area: string;
  readonly address: string;
  readonly longitude: number;
  readonly latitude: number;
}

export interface BranchDetails extends BranchListItem {
  readonly license: string | null;
  readonly location: BranchLocation | null;
  readonly createdOnUtc: string | null;
  readonly lastModifiedBy: BranchAuditUser | null;
  readonly modifiedOnUtc: string | null;
}

export interface CreateBranchRequest {
  readonly arabicName: string;
  readonly englishName: string;
  readonly ipAddress: string;
  readonly license: string | null;
  readonly location: Omit<BranchLocation, 'id'>;
}

export interface UpdateBranchRequest extends CreateBranchRequest {
  readonly rowVersion: string;
}

export interface BranchMutationResponse extends OperationalEntityState {
  readonly branchId: number;
  readonly arabicName: string | null;
  readonly englishName: string | null;
  readonly ipAddress: string;
  readonly license?: string | null;
  readonly location?: BranchLocation | null;
  readonly createdByApplicationUserId?: string;
  readonly createdOnUtc?: string | null;
  readonly lastModifiedByApplicationUserId?: string;
  readonly modifiedOnUtc?: string | null;
  readonly message?: string;
}

export type BranchLifecycleResponse = LifecycleMutationResponse;
export type BranchPermanentDeleteResponse = PermanentDeleteResponse;

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