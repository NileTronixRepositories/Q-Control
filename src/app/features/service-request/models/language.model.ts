import { AppDirection, AppLanguage } from '../../../shared/models/app-language.model';

export interface LocalizedText {
  readonly ar: string;
  readonly en: string;
}

export interface ServiceRequestLanguage {
  readonly code: AppLanguage;
  readonly direction: AppDirection;
  readonly label: string;
  readonly nativeLabel: string;
  readonly flag: string;
  readonly flagImageUrl: string;
  readonly ariaLabel: string;
}

export interface ServiceRequestTranslations {
  readonly kioskTitle: string;
  readonly kioskSubtitle: string;
  readonly logoLabel: string;
  readonly languageLabel: string;
  readonly stepServiceType: string;
  readonly stepDepartment: string;
  readonly stepSubSpecialty: string;
  readonly stepTicket: string;
  readonly serviceTypeTitle: string;
  readonly serviceTypeDescription: string;
  readonly specialtyTitle: string;
  readonly specialtyDescription: string;
  readonly subSpecialtyTitle: string;
  readonly subSpecialtyDescription: string;
  readonly ticketTitle: string;
  readonly ticketDescription: string;
  readonly loadingTitle: string;
  readonly loadingDescription: string;
  readonly loadingServicesTitle: string;
  readonly loadingServicesDescription: string;
  readonly errorLoadingTitle: string;
  readonly errorLoadingDescription: string;
  readonly retryLabel: string;
  readonly backLabel: string;
  readonly nextLabel: string;
  readonly restartLabel: string;
  readonly footerServicePrompt: string;
  readonly footerSpecialtyPrompt: string;
  readonly footerSubSpecialtyPrompt: string;
  readonly footerTicketPrompt: string;
  readonly ticketNumberLabel: string;
  readonly serviceTypeLabel: string;
  readonly departmentLabel: string;
  readonly subSpecialtyLabel: string;
  readonly dateTimeLabel: string;
  readonly estimatedWaitingLabel: string;
  readonly minutesLabel: string;
  readonly qrLabel: string;
  readonly successLabel: string;
  readonly counterHintLabel: string;
  readonly stepCustomerInput: string;
  readonly customerInputTitle: string;
  readonly customerInputDescription: string;
  readonly footerCustomerInputPrompt: string;
  readonly confirmAndIssueTicket: string;
  readonly fieldRequired: string;
  readonly minLengthRequirement: string;
  readonly maxLengthRequirement: string;
  readonly mustStartWith: string;
  readonly minValueRequirement: string;
  readonly maxValueRequirement: string;
  readonly invalidNumber: string;
}

export const SERVICE_REQUEST_LANGUAGES: readonly ServiceRequestLanguage[] = [
  {
    code: 'ar',
    direction: 'rtl',
    label: 'Arabic',
    nativeLabel: 'عربي',
    flag: '🇪🇬',
    flagImageUrl: '/images/service-request/ar.jpg',
    ariaLabel: 'Switch kiosk language to Arabic',
  },
  {
    code: 'en',
    direction: 'ltr',
    label: 'English',
    nativeLabel: 'English',
    flag: '🇬🇧',
    flagImageUrl: '/images/service-request/en.jpg',
    ariaLabel: 'Switch kiosk language to English',
  },
];

export const SERVICE_REQUEST_TRANSLATIONS: Record<AppLanguage, ServiceRequestTranslations> = {
  ar: {
    kioskTitle: 'خدمة إصدار التذاكر',
    kioskSubtitle: 'اختر الخدمة المناسبة وسيتم إصدار رقم الانتظار تلقائيا',
    logoLabel: 'Q-System',
    languageLabel: 'اختيار اللغة',
    stepServiceType: 'نوع الخدمة',
    stepDepartment: 'التخصص',
    stepSubSpecialty: 'التخصص الفرعي',
    stepTicket: 'التذكرة',
    serviceTypeTitle: 'اختر نوع الخدمة',
    serviceTypeDescription: 'اضغط على الخدمة المطلوبة للانتقال للخطوة التالية.',
    specialtyTitle: 'اختر التخصص',
    specialtyDescription: 'حدد القسم أو التخصص المناسب لطلبك.',
    subSpecialtyTitle: 'اختر التخصص الفرعي',
    subSpecialtyDescription: 'هذا التخصص يحتوي على اختيارات أدق لتحسين توجيه التذكرة.',
    ticketTitle: 'تم إصدار رقمك',
    ticketDescription: 'احتفظ برقم التذكرة وانتظر النداء على الشاشة.',
    loadingTitle: 'جاري إصدار التذكرة',
    loadingDescription: 'برجاء الانتظار لحظات قليلة.',
    loadingServicesTitle: 'جاري تحميل قائمة الخدمات...',
    loadingServicesDescription: 'يرجى الانتظار لحين تهيئة البيانات.',
    errorLoadingTitle: 'تعذر الاتصال بالخادم',
    errorLoadingDescription: 'حدث خطأ أثناء تحميل قائمة الخدمات من الخادم، يرجى المحاولة مرة أخرى.',
    retryLabel: 'إعادة المحاولة',
    backLabel: 'السابق',
    nextLabel: 'التالي',
    restartLabel: 'طلب جديد',
    footerServicePrompt: 'اختر نوع الخدمة من الشاشة',
    footerSpecialtyPrompt: 'اختر التخصص المطلوب',
    footerSubSpecialtyPrompt: 'اختر التخصص الفرعي',
    footerTicketPrompt: 'برجاء استلام التذكرة',
    ticketNumberLabel: 'رقم التذكرة',
    serviceTypeLabel: 'نوع الخدمة',
    departmentLabel: 'التخصص',
    subSpecialtyLabel: 'التخصص الفرعي',
    dateTimeLabel: 'التاريخ والوقت',
    estimatedWaitingLabel: 'وقت الانتظار المتوقع',
    minutesLabel: 'دقيقة',
    qrLabel: 'رمز QR',
    successLabel: 'تم بنجاح',
    counterHintLabel: 'منطقة الخدمة',
    stepCustomerInput: 'بيانات العميل',
    customerInputTitle: 'إدخال بيانات الخدمة',
    customerInputDescription: 'يرجى إدخال البيانات المطلوبة أدناه للمتابعة وإصدار التذكرة.',
    footerCustomerInputPrompt: 'أدخل البيانات المطلوبة ثم اضغط تأكيد',
    confirmAndIssueTicket: 'تأكيد البيانات وإصدار التذكرة',
    fieldRequired: 'هذا الحقل مطلوب',
    minLengthRequirement: 'أقل عدد أحرف:',
    maxLengthRequirement: 'أقصى عدد أحرف:',
    mustStartWith: 'يجب أن يبدأ بـ:',
    minValueRequirement: 'أقل قيمة:',
    maxValueRequirement: 'أقصى قيمة:',
    invalidNumber: 'يرجى إدخال رقم صحيح صالح',
  },
  en: {
    kioskTitle: 'Queue Ticket Service',
    kioskSubtitle: 'Choose the required service and receive your queue number automatically',
    logoLabel: 'Q-System',
    languageLabel: 'Language',
    stepServiceType: 'Service',
    stepDepartment: 'Department',
    stepSubSpecialty: 'Sub-specialty',
    stepTicket: 'Ticket',
    serviceTypeTitle: 'Choose service type',
    serviceTypeDescription: 'Tap the service you need to continue.',
    specialtyTitle: 'Choose department',
    specialtyDescription: 'Select the department or specialty that matches your request.',
    subSpecialtyTitle: 'Choose sub-specialty',
    subSpecialtyDescription: 'This department has more precise options for better ticket routing.',
    ticketTitle: 'Your ticket is ready',
    ticketDescription: 'Keep your ticket number and wait for the screen announcement.',
    loadingTitle: 'Generating your ticket',
    loadingDescription: 'Please wait for a moment.',
    loadingServicesTitle: 'Loading services catalog...',
    loadingServicesDescription: 'Please wait while kiosk data is initialized.',
    errorLoadingTitle: 'Connection Error',
    errorLoadingDescription: 'An error occurred while loading services from the server. Please try again.',
    retryLabel: 'Retry',
    backLabel: 'Back',
    nextLabel: 'Next',
    restartLabel: 'New request',
    footerServicePrompt: 'Choose a service from the screen',
    footerSpecialtyPrompt: 'Choose the required department',
    footerSubSpecialtyPrompt: 'Choose the sub-specialty',
    footerTicketPrompt: 'Please collect your ticket',
    ticketNumberLabel: 'Ticket number',
    serviceTypeLabel: 'Service type',
    departmentLabel: 'Department',
    subSpecialtyLabel: 'Sub-specialty',
    dateTimeLabel: 'Date & time',
    estimatedWaitingLabel: 'Estimated waiting',
    minutesLabel: 'minutes',
    qrLabel: 'QR code',
    successLabel: 'Completed',
    counterHintLabel: 'Service area',
    stepCustomerInput: 'Customer Info',
    customerInputTitle: 'Service Details Input',
    customerInputDescription: 'Please provide the required information below to continue and issue your ticket.',
    footerCustomerInputPrompt: 'Enter the required details then press confirm',
    confirmAndIssueTicket: 'Confirm & Issue Ticket',
    fieldRequired: 'This field is required',
    minLengthRequirement: 'Minimum length:',
    maxLengthRequirement: 'Maximum length:',
    mustStartWith: 'Must start with:',
    minValueRequirement: 'Minimum value:',
    maxValueRequirement: 'Maximum value:',
    invalidNumber: 'Please enter a valid integer',
  },
};
