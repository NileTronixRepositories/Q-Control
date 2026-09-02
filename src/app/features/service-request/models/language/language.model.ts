import { AppDirection, AppLanguage } from '../../../../core/i18n/app-language.model';

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
  readonly languageStepTitle: string;
  readonly languageStepDescription: string;
  readonly userInputTitle: string;
  readonly userInputDescription: string;
  readonly userInputRequired: string;
  readonly languageStepBadge: string;
  readonly customerInputStepBadge: string;
  readonly userInputStepBadge: string;
  readonly serviceTypeStepBadge: string;
  readonly departmentStepBadge: string;
  readonly subSpecialtyStepBadge: string;
  readonly ticketIssuedStepBadge: string;
  readonly chooseFlowTitle: string;
  readonly chooseFlowDescription: string;
  readonly haveReservationLabel: string;
  readonly haveReservationDesc: string;
  readonly newTicketLabel: string;
  readonly newTicketDesc: string;
  readonly chooseFlowStepBadge: string;
  readonly reservationSearchTitle: string;
  readonly reservationSearchDescription: string;
  readonly searchReservationBtn: string;
  readonly searchingReservationsTitle: string;
  readonly searchingReservationsDescription: string;
  readonly noReservationsFoundTitle: string;
  readonly noReservationsFoundDescription: string;
  readonly reservationsListTitle: string;
  readonly reservationsListDescription: string;
  readonly reservationIdLabel: string;
  readonly reservationDateLabel: string;
  readonly reservationTimeLabel: string;
  readonly reservationStatusLabel: string;
  readonly convertReservationBtn: string;
  readonly convertingReservationTitle: string;
  readonly convertingReservationDescription: string;
  readonly atLeastOneInputRequired: string;
  readonly editSearchLabel: string;
  readonly directTicketFallbackLabel: string;
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
    languageStepTitle: 'اختر لغة التواصل',
    languageStepDescription: 'يرجى لمس الشاشة لاختيار اللغة المطلوبة للمتابعة.',
    userInputTitle: 'إدخال بيانات المستخدم',
    userInputDescription: 'استخدم لوحة الأرقام لإدخال بياناتك قبل طباعة التذكرة.',
    userInputRequired: 'إدخال بيانات المستخدم مطلوب دائماً',
    languageStepBadge: 'الخطوة 0: اختيار اللغة',
    customerInputStepBadge: 'خطوة إدخال بيانات الخدمة',
    userInputStepBadge: 'خطوة إدخال بيانات المستخدم',
    serviceTypeStepBadge: 'الخطوة 1: اختيار الخدمة',
    departmentStepBadge: 'الخطوة 2: اختيار القسم / العيادة',
    subSpecialtyStepBadge: 'الخطوة 3: التخصص الفرعي',
    ticketIssuedStepBadge: 'تم إصدار التذكرة بنجاح',
    chooseFlowTitle: 'هل لديك حجز مسبق؟',
    chooseFlowDescription:
      'اختر إذا كان لديك موعد حجز مسجل مسبقاً أو ترغب في إصدار تذكرة فورية جديدة.',
    haveReservationLabel: 'لدي حجز مسبق',
    haveReservationDesc: 'البحث عن موعد مسجل مسبقاً وتحويله لتذكرة انتظار',
    newTicketLabel: 'تذكرة جديدة',
    newTicketDesc: 'إصدار تذكرة فورية مباشرة لقائمة الانتظار',
    chooseFlowStepBadge: 'نوع الطلب',
    reservationSearchTitle: 'البحث عن الحجز المسبق',
    reservationSearchDescription: 'أدخل بيانات البحث المسجلة بالحجز (رقم الهاتف أو الرقم القومي)',
    searchReservationBtn: 'بحث عن الحجز',
    searchingReservationsTitle: 'جاري البحث عن الحجوزات...',
    searchingReservationsDescription: 'يرجى الانتظار لحين جلب بيانات الحجز المطابقة.',
    noReservationsFoundTitle: 'لم يتم العثور على أي حجز مطابق',
    noReservationsFoundDescription:
      'لم نتمكن من العثور على حجوزات مطابقة للبيانات المدخلة في هذه الخدمة.',
    reservationsListTitle: 'قائمة الحجوزات المتاحة',
    reservationsListDescription: 'يرجى اختيار الحجز المطلوب لإصدار تذكرة الانتظار الخاصة به.',
    reservationIdLabel: 'رقم الحجز',
    reservationDateLabel: 'تاريخ الحجز',
    reservationTimeLabel: 'الوقت المحدد',
    reservationStatusLabel: 'حالة الحجز',
    convertReservationBtn: 'إصدار تذكرة للحجز المحدد',
    convertingReservationTitle: 'جاري تحويل الحجز وإصدار التذكرة...',
    convertingReservationDescription: 'يرجى الانتظار لحظات قليلة.',
    atLeastOneInputRequired: 'يرجى إدخال بيان واحد على الأقل للبحث',
    editSearchLabel: 'تعديل بيانات البحث وإعادة المحاولة',
    directTicketFallbackLabel: 'إصدار تذكرة جديدة مباشرة بدون حجز',
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
    errorLoadingDescription:
      'An error occurred while loading services from the server. Please try again.',
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
    customerInputDescription:
      'Please provide the required information below to continue and issue your ticket.',
    footerCustomerInputPrompt: 'Enter the required details then press confirm',
    confirmAndIssueTicket: 'Confirm & Issue Ticket',
    fieldRequired: 'This field is required',
    minLengthRequirement: 'Minimum length:',
    maxLengthRequirement: 'Maximum length:',
    mustStartWith: 'Must start with:',
    minValueRequirement: 'Minimum value:',
    maxValueRequirement: 'Maximum value:',
    invalidNumber: 'Please enter a valid integer',
    languageStepTitle: 'Select Preferred Language',
    languageStepDescription: 'Please touch the screen to choose your language to continue.',
    userInputTitle: 'Enter User Information',
    userInputDescription: 'Use touchscreen keypad to submit user data before printing ticket.',
    userInputRequired: 'User input is mandatory',
    languageStepBadge: 'Step 0: Select Language',
    customerInputStepBadge: 'Service Data Input Step',
    userInputStepBadge: 'User Input Step',
    serviceTypeStepBadge: 'Step 1: Select Service',
    departmentStepBadge: 'Step 2: Select Department',
    subSpecialtyStepBadge: 'Step 3: Sub Specialty',
    ticketIssuedStepBadge: 'Ticket Issued Successfully',
    chooseFlowTitle: 'Do you have a prior reservation?',
    chooseFlowDescription:
      'Choose whether you have a pre-registered reservation or want a new instant ticket.',
    haveReservationLabel: 'I have a reservation',
    haveReservationDesc: 'Search for a pre-scheduled appointment and convert to a ticket',
    newTicketLabel: 'New Ticket',
    newTicketDesc: 'Issue an instant ticket directly for the waiting queue',
    chooseFlowStepBadge: 'Flow Type',
    reservationSearchTitle: 'Search Prior Reservation',
    reservationSearchDescription: 'Enter your registered lookup details (Phone or National ID)',
    searchReservationBtn: 'Search Reservation',
    searchingReservationsTitle: 'Searching for reservations...',
    searchingReservationsDescription: 'Please wait while matching reservations are retrieved.',
    noReservationsFoundTitle: 'No matching reservations found',
    noReservationsFoundDescription:
      'We could not find any active reservations matching the provided details for this service.',
    reservationsListTitle: 'Matching Reservations',
    reservationsListDescription: 'Please select your reservation to convert into a queue ticket.',
    reservationIdLabel: 'Reservation ID',
    reservationDateLabel: 'Reservation Date',
    reservationTimeLabel: 'Scheduled Time',
    reservationStatusLabel: 'Status',
    convertReservationBtn: 'Issue Ticket for Selected Reservation',
    convertingReservationTitle: 'Converting reservation to queue ticket...',
    convertingReservationDescription: 'Please wait a moment.',
    atLeastOneInputRequired: 'Please enter at least one field to search',
    editSearchLabel: 'Edit Search & Try Again',
    directTicketFallbackLabel: 'Issue a New Direct Ticket Instead',
  },
};
