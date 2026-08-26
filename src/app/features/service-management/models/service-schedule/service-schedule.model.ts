export type DayOfWeek =
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export const SERVICE_SCHEDULE_DAYS: readonly DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export type ServiceSchedulePermission =
  | 'ServiceSchedules.View'
  | 'ServiceSchedules.Create'
  | 'ServiceSchedules.Update';

export interface ServiceScheduleScope {
  readonly branchId: number;
  readonly leafServiceId: number;
  readonly branchName: string;
  readonly serviceName: string;
}

export interface ServiceSchedule {
  readonly scheduleId: number;
  readonly branchId: number;
  readonly serviceId: number;
  readonly days: readonly ServiceScheduleDay[];
  readonly isSlotCodeRequired: boolean;
  readonly slotCode: string | null;
  readonly isCurrentlyOperational: boolean;
  readonly rowVersion: string;
  readonly createdByApplicationUserId: string | null;
  readonly createdOnUtc: string | null;
  readonly lastModifiedByApplicationUserId: string | null;
  readonly lastModifiedOnUtc: string | null;
  readonly message: string | null;
}

export interface ServiceScheduleTimeSlot {
  readonly startTime: string;
  readonly endTime: string;
}

export interface ServiceScheduleDay {
  readonly dayOfWeek: DayOfWeek;
  readonly timeSlots: readonly ServiceScheduleTimeSlot[];
}

export interface CreateServiceScheduleRequest {
  readonly days: readonly ServiceScheduleDay[];
  readonly isSlotCodeRequired: boolean;
  readonly slotCode: string | null;
}

export interface UpdateServiceScheduleRequest extends CreateServiceScheduleRequest {
  readonly rowVersion: string;
}

export type ServiceScheduleFormMode = 'closed' | 'create' | 'edit';
export type ServiceScheduleMessageTone = 'success' | 'error' | 'info';

export interface ServiceScheduleUiMessage {
  readonly tone: ServiceScheduleMessageTone;
  readonly text: string;
}

export interface ServiceSchedulePendingChanges {
  canDeactivatePendingChanges(): boolean;
}
