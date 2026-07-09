export type ServiceWorkflowPermission =
  | 'ServiceWorkflows.ViewAll'
  | 'ServiceWorkflows.ViewDetails'
  | 'ServiceWorkflows.Create'
  | 'ServiceWorkflows.Update'
  | 'ServiceWorkflows.Deactivate'
  | 'ServiceWorkflows.Reactivate'
  | 'ServiceWorkflows.ViewCandidateServices'
  | 'ServiceWorkflows.ViewServiceWorkflows'
  | 'ServiceWorkflows.ViewStartOptions';

export type WorkflowStartMode = 'NoWorkflow' | 'AutoApply' | 'SelectionRequired';
export type WorkflowBooleanFilter = boolean | null;

export interface ServiceWorkflowListQuery {
  readonly searchText: string;
  readonly isActive: WorkflowBooleanFilter;
  readonly startServiceId: number | null;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly orderSort?: string;
}

export interface ServiceWorkflowStepMutation {
  readonly serviceId: number;
  readonly stepOrder: number;
}

export interface CreateServiceWorkflowRequest {
  readonly arabicName: string;
  readonly englishName: string;
  readonly steps: readonly ServiceWorkflowStepMutation[];
}

export interface UpdateServiceWorkflowRequest extends CreateServiceWorkflowRequest {
  readonly rowVersion: string;
}

export interface ServiceWorkflowMutationResponse {
  readonly id?: number;
  readonly workflowId?: number;
  readonly rowVersion: string;
  readonly message?: string | null;
}

export interface ServiceWorkflowStatusResponse extends ServiceWorkflowMutationResponse {
  readonly isActive: boolean;
}

export interface ServiceWorkflowListItem {
  readonly id?: number;
  readonly workflowId?: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly startServiceId?: number | null;
  readonly startServiceArabicName?: string | null;
  readonly startServiceEnglishName?: string | null;
  readonly stepsCount: number;
  readonly isActive: boolean;
  readonly createdOnUtc?: string | null;
  readonly modifiedOnUtc?: string | null;
  readonly rowVersion: string;
  readonly steps?: readonly ServiceWorkflowStep[];
}

export interface ServiceWorkflowStep {
  readonly serviceId: number;
  readonly stepOrder: number;
  readonly arabicName?: string | null;
  readonly englishName?: string | null;
  readonly serviceArabicName?: string | null;
  readonly serviceEnglishName?: string | null;
  readonly parentServiceId?: number | null;
  readonly parentServiceArabicName?: string | null;
  readonly parentServiceEnglishName?: string | null;
  readonly isActive?: boolean;
  readonly isDeleted?: boolean;
  readonly effectiveIsActive?: boolean;
  readonly isTicketIssuable?: boolean;
  readonly isMatchedService?: boolean;
}

export interface ServiceWorkflowDetails extends ServiceWorkflowListItem {
  readonly steps: readonly ServiceWorkflowStep[];
  readonly deactivatedOnUtc?: string | null;
  readonly reactivatedOnUtc?: string | null;
  readonly deactivatedBy?: string | null;
  readonly reactivatedBy?: string | null;
}

export interface WorkflowCandidateService {
  readonly serviceId?: number;
  readonly id?: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly parentServiceId?: number | null;
  readonly parentServiceArabicName?: string | null;
  readonly parentServiceEnglishName?: string | null;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly isTicketIssuable: boolean;
  readonly relatedWorkflows?: readonly WorkflowCandidateRelatedWorkflow[];
}

export interface WorkflowCandidateRelatedWorkflow {
  readonly workflowId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly isActive?: boolean;
  readonly stepsCount?: number;
}

export interface WorkflowCandidateQuery {
  readonly searchText: string;
  readonly parentServiceId: number | null;
  readonly includeInactive: boolean;
  readonly includeDeleted: boolean;
  readonly pageNumber: number;
  readonly pageSize: number;
}

export interface ServiceRelatedWorkflow extends ServiceWorkflowDetails {
  readonly containsServiceOccurrenceCount: number;
  readonly containsServiceStepOrders: readonly number[];
  readonly isStartService: boolean;
}

export interface WorkflowStartOptionItem {
  readonly workflowId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly isActive: boolean;
  readonly startServiceId?: number | null;
  readonly stepsCount: number;
  readonly steps: readonly ServiceWorkflowStep[];
}

export interface WorkflowStartOptions {
  readonly serviceId: number;
  readonly mode: WorkflowStartMode;
  readonly requiresWorkflowSelection: boolean;
  readonly autoApplyWorkflowId: number | null;
  readonly workflows: readonly WorkflowStartOptionItem[];
}

export type WorkflowPanelMode = 'closed' | 'view' | 'create' | 'edit';
export type WorkflowConfirmAction = 'deactivate' | 'reactivate';

export interface WorkflowConfirmState {
  readonly action: WorkflowConfirmAction;
  readonly workflowId: number;
  readonly rowVersion: string;
  readonly workflowName: string;
}

export interface WorkflowBuilderStep {
  readonly uid: string;
  readonly service: WorkflowCandidateService | null;
}


