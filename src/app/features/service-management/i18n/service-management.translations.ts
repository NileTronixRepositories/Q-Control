import { AppLanguage } from '../../../shared/models/app-language.model';

export interface ServiceManagementTranslations {
  readonly title: string;
  readonly description: string;
  readonly listTab: string;
  readonly treeTab: string;
  readonly addService: string;
  readonly addRootService: string;
  readonly addChildService: string;
  readonly serviceHierarchy: string;
  readonly treeRoot: string;
  readonly selectedService: string;
  readonly editorEmptyTitle: string;
  readonly editorEmptyBody: string;
  readonly createUnder: string;
  readonly searchPlaceholder: string;
  readonly treeSearchLabel: string;
  readonly treeSearchPlaceholder: string;
  readonly treeSearchHelp: string;
  readonly clearSearch: string;
  readonly noSearchResults: string;
  readonly activeFilter: string;
  readonly deletedFilter: string;
  readonly ticketFilter: string;
  readonly parentFilter: string;
  readonly all: string;
  readonly active: string;
  readonly inactive: string;
  readonly deleted: string;
  readonly notDeleted: string;
  readonly ticketIssuable: string;
  readonly notTicketIssuable: string;
  readonly operationallyDisabled: string;
  readonly canIssueTicket: string;
  readonly cannotIssueTicket: string;
  readonly hasChildren: string;
  readonly pageSize: string;
  readonly loading: string;
  readonly noItems: string;
  readonly noTreeItems: string;
  readonly totalItems: string;
  readonly previous: string;
  readonly next: string;
  readonly refresh: string;
  readonly arabicName: string;
  readonly englishName: string;
  readonly serviceCode: string;
  readonly serviceCodeRequired: string;
  readonly serviceCodeRequiredError: string;
  readonly serviceCodeMustBeEmpty: string;
  readonly serviceCodeMaxLength: string;
  readonly serviceCodeAlreadyExists: string;
  readonly duplicateArabicName: string;
  readonly duplicateEnglishName: string;
  readonly parent: string;
  readonly logo: string;
  readonly status: string;
  readonly effectiveActive: string;
  readonly orderNo: string;
  readonly priority: string;
  readonly weight: string;
  readonly actions: string;
  readonly view: string;
  readonly edit: string;
  readonly delete: string;
  readonly restore: string;
  readonly permanentlyDelete: string;
  readonly deletePermanently: string;
  readonly details: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly close: string;
  readonly cancel: string;
  readonly save: string;
  readonly basicInfo: string;
  readonly hierarchy: string;
  readonly ticketBehavior: string;
  readonly ordering: string;
  readonly ticketNumbers: string;
  readonly arabicUserMessage: string;
  readonly englishUserMessage: string;
  readonly noParent: string;
  readonly clientInputRequired: string;
  readonly hasReservation: string;
  readonly categoryOnly: string;
  readonly rangePrefix: string;
  readonly rangeStartNumber: string;
  readonly rangeEndNumber: string;
  readonly waitingDuration: string;
  readonly noOfTicketCopies: string;
  readonly uploadLogo: string;
  readonly serviceData: string;
  readonly serviceMedia: string;
  readonly serviceLogo: string;
  readonly serviceIcon: string;
  readonly advertisementImages: string;
  readonly uploadIcon: string;
  readonly replaceLogo: string;
  readonly replaceIcon: string;
  readonly uploadAdvertisements: string;
  readonly deleteImage: string;
  readonly deleteLogo: string;
  readonly deleteIcon: string;
  readonly noLogoUploaded: string;
  readonly noIconUploaded: string;
  readonly noAdvertisementImages: string;
  readonly invalidImageType: string;
  readonly imageRequired: string;
  readonly imagesRequired: string;
  readonly uploadSuccessful: string;
  readonly deleteSuccessful: string;
  readonly imageConcurrencyConflict: string;
  readonly confirmImageDeletion: string;
  readonly selectedImages: string;
  readonly removeSelectedImage: string;
  readonly allowedImageTypes: string;
  readonly includeInactive: string;
  readonly includeDeleted: string;
  readonly expand: string;
  readonly collapse: string;
  readonly requiredField: string;
  readonly maxLength100: string;
  readonly maxLength500: string;
  readonly maxLength10: string;
  readonly minZero: string;
  readonly copiesMin: string;
  readonly rangeInvalid: string;
  readonly ticketRequired: string;
  readonly childTicketDisabled: string;
  readonly fallbackSuccess: string;
  readonly fallbackError: string;
  readonly accessDenied: string;
  readonly noPermissionHint: string;
  readonly concurrencyError: string;
  readonly reloadService: string;
  readonly deleteConfirmTitle: string;
  readonly restoreConfirmTitle: string;
  readonly permanentDeleteConfirmTitle: string;
  readonly deleteConfirmBody: string;
  readonly restoreConfirmBody: string;
  readonly permanentDeleteConfirmBody: string;
  readonly deleteChildrenWarning: string;
  readonly restoredButDisabled: string;
  readonly yes: string;
  readonly no: string;
  readonly notAvailable: string;
  readonly scope: string;
  readonly globalScope: string;
  readonly branchScopedScope: string;
  readonly ownerBranch: string;
  readonly ownershipInfo: string;
  readonly assignedToCurrentBranch: string;
  readonly notAssignedToCurrentBranch: string;
  readonly ownedByCurrentBranch: string;
  readonly serviceCentral: string;
  readonly scopeFilter: string;
  readonly ownerBranchFilter: string;
  readonly assignedFilter: string;
  readonly branchAssignmentTitle: string;
  readonly branchAssignmentDescription: string;
  readonly branchAssignmentSourceTitle: string;
  readonly branchAssignmentTargetTitle: string;
  readonly branchAssignmentDropHint: string;
  readonly branchAssignmentInvalidLeaf: string;
  readonly branchAssignmentMissingBranch: string;
  readonly branchAssignmentAlreadyAssigned: string;
  readonly relatedWorkflows: string;
  readonly workflowStartOptions: string;
  readonly workflowSelectionRequired: string;
  readonly workflowSelectionNotRequired: string;
  readonly workflowStartModeNoWorkflow: string;
  readonly workflowStartModeAutoApply: string;
  readonly workflows: string;
  readonly customInputs: string;
  readonly customInputsHelp: string;
  readonly addCustomInput: string;
  readonly removeCustomInput: string;
  readonly customInputName: string;
  readonly customInputLabelAr: string;
  readonly customInputLabelEn: string;
  readonly customInputType: string;
  readonly customInputTypeString: string;
  readonly customInputTypeInteger: string;
  readonly customInputRequired: string;
  readonly customInputOrder: string;
  readonly customInputRestrictions: string;
  readonly customInputMinLength: string;
  readonly customInputMaxLength: string;
  readonly customInputStartWith: string;
  readonly customInputMinValue: string;
  readonly customInputMaxValue: string;
  readonly customInputsRequiredError: string;
  readonly customInputDuplicateName: string;
  readonly customInputDuplicateOrder: string;
  readonly customInputMinLengthError: string;
  readonly customInputMaxLengthError: string;
  readonly customInputLengthRangeError: string;
  readonly customInputValueRangeError: string;
  readonly customInputStartWithMaxLength: string;
  readonly customInputOrderMinError: string;
  readonly noCustomInputs: string;
  readonly customInputDetails: string;
}

export const SERVICE_MANAGEMENT_TRANSLATIONS: Record<AppLanguage, ServiceManagementTranslations> = {
  ar: {
    title: 'إدارة الخدمات',
    description: 'إدارة دليل الخدمات والتسلسل الهرمي وإعدادات إصدار التذاكر.',
    listTab: 'قائمة الخدمات',
    treeTab: 'شجرة الخدمات',
    addService: 'إضافة خدمة',
    addRootService: 'إضافة خدمة رئيسية',
    addChildService: 'إضافة خدمة فرعية',
    serviceHierarchy: 'الخدمات',
    treeRoot: 'الخدمات',
    selectedService: 'الخدمة المحددة',
    editorEmptyTitle: 'اختر خدمة أو أنشئ خدمة جديدة',
    editorEmptyBody: 'استخدم الشجرة لإضافة خدمة رئيسية، أو اضغط + بجانب أي خدمة لإضافة خدمة فرعية.',
    createUnder: 'إنشاء تحت',
    searchPlaceholder: 'ابحث بالاسم العربي أو الإنجليزي',
    treeSearchLabel:
      '\u0627\u0644\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u062e\u062f\u0645\u0629 \u0623\u0648 \u0643\u0648\u062f \u0627\u0644\u062e\u062f\u0645\u0629',
    treeSearchPlaceholder: '\u0627\u0628\u062d\u062b \u0639\u0646 \u062e\u062f\u0645\u0629...',
    treeSearchHelp:
      '\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u062e\u062f\u0645\u0629 \u0623\u0648 \u0643\u0648\u062f \u0627\u0644\u062e\u062f\u0645\u0629.',
    clearSearch: '\u0645\u0633\u062d \u0627\u0644\u0628\u062d\u062b',
    noSearchResults:
      '\u0644\u0627 \u062a\u0648\u062c\u062f \u062e\u062f\u0645\u0627\u062a \u0645\u0637\u0627\u0628\u0642\u0629 \u0644\u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u0628\u062d\u062b.',
    activeFilter: 'الحالة',
    deletedFilter: 'المحذوفة',
    ticketFilter: 'إصدار التذاكر',
    parentFilter: 'الخدمة الرئيسية',
    all: 'الكل',
    active: 'نشط',
    inactive: 'غير نشط',
    deleted: 'محذوف',
    notDeleted: 'غير محذوف',
    ticketIssuable: 'تصدر تذاكر',
    notTicketIssuable: 'لا تصدر تذاكر',
    operationallyDisabled: 'معطلة تشغيليًا',
    canIssueTicket: 'يمكن إصدار تذكرة',
    cannotIssueTicket: 'لا يمكن إصدار تذكرة',
    hasChildren: 'لها خدمات فرعية',
    pageSize: 'حجم الصفحة',
    loading: 'جاري التحميل...',
    noItems: 'لا توجد خدمات مطابقة.',
    noTreeItems: 'لا توجد خدمات في الشجرة.',
    totalItems: 'إجمالي العناصر',
    previous: 'السابق',
    next: 'التالي',
    refresh: 'تحديث',
    arabicName: 'الاسم العربي',
    englishName: 'الاسم الإنجليزي',
    serviceCode: 'كود الخدمة',
    serviceCodeRequired: 'كود الخدمة مطلوب',
    serviceCodeRequiredError: 'كود الخدمة مطلوب.',
    serviceCodeMustBeEmpty: 'يجب ترك كود الخدمة فارغًا عندما لا يكون مطلوبًا.',
    serviceCodeMaxLength: 'لا يمكن أن يتجاوز كود الخدمة 100 حرف.',
    serviceCodeAlreadyExists: 'كود الخدمة المحدد مستخدم بالفعل في خدمة أخرى.',
    duplicateArabicName: 'الاسم العربي مستخدم بالفعل داخل نفس النطاق والفرع.',
    duplicateEnglishName: 'الاسم الإنجليزي مستخدم بالفعل داخل نفس النطاق والفرع.',
    parent: 'الخدمة الرئيسية',
    logo: 'الشعار',
    status: 'الحالة',
    effectiveActive: 'الحالة التشغيلية',
    orderNo: 'الترتيب',
    priority: 'الأولوية',
    weight: 'الوزن',
    actions: 'الإجراءات',
    view: 'عرض',
    edit: 'تعديل',
    delete: 'حذف',
    restore: 'استعادة',
    permanentlyDelete: 'حذف نهائي',
    deletePermanently: 'حذف نهائي',
    details: 'تفاصيل الخدمة',
    createTitle: 'إنشاء خدمة',
    editTitle: 'تعديل الخدمة',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    basicInfo: 'المعلومات الأساسية',
    hierarchy: 'التسلسل الهرمي',
    ticketBehavior: 'سلوك التذاكر',
    ordering: 'الترتيب والأولوية',
    ticketNumbers: 'إعدادات أرقام التذاكر',
    arabicUserMessage: 'رسالة المستخدم بالعربية',
    englishUserMessage: 'رسالة المستخدم بالإنجليزية',
    noParent: 'بدون خدمة رئيسية',
    clientInputRequired: 'إدخال العميل مطلوب',
    hasReservation: 'تحتوي على حجز',
    categoryOnly: 'تصنيف فقط',
    rangePrefix: 'بادئة النطاق',
    rangeStartNumber: 'رقم بداية النطاق',
    rangeEndNumber: 'رقم نهاية النطاق',
    waitingDuration: 'مدة الانتظار',
    noOfTicketCopies: 'عدد نسخ التذكرة',
    uploadLogo: 'رفع شعار',
    serviceData: 'بيانات الخدمة والتذاكر',
    serviceMedia: 'وسائط الخدمة',
    serviceLogo: 'شعار الخدمة',
    serviceIcon: 'أيقونة الخدمة',
    advertisementImages: 'صور الإعلانات',
    uploadIcon: 'رفع أيقونة',
    replaceLogo: 'استبدال الشعار',
    replaceIcon: 'استبدال الأيقونة',
    uploadAdvertisements: 'رفع الإعلانات',
    deleteImage: 'حذف الصورة',
    deleteLogo: 'حذف الشعار',
    deleteIcon: 'حذف الأيقونة',
    noLogoUploaded: 'لم يتم رفع شعار',
    noIconUploaded: 'لم يتم رفع أيقونة',
    noAdvertisementImages: 'لا توجد صور إعلانات',
    invalidImageType: 'الصور المدعومة فقط هي PNG وJPG وJPEG وWEBP.',
    imageRequired: 'الصورة مطلوبة.',
    imagesRequired: 'يجب رفع صورة واحدة على الأقل.',
    uploadSuccessful: 'تم رفع الصورة بنجاح.',
    deleteSuccessful: 'تم حذف الصورة بنجاح.',
    imageConcurrencyConflict: 'تم تعديل الخدمة أو الصورة بواسطة مستخدم آخر. تم تحميل أحدث بيانات.',
    confirmImageDeletion: 'هل أنت متأكد من حذف صورة هذه الخدمة؟',
    selectedImages: 'صور محددة',
    removeSelectedImage: 'إزالة الصورة المحددة',
    allowedImageTypes: 'PNG أو JPG أو JPEG أو WEBP فقط.',
    includeInactive: 'تضمين غير النشطة',
    includeDeleted: 'تضمين المحذوفة',
    expand: 'توسيع',
    collapse: 'طي',
    requiredField: 'هذا الحقل مطلوب.',
    maxLength100: 'الحد الأقصى 100 حرف.',
    maxLength500: 'الحد الأقصى 500 حرف.',
    maxLength10: 'الحد الأقصى 10 أحرف.',
    minZero: 'يجب أن تكون القيمة 0 أو أكبر.',
    copiesMin: 'يجب أن يكون عدد نسخ التذكرة أكبر من 0.',
    rangeInvalid: 'يجب أن يكون رقم نهاية النطاق أكبر من أو يساوي رقم البداية.',
    ticketRequired: 'اختر ما إذا كانت هذه الخدمة تصدر تذاكر.',
    childTicketDisabled: 'الخدمة التي تحتوي على خدمات فرعية لا يمكنها إصدار تذاكر.',
    fallbackSuccess: 'تمت العملية بنجاح.',
    fallbackError: 'حدث خطأ غير متوقع.',
    accessDenied: 'تم رفض الوصول.',
    noPermissionHint: 'ليست لديك صلاحية لهذا الإجراء.',
    concurrencyError:
      'تم تعديل الخدمة بواسطة مستخدم آخر. يرجى إعادة تحميل أحدث البيانات قبل الحفظ مرة أخرى.',
    reloadService: 'إعادة تحميل الخدمة',
    deleteConfirmTitle: 'حذف الخدمة',
    restoreConfirmTitle: 'استعادة الخدمة',
    permanentDeleteConfirmTitle: 'حذف الخدمة نهائيًا',
    deleteConfirmBody: 'هل أنت متأكد من حذف هذه الخدمة؟',
    restoreConfirmBody: 'هل أنت متأكد من استعادة هذه الخدمة؟',
    permanentDeleteConfirmBody:
      'سيؤدي ذلك إلى حذف الخدمة نهائيًا وأي سجلات مرتبطة يسمح الخادم بحذفها. لا يمكن التراجع عن هذا الإجراء.',
    deleteChildrenWarning:
      'هذه الخدمة تحتوي على خدمات فرعية. حذفها لن يحذف الخدمات الفرعية، لكنها لن تتمكن من إصدار التذاكر طالما أن الخدمة الرئيسية محذوفة.',
    restoredButDisabled:
      'تمت استعادة الخدمة بنجاح، لكنها لا تزال غير متاحة تشغيليًا لأن الخدمة الرئيسية غير نشطة أو محذوفة.',
    yes: 'نعم',
    no: 'لا',
    notAvailable: '-',
    scope: 'النطاق',
    globalScope: 'عام',
    branchScopedScope: 'خاص بالفرع',
    ownerBranch: 'الفرع المالك',
    ownershipInfo: 'معلومات الملكية',
    assignedToCurrentBranch: 'مسندة إلى الفرع الحالي',
    notAssignedToCurrentBranch: 'غير مسندة إلى الفرع الحالي',
    ownedByCurrentBranch: 'مملوكة للفرع الحالي',
    serviceCentral: 'مركز الخدمات',
    scopeFilter: 'نطاق الخدمة',
    ownerBranchFilter: 'معرف الفرع المالك',
    assignedFilter: 'مسندة إلى الفرع الحالي',
    branchAssignmentTitle: 'إسناد خدمات الفرع',
    branchAssignmentDescription: 'اسحب الخدمات الطرفية النشطة إلى شجرة الفرع لإسنادها.',
    branchAssignmentSourceTitle: 'مركز الخدمات',
    branchAssignmentTargetTitle: 'خدمات الفرع المسندة',
    branchAssignmentDropHint: 'أفلت خدمة هنا لإسنادها إلى الفرع.',
    branchAssignmentInvalidLeaf: 'يمكن إسناد الخدمات الطرفية النشطة فقط.',
    branchAssignmentMissingBranch: 'لا يوجد فرع نشط متاح للإسناد.',
    branchAssignmentAlreadyAssigned: 'هذه الخدمة مسندة بالفعل إلى الفرع.',
    relatedWorkflows: 'مسارات العمل المرتبطة',
    workflowStartOptions: 'خيارات بدء مسار العمل',
    workflowSelectionRequired: 'اختيار مسار العمل مطلوب',
    workflowSelectionNotRequired: 'لا يلزم اختيار مسار عمل',
    workflowStartModeNoWorkflow: 'بدون مسار عمل',
    workflowStartModeAutoApply: 'تطبيق تلقائي',
    workflows: 'مسارات العمل',
    customInputs: 'البيانات المطلوبة من العميل',
    customInputsHelp:
      'تحديد الحقول والشروط التي يدخلها العميل عند اختيار هذه الخدمة في جهاز الخدمة الذاتية.',
    addCustomInput: 'إضافة حقل جديد',
    removeCustomInput: 'إزالة الحقل',
    customInputName: 'اسم الحقل الداخلي',
    customInputLabelAr: 'التسمية بالعربية',
    customInputLabelEn: 'التسمية بالإنجليزية',
    customInputType: 'نوع الحقل',
    customInputTypeString: 'نص (String)',
    customInputTypeInteger: 'رقم صحيح (Integer)',
    customInputRequired: 'حقل إلزامي',
    customInputOrder: 'الترتيب',
    customInputRestrictions: 'شروط وقيود الإدخال',
    customInputMinLength: 'أقل عدد أحرف',
    customInputMaxLength: 'أقصى عدد أحرف',
    customInputStartWith: 'يجب أن يبدأ بـ',
    customInputMinValue: 'أقل قيمة رقمية',
    customInputMaxValue: 'أقصى قيمة رقمية',
    customInputsRequiredError: 'يجب تعريف حقل واحد على الأقل عند طلب بيانات العميل.',
    customInputDuplicateName: 'اسم الحقل الداخلي مستخدم بالفعل داخل هذه الخدمة.',
    customInputDuplicateOrder: 'ترتيب الحقل مستخدم بالفعل داخل هذه الخدمة.',
    customInputMinLengthError: 'يجب أن يكون أقل عدد أحرف 0 أو أكثر.',
    customInputMaxLengthError: 'يجب أن يكون أقصى عدد أحرف بين 1 و 3000.',
    customInputLengthRangeError: 'يجب أن يكون أقصى عدد أحرف أكبر من أو يساوي أقل عدد أحرف.',
    customInputValueRangeError: 'يجب أن تكون أقصى قيمة أكبر من أو تساوي أقل قيمة.',
    customInputStartWithMaxLength: 'لا يمكن أن تتجاوز بادئة النص 100 حرف.',
    customInputOrderMinError: 'يجب أن يكون الترتيب أكبر من 0.',
    noCustomInputs: 'لا توجد حقول بيانات مخصصة.',
    customInputDetails: 'بيانات العميل المطلوبة',
  },
  en: {
    title: 'Service Management',
    description: 'Manage the service catalog, hierarchy, and ticket issuance settings.',
    listTab: 'Service List',
    treeTab: 'Service Tree',
    addService: 'Add Service',
    addRootService: 'Add Root Service',
    addChildService: 'Add Child Service',
    serviceHierarchy: 'Services ',
    treeRoot: 'Services',
    selectedService: 'Selected service',
    editorEmptyTitle: 'Select a service or create a new one',
    editorEmptyBody:
      'Use the tree to add a root service, or press + next to any service to add a child service.',
    createUnder: 'Creating under',
    searchPlaceholder: 'Search Arabic or English name',
    treeSearchLabel: 'Search by service name or service code',
    treeSearchPlaceholder: 'Search services...',
    treeSearchHelp: 'Search by service name or service code.',
    clearSearch: 'Clear search',
    noSearchResults: 'No services match your search.',
    activeFilter: 'Status',
    deletedFilter: 'Deleted',
    ticketFilter: 'Ticket issuance',
    parentFilter: 'Parent service',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    deleted: 'Deleted',
    notDeleted: 'Not Deleted',
    ticketIssuable: 'Ticket Issuable',
    notTicketIssuable: 'Not Ticket Issuable',
    operationallyDisabled: 'Operationally Disabled',
    canIssueTicket: 'Can Issue Ticket',
    cannotIssueTicket: 'Cannot Issue Ticket',
    hasChildren: 'Has Children',
    pageSize: 'Page size',
    loading: 'Loading...',
    noItems: 'No matching services found.',
    noTreeItems: 'No services found in the tree.',
    totalItems: 'Total items',
    previous: 'Previous',
    next: 'Next',
    refresh: 'Refresh',
    arabicName: 'Arabic Name',
    englishName: 'English Name',
    serviceCode: 'Service Code',
    serviceCodeRequired: 'Service Code Required',
    serviceCodeRequiredError: 'Service code is required.',
    serviceCodeMustBeEmpty: 'Service code must be empty when it is not required.',
    serviceCodeMaxLength: 'Service code cannot exceed 100 characters.',
    serviceCodeAlreadyExists: 'The specified service code is already used by another service.',
    duplicateArabicName: 'The Arabic name is already used in the same scope and owner branch.',
    duplicateEnglishName: 'The English name is already used in the same scope and owner branch.',
    parent: 'Parent',
    logo: 'Logo',
    status: 'Status',
    effectiveActive: 'Operational Status',
    orderNo: 'Order',
    priority: 'Priority',
    weight: 'Weight',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
    restore: 'Restore',
    permanentlyDelete: 'Permanently Delete',
    deletePermanently: 'Delete Permanently',
    details: 'Service Details',
    createTitle: 'Create Service',
    editTitle: 'Edit Service',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    basicInfo: 'Basic Information',
    hierarchy: 'Hierarchy',
    ticketBehavior: 'Ticket Behavior',
    ordering: 'Ordering and Priority',
    ticketNumbers: 'Ticket Number Settings',
    arabicUserMessage: 'Arabic User Message',
    englishUserMessage: 'English User Message',
    noParent: 'No Parent',
    clientInputRequired: 'Client Input Required',
    hasReservation: 'Has Reservation',
    categoryOnly: 'Category Only',
    rangePrefix: 'Range Prefix',
    rangeStartNumber: 'Range Start Number',
    rangeEndNumber: 'Range End Number',
    waitingDuration: 'Waiting Duration',
    noOfTicketCopies: 'Ticket Copies',
    uploadLogo: 'Upload Logo',
    serviceData: 'Service Data & Tickets',
    serviceMedia: 'Service Media',
    serviceLogo: 'Service Logo',
    serviceIcon: 'Service Icon',
    advertisementImages: 'Advertisement Images',
    uploadIcon: 'Upload Icon',
    replaceLogo: 'Replace Logo',
    replaceIcon: 'Replace Icon',
    uploadAdvertisements: 'Upload Advertisements',
    deleteImage: 'Delete Image',
    deleteLogo: 'Delete Logo',
    deleteIcon: 'Delete Icon',
    noLogoUploaded: 'No Logo Uploaded',
    noIconUploaded: 'No Icon Uploaded',
    noAdvertisementImages: 'No Advertisement Images',
    invalidImageType: 'Only PNG, JPG, JPEG, and WEBP images are supported.',
    imageRequired: 'Image is required.',
    imagesRequired: 'At least one image is required.',
    uploadSuccessful: 'Image uploaded successfully.',
    deleteSuccessful: 'Image deleted successfully.',
    imageConcurrencyConflict:
      'The service or image was modified by another user. The latest data has been loaded.',
    confirmImageDeletion: 'Are you sure you want to delete this service image?',
    selectedImages: 'selected images',
    removeSelectedImage: 'Remove selected image',
    allowedImageTypes: 'PNG, JPG, JPEG, or WEBP only.',
    includeInactive: 'Include inactive',
    includeDeleted: 'Include deleted',
    expand: 'Expand',
    collapse: 'Collapse',
    requiredField: 'This field is required.',
    maxLength100: 'Maximum length is 100 characters.',
    maxLength500: 'Maximum length is 500 characters.',
    maxLength10: 'Maximum length is 10 characters.',
    minZero: 'Value must be 0 or greater.',
    copiesMin: 'Ticket copies must be greater than 0.',
    rangeInvalid: 'Range end must be greater than or equal to range start.',
    ticketRequired: 'Choose whether this service issues tickets.',
    childTicketDisabled: 'Service with children cannot issue tickets.',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    accessDenied: 'Access denied.',
    noPermissionHint: 'You do not have permission for this action.',
    concurrencyError:
      'This service was modified by another user. Reload the latest service details before saving again.',
    reloadService: 'Reload Service',
    deleteConfirmTitle: 'Delete Service',
    restoreConfirmTitle: 'Restore Service',
    permanentDeleteConfirmTitle: 'Permanently Delete Service',
    deleteConfirmBody: 'Are you sure you want to delete this service?',
    restoreConfirmBody: 'Are you sure you want to restore this service?',
    permanentDeleteConfirmBody:
      'This permanently removes the service and any related records the server allows. This action cannot be undone.',
    deleteChildrenWarning:
      'This service has child services. Deleting it will not delete the children, but they will not be able to issue tickets while this parent is deleted.',
    restoredButDisabled:
      'Service restored successfully, but it is still not operational because its parent service is inactive or deleted.',
    yes: 'Yes',
    no: 'No',
    notAvailable: '-',
    scope: 'Scope',
    globalScope: 'Global',
    branchScopedScope: 'Branch Scoped',
    ownerBranch: 'Owner Branch',
    ownershipInfo: 'Ownership Information',
    assignedToCurrentBranch: 'Assigned to current branch',
    notAssignedToCurrentBranch: 'Not assigned to current branch',
    ownedByCurrentBranch: 'Owned by current branch',
    serviceCentral: 'Service Central',
    scopeFilter: 'Service Scope',
    ownerBranchFilter: 'Owner Branch ID',
    assignedFilter: 'Assigned to current branch',
    branchAssignmentTitle: 'Branch service assignment',
    branchAssignmentDescription: 'Drag active leaf services into the branch tree to assign them.',
    branchAssignmentSourceTitle: 'Service Central',
    branchAssignmentTargetTitle: 'Assigned branch services',
    branchAssignmentDropHint: 'Drop a service here to assign it to the branch.',
    branchAssignmentInvalidLeaf: 'Only active leaf services can be assigned.',
    branchAssignmentMissingBranch: 'No active branch is available for assignment.',
    branchAssignmentAlreadyAssigned: 'This service is already assigned to the branch.',
    relatedWorkflows: 'Related Workflows',
    workflowStartOptions: 'Workflow Start Options',
    workflowSelectionRequired: 'Workflow selection required',
    workflowSelectionNotRequired: 'No workflow selection required',
    workflowStartModeNoWorkflow: 'No Workflow',
    workflowStartModeAutoApply: 'Auto Apply',
    workflows: 'Workflows',
    customInputs: 'Customer Custom Inputs',
    customInputsHelp:
      'Configure fields and validation rules that the customer must provide when selecting this service at the kiosk.',
    addCustomInput: 'Add Input',
    removeCustomInput: 'Remove Input',
    customInputName: 'Internal Field Name',
    customInputLabelAr: 'Arabic Label',
    customInputLabelEn: 'English Label',
    customInputType: 'Field Type',
    customInputTypeString: 'Text (String)',
    customInputTypeInteger: 'Integer (Integer)',
    customInputRequired: 'Required Field',
    customInputOrder: 'Order',
    customInputRestrictions: 'Input Restrictions',
    customInputMinLength: 'Minimum Length',
    customInputMaxLength: 'Maximum Length',
    customInputStartWith: 'Must Start With',
    customInputMinValue: 'Minimum Value',
    customInputMaxValue: 'Maximum Value',
    customInputsRequiredError:
      'At least one custom input is required when client input is enabled.',
    customInputDuplicateName: 'Internal field name must be unique within this service.',
    customInputDuplicateOrder: 'Order number must be unique within this service.',
    customInputMinLengthError: 'Minimum length must be 0 or greater.',
    customInputMaxLengthError: 'Maximum length must be between 1 and 3000.',
    customInputLengthRangeError: 'Maximum length must be greater than or equal to minimum length.',
    customInputValueRangeError: 'Maximum value must be greater than or equal to minimum value.',
    customInputStartWithMaxLength: 'Start with prefix cannot exceed 100 characters.',
    customInputOrderMinError: 'Order must be greater than 0.',
    noCustomInputs: 'No custom inputs configured.',
    customInputDetails: 'Required Customer Inputs',
  },
};
