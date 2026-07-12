import { ServiceScope, ServiceTreeNode } from './service-management.model';

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

export interface CreateBranchServiceTreeResponse {
  readonly branchId: number;
  readonly scope: Extract<ServiceScope, 'BranchScoped'>;
  readonly ownerBranchId: number;
  readonly createdServicesCount: number;
  readonly createdAssignmentsCount: number;
  readonly root: CreatedBranchServiceTreeNode;
  readonly message: string;
}

export interface CreateBranchServiceSubtreeResponse extends CreateBranchServiceTreeResponse {
  readonly parentServiceId: number;
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

export type BranchServiceTreeNode = ServiceTreeNode;
