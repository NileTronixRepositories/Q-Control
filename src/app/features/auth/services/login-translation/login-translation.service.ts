import { Injectable } from '@angular/core';

import { LoginLanguage, LoginTranslations } from '../../models/login-translations/login-translations.model';

@Injectable({
  providedIn: 'root',
})
export class LoginTranslationService {
  private readonly translations: Record<LoginLanguage, LoginTranslations> = {
    ar: {
      clinicLogoAlt: '\u0634\u0639\u0627\u0631 \u0627\u0644\u0645\u0624\u0633\u0633\u0629',
      systemLogoAlt: '\u0634\u0639\u0627\u0631 \u0627\u0644\u0646\u0638\u0627\u0645',
      languageLabel: '\u0644\u063a\u0629 \u0627\u0644\u0648\u0627\u062c\u0647\u0629',
      arabicLanguage: '\u0639\u0631\u0628\u064a',
      englishLanguage: 'English',
      brandName: 'Q-Control',
      brandSubtitle: 'Hospital Central Management',
      brandEyebrow:
        '\u0646\u0638\u0627\u0645 \u0625\u062f\u0627\u0631\u0629 \u0645\u0631\u0643\u0632\u064a',
      brandHeading:
        '\u062a\u062d\u0643\u0645 \u0643\u0627\u0645\u0644 \u0641\u064a \u0631\u062d\u0644\u0629 \u0627\u0644\u0645\u0631\u064a\u0636 \u062f\u0627\u062e\u0644 \u0627\u0644\u0645\u0633\u062a\u0634\u0641\u0649.',
      brandDescription:
        '\u0645\u0646\u0635\u0629 \u0645\u0648\u062d\u062f\u0629 \u0644\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0627\u0644\u062e\u062f\u0645\u0627\u062a \u0648\u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645\u064a\u0646 \u0648\u0627\u0644\u0646\u062f\u0627\u0621 \u0648\u062d\u0627\u0644\u0629 \u0627\u0644\u062a\u0630\u0627\u0643\u0631.',
      loginEyebrow: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644',
      loginTitle:
        '\u0645\u0631\u062d\u0628\u0627 \u0628\u0643 \u0641\u064a \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
      loginDescription:
        '\u0623\u062f\u062e\u0644 \u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0644\u0644\u0645\u062a\u0627\u0628\u0639\u0629.',
      usernameLabel: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
      usernamePlaceholder: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
      usernameRequired:
        '\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0645\u0637\u0644\u0648\u0628.',
      passwordLabel: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
      passwordPlaceholder: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
      passwordRequired:
        '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0629.',
      passwordMinLength:
        '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064a\u062c\u0628 \u0623\u0644\u0627 \u062a\u0642\u0644 \u0639\u0646 6 \u0623\u062d\u0631\u0641.',
      showPasswordLabel:
        '\u0625\u0638\u0647\u0627\u0631 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
      hidePasswordLabel:
        '\u0625\u062e\u0641\u0627\u0621 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
      rememberSession: '\u062a\u0630\u0643\u0631 \u0627\u0644\u062c\u0644\u0633\u0629',
      technicalSupport: '\u0627\u0644\u062f\u0639\u0645 \u0627\u0644\u0641\u0646\u064a',
      loginReadyMessage:
        '\u062a\u0645 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0628\u0646\u062c\u0627\u062d.',
      requiredCredentialsMessage:
        '\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645 \u0623\u0648 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.',
      dismissNotificationLabel: '\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062a\u0646\u0628\u064a\u0647',
      submittingButton: '\u062c\u0627\u0631\u064a \u0627\u0644\u062f\u062e\u0648\u0644...',
      submitButton:
        '\u062f\u062e\u0648\u0644 \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645',
    },
    en: {
      clinicLogoAlt: 'Organization logo',
      systemLogoAlt: 'System logo',
      languageLabel: 'Interface language',
      arabicLanguage: 'Arabic',
      englishLanguage: 'English',
      brandName: 'Q-Control',
      brandSubtitle: 'Hospital Central Management',
      brandEyebrow: 'Central management system',
      brandHeading: 'Complete control over the patient journey inside the hospital.',
      brandDescription:
        'A unified platform for branches, services, users, calling, and ticket status management.',
      loginEyebrow: 'Sign in',
      loginTitle: 'Welcome to the control panel',
      loginDescription: 'Enter your username and password to continue.',
      usernameLabel: 'Username',
      usernamePlaceholder: 'Username',
      usernameRequired: 'Username is required.',
      passwordLabel: 'Password',
      passwordPlaceholder: 'Password',
      passwordRequired: 'Password is required.',
      passwordMinLength: 'Password must be at least 6 characters.',
      showPasswordLabel: 'Show password',
      hidePasswordLabel: 'Hide password',
      rememberSession: 'Remember session',
      technicalSupport: 'Technical support',
      loginReadyMessage: 'Signed in successfully.',
      requiredCredentialsMessage: 'Invalid username or password.',
      dismissNotificationLabel: 'Dismiss notification',
      submittingButton: 'Signing in...',
      submitButton: 'Sign in ',
    },
  };

  getTranslations(language: LoginLanguage): LoginTranslations {
    return this.translations[language];
  }
}
