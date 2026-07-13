import { AppLanguage } from '../../../shared/models/app-language.model';

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
  readonly lifecycleDeleteBody: string;
  readonly lifecycleRestoreBody: string;
  readonly lifecycleDeleteParentWarning: string;
  readonly lifecycleRestoreOperationalWarning: string;
  readonly lifecycleDeleting: string;
  readonly lifecycleRestoring: string;
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
    title: 'خدمات الفرع',
    description: 'عرض الخدمات المسندة للفرع وإسناد خدمات موجودة أو إنشاء شجرة مملوكة للفرع.',
    branchServicesTitle: 'شجرة خدمات الفرع',
    branchSelector: 'الفرع',
    selectBranch: 'اختر فرعًا',
    activeBranch: 'الفرع الحالي',
    refresh: 'تحديث',
    loading: 'جاري التحميل...',
    noBranchSelected: 'اختر فرعًا لعرض خدماته.',
    noServices: 'لا توجد خدمات مسندة لهذا الفرع.',
    addServices: 'إضافة خدمات',
    createBranchTree: 'إنشاء شجرة للفرع',
    assignTitle: 'إسناد خدمات موجودة',
    assignDescription: 'اختر خدمات Leaf فعالة فقط. سيضيف النظام المسار الأبوي تلقائيًا.',
    createTreeTitle: 'إنشاء شجرة خدمات للفرع',
    createTreeDescription: 'كل العناصر ستنشأ كـ BranchScoped ومملوكة للفرع الحالي.',
    createLeafTitle: 'إنشاء خدمة فرعية',
    createLeafDescription: 'سيتم إنشاء خدمة واحدة تحت الخدمة المركزية وإرسالها للمراجعة.',
    createSubtreeTitle: 'إضافة خدمة فرعية',
    createSubtreeDescription: 'سيتم إنشاء الخدمة الجديدة كفرع مباشر تحت الخدمة المحددة.',
    createSubtreeUnder: 'تحت الخدمة',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    assign: 'إسناد',
    unassign: 'إلغاء الربط',
    unassigning: 'جارٍ إلغاء الربط...',
    unassignConfirmTitle: 'تأكيد إلغاء ربط الخدمة',
    unassignConfirmBody: 'قد تؤدي العملية إلى إزالة روابط الخدمات الأب غير المستخدمة من هذا الفرع تلقائيًا.',
    unassignPreserveDefinition: 'سيتم حذف علاقات الربط فقط. لن يتم حذف تعريف الخدمة أو تعديلها في أي فرع آخر.',
    unassignSuccess: 'تم إلغاء ربط {service} وإزالة {count} من روابط الخدمات.',
    lifecycleDeleteTitle: 'تأكيد حذف خدمة الفرع',
    lifecycleRestoreTitle: 'تأكيد استعادة خدمة الفرع',
    lifecycleDeleteBody: 'سيتم حذف تعريف الخدمة المحددة حذفًا منطقيًا مع الحفاظ على ربطها بالفرع وعلاقاتها الحالية.',
    lifecycleRestoreBody: 'سيتم استعادة الخدمة المحددة فقط دون استعادة أي أب أو ابن محذوف تلقائيًا.',
    lifecycleDeleteParentWarning: 'لن يتم حذف الأبناء أو تعطيلهم مباشرة، لكنهم سيصبحون غير فعالين تشغيليًا حتى استعادة وتفعيل المسار الأبوي.',
    lifecycleRestoreOperationalWarning: 'قد تظل الخدمة غير فعالة تشغيليًا إذا كان أحد الآباء ما زال محذوفًا أو غير نشط.',
    lifecycleDeleting: 'جارٍ حذف الخدمة...',
    lifecycleRestoring: 'جارٍ استعادة الخدمة...',
    lifecycleActionUnavailable: 'هذا الإجراء متاح فقط لخدمة BranchScoped مملوكة للفرع الحالي.',
    selectedCount: 'عدد الخدمات المحددة',
    createdAssignments: 'علاقات جديدة',
    existingAssignments: 'علاقات موجودة',
    noSelectableLeaves: 'لا توجد خدمات Leaf متاحة للاختيار.',
    invalidSelection: 'اختر خدمة Leaf فعالة واحدة على الأقل.',
    accessDenied: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
    fallbackSuccess: 'تمت العملية بنجاح.',
    fallbackError: 'حدث خطأ غير متوقع.',
    branchNotFound: 'الفرع غير موجود أو لم يعد متاحًا.',
    arabicName: 'الاسم العربي',
    englishName: 'الاسم الإنجليزي',
    arabicUserMessage: 'رسالة المستخدم بالعربي',
    englishUserMessage: 'رسالة المستخدم بالإنجليزي',
    orderNo: 'الترتيب',
    priority: 'الأولوية',
    ticketIssuable: 'تصدر تذاكر',
    clientInputRequired: 'يتطلب إدخال من العميل',
    hasReservation: 'يدعم الحجز',
    rangePrefix: 'بادئة الرقم',
    rangeStartNumber: 'بداية النطاق',
    rangeEndNumber: 'نهاية النطاق',
    waitingDuration: 'مدة الانتظار',
    noOfTicketCopies: 'عدد نسخ التذكرة',
    addChild: 'إضافة فرعي',
    removeNode: 'حذف العنصر',
    rootRequired: 'يجب إدخال بيانات الجذر.',
    requiredField: 'هذا الحقل مطلوب.',
    duplicateSiblingName: 'لا يمكن تكرار اسم بين عناصر نفس المستوى.',
    ticketParentError: 'العنصر الذي يحتوي على أبناء لا يمكنه إصدار تذاكر.',
    ticketSettingsRequired: 'إعدادات التذكرة مطلوبة للخدمة التي تصدر تذاكر.',
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
    lifecycleDeleteBody: 'The selected service definition will be soft deleted while its branch assignment and existing relationships are preserved.',
    lifecycleRestoreBody: 'Only the selected service will be restored. Deleted parents or children will not be restored automatically.',
    lifecycleDeleteParentWarning: 'Children will not be deleted or directly disabled, but they will remain operationally unavailable until their parent path is restored and active.',
    lifecycleRestoreOperationalWarning: 'The service may remain operationally unavailable while any parent is deleted or inactive.',
    lifecycleDeleting: 'Deleting service...',
    lifecycleRestoring: 'Restoring service...',
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
