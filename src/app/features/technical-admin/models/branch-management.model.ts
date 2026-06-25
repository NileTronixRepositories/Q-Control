export type BranchOrderSort = 'Newest' | 'Oldest';

export interface BranchListQuery {
  readonly searchText: string;
  readonly orderSort: BranchOrderSort;
  readonly pageNumber: number;
  readonly pageSize: number;
}

export interface BranchAuditUser {
  readonly applicationUserId: string;
  readonly userName: string;
  readonly nameEn: string | null;
  readonly nameAr: string | null;
}

export interface BranchListItem {
  readonly branchId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly ipAddress: string;
  readonly isUpdatesAvailable: boolean;
  readonly lastUpdated: string | null;
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
  readonly governorate: string | null;
  readonly city: string | null;
  readonly area: string | null;
  readonly address: string | null;
  readonly longitude: string | null;
  readonly latitude: string | null;
}

export interface BranchDetails extends BranchListItem {
  readonly license: string | null;
  readonly location: BranchLocation | null;
  readonly createdOnUtc: string | null;
  readonly lastModifiedBy: BranchAuditUser | null;
  readonly modifiedOnUtc: string | null;
}

export interface BranchMutationRequest {
  readonly arabicName: string | null;
  readonly englishName: string | null;
  readonly ipAddress: string;
  readonly license: string | null;
  readonly location: Omit<BranchLocation, 'id'> | null;
}

export interface BranchMutationResponse {
  readonly branchId: number;
  readonly arabicName: string | null;
  readonly englishName: string | null;
  readonly ipAddress: string;
  readonly isUpdatesAvailable: boolean;
  readonly lastUpdated: string | null;
  readonly license?: string | null;
  readonly location?: BranchLocation | null;
  readonly createdByApplicationUserId?: string;
  readonly createdOnUtc?: string | null;
  readonly lastModifiedByApplicationUserId?: string;
  readonly modifiedOnUtc?: string | null;
}

export interface BranchDeleteResponse {
  readonly branchId: number;
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
