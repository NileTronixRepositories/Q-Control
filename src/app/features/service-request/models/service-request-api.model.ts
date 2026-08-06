import { ServiceType } from './service-type.model';
import { Specialty } from './specialty.model';

export interface TicketIssuanceTheme {
  readonly mainColor: string | null;
  readonly secondaryColor: string | null;
  readonly backgroundColor: string | null;
  readonly headerColor: string | null;
  readonly footerColor: string | null;
  readonly mainTextColor: string | null;
}

export interface TicketIssuanceBehavior {
  readonly showLanguagePage: boolean;
  readonly defaultLanguageIsArabic: boolean;
  readonly alwaysRequireUserInput: boolean;
  readonly showServiceNavigationPath: boolean;
  readonly allowOperatorSelection: boolean;
  readonly allowRequestMoreServices: boolean;
}

export interface TicketIssuanceButton {
  readonly backgroundColor: string | null;
  readonly textColor: string | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly text: string | null;
}

export interface TicketIssuanceServiceButton extends TicketIssuanceButton {
  readonly space: number | null;
  readonly fontSize: number | null;
}

export interface TicketIssuanceBranding {
  readonly logoUrl: string | null;
  readonly theme: TicketIssuanceTheme;
  readonly behavior: TicketIssuanceBehavior;
  readonly languageButton: TicketIssuanceButton;
  readonly serviceButton: TicketIssuanceServiceButton;
  readonly keypadButton: TicketIssuanceButton;
  readonly footerButton: TicketIssuanceButton;
}

export interface BranchServiceNodeDto {
  readonly serviceId: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly arabicUserMessage: string | null;
  readonly englishUserMessage: string | null;
  readonly isTicketIssuable: boolean;
  readonly rangePrefix: string | null;
  readonly rangeStartNumber: number | null;
  readonly rangeEndNumber: number | null;
  readonly children: readonly BranchServiceNodeDto[];
}

export interface TicketIssuableServicesResponse {
  readonly branchId: number;
  readonly branchBranding: TicketIssuanceBranding | null;
  readonly services: readonly BranchServiceNodeDto[];
}

export interface MappedServiceRequestData {
  readonly branchId: number;
  readonly branchBranding: TicketIssuanceBranding | null;
  readonly logoUrl: string | null;
  readonly theme: TicketIssuanceTheme | null;
  readonly serviceTypes: readonly ServiceType[];
  readonly specialtiesMap: ReadonlyMap<string, readonly Specialty[]>;
}
