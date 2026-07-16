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
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';
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
  ServiceScheduleFormMode,
  ServiceSchedulePendingChanges,
  ServiceScheduleScope,
  ServiceScheduleUiMessage,
} from '../../models/service-schedule.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceScheduleApiService } from '../../services/service-schedule-api.service';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/;

function serviceScheduleTimeValidator(control: AbstractControl): ValidationErrors | null {
  const startTime = String(control.get('startTime')?.value ?? '').trim();
  const endTime = String(control.get('endTime')?.value ?? '').trim();

  if (!startTime || !endTime) {
    return null;
  }

  if (!TIME_PATTERN.test(startTime) || !TIME_PATTERN.test(endTime)) {
    return { invalidTime: true };
  }

  return timeToMinutes(startTime) < timeToMinutes(endTime) ? null : { timeRange: true };
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
  imports: [ReactiveFormsModule, TechnicalAdminPageHeroComponent],
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
  protected readonly formMode = signal<ServiceScheduleFormMode>('closed');
  protected readonly reloadRequired = signal(false);
  protected readonly slotCodeConflict = signal(false);
  protected readonly selectedWorkDays = computed(() => this.scheduleForm.controls.workDays.value);
  protected readonly canSave = computed(() => {
    const current = this.schedule();
    return !this.saving() && !this.reloadRequired() && (current?.isCurrentlyOperational ?? true);
  });

  protected readonly scheduleForm = this.formBuilder.group(
    {
      startTime: ['', [Validators.required]],
      endTime: ['', [Validators.required]],
      workDays: this.formBuilder.control<readonly DayOfWeek[]>([], [Validators.required]),
      isSlotCodeRequired: [false],
      slotCode: ['', [Validators.maxLength(100)]],
    },
    { validators: serviceScheduleTimeValidator },
  );

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

  protected openCreate(): void {
    if (!this.canCreate() || this.schedule()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    this.reloadRequired.set(false);
    this.slotCodeConflict.set(false);
    this.scheduleForm.reset({
      startTime: '',
      endTime: '',
      workDays: [],
      isSlotCodeRequired: false,
      slotCode: '',
    });
    this.formMode.set('create');
  }

  protected openEdit(): void {
    const current = this.schedule();

    if (!current || !this.canUpdate()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    if (!current.isCurrentlyOperational) {
      this.showMessage('error', this.translations().currentlyUnavailableHint);
      return;
    }

    this.reloadRequired.set(false);
    this.slotCodeConflict.set(false);
    this.scheduleForm.reset({
      startTime: this.toInputTime(current.startTime),
      endTime: this.toInputTime(current.endTime),
      workDays: [...current.workDays],
      isSlotCodeRequired: current.isSlotCodeRequired,
      slotCode: current.slotCode ?? '',
    });
    this.formMode.set('edit');
  }

  protected closeForm(): void {
    if (!this.canDeactivatePendingChanges()) {
      return;
    }

    this.formMode.set('closed');
    this.reloadRequired.set(false);
    this.scheduleForm.markAsPristine();
  }

  protected reloadLatest(): void {
    this.reloadRequired.set(false);
    this.loadSchedule();
  }

  protected toggleWorkDay(day: DayOfWeek, checked: boolean): void {
    const selected = new Set(this.scheduleForm.controls.workDays.value);

    if (checked) {
      selected.add(day);
    } else {
      selected.delete(day);
    }

    this.scheduleForm.controls.workDays.setValue(
      SERVICE_SCHEDULE_DAYS.filter((item) => selected.has(item)),
    );
    this.scheduleForm.controls.workDays.markAsDirty();
    this.scheduleForm.controls.workDays.markAsTouched();
  }

  protected hasWorkDay(day: DayOfWeek): boolean {
    return this.selectedWorkDays().includes(day);
  }

  protected submit(): void {
    const currentScope = this.scope();
    this.scheduleForm.markAllAsTouched();
    this.slotCodeConflict.set(false);
    this.applySlotCodeValidation();

    if (!currentScope || this.scheduleForm.invalid || !this.canSave()) {
      return;
    }

    const request = this.mapRequest();
    const mode = this.formMode();
    const mutation$ =
      mode === 'create'
        ? this.apiService.createSchedule(currentScope.branchId, currentScope.leafServiceId, request)
        : this.apiService.updateSchedule(currentScope.branchId, currentScope.leafServiceId, {
            ...request,
            rowVersion: this.schedule()?.rowVersion ?? '',
          });

    this.saving.set(true);
    mutation$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (response) => {
        this.schedule.set(response);
        this.formMode.set('closed');
        this.reloadRequired.set(false);
        this.scheduleForm.markAsPristine();
        this.showMessage(
          'success',
          response.message ||
            (mode === 'create'
              ? this.translations().scheduleCreated
              : this.translations().scheduleUpdated),
        );
      },
      error: (error: HttpErrorResponse) => this.handleMutationError(error),
    });
  }

  protected controlError(controlName: 'startTime' | 'endTime' | 'slotCode'): string | null {
    const control = this.scheduleForm.controls[controlName];

    if (controlName === 'slotCode' && this.slotCodeConflict()) {
      return this.translations().slotCodeAlreadyExists;
    }

    if (!control.touched || !control.invalid) {
      return null;
    }

    if (control.hasError('required')) {
      return this.translations().requiredField;
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

    if (this.scheduleForm.hasError('invalidTime')) {
      return this.translations().invalidTime;
    }

    if (this.scheduleForm.hasError('timeRange')) {
      return this.translations().timeRangeInvalid;
    }

    if (this.scheduleForm.controls.workDays.touched && this.selectedWorkDays().length === 0) {
      return this.translations().workDaysRequired;
    }

    return null;
  }

  protected dayLabel(day: DayOfWeek): string {
    return this.translations().dayLabels[day];
  }

  protected formatDays(days: readonly DayOfWeek[]): string {
    return days.map((day) => this.dayLabel(day)).join(', ');
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

    this.selectedBranchId.set(branchId);
    this.selectedServicePath.set(this.findTreePath(this.scheduleTree(), leafServiceId));
    this.scope.set({
      branchId,
      leafServiceId,
      branchName: this.branchLabel(branchId),
      serviceName: this.serviceName(node),
    });
    this.loadSchedule();
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
          this.formMode.set('closed');
          this.reloadRequired.set(false);
          this.scheduleForm.markAsPristine();
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 404 && this.containsErrorCode(error, 'ScheduleNotFound')) {
            this.schedule.set(null);
            this.formMode.set('closed');
            this.reloadRequired.set(false);
            this.scheduleForm.markAsPristine();
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
    this.formMode.set('closed');
    this.reloadRequired.set(false);
    this.slotCodeConflict.set(false);
    this.scheduleForm.markAsPristine();
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

  private mapRequest(): CreateServiceScheduleRequest {
    const value = this.scheduleForm.getRawValue();
    const slotCode = value.slotCode.trim();

    return {
      startTime: this.toApiTime(value.startTime),
      endTime: this.toApiTime(value.endTime),
      workDays: SERVICE_SCHEDULE_DAYS.filter((day) => value.workDays.includes(day)),
      isSlotCodeRequired: value.isSlotCodeRequired,
      slotCode: value.isSlotCodeRequired ? slotCode : null,
    };
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
    return TIME_PATTERN.test(value) ? value.slice(0, 5) : '';
  }

  private toApiTime(value: string): string {
    return value.length === 5 ? `${value}:00` : value;
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



