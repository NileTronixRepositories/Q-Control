import { AppLanguage } from '../../../shared/models/app-language.model';

export interface ServiceGlobalizationTranslations {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly branchRequestsTitle: string;
  readonly branchRequestsDescription: string;
  readonly centralTreeTitle: string;
  readonly centralTreeDescription: string;
  readonly requestId: string;
  readonly service: string;
  readonly requestType: string;
  readonly branch: string;
  readonly parentService: string;
  readonly servicesCount: string;
  readonly status: string;
  readonly requestedOn: string;
  readonly reviewedOn: string;
  readonly reviewedBy: string;
  readonly rejectionReason: string;
  readonly actions: string;
  readonly allStatuses: string;
  readonly allTypes: string;
  readonly allBranches: string;
  readonly search: string;
  readonly order: string;
  readonly newest: string;
  readonly oldest: string;
  readonly pageSize: string;
  readonly previous: string;
  readonly next: string;
  readonly total: string;
  readonly refresh: string;
  readonly loading: string;
  readonly empty: string;
  readonly view: string;
  readonly approve: string;
  readonly reject: string;
  readonly close: string;
  readonly cancel: string;
  readonly confirmApproveTitle: string;
  readonly confirmApproveBody: string;
  readonly rejectTitle: string;
  readonly rejectHint: string;
  readonly rejectPlaceholder: string;
  readonly pending: string;
  readonly approved: string;
  readonly rejected: string;
  readonly branchServiceTree: string;
  readonly leafUnderGlobalParent: string;
  readonly requestDetails: string;
  readonly parentSummary: string;
  readonly serviceTree: string;
  readonly global: string;
  readonly branchScoped: string;
  readonly active: string;
  readonly inactive: string;
  readonly deleted: string;
  readonly notReviewed: string;
  readonly noReason: string;
  readonly accessDenied: string;
  readonly fallbackError: string;
  readonly conflictReloaded: string;
  readonly includeInactive: string;
  readonly includeDeleted: string;
  readonly availableWhilePending: string;
  readonly requestSent: string;
  readonly openRequests: string;
  readonly createLeafTitle: string;
  readonly createLeafDescription: string;
}

export const SERVICE_GLOBALIZATION_TRANSLATIONS: Record<AppLanguage, ServiceGlobalizationTranslations> = {
  ar: {
    eyebrow: 'إدارة الخدمات المركزية',
    title: 'طلبات اعتماد الخدمات',
    description: 'راجع الخدمات التي أنشأتها الفروع واعتمدها كخدمات مركزية أو ارفضها.',
    branchRequestsTitle: 'طلبات الاعتماد المركزية',
    branchRequestsDescription: 'تابع حالة الخدمات التي أرسلها الفرع للمراجعة المركزية.',
    centralTreeTitle: 'شجرة الخدمات المركزية',
    centralTreeDescription: 'تعرض الخدمات العامة فقط من المصدر المركزي المعتمد.',
    requestId: 'رقم الطلب',
    service: 'الخدمة',
    requestType: 'نوع الطلب',
    branch: 'الفرع',
    parentService: 'الخدمة الأب',
    servicesCount: 'عدد الخدمات',
    status: 'الحالة',
    requestedOn: 'تاريخ الطلب',
    reviewedOn: 'تاريخ المراجعة',
    reviewedBy: 'تمت المراجعة بواسطة',
    rejectionReason: 'سبب الرفض',
    actions: 'الإجراءات',
    allStatuses: 'كل الحالات',
    allTypes: 'كل الأنواع',
    allBranches: 'كل الفروع',
    search: 'البحث باسم الخدمة أو الفرع',
    order: 'الترتيب',
    newest: 'الأحدث',
    oldest: 'الأقدم',
    pageSize: 'حجم الصفحة',
    previous: 'السابق',
    next: 'التالي',
    total: 'الإجمالي',
    refresh: 'تحديث',
    loading: 'جاري التحميل...',
    empty: 'لا توجد طلبات مطابقة.',
    view: 'عرض',
    approve: 'موافقة',
    reject: 'رفض',
    close: 'إغلاق',
    cancel: 'إلغاء',
    confirmApproveTitle: 'تأكيد اعتماد الطلب',
    confirmApproveBody: 'سيتم تحويل جميع خدمات الطلب إلى خدمات مركزية وإتاحتها لباقي الفروع.',
    rejectTitle: 'رفض طلب الاعتماد',
    rejectHint: 'يمكن إضافة سبب للرفض بحد أقصى 1000 حرف.',
    rejectPlaceholder: 'اكتب سبب الرفض...',
    pending: 'قيد المراجعة',
    approved: 'معتمد',
    rejected: 'مرفوض',
    branchServiceTree: 'شجرة خدمات فرع',
    leafUnderGlobalParent: 'خدمة تحت أب مركزي',
    requestDetails: 'تفاصيل طلب الاعتماد',
    parentSummary: 'الخدمة المركزية الأب',
    serviceTree: 'الخدمات داخل الطلب',
    global: 'مركزي',
    branchScoped: 'مخصص لفرع',
    active: 'نشط',
    inactive: 'غير نشط',
    deleted: 'محذوف',
    notReviewed: 'لم تتم المراجعة',
    noReason: 'لم يُذكر سبب',
    accessDenied: 'ليس لديك صلاحية لتنفيذ هذا الإجراء.',
    fallbackError: 'تعذر إكمال طلب اعتماد الخدمة.',
    conflictReloaded: 'تم تعديل الطلب بواسطة مستخدم آخر. تم تحديث البيانات.',
    includeInactive: 'إظهار غير النشطة',
    includeDeleted: 'إظهار المحذوفة',
    availableWhilePending: 'الخدمات متاحة داخل الفرع أثناء انتظار قرار الاعتماد.',
    requestSent: 'تم إنشاء الخدمة وإرسالها للمراجعة المركزية.',
    openRequests: 'عرض طلبات الاعتماد',
    createLeafTitle: 'إنشاء خدمة فرعية',
    createLeafDescription: 'سيتم إنشاء Leaf واحدة تحت الخدمة المركزية وإرسالها للمراجعة.',
  },
  en: {
    eyebrow: 'Central service management',
    title: 'Service Globalization Requests',
    description: 'Review branch-created services and approve or reject their central publication.',
    branchRequestsTitle: 'Central approval requests',
    branchRequestsDescription: 'Track the review status of services submitted by this branch.',
    centralTreeTitle: 'Central Service Tree',
    centralTreeDescription: 'Displays only approved global services from the dedicated central source.',
    requestId: 'Request ID',
    service: 'Service',
    requestType: 'Request type',
    branch: 'Branch',
    parentService: 'Parent service',
    servicesCount: 'Services',
    status: 'Status',
    requestedOn: 'Requested on',
    reviewedOn: 'Reviewed on',
    reviewedBy: 'Reviewed by',
    rejectionReason: 'Rejection reason',
    actions: 'Actions',
    allStatuses: 'All statuses',
    allTypes: 'All types',
    allBranches: 'All branches',
    search: 'Search by service or branch',
    order: 'Order',
    newest: 'Newest',
    oldest: 'Oldest',
    pageSize: 'Page size',
    previous: 'Previous',
    next: 'Next',
    total: 'Total',
    refresh: 'Refresh',
    loading: 'Loading...',
    empty: 'No matching requests.',
    view: 'View',
    approve: 'Approve',
    reject: 'Reject',
    close: 'Close',
    cancel: 'Cancel',
    confirmApproveTitle: 'Confirm request approval',
    confirmApproveBody: 'Every service in this request will become central and available to other branches.',
    rejectTitle: 'Reject globalization request',
    rejectHint: 'An optional rejection reason can contain up to 1000 characters.',
    rejectPlaceholder: 'Enter the rejection reason...',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    branchServiceTree: 'Branch service tree',
    leafUnderGlobalParent: 'Leaf under global parent',
    requestDetails: 'Request details',
    parentSummary: 'Global parent service',
    serviceTree: 'Services in this request',
    global: 'Global',
    branchScoped: 'Branch scoped',
    active: 'Active',
    inactive: 'Inactive',
    deleted: 'Deleted',
    notReviewed: 'Not reviewed',
    noReason: 'No reason supplied',
    accessDenied: 'You do not have permission to perform this action.',
    fallbackError: 'The service globalization request could not be completed.',
    conflictReloaded: 'Another user changed this request. The current data has been reloaded.',
    includeInactive: 'Include inactive',
    includeDeleted: 'Include deleted',
    availableWhilePending: 'The services remain available to this branch while review is pending.',
    requestSent: 'The service was created and sent for central review.',
    openRequests: 'View approval requests',
    createLeafTitle: 'Create leaf service',
    createLeafDescription: 'One leaf will be created under the global service and sent for review.',
  },
};
