export type ServiceWorkflowPermission =
  | 'ServiceWorkflows.ViewAll'
  | 'ServiceWorkflows.ViewDetails'
  | 'ServiceWorkflows.Create'
  | 'ServiceWorkflows.Update'
  | 'ServiceWorkflows.SetDefault'
  | 'ServiceWorkflows.Deactivate'
  | 'ServiceWorkflows.Reactivate'
  | 'ServiceWorkflows.ViewCandidateServices'
  | 'ServiceWorkflows.ViewStartOptions';

export type WorkflowStartMode = 'NoWorkflow' | 'DefaultAvailable';
export type WorkflowBooleanFilter = boolean | null;
export type WorkflowOrderSort = 'Newest' | 'Oldest';

export interface ServiceWorkflowScope {
  readonly branchId: number;
  readonly leafServiceId: number;
  readonly branchName: string;
  readonly ownerServiceName: string;
}

export interface ServiceWorkflowListQuery {
  readonly searchText: string;
  readonly isActive: WorkflowBooleanFilter;
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly orderSort: WorkflowOrderSort;
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

export interface ServiceWorkflowStep {
  readonly serviceId: number;
  readonly stepOrder: number;
  readonly arabicName: string | null;
  readonly englishName: string | null;
  readonly parentServiceId: number | null;
  readonly parentArabicName: string | null;
  readonly parentEnglishName: string | null;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly effectiveIsActive: boolean;
  readonly isTicketIssuable: boolean;
  readonly isMatchedService: boolean;
}

export interface ServiceWorkflowListItem {
  readonly workflowId: number;
  readonly branchId: number;
  readonly leafServiceId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly isDefault: boolean;
  readonly startServiceId: number | null;
  readonly startServiceArabicName: string | null;
  readonly startServiceEnglishName: string | null;
  readonly stepsCount: number;
  readonly isActive: boolean;
  readonly steps: readonly ServiceWorkflowStep[];
  readonly rowVersion: string;
  readonly createdOnUtc: string | null;
  readonly modifiedOnUtc: string | null;
}

export interface ServiceWorkflowDetails extends ServiceWorkflowListItem {
  readonly ownerServiceArabicName: string | null;
  readonly ownerServiceEnglishName: string | null;
  readonly createdByApplicationUserId: string | null;
  readonly lastModifiedByApplicationUserId: string | null;
  readonly deactivatedByApplicationUserId: string | null;
  readonly deactivatedOnUtc: string | null;
  readonly reactivatedByApplicationUserId: string | null;
  readonly reactivatedOnUtc: string | null;
  readonly message: string | null;
}

export interface ServiceWorkflowMutationResponse {
  readonly workflowId: number;
  readonly branchId: number;
  readonly leafServiceId: number;
  readonly isDefault: boolean;
  readonly isActive: boolean;
  readonly rowVersion: string;
  readonly message: string | null;
}

export interface WorkflowCandidateService {
  readonly serviceId: number;
  readonly parentServiceId: number | null;
  readonly parentArabicName: string | null;
  readonly parentEnglishName: string | null;
  readonly arabicName: string;
  readonly englishName: string;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly effectiveIsActive: boolean;
  readonly isTicketIssuable: boolean;
}

export interface WorkflowCandidateQuery {
  readonly searchText: string;
  readonly parentServiceId: number | null;
  readonly pageNumber: number;
  readonly pageSize: number;
}

export interface WorkflowStartOptionItem {
  readonly workflowId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly isActive: boolean;
  readonly isDefault: boolean;
  readonly startServiceId: number | null;
  readonly stepsCount: number;
  readonly steps: readonly ServiceWorkflowStep[];
}

export interface WorkflowStartOptions {
  readonly serviceId: number;
  readonly branchId: number;
  readonly leafServiceId: number;
  readonly hasWorkflows: boolean;
  readonly defaultWorkflowId: number | null;
  readonly mode: WorkflowStartMode;
  readonly requiresWorkflowSelection: boolean;
  readonly autoApplyWorkflowId: number | null;
  readonly workflows: readonly WorkflowStartOptionItem[];
}

export type WorkflowPanelMode = 'closed' | 'view' | 'create' | 'edit';
export type WorkflowConfirmAction = 'set-default' | 'deactivate' | 'reactivate';

export interface WorkflowConfirmState {
  readonly action: WorkflowConfirmAction;
  readonly workflowId: number;
  readonly rowVersion: string;
  readonly workflowName: string;
}

export interface WorkflowBuilderStep {
  readonly uid: string;
  readonly service: WorkflowCandidateService;
}
