export interface BranchBrandingResponse {
  readonly branchId: number;
  readonly logoUrl: string | null;
  readonly mainColor: string | null;
  readonly secondaryColor: string | null;
  readonly backgroundColor: string | null;
  readonly isConfigured: boolean;
  readonly rowVersion: string | null;
  readonly message: string | null;
}

export interface UpdateBranchThemeRequest {
  readonly mainColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
  readonly rowVersion: string | null;
}

export interface BranchAdvertisementResponse {
  readonly id: number;
  readonly branchId: number;
  readonly imageUrl: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly rowVersion: string;
}

export interface BranchAdvertisementStateResponse {
  readonly advertisementId: number;
  readonly branchId: number;
  readonly isActive: boolean;
  readonly displayOrder: number;
  readonly rowVersion: string;
  readonly message: string;
}

export interface BranchAdvertisementDeleteResponse {
  readonly advertisementId: number;
  readonly branchId: number;
  readonly message: string;
}

export interface ReorderBranchAdvertisementItemRequest {
  readonly advertisementId: number;
  readonly displayOrder: number;
  readonly rowVersion: string;
}

export interface ReorderBranchAdvertisementsRequest {
  readonly items: readonly ReorderBranchAdvertisementItemRequest[];
}

export type BranchBrandingPermission = 'Branches.ViewDetails' | 'Branches.Update' | 'BranchAdmins.Create';
