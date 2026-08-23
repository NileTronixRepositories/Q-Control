import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { BranchServicesApiService } from '../../services/branch/branch-services-api.service';
import { ServiceManagementPermissionService } from '../../services/catalog/service-management-permission.service';
import { ServiceScheduleApiService } from '../../services/schedule/service-schedule-api.service';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const API_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;
const AM_PM_TIME_PATTERN = /^(0?[1-9]|1[0-2]):([0-5]\d)(?::[0-5]\d)?\s*([AP]M)$/i;

type ScheduleRuleGroup = FormGroup<{
  startTime: FormControl<string>;
  endTime: FormControl<string>;
  day: FormControl<DayOfWeek | null>;
}>;

type ScheduleForm = FormGroup<{
  rules: FormArray<ScheduleRuleGroup>;
  isSlotCodeRequired: FormControl<boolean>;
  slotCode: FormControl<string>;
}>;

function serviceScheduleRulesValidator(control: AbstractControl): ValidationErrors | null {
  const rulesControl = control.get('rules');

  if (!(rulesControl instanceof FormArray) || rulesControl.length === 0) {
    return { daysRequired: true };
  }

  let hasInvalidTime = false;
  let hasInvalidRange = false;
  let hasNoDays = false;
  let hasDuplicate = false;
  let hasOverlap = false;

  const slotsPerDay = new Map<DayOfWeek, Array<{ start: number; end: number }>>();
  SERVICE_SCHEDULE_DAYS.forEach((day) => slotsPerDay.set(day, []));

  for (const ruleControl of rulesControl.controls) {
    const startTime = String(ruleControl.get('startTime')?.value ?? '').trim();
    const endTime = String(ruleControl.get('endTime')?.value ?? '').trim();
    const day = ruleControl.get('day')?.value as DayOfWeek | null;

    if (!day) {
      hasNoDays = true;
    }

    if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
      hasInvalidTime = true;
      continue;
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (startMinutes >= endMinutes) {
      hasInvalidRange = true;
      continue;
    }

    if (day) {
      slotsPerDay.get(day)?.push({ start: startMinutes, end: endMinutes });
    }
  }

  for (const [_, slots] of slotsPerDay.entries()) {
    slots.sort((a, b) => a.start - b.start || a.end - b.end);
    for (let i = 1; i < slots.length; i++) {
      if (slots[i].start === slots[i - 1].start && slots[i].end === slots[i - 1].end) {
        hasDuplicate = true;
      } else if (slots[i].start < slots[i - 1].end && slots[i].end > slots[i - 1].start) {
        hasOverlap = true;
      }
    }
  }

  const validRulesCount = rulesControl.controls.filter((r) => r.get('day')?.value).length;
  const errors: ValidationErrors = {};
  if (hasNoDays || validRulesCount === 0) errors['daysRequired'] = true;
  if (hasInvalidTime) errors['invalidTime'] = true;
  if (hasInvalidRange) errors['timeRange'] = true;
  if (hasDuplicate) errors['duplicateTimeSlot'] = true;
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
  private readonly destroyRef = inject(DestroyRef);

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

  protected openNativeTimePicker(input: HTMLInputElement): void {
    if (this.inlineControlsDisabled()) {
      return;
    }

    const picker = input as { showPicker?: () => void };

    if (typeof picker.showPicker === 'function') {
      picker.showPicker();
    }
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
    mutation$
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
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
      .pipe(
        finalize(() => this.branchesLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
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
      .pipe(
        finalize(() => this.treeLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
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
      .pipe(
        finalize(() => this.scheduleLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
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
        rules: this.formBuilder.array<ScheduleRuleGroup>([]),
        isSlotCodeRequired: [false],
        slotCode: ['', [Validators.maxLength(100)]],
      },
      { validators: serviceScheduleRulesValidator },
    ) as ScheduleForm;
  }

  private createRuleGroup(
    startTime = '',
    endTime = '',
    day: DayOfWeek | null = null,
  ): ScheduleRuleGroup {
    return this.formBuilder.group({
      startTime: [startTime, [Validators.required, Validators.pattern(TIME_PATTERN)]],
      endTime: [endTime, [Validators.required, Validators.pattern(TIME_PATTERN)]],
      day: [day],
    }) as ScheduleRuleGroup;
  }

  private resetScheduleForm(schedule: ServiceSchedule | null = null): void {
    const rulesArray = this.scheduleForm.controls.rules;
    rulesArray.clear();

    if (schedule && schedule.days.length > 0) {
      for (const dayGroup of schedule.days) {
        for (const slot of dayGroup.timeSlots) {
          rulesArray.push(
            this.createRuleGroup(this.toInputTime(slot.startTime), this.toInputTime(slot.endTime), dayGroup.dayOfWeek),
          );
        }
      }
    } else {
      // Create a default empty rule
      rulesArray.push(this.createRuleGroup());
    }

    this.scheduleForm.controls.isSlotCodeRequired.setValue(schedule?.isSlotCodeRequired ?? false);
    this.scheduleForm.controls.slotCode.setValue(schedule?.slotCode ?? '');
    this.scheduleForm.markAsPristine();
    this.scheduleForm.markAsUntouched();
    this.scheduleForm.updateValueAndValidity();
  }

  protected rules(): readonly ScheduleRuleGroup[] {
    return this.scheduleForm.controls.rules.controls;
  }

  protected dayGroups(): any[] {
    return this.days.map((day, idx) => ({
      controls: {
        isWorkingDay: {
          value: this.timeSlotGroups(idx).length > 0,
        },
        dayOfWeek: {
          value: day,
        },
      },
    }));
  }

  protected timeSlotGroups(dayIndex: number): ScheduleRuleGroup[] {
    const day = this.days[dayIndex];
    return this.rules().filter((r) => r.controls.day.value === day) as ScheduleRuleGroup[];
  }

  protected toggleWorkingDay(dayIndex: number, checked: boolean): void {
    const day = this.days[dayIndex];
    if (checked) {
      if (this.timeSlotGroups(dayIndex).length === 0) {
        const nonPlaceholders = this.rules().filter((r) => !!r.controls.day.value);
        this.scheduleForm.controls.rules.clear();
        nonPlaceholders.forEach((r) => this.scheduleForm.controls.rules.push(r));
        this.scheduleForm.controls.rules.push(this.createRuleGroup('08:00', '15:00', day));
      }
    } else {
      const remaining = this.rules().filter((r) => r.controls.day.value !== day);
      this.scheduleForm.controls.rules.clear();
      remaining.forEach((r) => this.scheduleForm.controls.rules.push(r));
    }
    this.scheduleForm.markAsDirty();
    this.scheduleForm.updateValueAndValidity();
  }

  protected addTimeSlot(dayIndex: number): void {
    const day = this.days[dayIndex];
    this.scheduleForm.controls.rules.push(this.createRuleGroup('08:00', '15:00', day));
    this.scheduleForm.markAsDirty();
    this.scheduleForm.updateValueAndValidity();
  }

  protected removeTimeSlot(dayIndex: number, slotIndex: number): void {
    const daySlots = this.timeSlotGroups(dayIndex);
    const targetSlot = daySlots[slotIndex];
    if (targetSlot) {
      const idx = this.rules().indexOf(targetSlot);
      if (idx !== -1) {
        this.scheduleForm.controls.rules.removeAt(idx);
      }
    }
    this.scheduleForm.markAsDirty();
    this.scheduleForm.updateValueAndValidity();
  }


  protected addRule(): void {
    if (!this.canEditInline()) return;
    this.scheduleForm.controls.rules.push(this.createRuleGroup());
    this.scheduleForm.markAsDirty();
    this.scheduleForm.updateValueAndValidity();
  }

  protected removeRule(index: number): void {
    if (!this.canEditInline()) return;
    this.scheduleForm.controls.rules.removeAt(index);
    if (this.scheduleForm.controls.rules.length === 0) {
      this.scheduleForm.controls.rules.push(this.createRuleGroup());
    }
    this.scheduleForm.markAsDirty();
    this.scheduleForm.updateValueAndValidity();
  }

  protected ruleControlError(ruleIndex: number, controlName: 'startTime' | 'endTime'): string | null {
    const control = this.rules()[ruleIndex].controls[controlName];

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
  private mapRequest(): CreateServiceScheduleRequest {
    const value = this.scheduleForm.getRawValue();
    const slotCode = value.slotCode.trim();
    
    const daysMap = new Map<DayOfWeek, Array<{ startTime: string; endTime: string }>>();
    SERVICE_SCHEDULE_DAYS.forEach(d => daysMap.set(d, []));

    for (const rule of value.rules) {
      if (!rule.day || !rule.startTime || !rule.endTime) continue;
      
      const apiStartTime = this.toApiTime(rule.startTime);
      const apiEndTime = this.toApiTime(rule.endTime);
      
      daysMap.get(rule.day)?.push({ startTime: apiStartTime, endTime: apiEndTime });
    }

    const days = Array.from(daysMap.entries())
      .filter(([_, slots]) => slots.length > 0)
      .map(([dayOfWeek, timeSlots]) => ({
        dayOfWeek,
        timeSlots: timeSlots.sort((first, second) => this.compareTimeSlots(first, second)),
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



