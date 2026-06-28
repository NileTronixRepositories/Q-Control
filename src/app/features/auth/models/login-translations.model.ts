import { AppDirection, AppLanguage } from '../../../shared/models/app-language.model';

export type LoginLanguage = AppLanguage;
export type LoginDirection = AppDirection;

export interface LoginTranslations {
  readonly clinicLogoAlt: string;
  readonly systemLogoAlt: string;
  readonly languageLabel: string;
  readonly arabicLanguage: string;
  readonly englishLanguage: string;
  readonly brandName: string;
  readonly brandSubtitle: string;
  readonly brandEyebrow: string;
  readonly brandHeading: string;
  readonly brandDescription: string;
  readonly loginEyebrow: string;
  readonly loginTitle: string;
  readonly loginDescription: string;
  readonly usernameLabel: string;
  readonly usernamePlaceholder: string;
  readonly usernameRequired: string;
  readonly passwordLabel: string;
  readonly passwordPlaceholder: string;
  readonly passwordRequired: string;
  readonly passwordMinLength: string;
  readonly showPasswordLabel: string;
  readonly hidePasswordLabel: string;
  readonly rememberSession: string;
  readonly technicalSupport: string;
  readonly loginReadyMessage: string;
  readonly requiredCredentialsMessage: string;
  readonly dismissNotificationLabel: string;
  readonly submittingButton: string;
  readonly submitButton: string;
}
