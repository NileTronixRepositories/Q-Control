export interface SegmentTranslations {
  readonly title: string;
  readonly description: string;
  readonly globalSegments: string;
  readonly branchScopedSegments: string;
  readonly defaultSegment: string;
  readonly systemDefault: string;
  readonly scopeGlobal: string;
  readonly scopeBranchScoped: string;
  readonly arabicName: string;
  readonly englishName: string;
  readonly priority: string;
  readonly scope: string;
  readonly ownerBranch: string;
  readonly createdOn: string;
  readonly modifiedOn: string;
  readonly actions: string;
  readonly searchPlaceholder: string;
  readonly filterScope: string;
  readonly filterBranch: string;
  readonly filterPriority: string;
  readonly allScopes: string;
  readonly allBranches: string;
  readonly createGlobalSegment: string;
  readonly createBranchSegment: string;
  readonly editSegment: string;
  readonly viewDetails: string;
  readonly assignedLeafServicesCount: string;
  readonly pendingGlobalizationRequest: string;
  readonly viewPendingRequest: string;
  readonly save: string;
  readonly cancel: string;
  readonly close: string;
  readonly loading: string;
  readonly emptySegments: string;
  readonly serviceSegmentsTitle: string;
  readonly serviceCapacity: string;
  readonly allocatedQuota: string;
  readonly remainingQuota: string;
  readonly serviceRange: string;
  readonly assignSegments: string;
  readonly editQuota: string;
  readonly unassignSegment: string;
  readonly confirmUnassignTitle: string;
  readonly confirmUnassignMessage: string;
  readonly confirmApproveTitle: string;
  readonly confirmApproveMessage: string;
  readonly technicalRequestsTitle: string;
  readonly branchRequestsTitle: string;
  readonly requestId: string;
  readonly status: string;
  readonly requestedBy: string;
  readonly requestedOn: string;
  readonly reviewedBy: string;
  readonly reviewedOn: string;
  readonly rejectionReason: string;
  readonly approve: string;
  readonly reject: string;
  readonly pending: string;
  readonly approved: string;
  readonly rejected: string;
  readonly quotaExceedsRemaining: string;
  readonly rangeSmallerThanAllocatedQuotas: string;
  readonly concurrencyError: string;
  readonly noAvailableSegments: string;
  readonly selectSegmentsToAdd: string;
  readonly  quota: string;
  readonly assignedSegmentsList: string;
  readonly protected: string;
  readonly selectedTotal: string;
}

export const SEGMENT_TRANSLATIONS_AR: SegmentTranslations = {
  title: 'إدارة الشرائح (Segments)',
  description: 'إدارة وتصنيف الخدمات التشغيلية وتخصيص الحصص للشرائح داخل الفروع.',
  globalSegments: 'شرائح عامة',
  branchScopedSegments: 'شرائح الفرع',
  defaultSegment: 'الشريحة الافتراضية',
  systemDefault: 'افتراضي النظام',
  scopeGlobal: 'عامة (Global)',
  scopeBranchScoped: 'خاصة بالفرع (Branch-Scoped)',
  arabicName: 'الاسم بالعربية',
  englishName: 'الاسم بالإنجليزية',
  priority: 'الأولوية',
  scope: 'النطاق',
  ownerBranch: 'الفرع المالك',
  createdOn: 'تاريخ الإنشاء',
  modifiedOn: 'تاريخ التعديل',
  actions: 'الإجراءات',
  searchPlaceholder: 'بحث بالاسم العربي أو الإنجليزي...',
  filterScope: 'تصفية حسب النطاق',
  filterBranch: 'تصفية حسب الفرع',
  filterPriority: 'تصفية حسب الأولوية',
  allScopes: 'جميع النطاقات',
  allBranches: 'جميع الفروع',
  createGlobalSegment: 'إنشاء شريحة عامة',
  createBranchSegment: 'إنشاء شريحة للفرع',
  editSegment: 'تعديل الشريحة',
  viewDetails: 'عرض التفاصيل',
  assignedLeafServicesCount: 'عدد الخدمات المربوطة',
  pendingGlobalizationRequest: 'طلب تعميم قيد الانتظار',
  viewPendingRequest: 'عرض طلب التعميم',
  save: 'حفظ',
  cancel: 'إلغاء',
  close: 'إغلاق',
  loading: 'جاري التحميل...',
  emptySegments: 'لا توجد شرائح للعرض.',
  serviceSegmentsTitle: 'شرائح الخدمة',
  serviceCapacity: 'إجمالي سعة الخدمة',
  allocatedQuota: 'الحصة المخصصة',
  remainingQuota: 'الحصة المتبقية',
  serviceRange: 'نطاق التذاكر',
  assignSegments: 'ربط شرائح جديدة',
  editQuota: 'تعديل الحصة',
  unassignSegment: 'إزالة الربط',
  confirmUnassignTitle: 'تأكيد إزالة ربط الشريحة',
  confirmUnassignMessage: 'هل أنت تأكد من إزالة هذه الشريحة من الخدمة المحددة؟ لن يتم حذف الشريحة وتعود حصتها تلقائياً للشريحة الافتراضية.',
  confirmApproveTitle: 'تأكيد الموافقة على تعميم الشريحة',
  confirmApproveMessage: 'الموافقة على هذا الطلب ستؤدي لتحويل الشريحة إلى شريحة عامة (Global) تصبح متاحة لجميع الفروع.',
  technicalRequestsTitle: 'طلبات تعميم الشرائح (الإدارة المركزية)',
  branchRequestsTitle: 'طلبات شرائح الفرع',
  requestId: 'رقم الطلب',
  status: 'الحالة',
  requestedBy: 'مقدم الطلب',
  requestedOn: 'تاريخ الطلب',
  reviewedBy: 'المراجع',
  reviewedOn: 'تاريخ المراجعة',
  rejectionReason: 'سبب الرفض',
  approve: 'موافقة وتعميم',
  reject: 'رفض',
  pending: 'قيد الانتظار',
  approved: 'تمت الموافقة',
  rejected: 'مرفوض',
  quotaExceedsRemaining: 'مجموع الحصص المختارة يتجاوز السعة المتبقية للخدمة.',
  rangeSmallerThanAllocatedQuotas: 'لا يمكن تقليل نطاق الخدمة لأن الحصص المخصصة للشرائح تتجاوز السعة الجديدة.',
  concurrencyError: 'تم تعديل البيانات بواسطة مستخدم آخر. تم تحديث البيانات بأحدث نسخة.',
  noAvailableSegments: 'لا توجد شرائح متاحة للربط حالياً.',
  selectSegmentsToAdd: 'اختر الشرائح وحدد حصة كل منها:',
  quota: 'الحصة',
  assignedSegmentsList: 'قائمة الشرائح المربوطة بالخدمة',
  protected: 'محمي',
  selectedTotal: 'إجمالي المختار',
};

export const SEGMENT_TRANSLATIONS_EN: SegmentTranslations = {
  title: 'Segment Management',
  description: 'Manage operational segments and allocate service quotas within branches.',
  globalSegments: 'Global Segments',
  branchScopedSegments: 'Branch Scoped Segments',
  defaultSegment: 'Default Segment',
  systemDefault: 'System Default',
  scopeGlobal: 'Global',
  scopeBranchScoped: 'Branch Scoped',
  arabicName: 'Arabic Name',
  englishName: 'English Name',
  priority: 'Priority',
  scope: 'Scope',
  ownerBranch: 'Owner Branch',
  createdOn: 'Created On',
  modifiedOn: 'Modified On',
  actions: 'Actions',
  searchPlaceholder: 'Search by Arabic or English name...',
  filterScope: 'Filter by Scope',
  filterBranch: 'Filter by Branch',
  filterPriority: 'Filter by Priority',
  allScopes: 'All Scopes',
  allBranches: 'All Branches',
  createGlobalSegment: 'Create Global Segment',
  createBranchSegment: 'Create Branch Segment',
  editSegment: 'Edit Segment',
  viewDetails: 'View Details',
  assignedLeafServicesCount: 'Assigned Leaf Services',
  pendingGlobalizationRequest: 'Pending Globalization Request',
  viewPendingRequest: 'View Pending Request',
  save: 'Save',
  cancel: 'Cancel',
  close: 'Close',
  loading: 'Loading...',
  emptySegments: 'No segments found.',
  serviceSegmentsTitle: 'Service Segments',
  serviceCapacity: 'Service Capacity',
  allocatedQuota: 'Allocated Quota',
  remainingQuota: 'Remaining Quota',
  serviceRange: 'Service Ticket Range',
  assignSegments: 'Assign Segments',
  editQuota: 'Edit Quota',
  unassignSegment: 'Unassign Segment',
  confirmUnassignTitle: 'Confirm Segment Unassign',
  confirmUnassignMessage: 'Are you sure you want to remove this segment from the selected service? The segment definition will not be deleted, and its quota will return to the Default Segment.',
  confirmApproveTitle: 'Confirm Segment Globalization',
  confirmApproveMessage: 'Approving this request will convert the segment to Global, making it available to all branches.',
  technicalRequestsTitle: 'Segment Globalization Requests',
  branchRequestsTitle: 'Branch Segment Requests',
  requestId: 'Request ID',
  status: 'Status',
  requestedBy: 'Requested By',
  requestedOn: 'Requested On',
  reviewedBy: 'Reviewed By',
  reviewedOn: 'Reviewed On',
  rejectionReason: 'Rejection Reason',
  approve: 'Approve',
  reject: 'Reject',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  quotaExceedsRemaining: 'Selected quotas exceed the remaining service capacity.',
  rangeSmallerThanAllocatedQuotas: 'The service range cannot be reduced because allocated segment quotas exceed the new capacity.',
  concurrencyError: 'Data was modified by another user. Reloaded latest details.',
  noAvailableSegments: 'No available segments to assign at this time.',
  selectSegmentsToAdd: 'Select segments and specify quota for each:',
  quota: 'Quota',
  assignedSegmentsList: 'Assigned Segments List',
  protected: 'Protected',
  selectedTotal: 'Selected Total',
};

