export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
  readonly rememberSession: boolean;
}

export type AuthenticatedUserType = 'TechnicalAdmin' | 'OrganizationAdmin' | 'BranchAdmin';

export interface AuthenticatedBranch {
  readonly branchId: number;
  readonly englishName: string;
  readonly arabicName: string;
  readonly isActive: boolean;
}

export interface AuthenticatedSession {
  readonly token: string;
  readonly userType: AuthenticatedUserType;
  readonly displayName?: string;
  readonly userName?: string;
  readonly email?: string;
  readonly requiresBranchSelection: boolean;
  readonly activeBranchId: number | null;
  readonly branches: readonly AuthenticatedBranch[];
  readonly firstLoginFlag: boolean;
  readonly passwordExpiredFlag: boolean;
  readonly passwordChangedOnUtc: string | null;
  readonly passwordExpiresOnUtc: string | null;
}

export interface LoginSubmissionResult {
  readonly accepted: boolean;
  readonly message: string;
  readonly session?: AuthenticatedSession;
  readonly errorCode?: string;
}

export interface ChangeInitialPasswordSubmissionResult extends LoginSubmissionResult {}
