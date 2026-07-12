export interface CreateBranchAdminRequest {
  readonly userName: string;
  readonly email: string;
  readonly nameEn: string;
  readonly nameAr: string | null;
  readonly phoneNumber: string | null;
  readonly temporaryPassword: string;
}

export interface CreateBranchAdminResponse {
  readonly applicationUserId: string;
  readonly branchAdminId: string;
  readonly branchId: number;
  readonly userName: string;
  readonly email: string;
  readonly nameEn: string;
  readonly nameAr: string | null;
  readonly phoneNumber: string | null;
  readonly userType: 'BranchAdmin';
  readonly roleName: 'Branch Administrator';
  readonly isActive: boolean;
  readonly isFirstLogin: boolean;
  readonly createdByApplicationUserId: string;
  readonly createdOnUtc: string;
  readonly message: string;
}

export type CreateBranchAdminField =
  | 'userName'
  | 'email'
  | 'nameEn'
  | 'nameAr'
  | 'phoneNumber'
  | 'temporaryPassword'
  | 'confirmTemporaryPassword';

export interface BranchAdminApiError {
  readonly code?: string;
  readonly message?: string;
  readonly type?: string;
  readonly retryAfter?: number | null;
}

export interface BranchAdminApiProblemDetails {
  readonly type?: string;
  readonly title?: string;
  readonly status?: number;
  readonly detail?: string;
  readonly instance?: string;
  readonly traceId?: string;
  readonly errors?: readonly BranchAdminApiError[];
}
