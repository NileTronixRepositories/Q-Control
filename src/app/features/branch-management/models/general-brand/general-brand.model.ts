export interface GeneralBrandResponse {
  readonly id: number | null;

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

export interface CreateGeneralBrandRequest {
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
}

export interface UpdateGeneralBrandRequest extends CreateGeneralBrandRequest {
  readonly rowVersion?: string | null;
}

export type GeneralBrandPermission =
  | 'GeneralBrand.View'
  | 'GeneralBrand.Create'
  | 'GeneralBrand.Update';
