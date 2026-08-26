import { AppLanguage } from '../../../core/i18n/app-language.model';

export interface DisplayTranslations {
  readonly mediaPlayerLabel: string;
  readonly queueTableLabel: string;
  readonly activationTitle: string;
  readonly activationDescription: string;
  readonly usernameLabel: string;
  readonly usernamePlaceholder: string;
  readonly passwordLabel: string;
  readonly passwordPlaceholder: string;
  readonly hidePasswordLabel: string;
  readonly showPasswordLabel: string;
  readonly activatingLabel: string;
  readonly activateLabel: string;
  readonly demoModeLabel: string;
  readonly clinicWindowLabel: string;
  readonly numberLabel: string;
  readonly serviceLogoLabel: string;
  readonly callingNowLabel: string;
  readonly nowServingLabel: string;
  readonly ticketNumberLabel: string;
}

export const DISPLAY_TRANSLATIONS: Record<AppLanguage, DisplayTranslations> = {
  ar: {
    mediaPlayerLabel: 'مشغل الوسائط',
    queueTableLabel: 'جدول الانتظار',
    activationTitle: 'تفعيل شاشة العرض',
    activationDescription: 'يرجى تسجيل الدخول لربط الشاشة بقائمة تشغيل الفرع وتحديثات الطوابير المباشرة.',
    usernameLabel: 'اسم المستخدم / البريد الإلكتروني',
    usernamePlaceholder: 'أدخل اسم المستخدم',
    passwordLabel: 'كلمة المرور',
    passwordPlaceholder: 'أدخل كلمة المرور',
    hidePasswordLabel: 'إخفاء كلمة المرور',
    showPasswordLabel: 'إظهار كلمة المرور',
    activatingLabel: 'جارٍ التفعيل...',
    activateLabel: 'تفعيل وتشغيل الشاشة',
    demoModeLabel: 'الاستمرار في الوضع التجريبي',
    clinicWindowLabel: 'العيادة / الشباك',
    numberLabel: 'رقم',
    serviceLogoLabel: 'شعار الخدمة',
    callingNowLabel: 'جارٍ النداء الآن',
    nowServingLabel: 'جارٍ الخدمة',
    ticketNumberLabel: 'رقم التذكرة',
  },
  en: {
    mediaPlayerLabel: 'Media Player',
    queueTableLabel: 'Queue Table',
    activationTitle: 'Display Kiosk Activation',
    activationDescription: 'Please sign in to link this display with live branch video playlists and queue updates.',
    usernameLabel: 'Username / Email',
    usernamePlaceholder: 'Enter username',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter password',
    hidePasswordLabel: 'Hide password',
    showPasswordLabel: 'Show password',
    activatingLabel: 'Activating...',
    activateLabel: 'Activate & Start Display',
    demoModeLabel: 'Continue as Demo Mode',
    clinicWindowLabel: 'Clinic / Window',
    numberLabel: 'NO.',
    serviceLogoLabel: 'Service Logo',
    callingNowLabel: 'Calling Now',
    nowServingLabel: 'Now Serving',
    ticketNumberLabel: 'Ticket Number',
  },
};
