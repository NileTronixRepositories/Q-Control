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
  readonly showPassword: string;
  readonly hidePassword: string;
}

export const BRANCH_ADMINS_TRANSLATIONS: Record<AppLanguage, BranchAdminsTranslations> = {
  ar: {
    addBranchAdmin: 'إضافة مسؤول فرع',
    createBranchAdminTitle: 'إضافة مسؤول فرع',
    branchAdminUserName: 'اسم المستخدم',
    branchAdminEmail: 'البريد الإلكتروني',
    branchAdminNameEn: 'الاسم بالإنجليزية',
    branchAdminNameAr: 'الاسم بالعربية',
    branchAdminPhone: 'رقم الهاتف',
    branchAdminTemporaryPassword: 'كلمة المرور المؤقتة',
    branchAdminConfirmTemporaryPassword: 'تأكيد كلمة المرور',
    branchAdminPasswordMismatch: 'كلمتا المرور غير متطابقتين.',
    branchAdminCreated: 'تم إنشاء مسؤول الفرع بنجاح.',
    branchAdminHandoffNote:
      'استخدم بيانات الدخول وكلمة المرور المؤقتة التي أدخلتها لتسليمها للمستخدم.',
    invalidEmail: 'البريد الإلكتروني غير صحيح.',
    requiredField: 'هذا الحقل مطلوب.',
    passwordMinLength: 'كلمة المرور يجب ألا تقل عن 6 أحرف.',
    max30: 'الحد الأقصى 30 حرف.',
    max100: 'الحد الأقصى 100 حرف.',
    max120: 'الحد الأقصى 120 حرف.',
    max200: 'الحد الأقصى 200 حرف.',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    fallbackError: 'تعذر إنشاء مسؤول الفرع.',
    showPassword: 'إظهار كلمة المرور',
    hidePassword: 'إخفاء كلمة المرور',
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
    branchAdminHandoffNote:
      'Use the login credentials and temporary password you entered to hand them over through the approved administrative channel.',
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
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },
};
