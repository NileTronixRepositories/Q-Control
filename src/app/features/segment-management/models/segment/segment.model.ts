export type SegmentScope = 'Global' | 'BranchScoped';

export type SegmentGlobalizationRequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Segment {
  id: number;
  arabicName: string;
  englishName: string;
  priority: number;
  scope: SegmentScope;
  ownerBranchId: number | null;
  ownerBranchArabicName: string | null;
  ownerBranchEnglishName: string | null;
  isSystemDefault: boolean;
  rowVersion: string;
  createdOnUtc: string;
  modifiedOnUtc: string | null;
  message: string | null;
}

export interface SegmentDetails extends Segment {
  assignedLeafServicesCount: number;
  pendingGlobalizationRequestId: number | null;
}

export interface CreateGlobalSegmentRequest {
  arabicName: string;
  englishName: string;
  priority: number;
}

export interface CreateBranchSegmentRequest {
  arabicName: string;
  englishName: string;
  priority: number;
}

export interface CreateBranchSegmentResponse extends Segment {
  globalizationRequestId: number;
  globalizationRequestStatus: SegmentGlobalizationRequestStatus;
}

export interface UpdateSegmentRequest {
  arabicName: string;
  englishName: string;
  priority: number;
  rowVersion: string;
}

export interface SegmentQueryParameters {
  searchText?: string;
  scope?: SegmentScope;
  ownerBranchId?: number;
  priority?: number;
  pageNumber?: number;
  pageSize?: number;
  orderSort?: string;
}

export interface SegmentListPaginatedResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: Segment[];
}

export interface AssignedBranchServiceSegmentItem {
  branchServiceSegmentId: number;
  segmentId: number;
  arabicName: string;
  englishName: string;
  scope: SegmentScope;
  ownerBranchId: number | null;
  priority: number;
  quota: number;
  isSystemDefault: boolean;
  rowVersion: string;
}

export interface AssignedBranchServiceSegmentsResponse {
  branchId: number;
  leafServiceId: number;
  rangePrefix: string | null;
  rangeStartNumber: number;
  rangeEndNumber: number;
  capacity: number;
  allocatedNonDefaultQuota: number;
  remainingQuota: number;
  segments: AssignedBranchServiceSegmentItem[];
  message: string | null;
}

export interface AvailableSegmentItem {
  segmentId: number;
  arabicName: string;
  englishName: string;
  scope: SegmentScope;
  ownerBranchId: number | null;
  priority: number;
}

export interface AvailableSegmentsResponse {
  branchId: number;
  leafServiceId: number;
  remainingQuota: number;
  segments: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    data: AvailableSegmentItem[];
  };
}

export interface AssignSegmentItem {
  segmentId: number;
  quota: number;
}

export interface AssignServiceSegmentsRequest {
  items: AssignSegmentItem[];
}

export interface UpdateSegmentQuotaRequest {
  quota: number;
  rowVersion: string;
}

export interface SegmentGlobalizationRequest {
  id: number;
  requestId?: number;
  globalizationRequestId?: number;
  status: SegmentGlobalizationRequestStatus;
  branchId: number;
  branchArabicName: string;
  branchEnglishName: string;
  segmentId: number;
  segmentArabicName: string;
  segmentEnglishName: string;
  segmentScope: SegmentScope;
  segmentOwnerBranchId: number | null;
  segmentPriority: number;
  requestedByApplicationUserId: string;
  requestedByName: string;
  requestedOnUtc: string;
  reviewedByApplicationUserId: string | null;
  reviewedByName: string | null;
  reviewedOnUtc: string | null;
  rejectionReason: string | null;
  rowVersion: string;
  message: string | null;
}

export interface GlobalizationRequestQueryParameters {
  status?: SegmentGlobalizationRequestStatus;
  branchId?: number;
  searchText?: string;
  pageNumber?: number;
  pageSize?: number;
  orderSort?: string;
}

export interface GlobalizationRequestsPaginatedResponse {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  data: SegmentGlobalizationRequest[];
}

export interface RejectGlobalizationRequestPayload {
  rejectionReason?: string;
}

export type SegmentPermission =
  | 'Segments.ViewAll'
  | 'Segments.ViewDetails'
  | 'Segments.CreateGlobal'
  | 'Segments.CreateBranchScoped'
  | 'Segments.Update'
  | 'BranchServiceSegments.View'
  | 'BranchServiceSegments.ViewAvailable'
  | 'BranchServiceSegments.Assign'
  | 'BranchServiceSegments.UpdateQuota'
  | 'BranchServiceSegments.Unassign'
  | 'SegmentGlobalizationRequests.ViewAll'
  | 'SegmentGlobalizationRequests.ViewOwn'
  | 'SegmentGlobalizationRequests.ViewDetails'
  | 'SegmentGlobalizationRequests.Approve'
  | 'SegmentGlobalizationRequests.Reject';
