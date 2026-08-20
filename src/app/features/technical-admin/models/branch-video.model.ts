export type VideoProcessingStatus = 'Processing' | 'Ready' | 'Failed';

export interface BranchVideoResponse {
  readonly id: number;
  readonly branchId: number;
  readonly originalFileName: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly processingStatus: VideoProcessingStatus;
  readonly streamUrl: string | null;
  readonly rowVersion: string;
}

export type BranchVideo = BranchVideoResponse;

export interface BranchDisplayPlaylistVideo {
  readonly videoId: number;
  readonly displayOrder: number;
  readonly streamUrl: string;
}

export interface BranchDisplayPlaylistResponse {
  readonly branchId: number;
  readonly videos: readonly BranchDisplayPlaylistVideo[];
}

export interface ReorderBranchVideoItemRequest {
  readonly videoId: number;
  readonly displayOrder: number;
  readonly rowVersion: string;
}

export interface ReorderBranchVideosRequest {
  readonly items: readonly ReorderBranchVideoItemRequest[];
}

export interface BranchVideoStateResponse {
  readonly videoId: number;
  readonly branchId: number;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly processingStatus: VideoProcessingStatus;
  readonly rowVersion: string;
  readonly message: string;
}

export interface BranchVideoDeleteResponse {
  readonly videoId: number;
  readonly branchId: number;
  readonly message: string;
}
