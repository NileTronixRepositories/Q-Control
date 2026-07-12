export type ServicePermission =
  | 'Services.ViewAll'
  | 'Services.ViewDetails'
  | 'Services.Create'
  | 'Services.Update'
  | 'Services.Delete'
  | 'Services.Restore'
  | 'BranchServices.View'
  | 'BranchServices.Assign'
  | 'BranchServiceTrees.Create';

export type ServiceBooleanFilter = boolean | null;
export type ServiceScope = 'Global' | 'BranchScoped';

export interface ServiceListQuery {
  readonly pageNumber: number;
  readonly pageSize: number;
  readonly searchText: string;
  readonly isActive: ServiceBooleanFilter;
  readonly isDeleted: ServiceBooleanFilter;
  readonly isTicketIssuable: ServiceBooleanFilter;
  readonly parentServiceId: number | null;
  readonly scope: ServiceScope | null;
  readonly ownerBranchId: number | null;
  readonly isAssignedToCurrentBranch: ServiceBooleanFilter;
  readonly orderSort?: string;
}

export interface PagedServiceResponse<TItem> {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly data: readonly TItem[];
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

export interface ServiceListItem {
  readonly id: number;
  readonly parentServiceId: number | null;
  readonly scope: ServiceScope;
  readonly ownerBranchId: number | null;
  readonly ownerBranchArabicName: string | null;
  readonly ownerBranchEnglishName: string | null;
  readonly isOwnedByCurrentBranch: boolean;
  readonly isAssignedToCurrentBranch: boolean | null;
  readonly canEditDefinition: boolean;
  readonly arabicName: string;
  readonly englishName: string;
  readonly parentServiceNameAr?: string | null;
  readonly parentServiceNameEn?: string | null;
  readonly logoUrl: string | null;
  readonly isActive: boolean;
  readonly effectiveIsActive: boolean;
  readonly isTicketIssuable: boolean;
  readonly hasChildren: boolean;
  readonly canIssueTicket: boolean;
  readonly isDeleted: boolean;
  readonly orderNo: number;
  readonly priority: number;
  readonly weight: number;
  readonly rowVersion: string;
}

export interface ServiceDetails extends ServiceListItem {
  readonly parentServiceNameAr: string | null;
  readonly parentServiceNameEn: string | null;
  readonly arabicUserMessage: string | null;
  readonly englishUserMessage: string | null;
  readonly isClientInputRequired: boolean;
  readonly hasReservation: boolean;
  readonly rangePrefix: string;
  readonly rangeStartNumber: number;
  readonly rangeEndNumber: number;
  readonly waitingDuration: number;
  readonly noOfTicketCopies: number;
}

export interface ServiceTreeNode {
  readonly id: number;
  readonly parentServiceId: number | null;
  readonly scope: ServiceScope;
  readonly ownerBranchId: number | null;
  readonly ownerBranchArabicName: string | null;
  readonly ownerBranchEnglishName: string | null;
  readonly isOwnedByCurrentBranch: boolean;
  readonly isAssignedToCurrentBranch: boolean | null;
  readonly canEditDefinition: boolean;
  readonly arabicName: string;
  readonly englishName: string;
  readonly isActive: boolean;
  readonly effectiveIsActive: boolean;
  readonly isTicketIssuable: boolean;
  readonly hasChildren: boolean;
  readonly canIssueTicket: boolean;
  readonly isDeleted: boolean;
  readonly orderNo: number;
  readonly children: readonly ServiceTreeNode[];
}

export interface ServiceParentOption {
  readonly id: number;
  readonly parentServiceId: number | null;
  readonly scope?: ServiceScope;
  readonly ownerBranchId?: number | null;
  readonly ownerBranchArabicName?: string | null;
  readonly ownerBranchEnglishName?: string | null;
  readonly arabicName: string;
  readonly englishName: string;
  readonly effectiveIsActive: boolean;
}

export interface ServiceSelectionOptionsResponse {
  readonly parentServiceId: number | null;
  readonly items: readonly ServiceSelectionOption[];
}

export interface ServiceSelectionOption {
  readonly serviceId: number;
  readonly parentServiceId: number | null;
  readonly arabicName: string;
  readonly englishName: string;
  readonly arabicUserMessage?: string | null;
  readonly englishUserMessage?: string | null;
  readonly orderNo: number;
  readonly priority: number;
  readonly isActive: boolean;
  readonly effectiveIsActive: boolean;
  readonly isTicketIssuable: boolean;
  readonly hasChildren: boolean;
  readonly canIssueTicket: boolean;
  readonly hasReservation: boolean;
  readonly isClientInputRequired: boolean;
  readonly rangePrefix?: string | null;
  readonly rangeStartNumber?: number | null;
  readonly rangeEndNumber?: number | null;
  readonly waitingDuration?: number | null;
  readonly noOfTicketCopies?: number | null;
}

export interface ServiceTreeQuery {
  readonly includeInactive: boolean;
  readonly includeDeleted: boolean;
  readonly scope?: ServiceScope | null;
  readonly ownerBranchId?: number | null;
  readonly isAssignedToCurrentBranch?: ServiceBooleanFilter;
}

export interface ServiceParentQuery {
  readonly excludeServiceId?: number;
  readonly searchText?: string;
}

export interface ServiceMutationRequest {
  readonly parentServiceId: number | null;
  readonly arabicName: string;
  readonly englishName: string;
  readonly arabicUserMessage: string | null;
  readonly englishUserMessage: string | null;
  readonly isTicketIssuable: boolean;
  readonly isClientInputRequired: boolean;
  readonly hasReservation: boolean;
  readonly orderNo: number;
  readonly priority: number;
  readonly weight: number;
  readonly rangePrefix: string;
  readonly rangeStartNumber: number;
  readonly rangeEndNumber: number;
  readonly waitingDuration: number;
  readonly noOfTicketCopies: number;
}

export type CreateServiceRequest = ServiceMutationRequest;

export interface UpdateServiceRequest extends ServiceMutationRequest {
  readonly rowVersion: string;
}

export interface ServiceMutationResponse extends Partial<ServiceDetails> {
  readonly id: number;
  readonly rowVersion: string;
  readonly message?: string | null;
}

export interface ServiceLogoResponse {
  readonly id: number;
  readonly logoUrl: string | null;
  readonly rowVersion: string;
  readonly message: string;
}

export interface ServiceDeleteResponse {
  readonly id: number;
  readonly isDeleted: boolean;
  readonly isActive: boolean;
  readonly rowVersion: string;
  readonly message: string;
}

export interface ServiceRestoreResponse {
  readonly id: number;
  readonly isDeleted: boolean;
  readonly isActive: boolean;
  readonly effectiveIsActive: boolean;
  readonly canIssueTicket: boolean;
  readonly rowVersion: string;
  readonly message: string;
}

export type ServiceManagementTab = 'list' | 'tree';
export type ServicePanelMode = 'closed' | 'create' | 'edit' | 'view';
export type ServiceConfirmAction = 'delete' | 'restore' | 'removeLogo';
export type ServiceMessageTone = 'success' | 'error' | 'info';

export interface ServiceUiMessage {
  readonly tone: ServiceMessageTone;
  readonly text: string;
}

export interface ServiceConfirmState {
  readonly action: ServiceConfirmAction;
  readonly serviceId: number;
  readonly rowVersion: string;
  readonly serviceName: string;
  readonly hasChildren: boolean;
}

export interface FlatServiceTreeNode {
  readonly node: ServiceTreeNode;
  readonly depth: number;
}
