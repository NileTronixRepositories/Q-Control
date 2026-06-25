export interface TechnicalAdminNavigationItem {
  readonly label: string;
  readonly icon: string;
  readonly children: readonly TechnicalAdminNavigationChild[];
  expanded: boolean;
}

export interface TechnicalAdminNavigationChild {
  readonly label: string;
  readonly route: string;
}

export interface TechnicalAdminThemeConfiguration {
  readonly mainColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
  readonly advertisementImageNames: readonly string[];
}

export type ServiceRequestGeneralOption =
  | 'showLanguagePage'
  | 'defaultLanguageArabic'
  | 'alwaysRequireUserInput'
  | 'showServiceNavigationPath'
  | 'allowOperatorSelection'
  | 'allowRequestMoreServices';

export type ServiceRequestThemeColor =
  | 'backgroundColor'
  | 'headerColor'
  | 'footerColor'
  | 'mainTextColor';

export type ServiceRequestButtonGroup =
  | 'languageButtons'
  | 'serviceButtons'
  | 'keypadButtons'
  | 'footerButtons';

export interface ServiceRequestGeneralSettings {
  readonly showLanguagePage: boolean;
  readonly defaultLanguageArabic: boolean;
  readonly alwaysRequireUserInput: boolean;
  readonly showServiceNavigationPath: boolean;
  readonly allowOperatorSelection: boolean;
  readonly allowRequestMoreServices: boolean;
}

export interface ServiceRequestThemeSettings {
  readonly backgroundColor: string;
  readonly headerColor: string;
  readonly footerColor: string;
  readonly mainTextColor: string;
}

export interface ServiceRequestButtonSettings {
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly widthPercent: number;
  readonly heightPercent: number;
  readonly spacePercent?: number;
  readonly fontSizePercent?: number;
}

export interface ServiceRequestLayoutConfiguration {
  readonly general: ServiceRequestGeneralSettings;
  readonly theme: ServiceRequestThemeSettings;
  readonly buttons: Record<ServiceRequestButtonGroup, ServiceRequestButtonSettings>;
}

export interface LegacyTechnicalAdminPage {
  readonly title: string;
  readonly description: string;
  readonly path: string;
  readonly actionLabel: string;
}
