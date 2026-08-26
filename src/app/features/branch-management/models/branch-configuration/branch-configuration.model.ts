export interface BranchConfigurationResponse {
  readonly branchId: number;
  readonly allowedTime: string;
  readonly isConfigured: boolean;
  readonly rowVersion: string | null;
  readonly message: string | null;
}

export interface CreateBranchConfigurationRequest {
  readonly allowedTime: string;
}

export interface UpdateBranchConfigurationRequest {
  readonly allowedTime: string;
  readonly rowVersion: string;
}

export type BranchConfigurationPermission =
  | 'BranchConfigurations.View'
  | 'BranchConfigurations.Create'
  | 'BranchConfigurations.Update';
