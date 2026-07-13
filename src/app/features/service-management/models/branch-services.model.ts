import { ServiceScope, ServiceTreeNode } from './service-management.model';
import { ServiceGlobalizationRequestSummary } from './service-globalization.model';

export interface BranchServicesTreeQuery {
  readonly includeInactive: boolean;
  readonly includeDeleted: boolean;
}

export interface AssignBranchServicesRequest {
  readonly serviceIds: readonly number[];
}

export interface AssignBranchServicesResponse {
  readonly branchId: number;
  readonly requestedLeafServiceIds: readonly number[];
  readonly assignedServiceIds: readonly number[];
  readonly createdAssignmentsCount: number;
  readonly existingAssignmentsCount: number;
  readonly message: string;
}

export interface UnassignBranchLeafServiceResponse {
  readonly branchId: number;
  readonly leafServiceId: number;
  readonly unassignedServiceIds: readonly number[];
  readonly removedAssignmentsCount: number;
}

export interface CreateBranchServiceTreeRequest {
  readonly root: CreateBranchServiceTreeNodeRequest;
}

export interface CreateBranchServiceTreeNodeRequest {
  readonly arabicName: string;
  readonly englishName: string;
  readonly arabicUserMessage: string | null;
  readonly englishUserMessage: string | null;
  readonly isTicketIssuable: boolean | null;
  readonly isClientInputRequired: boolean;
  readonly hasReservation: boolean;
  readonly orderNo: number;
  readonly priority: number;
  readonly rangePrefix: string | null;
  readonly rangeStartNumber: number | null;
  readonly rangeEndNumber: number | null;
  readonly waitingDuration: number | null;
  readonly noOfTicketCopies: number | null;
  readonly children: readonly CreateBranchServiceTreeNodeRequest[];
}

export interface CreatedBranchServiceTreeNode {
  readonly id: number;
  readonly parentServiceId: number | null;
  readonly arabicName: string;
  readonly englishName: string;
  readonly scope: Extract<ServiceScope, 'BranchScoped'>;
  readonly ownerBranchId: number;
  readonly isTicketIssuable: boolean;
  readonly children: readonly CreatedBranchServiceTreeNode[];
}

interface CreateBranchServiceTreeResponseBase {
  readonly branchId: number;
  readonly scope: Extract<ServiceScope, 'BranchScoped'>;
  readonly ownerBranchId: number;
  readonly createdServicesCount: number;
  readonly createdAssignmentsCount: number;
  readonly root: CreatedBranchServiceTreeNode;
  readonly message: string;
}

export interface CreateBranchServiceTreeResponse extends CreateBranchServiceTreeResponseBase {
  readonly globalizationRequest: ServiceGlobalizationRequestSummary;
}

export interface CreateBranchServiceSubtreeResponse extends CreateBranchServiceTreeResponseBase {
  readonly parentServiceId: number;
  readonly globalizationRequest: ServiceGlobalizationRequestSummary | null;
}

export interface BranchServiceTreeDraftNode {
  readonly clientId: string;
  readonly arabicName: string;
  readonly englishName: string;
  readonly arabicUserMessage: string;
  readonly englishUserMessage: string;
  readonly isTicketIssuable: boolean;
  readonly isClientInputRequired: boolean;
  readonly hasReservation: boolean;
  readonly orderNo: number;
  readonly priority: number;
  readonly rangePrefix: string;
  readonly rangeStartNumber: number | null;
  readonly rangeEndNumber: number | null;
  readonly waitingDuration: number | null;
  readonly noOfTicketCopies: number | null;
  readonly children: readonly BranchServiceTreeDraftNode[];
}

export interface BranchServicesUiMessage {
  readonly tone: 'success' | 'error' | 'info';
  readonly text: string;
}

export interface BranchServiceUnassignConfirmState {
  readonly branchId: number;
  readonly leafServiceId: number;
  readonly serviceName: string;
}

export type BranchServiceLifecycleAction = 'delete' | 'restore';

export interface BranchServiceLifecycleConfirmState {
  readonly action: BranchServiceLifecycleAction;
  readonly branchId: number;
  readonly serviceId: number;
  readonly rowVersion: string;
  readonly serviceName: string;
  readonly hasChildren: boolean;
}

export type BranchServiceTreeNode = ServiceTreeNode;
