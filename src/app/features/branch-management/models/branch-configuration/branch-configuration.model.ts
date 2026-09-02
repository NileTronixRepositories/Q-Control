export interface BranchConfigurationResponse {
  readonly branchId: number;
  readonly allowedTime: string;
  readonly maximumTicketCallAttempts?: number;
  readonly maxCallAttempts?: number;
  readonly ticketNoShowAutoCancellationMinutes?: number;
  readonly noShowAutoCancellationMinutes?: number;
  readonly noShowReturnStatus?: string;
  readonly ticketArchiveRetentionDays?: number;
  readonly ticketHistoricalUsageHours?: number;
  readonly isConfigured: boolean;
  readonly rowVersion: string | null;
  readonly message: string | null;
}

export interface CreateBranchConfigurationRequest {
  readonly allowedTime: string;
  readonly maximumTicketCallAttempts?: number;
  readonly maxCallAttempts?: number;
  readonly ticketNoShowAutoCancellationMinutes?: number;
  readonly noShowAutoCancellationMinutes?: number;
  readonly noShowReturnStatus?: string;
  readonly ticketArchiveRetentionDays?: number;
  readonly ticketHistoricalUsageHours?: number;
}

export interface UpdateBranchConfigurationRequest {
  readonly allowedTime: string;
  readonly maximumTicketCallAttempts?: number;
  readonly maxCallAttempts?: number;
  readonly ticketNoShowAutoCancellationMinutes?: number;
  readonly noShowAutoCancellationMinutes?: number;
  readonly noShowReturnStatus?: string;
  readonly ticketArchiveRetentionDays?: number;
  readonly ticketHistoricalUsageHours?: number;
  readonly rowVersion: string;
}

export type BranchConfigurationPermission =
  | 'BranchConfigurations.View'
  | 'BranchConfigurations.Create'
  | 'BranchConfigurations.Update';
