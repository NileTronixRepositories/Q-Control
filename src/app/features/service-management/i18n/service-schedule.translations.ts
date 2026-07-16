import { AppLanguage } from '../../../shared/models/app-language.model';
import { DayOfWeek } from '../models/service-schedule.model';

export interface ServiceScheduleTranslations {
  readonly title: string;
  readonly description: string;
  readonly manageSchedule: string;
  readonly createSchedule: string;
  readonly editSchedule: string;
  readonly scheduleDetails: string;
  readonly configuredSchedule: string;
  readonly noScheduleTitle: string;
  readonly noScheduleBody: string;
  readonly selectBranchFirst: string;
  readonly invalidScheduleScope: string;
  readonly backToBranchServices: string;
  readonly branch: string;
  readonly service: string;
  readonly startTime: string;
  readonly endTime: string;
  readonly workDays: string;
  readonly slotCodeRequired: string;
  readonly slotCode: string;
  readonly operationalStatus: string;
  readonly operational: string;
  readonly currentlyUnavailable: string;
  readonly currentlyUnavailableHint: string;
  readonly rowVersion: string;
  readonly createdOn: string;
  readonly modifiedOn: string;
  readonly loading: string;
  readonly save: string;
  readonly cancel: string;
  readonly close: string;
  readonly refresh: string;
  readonly reloadLatest: string;
  readonly yes: string;
  readonly no: string;
  readonly notAvailable: string;
  readonly accessDenied: string;
  readonly fallbackError: string;
  readonly fallbackSuccess: string;
  readonly scheduleLoaded: string;
  readonly scheduleCreated: string;
  readonly scheduleUpdated: string;
  readonly requiredField: string;
  readonly invalidTime: string;
  readonly timeRangeInvalid: string;
  readonly workDaysRequired: string;
  readonly slotCodeRequiredError: string;
  readonly slotCodeMaxLength: string;
  readonly slotCodeAlreadyExists: string;
  readonly scheduleAlreadyExists: string;
  readonly concurrencyError: string;
  readonly discardChangesConfirm: string;
  readonly dayLabels: Record<DayOfWeek, string>;
}

export const SERVICE_SCHEDULE_TRANSLATIONS: Record<AppLanguage, ServiceScheduleTranslations> = {
  ar: {
    title: 'إدارة جدول الخدمة',
    description: 'إدارة مواعيد تشغيل الخدمة داخل الفرع المحدد.',
    manageSchedule: 'إدارة الجدول',
    createSchedule: 'إنشاء جدول',
    editSchedule: 'تعديل الجدول',
    scheduleDetails: 'تفاصيل الجدول',
    configuredSchedule: 'الجدول الحالي',
    noScheduleTitle: 'لا يوجد جدول محفوظ',
    noScheduleBody: 'لم يتم إعداد جدول لهذه الخدمة في هذا الفرع.',
    selectBranchFirst: 'اختر فرعا لعرض الخدمات.',
    invalidScheduleScope: 'لا يمكن إدارة جدول هذه الخدمة داخل الفرع المحدد.',
    backToBranchServices: 'العودة إلى خدمات الفرع',
    branch: 'الفرع',
    service: 'الخدمة',
    startTime: 'وقت البداية',
    endTime: 'وقت النهاية',
    workDays: 'أيام العمل',
    slotCodeRequired: 'يتطلب كود شباك',
    slotCode: 'كود الشباك',
    operationalStatus: 'الحالة التشغيلية',
    operational: 'تعمل',
    currentlyUnavailable: 'غير متاحة حاليا',
    currentlyUnavailableHint:
      'الجدول محفوظ، لكن الخدمة غير متاحة حاليا بسبب حالة الفرع أو الخدمة. لا يمكن حفظ تغييرات حتى تصبح متاحة.',
    rowVersion: 'إصدار السجل',
    createdOn: 'تاريخ الإنشاء',
    modifiedOn: 'آخر تعديل',
    loading: 'جاري التحميل...',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    refresh: 'تحديث',
    reloadLatest: 'تحميل آخر نسخة',
    yes: 'نعم',
    no: 'لا',
    notAvailable: '-',
    accessDenied: 'ليست لديك صلاحية كافية.',
    fallbackError: 'حدث خطأ غير متوقع.',
    fallbackSuccess: 'تمت العملية بنجاح.',
    scheduleLoaded: 'تم تحميل الجدول.',
    scheduleCreated: 'تم إنشاء الجدول.',
    scheduleUpdated: 'تم تحديث الجدول.',
    requiredField: 'هذا الحقل مطلوب.',
    invalidTime: 'أدخل وقتا صحيحا.',
    timeRangeInvalid: 'وقت النهاية يجب أن يكون بعد وقت البداية.',
    workDaysRequired: 'اختر يوم عمل واحدا على الأقل.',
    slotCodeRequiredError: 'كود الشباك مطلوب عند تفعيل هذا الخيار.',
    slotCodeMaxLength: 'الحد الأقصى 100 حرف.',
    slotCodeAlreadyExists: 'كود الشباك مستخدم بالفعل.',
    scheduleAlreadyExists: 'تم إنشاء جدول لهذه الخدمة بالفعل. تم تحميل آخر نسخة.',
    concurrencyError: 'تم تعديل الجدول بواسطة مستخدم آخر. حمل آخر نسخة قبل الحفظ.',
    discardChangesConfirm: 'لديك تغييرات غير محفوظة. هل تريد تجاهلها؟',
    dayLabels: {
      Sunday: 'الأحد',
      Monday: 'الإثنين',
      Tuesday: 'الثلاثاء',
      Wednesday: 'الأربعاء',
      Thursday: 'الخميس',
      Friday: 'الجمعة',
      Saturday: 'السبت',
    },
  },
  en: {
    title: 'Service Schedule',
    description: 'Manage the branch operating schedule for the selected ticket service.',
    manageSchedule: 'Manage Schedule',
    createSchedule: 'Create Schedule',
    editSchedule: 'Edit Schedule',
    scheduleDetails: 'Schedule Details',
    configuredSchedule: 'Configured Schedule',
    noScheduleTitle: 'No schedule configured',
    noScheduleBody: 'This branch service does not have a saved schedule yet.',
    selectBranchFirst: 'Select a branch to view services.',
    invalidScheduleScope: 'This service schedule cannot be managed for the selected branch.',
    backToBranchServices: 'Back to Branch Services',
    branch: 'Branch',
    service: 'Service',
    startTime: 'Start Time',
    endTime: 'End Time',
    workDays: 'Work Days',
    slotCodeRequired: 'Slot code required',
    slotCode: 'Slot Code',
    operationalStatus: 'Operational Status',
    operational: 'Operational',
    currentlyUnavailable: 'Currently Unavailable',
    currentlyUnavailableHint:
      'The schedule is saved, but the service is currently unavailable because of the branch or service state. Saving is disabled until it becomes operational.',
    rowVersion: 'Row Version',
    createdOn: 'Created On',
    modifiedOn: 'Last Modified',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    refresh: 'Refresh',
    reloadLatest: 'Reload latest',
    yes: 'Yes',
    no: 'No',
    notAvailable: '-',
    accessDenied: 'Access denied.',
    fallbackError: 'Unexpected error occurred.',
    fallbackSuccess: 'Operation completed successfully.',
    scheduleLoaded: 'Schedule loaded.',
    scheduleCreated: 'Schedule created.',
    scheduleUpdated: 'Schedule updated.',
    requiredField: 'This field is required.',
    invalidTime: 'Enter a valid time.',
    timeRangeInvalid: 'End time must be after start time.',
    workDaysRequired: 'Select at least one work day.',
    slotCodeRequiredError: 'Slot code is required when this option is enabled.',
    slotCodeMaxLength: 'Maximum length is 100 characters.',
    slotCodeAlreadyExists: 'This slot code is already used.',
    scheduleAlreadyExists: 'A schedule already exists. The latest schedule was loaded.',
    concurrencyError: 'The schedule was modified by another user. Reload the latest data before saving.',
    discardChangesConfirm: 'You have unsaved changes. Discard them?',
    dayLabels: {
      Sunday: 'Sunday',
      Monday: 'Monday',
      Tuesday: 'Tuesday',
      Wednesday: 'Wednesday',
      Thursday: 'Thursday',
      Friday: 'Friday',
      Saturday: 'Saturday',
    },
  },
};
