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
  readonly searchLabel: string;
  readonly filterScope: string;
  readonly filterBranch: string;
  readonly filterPriority: string;
  readonly filterTitle: string;
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
  readonly totalSegments: string;
  readonly refresh: string;
  readonly none: string;
  readonly priorityFixedHint: string;
  readonly priorityHelpText: string;
  readonly nameRequired: string;
  readonly nameMaxLength: string;
  readonly priorityNonNegative: string;
  readonly itemsCount: string;
  readonly pageLabel: string;
  readonly ofLabel: string;
  readonly prevPage: string;
  readonly nextPage: string;
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
  readonly segment: string;
  readonly allStatuses: string;
  readonly requestsCount: string;
  readonly noRequests: string;
  readonly viewAndReview: string;
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
  readonly quota: string;
  readonly assignedSegmentsList: string;
  readonly protected: string;
  readonly selectedTotal: string;
  readonly cannotIssueTicketTitle?: string;
  readonly cannotIssueTicketDesc?: string;
  readonly cannotIssueTicketBadge?: string;
  readonly retry?: string;
  readonly loadError?: string;
}

export const SEGMENT_TRANSLATIONS_AR: SegmentTranslations = {
  title: 'إدارة الشرائح',
  description: 'إدارة وتصنيف الخدمات التشغيلية وتخصيص الحصص للشرائح داخل الفروع.',
  globalSegments: 'شرائح عامة',
  branchScopedSegments: 'شرائح الفرع',
  defaultSegment: 'الشريحة الافتراضية',
  systemDefault: 'افتراضي النظام',
  scopeGlobal: 'عامة',
  scopeBranchScoped: 'خاصة بالفرع',
  arabicName: 'الاسم بالعربية',
  englishName: 'الاسم بالإنجليزية',
  priority: 'الأولوية',
  scope: 'النطاق',
  ownerBranch: 'الفرع المالك',
  createdOn: 'تاريخ الإنشاء',
  modifiedOn: 'تاريخ التعديل',
  actions: 'الإجراءات',
  searchPlaceholder: 'بحث بالاسم العربي أو الإنجليزي...',
  searchLabel: 'بحث في الشرائح',
  filterScope: 'تصفية حسب النطاق',
  filterBranch: 'تصفية حسب الفرع',
  filterPriority: 'تصفية حسب الأولوية',
  filterTitle: 'تصفية وبحث الشرائح',
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
  totalSegments: 'إجمالي الشرائح',
  refresh: 'تحديث',
  none: 'لا يوجد',
  priorityFixedHint: 'الأولوية ثابتة عند 0 للشريحة الافتراضية للنظام ولا يمكن تعديلها.',
  priorityHelpText: 'الرقم الأعلى يعني أولوية تشغيلية أعلى (مثال: 5 أعلى من 3 وأعلى من 0).',
  nameRequired: 'هذا الحقل مطلوب.',
  nameMaxLength: 'لا يمكن أن يتجاوز 100 حرف.',
  priorityNonNegative: 'الأولوية يجب أن تكون رقماً صحيحاً أكبر من أو يساوي 0.',
  itemsCount: 'شريحة',
  pageLabel: 'صفحة',
  ofLabel: 'من',
  prevPage: 'الصفحة السابقة',
  nextPage: 'الصفحة التالية',
  serviceSegmentsTitle: 'شرائح الخدمة',
  serviceCapacity: 'إجمالي سعة الخدمة',
  allocatedQuota: 'الحصة المخصصة',
  remainingQuota: 'الحصة المتبقية',
  serviceRange: 'نطاق التذاكر',
  assignSegments: 'ربط شرائح جديدة',
  editQuota: 'تعديل الحصة',
  unassignSegment: 'إزالة الربط',
  confirmUnassignTitle: 'تأكيد إزالة ربط الشريحة',
  confirmUnassignMessage: 'هل أنت متأكد من إزالة هذه الشريحة من الخدمة المحددة؟ لن يتم حذف الشريحة وتعود حصتها تلقائياً للشريحة الافتراضية.',
  confirmApproveTitle: 'تأكيد الموافقة على تعميم الشريحة',
  confirmApproveMessage: 'الموافقة على هذا الطلب ستؤدي لتحويل الشريحة إلى شريحة عامة تصبح متاحة لجميع الفروع.',
  technicalRequestsTitle: 'طلبات تعميم الشرائح',
  branchRequestsTitle: 'طلبات شرائح الفرع',
  segment: 'الشريحة',
  allStatuses: 'جميع الحالات',
  requestsCount: 'طلب',
  noRequests: 'لا توجد طلبات تطابق معايير البحث الحالية.',
  viewAndReview: 'عرض ومراجعة',
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
  cannotIssueTicketTitle: 'هذه الخدمة لا تصدر تذاكر',
  cannotIssueTicketDesc: 'تم ضبط هذه الخدمة كخدمة لا تصدر تذاكر، لذلك لا يمكن تخصيص نطاق أرقام أو ربط وإدارة شرائح بها. يمكنك تفعيل خيار إصدار التذاكر من شاشة إعدادات وتعديل الخدمة.',
  cannotIssueTicketBadge: 'لا يمكن إصدار تذكرة',
  retry: 'إعادة المحاولة',
  loadError: 'حدث خطأ أثناء تحميل بيانات الشرائح',
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
  searchLabel: 'Search Segments',
  filterScope: 'Filter by Scope',
  filterBranch: 'Filter by Branch',
  filterPriority: 'Filter by Priority',
  filterTitle: 'Filter & Search Segments',
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
  totalSegments: 'Total Segments',
  refresh: 'Refresh',
  none: 'None',
  priorityFixedHint: 'Priority is fixed to 0 for system default segment and cannot be modified.',
  priorityHelpText: 'Higher priority number = Higher business priority (e.g. 5 > 3 > 0).',
  nameRequired: 'This field is required.',
  nameMaxLength: 'Cannot exceed 100 characters.',
  priorityNonNegative: 'Priority must be an integer >= 0.',
  itemsCount: 'items',
  pageLabel: 'Page',
  ofLabel: 'of',
  prevPage: 'Previous Page',
  nextPage: 'Next Page',
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
  segment: 'Segment',
  allStatuses: 'All Statuses',
  requestsCount: 'requests',
  noRequests: 'No requests match the current filters.',
  viewAndReview: 'View & Review',
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
  cannotIssueTicketTitle: 'This Service Cannot Issue Tickets',
  cannotIssueTicketDesc: 'This service is configured not to issue tickets, so ticket ranges and segments cannot be assigned. You can enable ticket issuing from the service settings.',
  cannotIssueTicketBadge: 'Cannot Issue Ticket',
  retry: 'Retry',
  loadError: 'An error occurred while loading service segments',
};
