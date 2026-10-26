import { AppLanguage } from '../../../shared/models/app-language/app-language.model';

export interface ServiceWorkflowTranslations {
  readonly title: string;
  readonly description: string;
  readonly branch: string;
  readonly selectBranch: string;
  readonly selectBranchFirst: string;
  readonly invalidWorkflowScope: string;
  readonly backToWorkflowSelection: string;
  readonly backToBranchServices: string;
  readonly changeWorkflowScope: string;
  readonly changeService: string;
  readonly manageWorkflows: string;
  readonly workflowOwner: string;
  readonly autoAppliedWorkflow: string;
  readonly workflowList: string;
  readonly sortOrder: string;
  readonly newest: string;
  readonly oldest: string;
  readonly defaultWorkflow: string;
  readonly setDefault: string;
  readonly confirmSetDefaultTitle: string;
  readonly confirmSetDefaultBody: string;
  readonly defaultCannotDeactivate: string;
  readonly ineligibleOwnerService: string;
  readonly searchCandidates: string;
  readonly candidateSearchPlaceholder: string;
  readonly candidateSearchHelp: string;
  readonly allParents: string;
  readonly createWorkflow: string;
  readonly editWorkflow: string;
  readonly workflowDetails: string;
  readonly filters: string;
  readonly showFilters: string;
  readonly hideFilters: string;
  readonly search: string;
  readonly status: string;
  readonly all: string;
  readonly active: string;
  readonly inactive: string;
  readonly startService: string;
  readonly pageSize: string;
  readonly refresh: string;
  readonly noWorkflows: string;
  readonly steps: string;
  readonly start: string;
  readonly created: string;
  readonly modified: string;
  readonly actions: string;
  readonly view: string;
  readonly edit: string;
  readonly deactivate: string;
  readonly reactivate: string;
  readonly previous: string;
  readonly next: string;
  readonly totalItems: string;
  readonly arabicName: string;
  readonly englishName: string;
  readonly builder: string;
  readonly candidateServices: string;
  readonly addStep: string;
  readonly removeStep: string;
  readonly moveUp: string;
  readonly moveDown: string;
  readonly selectService: string;
  readonly parent: string;
  readonly alreadyUsed: string;
  readonly ticketIssuable: string;
  readonly deleted: string;
  readonly save: string;
  readonly cancel: string;
  readonly close: string;
  readonly loading: string;
  readonly requiredField: string;
  readonly maxLength100: string;
  readonly minimumSteps: string;
  readonly stepServiceRequired: string;
  readonly fallbackSuccess: string;
  readonly fallbackError: string;
  readonly accessDenied: string;
  readonly noPermissionHint: string;
  readonly concurrencyError: string;
  readonly confirmDeactivateTitle: string;
  readonly confirmReactivateTitle: string;
  readonly confirmDeactivateBody: string;
  readonly confirmReactivateBody: string;
  readonly noCandidates: string;
  readonly duplicateAllowed: string;
  readonly differentParentsAllowed: string;
  readonly rowVersion: string;
  readonly notAvailable: string;
  readonly suggestedWorkflows: string;
  readonly suggestedWorkflowsHint: string;
  readonly autoApplyWorkflow: string;
  readonly dragWorkflowStepHint: string;
  readonly dropWorkflowStepHint: string;
  readonly dragCandidateServiceHint: string;
  readonly dropWorkflowBuilderHint: string;
  readonly noSuggestedWorkflows: string;
  readonly useWorkflow: string;
  readonly startNewWorkflow: string;
  readonly workflowStartsBeforeAnchor: string;
  readonly invalidStep: string;
  readonly matchedService: string;
  readonly serviceSelection: string;
  readonly serviceSelectionHint: string;
  readonly selectedPath: string;
  readonly currentWorkflowPath: string;
  readonly noWorkflowSteps: string;
  readonly level: string;
  readonly replaceStepMode: string;
  readonly addStepMode: string;
  readonly selectionAccessDenied: string;
  readonly noSelectionOptions: string;
  readonly serviceCannotIssueTicket: string;
  readonly selectedServiceNotFound: string;
  readonly eyebrow: string;
  readonly heroDescription: string;
  readonly schedule: string;
  readonly goToSchedule: string;
  readonly sequenceTitle: string;
  readonly firstStep: string;
  readonly finalStep: string;
  readonly intermediateStep: string;
  readonly stepOrderLabel: string;
  readonly selectServiceBannerTitle: string;
  readonly selectServiceBannerDesc: string;
  readonly servicesReady: string;
  readonly noAutoAppliedWorkflow: string;
  readonly totalCount: string;
  readonly eligibleServices: string;
  readonly searchServicesPlaceholder: string;
  readonly noEligibleServices: string;
  readonly otherServices: string;
  readonly pickServiceTitle: string;
  readonly pickServiceHint: string;
  readonly addFirstWorkflow: string;
  readonly emptyWorkflowsHint: string;
  readonly workflowFor: string;
  readonly workflowNameOptional: string;
  readonly minimumStepsHint: string;
  readonly addStepsHint: string;
}

export const SERVICE_WORKFLOW_TRANSLATIONS: Record<AppLanguage, ServiceWorkflowTranslations> = {
  ar: {
    title: 'إدارة مسارات الخدمات',
    description:
      'إنشاء وتعديل مسارات تلقائية مرتبة بين الخدمات لاستخدامها لاحقًا في إصدار التذاكر.',
    branch: 'الفرع',
    selectBranch: 'اختر الفرع',
    selectBranchFirst: 'اختر فرعًا لعرض شجرة الخدمات المؤهلة',
    invalidWorkflowScope: 'الفرع أو الخدمة المحددة غير متاحة لإدارة المسارات.',
    backToWorkflowSelection: 'العودة لاختيار الخدمة',
    backToBranchServices: 'الرجوع لخدمات الفرع',
    changeWorkflowScope: 'تغيير الفرع أو الخدمة',
    changeService: 'تغيير الخدمة',
    manageWorkflows: 'إدارة مسارات الخدمة',
    workflowOwner: 'الخدمة المالكة للمسارات',
    autoAppliedWorkflow: 'المسار المطبق تلقائيًا',
    workflowList: 'مسارات الخدمة',
    sortOrder: 'الترتيب',
    newest: 'الأحدث',
    oldest: 'الأقدم',
    defaultWorkflow: 'افتراضي',
    setDefault: 'تعيين كافتراضي',
    confirmSetDefaultTitle: 'تعيين المسار الافتراضي',
    confirmSetDefaultBody: 'هل تريد تعيين هذا المسار كافتراضي؟ سيفقد المسار الافتراضي الحالي صفته.',
    defaultCannotDeactivate:
      'لا يمكن تعطيل المسار الافتراضي. عيّن مسارًا نشطًا آخر كافتراضي أولًا.',
    ineligibleOwnerService: 'هذه الخدمة غير مؤهلة لإدارة المسارات.',
    searchCandidates: 'البحث في الخدمات المتاحة',
    candidateSearchPlaceholder:
      '\u0627\u0628\u062d\u062b \u0628\u0627\u0633\u0645 \u0627\u0644\u062e\u062f\u0645\u0629 \u0623\u0648 \u0643\u0648\u062f \u0627\u0644\u062e\u062f\u0645\u0629',
    candidateSearchHelp:
      '\u0627\u0644\u0628\u062d\u062b \u064a\u062f\u0639\u0645 \u0627\u0633\u0645 \u0627\u0644\u062e\u062f\u0645\u0629 \u0648\u0643\u0648\u062f \u0627\u0644\u062e\u062f\u0645\u0629.',
    allParents: 'كل الخدمات الرئيسية',
    createWorkflow: 'إضافة مسار',
    editWorkflow: 'تعديل المسار',
    workflowDetails: 'تفاصيل المسار',
    filters: 'الفلاتر',
    showFilters: 'إظهار الفلاتر',
    hideFilters: 'إخفاء الفلاتر',
    search: 'بحث باسم المسار',
    status: 'الحالة',
    all: 'الكل',
    active: 'نشط',
    inactive: 'غير نشط',
    startService: 'خدمة البداية',
    pageSize: 'حجم الصفحة',
    refresh: 'تحديث',
    noWorkflows: 'لا توجد مسارات مطابقة.',
    steps: 'الخطوات',
    start: 'البداية',
    created: 'تاريخ الإنشاء',
    modified: 'آخر تعديل',
    actions: 'الإجراءات',
    view: 'عرض',
    edit: 'تعديل',
    deactivate: 'تعطيل',
    reactivate: 'إعادة تفعيل',
    previous: 'السابق',
    next: 'التالي',
    totalItems: 'إجمالي العناصر',
    arabicName: 'الاسم العربي',
    englishName: 'الاسم الإنجليزي',
    builder: 'بناء المسار',
    candidateServices: 'الخدمات المتاحة',
    addStep: 'إضافة خطوة',
    removeStep: 'حذف الخطوة',
    moveUp: 'تحريك لأعلى',
    moveDown: 'تحريك لأسفل',
    selectService: 'اختر خدمة',
    parent: 'الخدمة الرئيسية',
    alreadyUsed: 'مستخدمة في مسارات أخرى',
    ticketIssuable: 'تصدر تذكرة',
    deleted: 'محذوفة',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    loading: 'جاري التحميل...',
    requiredField: 'هذا الحقل مطلوب.',
    maxLength100: 'الحد الأقصى 100 حرف.',
    minimumSteps: 'يجب إضافة خطوتين على الأقل.',
    stepServiceRequired: 'كل خطوة يجب أن تحتوي على خدمة.',
    fallbackSuccess: 'تمت العملية بنجاح.',
    fallbackError: 'حدث خطأ غير متوقع.',
    accessDenied: 'الصلاحية المطلوبة غير كافية.',
    noPermissionHint: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
    concurrencyError: 'تم تعديل المسار بواسطة مستخدم آخر. برجاء التحديث والمحاولة مرة أخرى.',
    confirmDeactivateTitle: 'تعطيل المسار',
    confirmReactivateTitle: 'إعادة تفعيل المسار',
    confirmDeactivateBody:
      'سيتم إيقاف استخدام هذا المسار في قرارات التذاكر الجديدة لاحقًا بدون حذف تعريفه أو خطواته.',
    confirmReactivateBody:
      'سيتم إعادة إتاحة هذا المسار للاستخدام. قد يرفض النظام العملية إذا كانت إحدى الخدمات غير نشطة أو محذوفة.',
    noCandidates: 'لا توجد خدمات متاحة مطابقة.',
    duplicateAllowed: 'يمكن تكرار نفس الخدمة أكثر من مرة داخل المسار.',
    differentParentsAllowed: 'يمكن اختيار خدمات من أكثر من خدمة رئيسية.',
    rowVersion: 'إصدار السجل',
    notAvailable: '-',
    suggestedWorkflows: 'مسارات موجودة تحتوي هذه الخدمة',
    suggestedWorkflowsHint: 'استخدم المسار كاملًا أو اسحب خطوة محددة إلى المسار الحالي.',
    autoApplyWorkflow: 'تطبيق تلقائي',
    dragWorkflowStepHint: 'اسحب هذه الخطوة إلى المسار الحالي.',
    dropWorkflowStepHint: 'أفلت خطوة من مسار مقترح هنا لإضافتها.',
    dragCandidateServiceHint: 'اسحب الخدمة لإضافتها إلى المسار.',
    dropWorkflowBuilderHint: 'أفلت الخدمة هنا لإضافتها أو أفلت خطوة لإعادة ترتيب المسار.',
    noSuggestedWorkflows:
      'لا توجد مسارات محفوظة تحتوي "{{ serviceName }}" كخطوة. الخدمة نفسها موجودة ويمكنك بدء مسار جديد بها.',
    useWorkflow: 'استخدام هذا المسار',
    startNewWorkflow: 'ابدأ مسار جديد بهذه الخدمة',
    workflowStartsBeforeAnchor:
      'هذا المسار يبدأ قبل الخدمة المختارة. سيتم تضمين الخطوات السابقة أيضًا.',
    invalidStep: 'هذه الخدمة غير صالحة للتشغيل حاليًا.',
    matchedService: 'الخدمة المختارة',
    serviceSelection: 'اختيار الخدمة',
    serviceSelectionHint: 'اختر الخدمة من المستوى الحالي حتى تصل لخدمة يمكن إضافتها للمسار.',
    selectedPath: 'المسار المختار',
    currentWorkflowPath: 'المسار الحالي',
    noWorkflowSteps: 'اختر خدمتين على الأقل لبناء المسار.',
    level: 'المستوى',
    replaceStepMode: 'تعديل خطوة',
    addStepMode: 'إضافة خطوة',
    selectionAccessDenied: 'اختيار الخدمات يحتاج صلاحية عرض الخدمات.',
    noSelectionOptions: 'لا توجد خدمات متاحة تحت هذا الاختيار.',
    serviceCannotIssueTicket: 'هذه الخدمة غير متاحة لإصدار تذكرة.',
    selectedServiceNotFound: 'الخدمة المختارة غير موجودة.',
    eyebrow: 'إدارة مسارات العمليات',
    heroDescription:
      'قم باختيار الفرع والخدمة لإنشاء وتتبع مسارات الخدمة وخطوات التنفيذ بكل سهولة.',
    schedule: 'جدول المواعيد',
    goToSchedule: 'الانتقال لجدول مواعيد هذه الخدمة',
    sequenceTitle: 'تسلسل خطوات المسار',
    firstStep: 'الخطوة الأولى',
    finalStep: 'الجهة النهائية',
    intermediateStep: 'خطوة وسيطة',
    stepOrderLabel: 'ترتيب الخطوة',
    selectServiceBannerTitle: 'اختر الخدمة لإدارة مسار العمليات',
    selectServiceBannerDesc:
      'انقر على أي خدمة أو على زر "إدارة المسارات" لعرض أو إنشاء مسارات تنفيذ خاصة بها.',
    servicesReady: 'خدمة جاهزة للمسارات',
    noAutoAppliedWorkflow: 'لا يوجد مسار تلقائي',
    totalCount: 'مسار',
    eligibleServices: 'الخدمات المتاحة للمسارات',
    searchServicesPlaceholder: 'ابحث عن خدمة...',
    noEligibleServices: 'لا توجد خدمات مطابقة.',
    otherServices: 'خدمات أخرى',
    pickServiceTitle: 'اختر خدمة لعرض مساراتها',
    pickServiceHint: 'اختر أي خدمة من القائمة لعرض مساراتها أو إضافة مسار جديد لها.',
    addFirstWorkflow: 'إضافة أول مسار',
    emptyWorkflowsHint:
      'لم تتم إضافة أي مسارات لهذه الخدمة بعد. أضف مسارًا لتحديد تسلسل الخدمات التلقائي.',
    workflowFor: 'للخدمة',
    workflowNameOptional: 'اسم المسار (اختياري)',
    minimumStepsHint: 'الحد الأدنى خطوتان',
    addStepsHint: 'اضغط على أي خدمة بالأسفل لإضافتها كخطوة.',
  },
  en: {
    title: 'Service Workflows',
    description:
      'Create and manage ordered automatic service paths for future ticket workflow decisions.',
    branch: 'Branch',
    selectBranch: 'Select branch',
    selectBranchFirst: 'Select a branch to view eligible leaf services.',
    invalidWorkflowScope:
      'The selected branch or leaf service is not available for workflow management.',
    backToWorkflowSelection: 'Back to service selection',
    backToBranchServices: 'Back to Branch Services',
    changeWorkflowScope: 'Change branch or service',
    changeService: 'Change Service',
    manageWorkflows: 'Manage service workflows',
    workflowOwner: 'Workflow owner service',
    autoAppliedWorkflow: 'Auto-applied workflow',
    workflowList: 'Service workflows',
    sortOrder: 'Sort order',
    newest: 'Newest',
    oldest: 'Oldest',
    defaultWorkflow: 'Default',
    setDefault: 'Set as Default',
    confirmSetDefaultTitle: 'Set Default Workflow',
    confirmSetDefaultBody:
      'Set this workflow as default? The current default workflow will become non-default.',
    defaultCannotDeactivate:
      'The default workflow cannot be deactivated. Set another active workflow as default first.',
    ineligibleOwnerService: 'This service is not eligible for workflow management.',
    searchCandidates: 'Search available services',
    candidateSearchPlaceholder: 'Search by service name or service code',
    candidateSearchHelp: 'Search by service name or service code.',
    allParents: 'All parent services',
    createWorkflow: 'Create Workflow',
    editWorkflow: 'Edit Workflow',
    workflowDetails: 'Workflow Details',
    filters: 'Filters',
    showFilters: 'Show filters',
    hideFilters: 'Hide filters',
    search: 'Search workflow name',
    status: 'Status',
    all: 'All',
    active: 'Active',
    inactive: 'Inactive',
    startService: 'Start service',
    pageSize: 'Page size',
    refresh: 'Refresh',
    noWorkflows: 'No matching workflows found.',
    steps: 'Steps',
    start: 'Start',
    created: 'Created',
    modified: 'Last modified',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    previous: 'Previous',
    next: 'Next',
    totalItems: 'Total items',
    arabicName: 'Arabic Name',
    englishName: 'English Name',
    builder: 'Workflow Builder',
    candidateServices: 'Candidate Services',
    addStep: 'Add Step',
    removeStep: 'Remove Step',
    moveUp: 'Move Up',
    moveDown: 'Move Down',
    selectService: 'Select service',
    parent: 'Parent service',
    alreadyUsed: 'Used in other workflows',
    ticketIssuable: 'Ticket issuable',
    deleted: 'Deleted',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    loading: 'Loading...',
    requiredField: 'This field is required.',
    maxLength100: 'Maximum length is 100 characters.',
    minimumSteps: 'Add at least two steps.',
    stepServiceRequired: 'Every step must have a selected service.',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    accessDenied: 'Access denied.',
    noPermissionHint: 'You do not have permission for this action.',
    concurrencyError: 'This workflow was updated by another user. Please refresh and try again.',
    confirmDeactivateTitle: 'Deactivate Workflow',
    confirmReactivateTitle: 'Reactivate Workflow',
    confirmDeactivateBody:
      'This will stop the workflow from being used for future ticket decisions without deleting its definition or steps.',
    confirmReactivateBody:
      'This will make the workflow available again. The backend may reject it if a step service is inactive or deleted.',
    noCandidates: 'No matching candidate services found.',
    duplicateAllowed: 'The same service can appear more than once in a workflow.',
    differentParentsAllowed: 'Services from different parents are allowed.',
    rowVersion: 'RowVersion',
    notAvailable: '-',
    suggestedWorkflows: 'Existing workflows containing this service',
    suggestedWorkflowsHint: 'Use the full workflow or drag individual steps into the current path.',
    autoApplyWorkflow: 'Auto Apply',
    dragWorkflowStepHint: 'Drag this step into the current workflow path.',
    dropWorkflowStepHint: 'Drop a suggested workflow step here to add it.',
    dragCandidateServiceHint: 'Drag this service into the workflow path.',
    dropWorkflowBuilderHint: 'Drop a service here to add it, or drop a step to reorder the path.',
    noSuggestedWorkflows:
      'No saved workflows contain "{{ serviceName }}" as a step. The service exists and can start a new workflow.',
    useWorkflow: 'Use this workflow',
    startNewWorkflow: 'Start new workflow with this service',
    workflowStartsBeforeAnchor:
      'This workflow starts before the selected service. Previous steps will also be included.',
    invalidStep: 'This service is not currently valid for execution.',
    matchedService: 'Selected service',
    serviceSelection: 'Service Selection',
    serviceSelectionHint:
      'Select through the current level until you reach a service that can be added to the workflow.',
    selectedPath: 'Selected path',
    currentWorkflowPath: 'Current workflow path',
    noWorkflowSteps: 'Select at least two services to build the workflow.',
    level: 'Level',
    replaceStepMode: 'Replace Step',
    addStepMode: 'Add Step',
    selectionAccessDenied: 'Service selection requires Services.ViewAll permission.',
    noSelectionOptions: 'No services available under this selection.',
    serviceCannotIssueTicket: 'This service cannot issue tickets.',
    selectedServiceNotFound: 'Selected service was not found.',
    eyebrow: 'Workflow Operations',
    heroDescription: 'Select a branch and service to create and configure workflows effortlessly.',
    schedule: 'Schedule',
    goToSchedule: 'Go to service schedule',
    sequenceTitle: 'Workflow Step Sequence',
    firstStep: 'Start Step',
    finalStep: 'Final Step',
    intermediateStep: 'Intermediate Step',
    stepOrderLabel: 'Step Order',
    selectServiceBannerTitle: 'Select a Service for Workflow Setup',
    selectServiceBannerDesc:
      'Click any service or "Manage Workflows" button to configure execution steps.',
    servicesReady: 'Services ready',
    noAutoAppliedWorkflow: 'No auto-applied workflow',
    totalCount: 'Workflows',
    eligibleServices: 'Workflow-ready services',
    searchServicesPlaceholder: 'Search services...',
    noEligibleServices: 'No matching services.',
    otherServices: 'Other services',
    pickServiceTitle: 'Select a service to view its workflows',
    pickServiceHint: 'Pick any service from the list to view its workflows or add a new one.',
    addFirstWorkflow: 'Add first workflow',
    emptyWorkflowsHint:
      'No workflows configured for this service yet. Add one to define the automatic service sequence.',
    workflowFor: 'for',
    workflowNameOptional: 'Workflow name (optional)',
    minimumStepsHint: 'Minimum two steps',
    addStepsHint: 'Click any service below to add it as a step.',
  },
};
