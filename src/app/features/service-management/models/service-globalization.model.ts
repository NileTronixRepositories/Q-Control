import { ServiceScope } from './service-management.model';

export type ServiceGlobalizationPermission =
  | 'ServiceGlobalizationRequests.ViewAll'
  | 'ServiceGlobalizationRequests.ViewDetails'
  | 'ServiceGlobalizationRequests.ViewOwn'
  | 'ServiceGlobalizationRequests.Approve'
  | 'ServiceGlobalizationRequests.Reject';

export type ServiceGlobalizationRequestStatus = 'Pending' | 'Approved' | 'Rejected';
export type ServiceGlobalizationRequestType = 'BranchServiceTree' | 'LeafUnderGlobalParent';
export type ServiceGlobalizationOrderSort = 'Newest' | 'Oldest';

export interface ServiceGlobalizationRequestSummary {
  readonly requestId: number;
  readonly requestType: ServiceGlobalizationRequestType;
  readonly status: ServiceGlobalizationRequestStatus;
  readonly requestedOnUtc: string;
}

export interface ServiceGlobalizationRequestListItem {
  readonly requestId: number;
  readonly requestType: ServiceGlobalizationRequestType;
  readonly status: ServiceGlobalizationRequestStatus;
  readonly branchId: number;
  readonly branchArabicName: string;
  readonly branchEnglishName: string;
  readonly rootServiceId: number;
  readonly rootServiceArabicName: string;
  readonly rootServiceEnglishName: string;
  readonly parentServiceId: number | null;
  readonly parentServiceArabicName: string | null;
  readonly parentServiceEnglishName: string | null;
  readonly servicesCount: number;
  readonly requestedByApplicationUserId: string;
  readonly requestedOnUtc: string;
  readonly reviewedByApplicationUserId: string | null;
  readonly reviewedOnUtc: string | null;
  readonly rejectionReason: string | null;
  readonly rowVersion: string;
}

export interface PagedServiceGlobalizationRequestsResponse {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly data: readonly ServiceGlobalizationRequestListItem[];
}

export interface ServiceGlobalizationRequestQuery {
  readonly status: ServiceGlobalizationRequestStatus | null;
  readonly requestType: ServiceGlobalizationRequestType | null;
  readonly searchText: string;
  readonly orderSort: ServiceGlobalizationOrderSort;
  readonly pageNumber: number;
  readonly pageSize: number;
}

export interface TechnicalServiceGlobalizationRequestQuery
  extends ServiceGlobalizationRequestQuery {
  readonly branchId: number | null;
}

export interface ServiceGlobalizationParentService {
  readonly serviceId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly scope: ServiceScope;
  readonly ownerBranchId: number | null;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
}

export interface ServiceGlobalizationRequestServiceNode {
  readonly serviceId: number;
  readonly parentServiceId: number | null;
  readonly arabicName: string;
  readonly englishName: string;
  readonly scope: ServiceScope;
  readonly ownerBranchId: number | null;
  readonly isActive: boolean;
  readonly isDeleted: boolean;
  readonly children: readonly ServiceGlobalizationRequestServiceNode[];
}

export interface ServiceGlobalizationRequestDetails {
  readonly requestId: number;
  readonly requestType: ServiceGlobalizationRequestType;
  readonly status: ServiceGlobalizationRequestStatus;
  readonly branchId: number;
  readonly branchArabicName: string;
  readonly branchEnglishName: string;
  readonly rootServiceId: number;
  readonly requestedByApplicationUserId: string;
  readonly requestedOnUtc: string;
  readonly reviewedByApplicationUserId: string | null;
  readonly reviewedOnUtc: string | null;
  readonly rejectionReason: string | null;
  readonly parentService: ServiceGlobalizationParentService | null;
  readonly services: readonly ServiceGlobalizationRequestServiceNode[];
  readonly rowVersion: string;
}

export interface ApproveServiceGlobalizationRequestResponse {
  readonly requestId: number;
  readonly status: Extract<ServiceGlobalizationRequestStatus, 'Approved'>;
  readonly branchId: number;
  readonly promotedServiceIds: readonly number[];
  readonly reviewedByApplicationUserId: string;
  readonly reviewedOnUtc: string;
  readonly rowVersion: string;
  readonly message: string;
}

export interface RejectServiceGlobalizationRequestRequest {
  readonly rejectionReason: string | null;
}

export interface RejectServiceGlobalizationRequestResponse {
  readonly requestId: number;
  readonly status: Extract<ServiceGlobalizationRequestStatus, 'Rejected'>;
  readonly branchId: number;
  readonly rejectionReason: string | null;
  readonly reviewedByApplicationUserId: string;
  readonly reviewedOnUtc: string;
  readonly rowVersion: string;
  readonly message: string;
}

export type ServiceGlobalizationDecisionAction = 'approve' | 'reject';

export interface ServiceGlobalizationDecisionState {
  readonly action: ServiceGlobalizationDecisionAction;
  readonly requestId: number;
  readonly serviceName: string;
  readonly rowVersion: string;
}
