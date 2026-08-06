export interface BranchBrandingResponse {
  readonly branchId: number;
  readonly logoUrl: string | null;

  readonly mainColor: string | null;
  readonly secondaryColor: string | null;
  readonly backgroundColor: string | null;
  readonly headerColor: string | null;
  readonly footerColor: string | null;
  readonly mainTextColor: string | null;

  readonly showLanguagePage: boolean;
  readonly defaultLanguageIsArabic: boolean;
  readonly alwaysRequireUserInput: boolean;
  readonly showServiceNavigationPath: boolean;
  readonly allowOperatorSelection: boolean;
  readonly allowRequestMoreServices: boolean;

  readonly languageButtonBackgroundColor: string | null;
  readonly languageButtonTextColor: string | null;
  readonly languageButtonWidth: number | null;
  readonly languageButtonHeight: number | null;
  readonly languageButtonText: string | null;

  readonly serviceButtonBackgroundColor: string | null;
  readonly serviceButtonTextColor: string | null;
  readonly serviceButtonWidth: number | null;
  readonly serviceButtonHeight: number | null;
  readonly serviceButtonSpace: number | null;
  readonly serviceButtonFontSize: number | null;
  readonly serviceButtonText: string | null;

  readonly keypadButtonBackgroundColor: string | null;
  readonly keypadButtonTextColor: string | null;
  readonly keypadButtonWidth: number | null;
  readonly keypadButtonHeight: number | null;
  readonly keypadButtonText: string | null;

  readonly footerButtonBackgroundColor: string | null;
  readonly footerButtonTextColor: string | null;
  readonly footerButtonWidth: number | null;
  readonly footerButtonHeight: number | null;
  readonly footerButtonText: string | null;

  readonly isConfigured: boolean;
  readonly rowVersion: string | null;
  readonly message: string | null;
}

export type BranchBrandingManagementResponse = BranchBrandingResponse;

export interface UpdateBranchThemeRequest {
  readonly mainColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;

  readonly headerColor?: string | null;
  readonly footerColor?: string | null;
  readonly mainTextColor?: string | null;

  readonly showLanguagePage: boolean;
  readonly defaultLanguageIsArabic: boolean;
  readonly alwaysRequireUserInput: boolean;
  readonly showServiceNavigationPath: boolean;
  readonly allowOperatorSelection: boolean;
  readonly allowRequestMoreServices: boolean;

  readonly languageButtonBackgroundColor?: string | null;
  readonly languageButtonTextColor?: string | null;
  readonly languageButtonWidth?: number | null;
  readonly languageButtonHeight?: number | null;
  readonly languageButtonText?: string | null;

  readonly serviceButtonBackgroundColor?: string | null;
  readonly serviceButtonTextColor?: string | null;
  readonly serviceButtonWidth?: number | null;
  readonly serviceButtonHeight?: number | null;
  readonly serviceButtonSpace?: number | null;
  readonly serviceButtonFontSize?: number | null;
  readonly serviceButtonText?: string | null;

  readonly keypadButtonBackgroundColor?: string | null;
  readonly keypadButtonTextColor?: string | null;
  readonly keypadButtonWidth?: number | null;
  readonly keypadButtonHeight?: number | null;
  readonly keypadButtonText?: string | null;

  readonly footerButtonBackgroundColor?: string | null;
  readonly footerButtonTextColor?: string | null;
  readonly footerButtonWidth?: number | null;
  readonly footerButtonHeight?: number | null;
  readonly footerButtonText?: string | null;

  readonly rowVersion?: string | null;
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
