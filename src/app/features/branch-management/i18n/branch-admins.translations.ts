import { AppLanguage } from '../../../shared/models/app-language/app-language.model';

export interface BranchAdminsTranslations {
  readonly addBranchAdmin: string;
  readonly createBranchAdminTitle: string;
  readonly branchAdminUserName: string;
  readonly branchAdminEmail: string;
  readonly branchAdminNameEn: string;
  readonly branchAdminNameAr: string;
  readonly branchAdminPhone: string;
  readonly branchAdminTemporaryPassword: string;
  readonly branchAdminConfirmTemporaryPassword: string;
  readonly branchAdminPasswordMismatch: string;
  readonly branchAdminCreated: string;
  readonly branchAdminHandoffNote: string;
  readonly invalidEmail: string;
  readonly requiredField: string;
  readonly passwordMinLength: string;
  readonly max30: string;
  readonly max100: string;
  readonly max120: string;
  readonly max200: string;
  readonly save: string;
  readonly cancel: string;
  readonly close: string;
  readonly fallbackError: string;
}

export const BRANCH_ADMINS_TRANSLATIONS: Record<AppLanguage, BranchAdminsTranslations> = {
  ar: {
    addBranchAdmin: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u0624\u0648\u0644 \u0641\u0631\u0639',
    createBranchAdminTitle: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u0624\u0648\u0644 \u0641\u0631\u0639',
    branchAdminUserName: '\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645',
    branchAdminEmail: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a',
    branchAdminNameEn: '\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629',
    branchAdminNameAr: '\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0639\u0631\u0628\u064a\u0629',
    branchAdminPhone: '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641',
    branchAdminTemporaryPassword: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0645\u0624\u0642\u062a\u0629',
    branchAdminConfirmTemporaryPassword: '\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631',
    branchAdminPasswordMismatch: '\u0643\u0644\u0645\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646.',
    branchAdminCreated: '\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0641\u0631\u0639 \u0628\u0646\u062c\u0627\u062d.',
    branchAdminHandoffNote: '\u0627\u0633\u062a\u062e\u062f\u0645 \u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u062f\u062e\u0648\u0644 \u0648\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u0645\u0624\u0642\u062a\u0629 \u0627\u0644\u062a\u064a \u0623\u062f\u062e\u0644\u062a\u0647\u0627 \u0644\u062a\u0633\u0644\u064a\u0645\u0647\u0627 \u0644\u0644\u0645\u0633\u062a\u062e\u062f\u0645.',
    invalidEmail: '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u063a\u064a\u0631 \u0635\u062d\u064a\u062d.',
    requiredField: '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.',
    passwordMinLength: '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064a\u062c\u0628 \u0623\u0644\u0627 \u062a\u0642\u0644 \u0639\u0646 6 \u0623\u062d\u0631\u0641.',
    max30: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 30 \u062d\u0631\u0641.',
    max100: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 100 \u062d\u0631\u0641.',
    max120: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 120 \u062d\u0631\u0641.',
    max200: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 200 \u062d\u0631\u0641.',
    save: '\u062d\u0641\u0638',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    close: '\u0625\u063a\u0644\u0627\u0642',
    fallbackError: '\u062a\u0639\u0630\u0631 \u0625\u0646\u0634\u0627\u0621 \u0645\u0633\u0624\u0648\u0644 \u0627\u0644\u0641\u0631\u0639.',
  },
  en: {
    addBranchAdmin: 'Add Branch Administrator',
    createBranchAdminTitle: 'Add Branch Administrator',
    branchAdminUserName: 'Username',
    branchAdminEmail: 'Email',
    branchAdminNameEn: 'English name',
    branchAdminNameAr: 'Arabic name',
    branchAdminPhone: 'Phone number',
    branchAdminTemporaryPassword: 'Temporary password',
    branchAdminConfirmTemporaryPassword: 'Confirm temporary password',
    branchAdminPasswordMismatch: 'Passwords do not match.',
    branchAdminCreated: 'Branch administrator was created successfully.',
    branchAdminHandoffNote: 'Use the login credentials and temporary password you entered to hand them over through the approved administrative channel.',
    invalidEmail: 'Email address is invalid.',
    requiredField: 'This field is required.',
    passwordMinLength: 'Password must be at least 6 characters.',
    max30: 'Maximum length is 30 characters.',
    max100: 'Maximum length is 100 characters.',
    max120: 'Maximum length is 120 characters.',
    max200: 'Maximum length is 200 characters.',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    fallbackError: 'Branch administrator could not be created.',
  },
};
