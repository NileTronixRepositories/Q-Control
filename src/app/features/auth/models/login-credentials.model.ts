export interface LoginCredentials {
  readonly username: string;
  readonly password: string;
  readonly rememberSession: boolean;
}

export type AuthenticatedUserType = 'TechnicalAdmin' | 'OrganizationAdmin';

export interface AuthenticatedSession {
  readonly token: string;
  readonly userType: AuthenticatedUserType;
  readonly requiresBranchSelection: boolean;
  readonly activeBranchId: string | null;
}

export interface LoginSubmissionResult {
  readonly accepted: boolean;
  readonly message: string;
  readonly session?: AuthenticatedSession;
}
