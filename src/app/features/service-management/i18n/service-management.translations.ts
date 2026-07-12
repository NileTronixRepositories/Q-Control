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
  readonly removeLogo: string;
  readonly chooseLogo: string;
  readonly allowedLogoTypes: string;
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
  readonly invalidLogo: string;
  readonly deleteConfirmTitle: string;
  readonly restoreConfirmTitle: string;
  readonly removeLogoConfirmTitle: string;
  readonly deleteConfirmBody: string;
  readonly restoreConfirmBody: string;
  readonly removeLogoConfirmBody: string;
  readonly deleteChildrenWarning: string;
  readonly restoredButDisabled: string;
  readonly yes: string;
  readonly no: string;
  readonly notAvailable: string;
  readonly scope: string;
  readonly globalScope: string;
  readonly branchScopedScope: string;
  readonly ownerBranch: string;
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
}

export const SERVICE_MANAGEMENT_TRANSLATIONS: Record<AppLanguage, ServiceManagementTranslations> = {
  ar: {
    title: 'إدارة الخدمات',
    description: 'إدارة كتالوج الخدمات والهيكل وإعدادات إصدار التذاكر.',
    listTab: 'قائمة الخدمات',
    treeTab: 'شجرة الخدمات',
    addService: 'إضافة خدمة',
    addRootService: 'إضافة خدمة رئيسية',
    addChildService: 'إضافة خدمة فرعية',
    serviceHierarchy: 'شجرة الخدمات',
    treeRoot: 'الخدمات',
    selectedService: 'الخدمة المحددة',
    editorEmptyTitle: 'اختر خدمة أو أنشئ خدمة جديدة',
    editorEmptyBody: 'استخدم الشجرة لإضافة خدمة رئيسية أو اضغط + بجانب أي خدمة لإضافة خدمة فرعية.',
    createUnder: 'يتم الإنشاء تحت',
    searchPlaceholder: 'ابحث بالاسم العربي أو الإنجليزي',
    activeFilter: 'الحالة',
    deletedFilter: 'الحذف',
    ticketFilter: 'إصدار التذاكر',
    parentFilter: 'الخدمة الرئيسية',
    all: 'الكل',
    active: 'نشطة',
    inactive: 'غير نشطة',
    deleted: 'محذوفة',
    notDeleted: 'غير محذوفة',
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
    restore: 'استرجاع',
    details: 'تفاصيل الخدمة',
    createTitle: 'إنشاء خدمة',
    editTitle: 'تعديل خدمة',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    basicInfo: 'البيانات الأساسية',
    hierarchy: 'الهيكل',
    ticketBehavior: 'سلوك التذكرة',
    ordering: 'الترتيب والأولوية',
    ticketNumbers: 'إعدادات رقم التذكرة',
    arabicUserMessage: 'رسالة المستخدم بالعربي',
    englishUserMessage: 'رسالة المستخدم بالإنجليزي',
    noParent: 'بدون خدمة رئيسية',
    clientInputRequired: 'يتطلب إدخال من العميل',
    hasReservation: 'يدعم الحجز',
    categoryOnly: 'تصنيف فقط',
    rangePrefix: 'بادئة الرقم',
    rangeStartNumber: 'بداية النطاق',
    rangeEndNumber: 'نهاية النطاق',
    waitingDuration: 'مدة الانتظار',
    noOfTicketCopies: 'عدد نسخ التذكرة',
    uploadLogo: 'رفع الشعار',
    removeLogo: 'حذف الشعار',
    chooseLogo: 'اختر صورة',
    allowedLogoTypes: 'PNG أو JPG أو JPEG أو WEBP فقط.',
    includeInactive: 'إظهار غير النشطة',
    includeDeleted: 'إظهار المحذوفة',
    expand: 'فتح',
    collapse: 'طي',
    requiredField: 'هذا الحقل مطلوب.',
    maxLength100: 'الحد الأقصى 100 حرف.',
    maxLength500: 'الحد الأقصى 500 حرف.',
    maxLength10: 'الحد الأقصى 10 أحرف.',
    minZero: 'القيمة يجب أن تكون 0 أو أكثر.',
    copiesMin: 'عدد النسخ يجب أن يكون أكبر من 0.',
    rangeInvalid: 'نهاية النطاق يجب أن تكون أكبر من أو تساوي البداية.',
    ticketRequired: 'يجب تحديد هل الخدمة تصدر تذاكر أم لا.',
    childTicketDisabled: 'الخدمة التي تحتوي على خدمات فرعية لا يمكنها إصدار تذاكر.',
    fallbackSuccess: 'تمت العملية بنجاح.',
    fallbackError: 'حدث خطأ غير متوقع.',
    accessDenied: 'الصلاحية المطلوبة غير كافية.',
    noPermissionHint: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
    concurrencyError: 'تم تعديل السجل بواسطة مستخدم آخر. برجاء التحديث والمحاولة مرة أخرى.',
    invalidLogo: 'ملف الشعار غير مدعوم أو فارغ.',
    deleteConfirmTitle: 'تأكيد حذف الخدمة',
    restoreConfirmTitle: 'تأكيد استرجاع الخدمة',
    removeLogoConfirmTitle: 'تأكيد حذف الشعار',
    deleteConfirmBody: 'هل أنت متأكد من حذف هذه الخدمة؟',
    restoreConfirmBody: 'هل أنت متأكد من استرجاع هذه الخدمة؟',
    removeLogoConfirmBody: 'هل أنت متأكد من حذف شعار هذه الخدمة؟',
    deleteChildrenWarning: 'هذه الخدمة تحتوي على خدمات فرعية. حذفها لن يحذف الخدمات الفرعية، لكنها لن تتمكن من إصدار تذاكر طالما الخدمة الرئيسية محذوفة.',
    restoredButDisabled: 'تم استرجاع الخدمة بنجاح، لكنها ما زالت غير فعالة تشغيليًا لأن الخدمة الرئيسية غير فعالة أو محذوفة.',
    yes: 'نعم',
    no: 'لا',
    notAvailable: '-',
    scope: 'النطاق',
    globalScope: 'عام',
    branchScopedScope: 'مملوك لفرع',
    ownerBranch: 'الفرع المالك',
    assignedToCurrentBranch: 'مسند للفرع الحالي',
    notAssignedToCurrentBranch: 'غير مسند للفرع الحالي',
    ownedByCurrentBranch: 'مملوك للفرع الحالي',
    serviceCentral: 'Service Central',
    scopeFilter: 'نطاق الخدمة',
    ownerBranchFilter: 'كود الفرع المالك',
    assignedFilter: 'الإسناد للفرع الحالي',
    branchAssignmentTitle: 'Branch service assignment',
    branchAssignmentDescription: 'Drag active leaf services into the branch tree to assign them.',
    branchAssignmentSourceTitle: 'Service Central',
    branchAssignmentTargetTitle: 'Assigned branch services',
    branchAssignmentDropHint: 'Drop a service here to assign it to the branch.',
    branchAssignmentInvalidLeaf: 'Only active leaf services can be assigned.',
    branchAssignmentMissingBranch: 'No active branch is available for assignment.',
    branchAssignmentAlreadyAssigned: 'This service is already assigned to the branch.',
  },
  en: {
    title: 'Service Management',
    description: 'Manage the service catalog, hierarchy, and ticket issuance settings.',
    listTab: 'Service List',
    treeTab: 'Service Tree',
    addService: 'Add Service',
    addRootService: 'Add Root Service',
    addChildService: 'Add Child Service',
    serviceHierarchy: 'Services Tree',
    treeRoot: 'Services',
    selectedService: 'Selected service',
    editorEmptyTitle: 'Select a service or create a new one',
    editorEmptyBody: 'Use the tree to add a root service, or press + next to any service to add a child service.',
    createUnder: 'Creating under',
    searchPlaceholder: 'Search Arabic or English name',
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
    removeLogo: 'Remove Logo',
    chooseLogo: 'Choose image',
    allowedLogoTypes: 'PNG, JPG, JPEG, or WEBP only.',
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
    concurrencyError: 'The record was modified by another user. Please refresh and try again.',
    invalidLogo: 'Logo file is unsupported or empty.',
    deleteConfirmTitle: 'Delete Service',
    restoreConfirmTitle: 'Restore Service',
    removeLogoConfirmTitle: 'Remove Logo',
    deleteConfirmBody: 'Are you sure you want to delete this service?',
    restoreConfirmBody: 'Are you sure you want to restore this service?',
    removeLogoConfirmBody: 'Are you sure you want to remove this service logo?',
    deleteChildrenWarning: 'This service has child services. Deleting it will not delete the children, but they will not be able to issue tickets while this parent is deleted.',
    restoredButDisabled: 'Service restored successfully, but it is still not operational because its parent service is inactive or deleted.',
    yes: 'Yes',
    no: 'No',
    notAvailable: '-',
    scope: 'Scope',
    globalScope: 'Global',
    branchScopedScope: 'Branch Scoped',
    ownerBranch: 'Owner Branch',
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
  },
};
