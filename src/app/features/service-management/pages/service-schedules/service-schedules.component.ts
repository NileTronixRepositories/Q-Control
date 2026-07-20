import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';
import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem } from '../../../technical-admin/models/branch-management.model';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { SERVICE_SCHEDULE_TRANSLATIONS } from '../../i18n/service-schedule.translations';
import { ServiceTreeNode } from '../../models/service-management.model';
import {
  CreateServiceScheduleRequest,
  DayOfWeek,
  SERVICE_SCHEDULE_DAYS,
  ServiceSchedule,
  ServiceSchedulePendingChanges,
  ServiceScheduleScope,
  ServiceScheduleTimeSlot,
  ServiceScheduleUiMessage,
} from '../../models/service-schedule.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceScheduleApiService } from '../../services/service-schedule-api.service';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const API_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const AM_PM_TIME_PATTERN = /^(0?[1-9]|1[0-2]):([0-5]\d)(?::[0-5]\d)?\s*([AP]M)$/i;

type TimeSlotGroup = FormGroup<{
  startTime: FormControl<string>;
  endTime: FormControl<string>;
}>;

type ScheduleDayGroup = FormGroup<{
  dayOfWeek: FormControl<DayOfWeek>;
  isWorkingDay: FormControl<boolean>;
  timeSlots: FormArray<TimeSlotGroup>;
}>;

type ScheduleForm = FormGroup<{
  days: FormArray<ScheduleDayGroup>;
  isSlotCodeRequired: FormControl<boolean>;
  slotCode: FormControl<string>;
}>;

function serviceScheduleDaysValidator(control: AbstractControl): ValidationErrors | null {
  const daysControl = control.get('days');

  if (!(daysControl instanceof FormArray)) {
    return null;
  }

  let hasWorkingDay = false;
  let hasMissingSlot = false;
  let hasInvalidTime = false;
  let hasInvalidRange = false;
  let hasDuplicateSlot = false;
  let hasOverlap = false;

  for (const dayControl of daysControl.controls) {
    if (!dayControl.get('isWorkingDay')?.value) {
      continue;
    }

    hasWorkingDay = true;
    const slotsControl = dayControl.get('timeSlots');

    if (!(slotsControl instanceof FormArray) || slotsControl.length === 0) {
      hasMissingSlot = true;
      continue;
    }

    const slots = slotsControl.controls.map((slotControl) => ({
      startTime: String(slotControl.get('startTime')?.value ?? '').trim(),
      endTime: String(slotControl.get('endTime')?.value ?? '').trim(),
    }));

    if (slots.some((slot) => !slot.startTime || !slot.endTime)) {
      hasMissingSlot = true;
    }

    if (slots.some((slot) => !TIME_PATTERN.test(slot.startTime) || !TIME_PATTERN.test(slot.endTime))) {
      hasInvalidTime = true;
      continue;
    }

    const sortedSlots = slots
      .map((slot) => ({
        ...slot,
        startMinutes: timeToMinutes(slot.startTime),
        endMinutes: timeToMinutes(slot.endTime),
      }))
      .sort((first, second) => first.startMinutes - second.startMinutes || first.endMinutes - second.endMinutes);

    if (sortedSlots.some((slot) => slot.startMinutes >= slot.endMinutes)) {
      hasInvalidRange = true;
    }

    const seenSlots = new Set<string>();
    for (const slot of sortedSlots) {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (seenSlots.has(key)) {
        hasDuplicateSlot = true;
      }
      seenSlots.add(key);
    }

    for (let index = 1; index < sortedSlots.length; index += 1) {
      const previous = sortedSlots[index - 1];
      const current = sortedSlots[index];
      if (current.startMinutes < previous.endMinutes && current.endMinutes > previous.startMinutes) {
        hasOverlap = true;
      }
    }
  }

  const errors: ValidationErrors = {};
  if (!hasWorkingDay) errors['daysRequired'] = true;
  if (hasMissingSlot) errors['timeSlotsRequired'] = true;
  if (hasInvalidTime) errors['invalidTime'] = true;
  if (hasInvalidRange) errors['timeRange'] = true;
  if (hasDuplicateSlot) errors['duplicateTimeSlot'] = true;
  if (hasOverlap) errors['overlappingTimeSlots'] = true;

  return Object.keys(errors).length > 0 ? errors : null;
}

function timeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

interface ServiceScheduleSelectLevel {
  readonly index: number;
  readonly options: readonly ServiceTreeNode[];
  readonly selectedId: number | null;
}

@Component({
  selector: 'app-service-schedules',
  standalone: true,
  imports: [ReactiveFormsModule, TechnicalAdminPageHeroComponent, NiletronixLoadingStateComponent],
  templateUrl: './service-schedules.component.html',
  styleUrl: './service-schedules.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceSchedulesComponent implements OnInit, OnDestroy, ServiceSchedulePendingChanges {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly branchApiService = inject(BranchManagementApiService);
  private readonly branchServicesApiService = inject(BranchServicesApiService);
  private readonly apiService = inject(ServiceScheduleApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);

  protected readonly translations = computed(
    () => SERVICE_SCHEDULE_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly isBranchAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'BranchAdmin',
  );

  protected readonly canView = this.permissionService.canViewSchedules;
  protected readonly canCreate = this.permissionService.canCreateSchedule;
  protected readonly canUpdate = this.permissionService.canUpdateSchedule;
  protected readonly days = SERVICE_SCHEDULE_DAYS;
  protected readonly branches = signal<readonly BranchListItem[]>([]);
  protected readonly branchTree = signal<readonly ServiceTreeNode[]>([]);
  protected readonly selectedBranchId = signal<number | null>(null);
  protected readonly selectedServicePath = signal<readonly number[]>([]);
  protected readonly scheduleTree = computed(() => this.filterScheduleTree(this.branchTree()));
  protected readonly serviceSelectLevels = computed<readonly ServiceScheduleSelectLevel[]>(() => {
    const levels: ServiceScheduleSelectLevel[] = [];
    const selectedPath = this.selectedServicePath();
    let options = this.scheduleTree();

    for (let index = 0; options.length > 0; index += 1) {
      const selectedId = selectedPath[index] ?? null;
      const selectedNode = options.find((node) => node.id === selectedId) ?? null;

      levels.push({ index, options, selectedId });

      if (!selectedNode || selectedNode.children.length === 0) {
        break;
      }

      options = selectedNode.children;
    }

    return levels;
  });
  protected readonly scope = signal<ServiceScheduleScope | null>(null);
  protected readonly scopeError = signal<string | null>(null);
  protected readonly schedule = signal<ServiceSchedule | null>(null);
  protected readonly message = signal<ServiceScheduleUiMessage | null>(null);
  protected readonly branchesLoading = signal(false);
  protected readonly treeLoading = signal(false);
  protected readonly scheduleLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly reloadRequired = signal(false);
  protected readonly slotCodeConflict = signal(false);
  protected readonly lacksInlinePermission = computed(() => {
    const current = this.schedule();
    return current ? !this.canUpdate() : !this.canCreate();
  });
  protected readonly canEditInline = computed(() => {
    const current = this.schedule();
    return !this.lacksInlinePermission() && !this.reloadRequired() && (current?.isCurrentlyOperational ?? true);
  });
  protected readonly inlineControlsDisabled = computed(() => !this.canEditInline() || this.saving());
  protected readonly canSave = computed(() => this.canEditInline() && !this.saving());

  protected readonly scheduleForm = this.createScheduleForm();

  private readonly routeBranchId = this.readPositiveInt(
    this.route.snapshot.paramMap.get('branchId'),
  );
  private readonly routeLeafServiceId = this.readPositiveInt(
    this.route.snapshot.paramMap.get('leafServiceId'),
  );
  protected readonly hasRouteScope = computed(() =>
    Boolean(this.routeBranchId && this.routeLeafServiceId),
  );

  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    if (!this.canView()) {
      return;
    }

    const session = this.authSessionService.currentSession();
    const activeBranchId = session?.activeBranchId ?? null;

    if (this.isBranchAdmin()) {
      const branchId = this.routeBranchId ?? activeBranchId;

      if (!branchId || (this.routeBranchId && branchId !== activeBranchId)) {
        this.scopeError.set(this.translations().invalidScheduleScope);
        return;
      }

      this.selectedBranchId.set(branchId);
      this.loadBranchTree(branchId);
      return;
    }

    this.loadBranches();

    if (this.routeBranchId) {
      this.selectedBranchId.set(this.routeBranchId);
      this.loadBranchTree(this.routeBranchId);
    }
  }

  ngOnDestroy(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
  }

  canDeactivatePendingChanges(): boolean {
    return !this.scheduleForm.dirty || window.confirm(this.translations().discardChangesConfirm);
  }

  protected clearMessage(): void {
    this.message.set(null);
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  protected backToBranchServices(): void {
    if (!this.canDeactivatePendingChanges()) {
      return;
    }

    void this.router.navigateByUrl('/admin/services/branch-services');
  }

  protected selectBranch(event: Event): void {
    const branchId = this.readPositiveInt((event.target as HTMLSelectElement).value);

    if (branchId === this.selectedBranchId()) {
      return;
    }

    if (!this.canDeactivatePendingChanges()) {
      return;
    }

    this.selectedBranchId.set(branchId);
    this.resetActiveSchedule();
    this.branchTree.set([]);

    if (branchId) {
      this.loadBranchTree(branchId);
    }
  }

  protected selectServiceLevel(event: Event, levelIndex: number): void {
    const serviceId = this.readPositiveInt((event.target as HTMLSelectElement).value);
    const branchId = this.selectedBranchId();
    const level = this.serviceSelectLevels().find((item) => item.index === levelIndex);

    if (!branchId || !level) {
      return;
    }

    if (serviceId === level.selectedId) {
      return;
    }

    if (!this.canDeactivatePendingChanges()) {
      return;
    }

    const nextPath = this.selectedServicePath().slice(0, levelIndex);
    const selectedNode = serviceId
      ? level.options.find((node) => node.id === serviceId) ?? null
      : null;

    this.resetActiveSchedule({ clearServicePath: false });

    if (!selectedNode) {
      this.selectedServicePath.set(nextPath);
      return;
    }

    this.selectedServicePath.set([...nextPath, selectedNode.id]);

    if (this.canManageScheduleFor(selectedNode)) {
      this.activateRouteScope(branchId, selectedNode.id);
    }
  }

  protected resetInlineChanges(): void {
    if (!this.canDeactivatePendingChanges()) {
      return;
    }

    this.reloadRequired.set(false);
    this.slotCodeConflict.set(false);
    this.resetScheduleForm(this.schedule());
  }

  protected reloadLatest(): void {
    if (!this.canDeactivatePendingChanges()) {
      return;
    }

    this.reloadRequired.set(false);
    this.loadSchedule();
  }

  protected dayGroups(): readonly ScheduleDayGroup[] {
    return this.scheduleForm.controls.days.controls;
  }

  protected timeSlotGroups(dayIndex: number): readonly TimeSlotGroup[] {
    return this.dayGroup(dayIndex).controls.timeSlots.controls;
  }

  protected openNativeTimePicker(input: HTMLInputElement): void {
    if (this.inlineControlsDisabled()) {
      return;
    }

    const picker = input as { showPicker?: () => void };

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
    }
  }

  protected dayIsWorking(dayIndex: number): boolean {
    return this.dayGroup(dayIndex).controls.isWorkingDay.value;
  }

  protected toggleWorkingDay(dayIndex: number, checked: boolean): void {
    if (!this.canEditInline()) {
      return;
    }

    const dayGroup = this.dayGroup(dayIndex);
    const slots = dayGroup.controls.timeSlots;

    if (checked) {
      dayGroup.controls.isWorkingDay.setValue(true);
      if (slots.length === 0) {
        slots.push(this.createTimeSlotGroup());
      }
    } else {
      if (this.hasEnteredTimeSlots(slots) && !window.confirm(this.translations().disableDayConfirm)) {
        return;
      }

      slots.clear();
      dayGroup.controls.isWorkingDay.setValue(false);
    }

    dayGroup.markAsDirty();
    dayGroup.markAsTouched();
    this.scheduleForm.updateValueAndValidity();
  }

  protected addTimeSlot(dayIndex: number): void {
    if (!this.canEditInline()) {
      return;
    }

    const dayGroup = this.dayGroup(dayIndex);

    dayGroup.controls.isWorkingDay.setValue(true);
    dayGroup.controls.timeSlots.push(this.createTimeSlotGroup());
    dayGroup.markAsDirty();
    dayGroup.markAsTouched();
    this.scheduleForm.updateValueAndValidity();
  }

  protected removeTimeSlot(dayIndex: number, slotIndex: number): void {
    if (!this.canEditInline()) {
      return;
    }

    const dayGroup = this.dayGroup(dayIndex);
    const slots = dayGroup.controls.timeSlots;

    slots.removeAt(slotIndex);

    if (slots.length === 0) {
      dayGroup.controls.isWorkingDay.setValue(false);
    }

    dayGroup.markAsDirty();
    dayGroup.markAsTouched();
    this.scheduleForm.updateValueAndValidity();
  }
  protected submit(): void {
    const currentScope = this.scope();
    this.scheduleForm.markAllAsTouched();
    this.slotCodeConflict.set(false);
    this.applySlotCodeValidation();
    this.scheduleForm.updateValueAndValidity();

    if (!currentScope || this.scheduleForm.invalid || !this.canSave()) {
      return;
    }

    const request = this.mapRequest();
    const isCreate = this.schedule() === null;
    const mutation$ = isCreate
      ? this.apiService.createSchedule(currentScope.branchId, currentScope.leafServiceId, request)
      : this.apiService.updateSchedule(currentScope.branchId, currentScope.leafServiceId, {
          ...request,
          rowVersion: this.schedule()?.rowVersion ?? '',
        });

    this.saving.set(true);
    mutation$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (response) => {
        this.schedule.set(response);
        this.syncSelectorState(response.branchId, response.serviceId);
        this.reloadRequired.set(false);
        this.resetScheduleForm(response);
        this.showMessage(
          'success',
          response.message ||
            (isCreate ? this.translations().scheduleCreated : this.translations().scheduleUpdated),
        );
      },
      error: (error: HttpErrorResponse) => this.handleMutationError(error),
    });
  }

  protected controlError(controlName: 'slotCode'): string | null {
    const control = this.scheduleForm.controls[controlName];

    if (this.slotCodeConflict()) {
      return this.translations().slotCodeAlreadyExists;
    }

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('maxlength')) {
      return this.translations().slotCodeMaxLength;
    }

    if (control.hasError('slotCodeRequired')) {
      return this.translations().slotCodeRequiredError;
    }

    if (control.hasError('slotCodeExists')) {
      return this.translations().slotCodeAlreadyExists;
    }

    return null;
  }

  protected slotControlError(
    dayIndex: number,
    slotIndex: number,
    controlName: 'startTime' | 'endTime',
  ): string | null {
    const control = this.timeSlotGroup(dayIndex, slotIndex).controls[controlName];

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      return controlName === 'startTime'
        ? this.translations().startTimeRequired
        : this.translations().endTimeRequired;
    }

    if (control.hasError('pattern')) {
      return this.translations().invalidTime;
    }

    return null;
  }
  protected formError(): string | null {
    if (!this.scheduleForm.touched) {
      return null;
    }

    if (this.scheduleForm.hasError('daysRequired')) {
      return this.translations().workDaysRequired;
    }

    if (this.scheduleForm.hasError('timeSlotsRequired')) {
      return this.translations().timeSlotsRequired;
    }

    if (this.scheduleForm.hasError('invalidTime')) {
      return this.translations().invalidTime;
    }

    if (this.scheduleForm.hasError('timeRange')) {
      return this.translations().timeRangeInvalid;
    }

    if (this.scheduleForm.hasError('duplicateTimeSlot')) {
      return this.translations().duplicateTimeSlot;
    }

    if (this.scheduleForm.hasError('overlappingTimeSlots')) {
      return this.translations().overlappingTimeSlots;
    }

    return null;
  }
  protected dayLabel(day: DayOfWeek): string {
    return this.translations().dayLabels[day];
  }

  protected displayTime(value: string): string {
    return this.toInputTime(value) || this.translations().notAvailable;
  }

  protected displayValue(value: string | null): string {
    return value?.trim() || this.translations().notAvailable;
  }

  private loadBranches(): void {
    this.branchesLoading.set(true);
    this.branchApiService
      .getBranches({
        searchText: '',
        orderSort: 'Newest',
        pageNumber: 1,
        pageSize: 100,
        isActive: true,
      })
      .pipe(finalize(() => this.branchesLoading.set(false)))
      .subscribe({
        next: (response) => this.branches.set(response.data),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadBranchTree(branchId: number): void {
    this.scopeError.set(null);
    this.treeLoading.set(true);
    this.branchServicesApiService
      .getBranchServicesTree(branchId, { includeInactive: false, includeDeleted: false })
      .pipe(finalize(() => this.treeLoading.set(false)))
      .subscribe({
        next: (tree) => {
          this.branchTree.set(tree);

          if (this.routeLeafServiceId) {
            this.activateRouteScope(branchId, this.routeLeafServiceId);
            return;
          }

          const currentLeafServiceId =
            this.scope()?.leafServiceId ?? this.schedule()?.serviceId ?? null;

          if (currentLeafServiceId) {
            this.syncSelectorState(branchId, currentLeafServiceId);
          }
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private activateRouteScope(branchId: number, leafServiceId: number): void {
    const node = this.findTreeNode(this.branchTree(), leafServiceId);

    if (!node || !this.canManageScheduleFor(node)) {
      this.scopeError.set(this.translations().invalidScheduleScope);
      return;
    }

    this.syncSelectorState(branchId, leafServiceId);
    this.scope.set({
      branchId,
      leafServiceId,
      branchName: this.branchLabel(branchId),
      serviceName: this.serviceName(node),
    });
    this.loadSchedule();
  }

  private syncSelectorState(branchId: number, leafServiceId: number): void {
    this.selectedBranchId.set(branchId);

    const servicePath = this.findTreePath(this.scheduleTree(), leafServiceId);

    if (servicePath.length > 0) {
      this.selectedServicePath.set(servicePath);
    }
  }

  private loadSchedule(): void {
    const currentScope = this.scope();

    if (!currentScope) {
      return;
    }

    this.scheduleLoading.set(true);
    this.apiService
      .getSchedule(currentScope.branchId, currentScope.leafServiceId)
      .pipe(finalize(() => this.scheduleLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.schedule.set(response);
          this.syncSelectorState(response.branchId, response.serviceId);
          this.reloadRequired.set(false);
          this.resetScheduleForm(response);
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404 && this.containsErrorCode(error, 'ScheduleNotFound')) {
            this.schedule.set(null);
            this.reloadRequired.set(false);
            this.resetScheduleForm(null);
            return;
          }

          this.handleApiError(error);
        },
      });
  }

  private resetActiveSchedule(options: { readonly clearServicePath?: boolean } = {}): void {
    this.scope.set(null);
    this.scopeError.set(null);
    this.schedule.set(null);
    if (options.clearServicePath !== false) {
      this.selectedServicePath.set([]);
    }
    this.reloadRequired.set(false);
    this.slotCodeConflict.set(false);
    this.resetScheduleForm(null);
  }

  private filterScheduleTree(nodes: readonly ServiceTreeNode[]): readonly ServiceTreeNode[] {
    return nodes.flatMap((node) => {
      const children = this.filterScheduleTree(node.children);

      if (this.canManageScheduleFor(node)) {
        return [{ ...node, children }];
      }

      if (children.length > 0) {
        return [{ ...node, children }];
      }

      return [];
    });
  }

  protected canManageScheduleFor(node: ServiceTreeNode): boolean {
    return (
      node.isAssignedToCurrentBranch !== false &&
      node.children.length === 0 &&
      !node.hasChildren &&
      node.isActive &&
      !node.isDeleted &&
      node.effectiveIsActive &&
      node.isTicketIssuable &&
      node.canIssueTicket
    );
  }

  private createScheduleForm(): ScheduleForm {
    return this.formBuilder.group(
      {
        days: this.formBuilder.array(SERVICE_SCHEDULE_DAYS.map((day) => this.createDayGroup(day))),
        isSlotCodeRequired: [false],
        slotCode: ['', [Validators.maxLength(100)]],
      },
      { validators: serviceScheduleDaysValidator },
    ) as ScheduleForm;
  }

  private createDayGroup(
    dayOfWeek: DayOfWeek,
    timeSlots: readonly ServiceScheduleTimeSlot[] = [],
  ): ScheduleDayGroup {
    return this.formBuilder.group({
      dayOfWeek: this.formBuilder.control(dayOfWeek),
      isWorkingDay: this.formBuilder.control(timeSlots.length > 0),
      timeSlots: this.formBuilder.array(
        timeSlots.map((slot) =>
          this.createTimeSlotGroup(this.toInputTime(slot.startTime), this.toInputTime(slot.endTime)),
        ),
      ),
    }) as ScheduleDayGroup;
  }

  private createTimeSlotGroup(startTime = '', endTime = ''): TimeSlotGroup {
    return this.formBuilder.group({
      startTime: [startTime, [Validators.required, Validators.pattern(TIME_PATTERN)]],
      endTime: [endTime, [Validators.required, Validators.pattern(TIME_PATTERN)]],
    }) as TimeSlotGroup;
  }

  private resetScheduleForm(schedule: ServiceSchedule | null = null): void {
    const daysByName = new Map(schedule?.days.map((day) => [day.dayOfWeek, day]) ?? []);
    const daysArray = this.scheduleForm.controls.days;

    daysArray.clear();
    SERVICE_SCHEDULE_DAYS.forEach((day) => {
      daysArray.push(this.createDayGroup(day, daysByName.get(day)?.timeSlots ?? []));
    });

    this.scheduleForm.controls.isSlotCodeRequired.setValue(schedule?.isSlotCodeRequired ?? false);
    this.scheduleForm.controls.slotCode.setValue(schedule?.slotCode ?? '');
    this.scheduleForm.markAsPristine();
    this.scheduleForm.markAsUntouched();
    this.scheduleForm.updateValueAndValidity();
  }

  private dayGroup(dayIndex: number): ScheduleDayGroup {
    return this.scheduleForm.controls.days.at(dayIndex);
  }

  private timeSlotGroup(dayIndex: number, slotIndex: number): TimeSlotGroup {
    return this.dayGroup(dayIndex).controls.timeSlots.at(slotIndex);
  }

  private hasEnteredTimeSlots(slots: FormArray<TimeSlotGroup>): boolean {
    return slots.controls.some((slot) =>
      Boolean(slot.controls.startTime.value.trim() || slot.controls.endTime.value.trim()),
    );
  }
  private mapRequest(): CreateServiceScheduleRequest {
    const value = this.scheduleForm.getRawValue();
    const slotCode = value.slotCode.trim();
    const days = this.scheduleForm.controls.days.controls
      .filter((dayGroup) => dayGroup.controls.isWorkingDay.value)
      .map((dayGroup) => ({
        dayOfWeek: dayGroup.controls.dayOfWeek.value,
        timeSlots: dayGroup.controls.timeSlots.controls
          .map((slotGroup) => ({
            startTime: this.toApiTime(slotGroup.controls.startTime.value),
            endTime: this.toApiTime(slotGroup.controls.endTime.value),
          }))
          .sort((first, second) => this.compareTimeSlots(first, second)),
      }));

    return {
      days,
      isSlotCodeRequired: value.isSlotCodeRequired,
      slotCode: value.isSlotCodeRequired ? slotCode : null,
    };
  }

  private compareTimeSlots(
    first: ServiceScheduleTimeSlot,
    second: ServiceScheduleTimeSlot,
  ): number {
    const startCompare = first.startTime.localeCompare(second.startTime);
    return startCompare === 0 ? first.endTime.localeCompare(second.endTime) : startCompare;
  }
  private applySlotCodeValidation(): void {
    const slotControl = this.scheduleForm.controls.slotCode;
    const currentErrors = { ...(slotControl.errors ?? {}) };
    delete currentErrors['slotCodeRequired'];

    if (this.scheduleForm.controls.isSlotCodeRequired.value && !slotControl.value.trim()) {
      currentErrors['slotCodeRequired'] = true;
    }

    slotControl.setErrors(Object.keys(currentErrors).length > 0 ? currentErrors : null);
  }

  private handleMutationError(error: HttpErrorResponse): void {
    if (this.containsErrorCode(error, 'SlotCodeAlreadyExists')) {
      this.slotCodeConflict.set(true);
      this.scheduleForm.controls.slotCode.setErrors({
        ...(this.scheduleForm.controls.slotCode.errors ?? {}),
        slotCodeExists: true,
      });
      this.scheduleForm.controls.slotCode.markAsTouched();
      this.showMessage('error', this.translations().slotCodeAlreadyExists);
      return;
    }

    if (this.containsErrorCode(error, 'ScheduleAlreadyExists')) {
      this.showMessage('info', this.translations().scheduleAlreadyExists);
      this.loadSchedule();
      return;
    }

    if (this.isConcurrencyError(error)) {
      this.reloadRequired.set(true);
      this.showMessage('error', this.translations().concurrencyError);
      return;
    }

    this.handleApiError(error);
  }

  private handleApiError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    if (error.status === 403) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    this.showMessage(
      'error',
      formatTechnicalAdminApiError(error, this.translations().fallbackError),
    );
  }

  private isConcurrencyError(error: HttpErrorResponse): boolean {
    return (
      this.containsErrorCode(error, 'concurrency') || this.containsErrorCode(error, 'rowversion')
    );
  }

  private containsErrorCode(error: HttpErrorResponse, expected: string): boolean {
    const values: string[] = [];
    const visit = (value: unknown, depth = 0): void => {
      if (depth > 4 || value === null || value === undefined) {
        return;
      }

      if (typeof value === 'string') {
        values.push(value);
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, depth + 1));
        return;
      }

      if (typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach((item) => visit(item, depth + 1));
      }
    };

    visit(error.error);
    const normalizedExpected = expected.toLowerCase();
    return values.some((value) => value.toLowerCase().includes(normalizedExpected));
  }

  private findTreePath(nodes: readonly ServiceTreeNode[], serviceId: number): readonly number[] {
    for (const node of nodes) {
      if (node.id === serviceId) {
        return [node.id];
      }

      const childPath = this.findTreePath(node.children, serviceId);
      if (childPath.length > 0) {
        return [node.id, ...childPath];
      }
    }

    return [];
  }

  private findTreeNode(
    nodes: readonly ServiceTreeNode[],
    serviceId: number | null,
  ): ServiceTreeNode | null {
    if (!serviceId) {
      return null;
    }

    for (const node of nodes) {
      if (node.id === serviceId) {
        return node;
      }

      const child = this.findTreeNode(node.children, serviceId);
      if (child) {
        return child;
      }
    }

    return null;
  }

  private branchLabel(branchId: number): string {
    const branch = this.branches().find((item) => item.branchId === branchId);
    const sessionBranch = this.authSessionService
      .currentSession()
      ?.branches.find((item) => item.branchId === branchId);
    const item = branch ?? sessionBranch;

    if (!item) {
      return `#${branchId}`;
    }

    return this.language() === 'ar' ? item.arabicName : item.englishName;
  }

  private serviceName(node: ServiceTreeNode): string {
    return this.language() === 'ar' ? node.arabicName : node.englishName;
  }

  private toInputTime(value: string): string {
    const normalizedValue = value.trim();

    if (API_TIME_PATTERN.test(normalizedValue)) {
      return normalizedValue.slice(0, 5);
    }

    const amPmMatch = AM_PM_TIME_PATTERN.exec(normalizedValue);

    if (!amPmMatch) {
      return '';
    }

    const period = amPmMatch[3].toUpperCase();
    const hour = Number(amPmMatch[1]);
    const minute = amPmMatch[2];
    const normalizedHour = period === 'AM'
      ? hour % 12
      : hour === 12
        ? 12
        : hour + 12;

    return `${String(normalizedHour).padStart(2, '0')}:${minute}`;
  }

  private toApiTime(value: string): string {
    const normalizedValue = this.toInputTime(value);
    return normalizedValue ? `${normalizedValue}:00` : value.trim();
  }

  private readPositiveInt(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private showMessage(tone: ServiceScheduleUiMessage['tone'], text: string): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    this.message.set({ tone, text });
    this.toastTimeoutId = setTimeout(() => {
      this.message.set(null);
      this.toastTimeoutId = null;
    }, 6000);
  }
}



