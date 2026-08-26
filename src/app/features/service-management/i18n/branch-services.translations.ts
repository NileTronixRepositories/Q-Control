import { AppLanguage } from '../../../shared/models/app-language/app-language.model';

export interface BranchServicesTranslations {
  readonly title: string;
  readonly description: string;
  readonly branchServicesTitle: string;
  readonly branchSelector: string;
  readonly selectBranch: string;
  readonly activeBranch: string;
  readonly refresh: string;
  readonly loading: string;
  readonly noBranchSelected: string;
  readonly noServices: string;
  readonly addServices: string;
  readonly createBranchTree: string;
  readonly assignTitle: string;
  readonly assignDescription: string;
  readonly createTreeTitle: string;
  readonly createTreeDescription: string;
  readonly createLeafTitle: string;
  readonly createLeafDescription: string;
  readonly createSubtreeTitle: string;
  readonly createSubtreeDescription: string;
  readonly createSubtreeUnder: string;
  readonly close: string;
  readonly cancel: string;
  readonly save: string;
  readonly assign: string;
  readonly unassign: string;
  readonly unassigning: string;
  readonly unassignConfirmTitle: string;
  readonly unassignConfirmBody: string;
  readonly unassignPreserveDefinition: string;
  readonly unassignSuccess: string;
  readonly lifecycleDeleteTitle: string;
  readonly lifecycleRestoreTitle: string;
  readonly lifecyclePermanentDeleteTitle: string;
  readonly lifecycleDeleteBody: string;
  readonly lifecycleRestoreBody: string;
  readonly lifecyclePermanentDeleteBody: string;
  readonly lifecycleDeleteParentWarning: string;
  readonly lifecycleRestoreOperationalWarning: string;
  readonly lifecycleDeleting: string;
  readonly lifecycleRestoring: string;
  readonly lifecyclePermanentlyDeleting: string;
  readonly lifecycleActionUnavailable: string;
  readonly selectedCount: string;
  readonly createdAssignments: string;
  readonly existingAssignments: string;
  readonly noSelectableLeaves: string;
  readonly invalidSelection: string;
  readonly accessDenied: string;
  readonly fallbackSuccess: string;
  readonly fallbackError: string;
  readonly branchNotFound: string;
  readonly arabicName: string;
  readonly englishName: string;
  readonly serviceCode: string;
  readonly serviceCodeRequired: string;
  readonly serviceCodeRequiredError: string;
  readonly serviceCodeMustBeEmpty: string;
  readonly serviceCodeMaxLength: string;
  readonly duplicateServiceCodeInTree: string;
  readonly serviceCodeAlreadyExists: string;
  readonly arabicUserMessage: string;
  readonly englishUserMessage: string;
  readonly orderNo: string;
  readonly priority: string;
  readonly ticketIssuable: string;
  readonly clientInputRequired: string;
  readonly hasReservation: string;
  readonly rangePrefix: string;
  readonly rangeStartNumber: string;
  readonly rangeEndNumber: string;
  readonly waitingDuration: string;
  readonly noOfTicketCopies: string;
  readonly addChild: string;
  readonly removeNode: string;
  readonly rootRequired: string;
  readonly requiredField: string;
  readonly duplicateSiblingName: string;
  readonly ticketParentError: string;
  readonly ticketSettingsRequired: string;
}

export const BRANCH_SERVICES_TRANSLATIONS: Record<AppLanguage, BranchServicesTranslations> = {
  ar: {
    title: 'خدمات الفروع',
    description: 'عرض خدمات الفرع المسندة، أو إسناد خدمات موجودة، أو إنشاء شجرة خدمات مملوكة للفرع.',
    branchServicesTitle: 'شجرة خدمات الفرع',
    branchSelector: 'الفرع',
    selectBranch: 'اختر فرعًا',
    activeBranch: 'الفرع النشط',
    refresh: 'تحديث',
    loading: 'جاري التحميل...',
    noBranchSelected: 'اختر فرعًا لعرض خدماته.',
    noServices: 'لا توجد خدمات مسندة إلى هذا الفرع.',
    addServices: 'إضافة خدمات',
    createBranchTree: 'إنشاء شجرة فرع',
    assignTitle: 'إسناد خدمات موجودة',
    assignDescription: 'اختر الخدمات الطرفية النشطة فقط. سيتم إسناد مسارات الخدمات الرئيسية تلقائيًا.',
    createTreeTitle: 'إنشاء شجرة خدمات للفرع',
    createTreeDescription: 'سيتم إنشاء جميع العناصر كنطاق خاص بالفرع ومملوكة للفرع النشط.',
    createLeafTitle: 'إنشاء خدمة طرفية',
    createLeafDescription: 'سيتم إنشاء خدمة واحدة تحت الخدمة العامة الرئيسية وإرسالها للمراجعة.',
    createSubtreeTitle: 'إضافة شجرة خدمات فرعية للفرع',
    createSubtreeDescription: 'أنشئ خدمة جديدة مملوكة للفرع تحت الخدمة الرئيسية المحددة.',
    createSubtreeUnder: 'تحت الخدمة',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    assign: 'إسناد',
    unassign: 'إلغاء الإسناد',
    unassigning: 'جاري إلغاء الإسناد...',
    unassignConfirmTitle: 'تأكيد إلغاء إسناد الخدمة',
    unassignConfirmBody: 'قد يؤدي ذلك أيضًا إلى إزالة إسنادات الخدمات الرئيسية غير المستخدمة من هذا الفرع تلقائيًا.',
    unassignPreserveDefinition: 'سيتم إزالة إسنادات الفرع فقط. لن يتم تغيير تعريف الخدمة أو الفروع الأخرى.',
    unassignSuccess: 'تم إلغاء إسناد {service} وإزالة {count} إسناد خدمة.',
    lifecycleDeleteTitle: 'تأكيد حذف خدمة الفرع',
    lifecycleRestoreTitle: 'تأكيد استعادة خدمة الفرع',
    lifecyclePermanentDeleteTitle: 'حذف الخدمة نهائيًا',
    lifecycleDeleteBody: 'سيتم حذف تعريف الخدمة المحددة حذفًا مؤقتًا مع الحفاظ على إسناد الفرع والعلاقات الحالية.',
    lifecycleRestoreBody: 'سيتم استعادة الخدمة المحددة فقط. لن تتم استعادة الخدمات الرئيسية أو الفرعية المحذوفة تلقائيًا.',
    lifecyclePermanentDeleteBody: 'سيؤدي هذا الإجراء إلى حذف الخدمة نهائيًا. قد تتم إزالة إسناد الفرع والجدول والمواعيد وسجلات صور الخدمة أيضًا. لا يمكن التراجع عن هذا الإجراء.',
    lifecycleDeleteParentWarning: 'لن يتم حذف الخدمات الفرعية أو تعطيلها مباشرة، لكنها ستظل غير متاحة تشغيليًا حتى تتم استعادة مسار الخدمة الرئيسية وتفعيله.',
    lifecycleRestoreOperationalWarning: 'قد تظل الخدمة غير متاحة تشغيليًا إذا كانت أي خدمة رئيسية محذوفة أو غير نشطة.',
    lifecycleDeleting: 'جاري حذف الخدمة...',
    lifecycleRestoring: 'جاري استعادة الخدمة...',
    lifecyclePermanentlyDeleting: 'جاري الحذف النهائي...',
    lifecycleActionUnavailable: 'هذا الإجراء متاح فقط للخدمة الخاصة بالفرع والمملوكة للفرع النشط.',
    selectedCount: 'الخدمات المحددة',
    createdAssignments: 'الإسنادات الجديدة',
    existingAssignments: 'الإسنادات الحالية',
    noSelectableLeaves: 'لا توجد خدمات طرفية متاحة للاختيار.',
    invalidSelection: 'اختر خدمة طرفية نشطة واحدة على الأقل.',
    accessDenied: 'تم رفض الوصول.',
    fallbackSuccess: 'تمت العملية بنجاح.',
    fallbackError: 'حدث خطأ غير متوقع.',
    branchNotFound: 'لم يتم العثور على الفرع أو لم يعد متاحًا.',
    arabicName: 'الاسم العربي',
    englishName: 'الاسم الإنجليزي',
    serviceCode: 'كود الخدمة',
    serviceCodeRequired: 'كود الخدمة مطلوب',
    serviceCodeRequiredError: 'كود الخدمة مطلوب.',
    serviceCodeMustBeEmpty: 'يجب ترك كود الخدمة فارغًا عندما لا يكون مطلوبًا.',
    serviceCodeMaxLength: 'لا يمكن أن يتجاوز كود الخدمة 100 حرف.',
    duplicateServiceCodeInTree: 'تحتوي شجرة الخدمات على أكواد خدمات مكررة.',
    serviceCodeAlreadyExists: 'كود الخدمة المحدد مستخدم بالفعل في خدمة أخرى.',
    arabicUserMessage: 'رسالة المستخدم بالعربية',
    englishUserMessage: 'رسالة المستخدم بالإنجليزية',
    orderNo: 'الترتيب',
    priority: 'الأولوية',
    ticketIssuable: 'تصدر تذاكر',
    clientInputRequired: 'إدخال العميل مطلوب',
    hasReservation: 'تحتوي على حجز',
    rangePrefix: 'بادئة النطاق',
    rangeStartNumber: 'رقم بداية النطاق',
    rangeEndNumber: 'رقم نهاية النطاق',
    waitingDuration: 'مدة الانتظار',
    noOfTicketCopies: 'عدد نسخ التذكرة',
    addChild: 'إضافة فرع',
    removeNode: 'إزالة العنصر',
    rootRequired: 'بيانات الجذر مطلوبة.',
    requiredField: 'هذا الحقل مطلوب.',
    duplicateSiblingName: 'يجب أن تكون أسماء العناصر الشقيقة فريدة.',
    ticketParentError: 'العنصر الذي يحتوي على عناصر فرعية لا يمكنه إصدار تذاكر.',
    ticketSettingsRequired: 'إعدادات التذاكر مطلوبة للخدمات التي تصدر تذاكر.',
  },
  en: {
    title: 'Branch Services',
    description: 'View assigned branch services, assign existing services, or create a branch-owned tree.',
    branchServicesTitle: 'Branch services tree',
    branchSelector: 'Branch',
    selectBranch: 'Select a branch',
    activeBranch: 'Active branch',
    refresh: 'Refresh',
    loading: 'Loading...',
    noBranchSelected: 'Select a branch to view its services.',
    noServices: 'No services are assigned to this branch.',
    addServices: 'Add Services',
    createBranchTree: 'Create Branch Tree',
    assignTitle: 'Assign Existing Services',
    assignDescription: 'Select active leaf services only. Parent paths will be assigned automatically.',
    createTreeTitle: 'Create Branch Service Tree',
    createTreeDescription: 'All nodes will be created as BranchScoped and owned by the active branch.',
    createLeafTitle: 'Create Leaf Service',
    createLeafDescription: 'One service will be created under the global parent and sent for review.',
    createSubtreeTitle: 'Add Branch Service Subtree',
    createSubtreeDescription: 'Create a new branch-owned service under the selected parent service.',
    createSubtreeUnder: 'Under service',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    assign: 'Assign',
    unassign: 'Unassign',
    unassigning: 'Unassigning...',
    unassignConfirmTitle: 'Confirm Service Unassignment',
    unassignConfirmBody: 'This may also remove unused parent service assignments from this branch automatically.',
    unassignPreserveDefinition: 'Only branch assignments will be removed. The service definition and other branches will not be changed.',
    unassignSuccess: 'Unassigned {service} and removed {count} service assignments.',
    lifecycleDeleteTitle: 'Confirm Branch Service Deletion',
    lifecycleRestoreTitle: 'Confirm Branch Service Restore',
    lifecyclePermanentDeleteTitle: 'Permanently Delete Service',
    lifecycleDeleteBody: 'The selected service definition will be soft deleted while its branch assignment and existing relationships are preserved.',
    lifecycleRestoreBody: 'Only the selected service will be restored. Deleted parents or children will not be restored automatically.',
    lifecyclePermanentDeleteBody: 'This action permanently removes the service. Its branch assignment, schedule, time slots, and service image records may also be removed. This action cannot be undone.',
    lifecycleDeleteParentWarning: 'Children will not be deleted or directly disabled, but they will remain operationally unavailable until their parent path is restored and active.',
    lifecycleRestoreOperationalWarning: 'The service may remain operationally unavailable while any parent is deleted or inactive.',
    lifecycleDeleting: 'Deleting service...',
    lifecycleRestoring: 'Restoring service...',
    lifecyclePermanentlyDeleting: 'Deleting permanently...',
    lifecycleActionUnavailable: 'This action is available only for a BranchScoped service owned by the active branch.',
    selectedCount: 'Selected services',
    createdAssignments: 'New assignments',
    existingAssignments: 'Existing assignments',
    noSelectableLeaves: 'No selectable leaf services are available.',
    invalidSelection: 'Select at least one active leaf service.',
    accessDenied: 'You do not have permission for this action.',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    branchNotFound: 'Branch was not found or is no longer available.',
    arabicName: 'Arabic Name',
    englishName: 'English Name',
    serviceCode: 'Service Code',
    serviceCodeRequired: 'Service Code Required',
    serviceCodeRequiredError: 'Service code is required.',
    serviceCodeMustBeEmpty: 'Service code must be empty when it is not required.',
    serviceCodeMaxLength: 'Service code cannot exceed 100 characters.',
    duplicateServiceCodeInTree: 'The service tree contains duplicate service codes.',
    serviceCodeAlreadyExists: 'The specified service code is already used by another service.',
    arabicUserMessage: 'Arabic User Message',
    englishUserMessage: 'English User Message',
    orderNo: 'Order',
    priority: 'Priority',
    ticketIssuable: 'Ticket Issuable',
    clientInputRequired: 'Client Input Required',
    hasReservation: 'Has Reservation',
    rangePrefix: 'Range Prefix',
    rangeStartNumber: 'Range Start Number',
    rangeEndNumber: 'Range End Number',
    waitingDuration: 'Waiting Duration',
    noOfTicketCopies: 'Ticket Copies',
    addChild: 'Add Child',
    removeNode: 'Remove Node',
    rootRequired: 'Root data is required.',
    requiredField: 'This field is required.',
    duplicateSiblingName: 'Sibling names must be unique.',
    ticketParentError: 'A node with children cannot issue tickets.',
    ticketSettingsRequired: 'Ticket settings are required for ticket-issuable services.',
  },
};
