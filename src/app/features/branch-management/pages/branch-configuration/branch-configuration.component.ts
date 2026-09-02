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

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { AuthSessionService } from '@core';
import { BranchListItem } from '@features/branch-management/models/branch-management/branch-management.model';
import { BranchConfigurationResponse } from '@features/branch-management/models/branch-configuration/branch-configuration.model';
import { BranchManagementApiService } from '@features/branch-management/services/branch-management-api/branch-management-api.service';
import { BranchConfigurationApiService } from '@features/branch-management/services/branch-configuration-api/branch-configuration-api.service';
import { BranchConfigurationPermissionService } from '@features/branch-management/services/branch-configuration-permission/branch-configuration-permission.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';

type UiMessageTone = 'success' | 'error' | 'info';

interface UiMessage {
  readonly tone: UiMessageTone;
  readonly text: string;
}

interface BranchOption {
  readonly id: number;
  readonly label: string;
}

@Component({
  selector: 'app-branch-configuration',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeroComponent, NiletronixLoadingStateComponent],
  templateUrl: './branch-configuration.component.html',
  styleUrls: ['./branch-configuration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchConfigurationComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly branchManagementApiService = inject(BranchManagementApiService);
  private readonly branchConfigurationApiService = inject(BranchConfigurationApiService);
  private readonly permissionService = inject(BranchConfigurationPermissionService);
  readonly i18nStore = inject(AdminI18nStore);

  readonly language = this.i18nStore.language;
  readonly direction = this.i18nStore.direction;
  readonly copy = this.i18nStore.translations;

  readonly branches = signal<readonly BranchOption[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly configuration = signal<BranchConfigurationResponse | null>(null);
  readonly branchesLoading = signal<boolean>(true);
  readonly configLoading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly message = signal<UiMessage | null>(null);
  private messageTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly configForm = this.formBuilder.group({
    hours: [0, [Validators.required, Validators.min(0), Validators.max(23), this.integerValidator]],
    minutes: [0, [Validators.required, Validators.min(0), Validators.max(59), this.integerValidator]],
    seconds: [0, [Validators.required, Validators.min(0), Validators.max(59), this.integerValidator]],
    maximumTicketCallAttempts: [3, [Validators.required, Validators.min(1), this.positiveIntegerValidator]],
    ticketNoShowAutoCancellationMinutes: [30, [Validators.required, Validators.min(1), this.positiveIntegerValidator]],
    ticketArchiveRetentionDays: [30, [Validators.required, Validators.min(1), this.positiveIntegerValidator]],
  });

  readonly isConfigured = computed(() => this.configuration()?.isConfigured ?? false);
  readonly rowVersion = computed(() => this.configuration()?.rowVersion ?? null);

  readonly ticketLabels = computed(() =>
    this.language() === 'ar'
      ? {
          generalSectionTitle: 'إعدادات أوقات الظهور (General Configuration)',
          generalSectionHelp: 'تحديد مهلة ظهور الخدمات على شاشات التذاكر قبل موعدها الرسمي.',
          title: 'إعدادات التذاكر (Ticket Runtime Configuration)',
          description:
            'يتم فرض حدود وقت التشغيل ومحاولات النداء والإلغاء التلقائي والأرشفة بواسطة الخادم الخلفي.',
          callAttempts: 'الحد الأقصى لمحاولات نداء التذكرة',
          callAttemptsHelp:
            'عدد محاولات نداء التذكرة المسموح بها قبل انتقالها إلى حالة عدم الحضور (No-Show).',
          noShowCancellation: 'مدة الإلغاء التلقائي لتذاكر عدم الحضور',
          noShowCancellationHelp:
            'عدد الدقائق التي تظل فيها التذكرة بحالة عدم الحضور قبل إلغائها تلقائياً.',
          archiveRetention: 'مدة الاحتفاظ بالتذاكر قبل الأرشفة',
          archiveRetentionHelp:
            'عدد الأيام التي تظل فيها التذاكر المنتهية في التخزين التشغيلي قبل نقلها إلى الأرشيف.',
          attemptsUnit: 'محاولة',
          minutes: 'دقيقة',
          days: 'يوم',
          positiveIntegerError: 'يجب إدخال قيم عددية صحيحة موجبة أكبر من الصفر.',
          timeError: 'يُرجى إدخال قيم صحيحة للوقت (الساعات من 0 إلى 23، والدقائق والثواني من 0 إلى 59).',
          runtimeSummaryTitle: 'محددات دورة حياة التذاكر',
          callAttemptsSummary: 'الحد الأقصى للنداء',
          noShowSummary: 'إلغاء عدم الحضور',
          retentionSummary: 'النقل للأرشيف بعد',
        }
      : {
          generalSectionTitle: 'General Configuration',
          generalSectionHelp: 'Defines how early services appear on ticket issuance screens before start.',
          title: 'Ticket Configuration',
          description:
            'Runtime call attempts, no-show auto-cancellation, and archive retention thresholds enforced by backend.',
          callAttempts: 'Maximum Ticket Call Attempts',
          callAttemptsHelp:
            'Maximum call attempts permitted before ticket transitions to No-Show.',
          noShowCancellation: 'No-Show Auto Cancellation Time',
          noShowCancellationHelp:
            'Minutes a No-Show ticket remains before automatic cancellation by the backend.',
          archiveRetention: 'Ticket Archive Retention',
          archiveRetentionHelp:
            'Days completed or cancelled tickets stay in operational storage before archiving.',
          attemptsUnit: 'Count',
          minutes: 'Minutes',
          days: 'Days',
          positiveIntegerError: 'Values must be positive integers greater than zero.',
          timeError: 'Please enter valid time values (Hours: 0-23, Minutes & Seconds: 0-59).',
          runtimeSummaryTitle: 'Ticket Runtime Overview',
          callAttemptsSummary: 'Max Call Attempts',
          noShowSummary: 'Auto Cancellation',
          retentionSummary: 'Archive After',
        },
  );

  readonly canModify = computed(() => {
    if (this.isConfigured()) {
      return this.permissionService.canUpdate();
    }
    return this.permissionService.canCreate();
  });

  ngOnInit(): void {
    this.loadBranches();
  }

  ngOnDestroy(): void {
    this.clearTimeout();
  }

  selectBranch(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const nextBranchId = target.value ? Number(target.value) : null;
    this.selectedBranchId.set(nextBranchId);

    if (nextBranchId) {
      this.syncSelectedBranchQuery(nextBranchId);
      this.loadConfiguration(nextBranchId);
    } else {
      this.configuration.set(null);
    }
  }

  refresh(): void {
    const branchId = this.selectedBranchId();
    if (branchId) {
      this.loadConfiguration(branchId);
    } else {
      this.loadBranches();
    }
  }

  save(): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !this.canModify() || this.saving()) {
      return;
    }

    if (this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    const {
      hours,
      minutes,
      seconds,
      maximumTicketCallAttempts,
      ticketNoShowAutoCancellationMinutes,
      ticketArchiveRetentionDays,
    } = this.configForm.getRawValue();

    const allowedTime = this.formatTime(Number(hours), Number(minutes), Number(seconds));
    const callAttempts = Number(maximumTicketCallAttempts);
    const noShowMinutes = Number(ticketNoShowAutoCancellationMinutes);
    const retentionDays = Number(ticketArchiveRetentionDays);

    this.saving.set(true);
    this.clearMessage();

    const request$ = this.isConfigured()
      ? this.branchConfigurationApiService.updateBranchConfiguration(branchId, {
          allowedTime,
          maximumTicketCallAttempts: callAttempts,
          maxCallAttempts: callAttempts,
          ticketNoShowAutoCancellationMinutes: noShowMinutes,
          noShowAutoCancellationMinutes: noShowMinutes,
          noShowReturnStatus: 'Waiting',
          ticketArchiveRetentionDays: retentionDays,
          ticketHistoricalUsageHours: retentionDays * 24,
          rowVersion: this.rowVersion() ?? '',
        })
      : this.branchConfigurationApiService.createBranchConfiguration(branchId, {
          allowedTime,
          maximumTicketCallAttempts: callAttempts,
          maxCallAttempts: callAttempts,
          ticketNoShowAutoCancellationMinutes: noShowMinutes,
          noShowAutoCancellationMinutes: noShowMinutes,
          noShowReturnStatus: 'Waiting',
          ticketArchiveRetentionDays: retentionDays,
          ticketHistoricalUsageHours: retentionDays * 24,
        });

    request$.subscribe({
      next: (response) => {
        this.saving.set(false);
        this.applyConfiguration(response);
        this.showMessage('success', this.copy().savedSuccessfullyLabel);
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.handleApiError(error, branchId);
      },
    });
  }

  clearMessage(): void {
    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = null;
    }
    this.message.set(null);
  }

  readonly isTechnicalAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin',
  );

  readonly currentBranchName = computed(() => {
    const session = this.authSessionService.currentSession();
    const branchId = this.selectedBranchId();
    if (this.branches().length > 0) {
      const match = this.branches().find((b) => b.id === branchId);
      if (match) return match.label;
    }
    if (session?.branches && session.branches.length > 0) {
      const match = session.branches.find((b) => b.branchId === branchId);
      if (match) {
        return (
          (this.language() === 'ar' ? match.arabicName : match.englishName) ||
          match.arabicName ||
          match.englishName
        );
      }
    }
    return branchId ? `فرع ${branchId}` : '';
  });

  private loadBranches(): void {
    const currentSession = this.authSessionService.currentSession();
    const activeBranchId = currentSession?.activeBranchId
      ? Number(currentSession.activeBranchId)
      : null;
    const isTechAdmin = currentSession?.userType === 'TechnicalAdmin';

    if (!isTechAdmin && activeBranchId) {
      const branch = currentSession?.branches?.find((b) => b.branchId === activeBranchId);
      const branchName = branch
        ? (this.language() === 'ar' ? branch.arabicName : branch.englishName) ||
          branch.arabicName ||
          branch.englishName
        : `فرع ${activeBranchId}`;
      const branchOption: BranchOption = { id: activeBranchId, label: branchName };
      this.branches.set([branchOption]);
      this.selectedBranchId.set(activeBranchId);
      this.branchesLoading.set(false);
      this.syncSelectedBranchQuery(activeBranchId);
      this.loadConfiguration(activeBranchId);
      return;
    }

    this.branchesLoading.set(true);
    this.branchManagementApiService
      .getBranches({
        searchText: '',
        orderSort: 'Newest',
        pageNumber: 1,
        pageSize: 100,
        isActive: null,
      })
      .subscribe({
        next: (response) => {
          const branchOptions = response.data.map((branch) => this.mapBranchOption(branch));
          this.branches.set(branchOptions);
          this.selectInitialBranch(branchOptions);
        },
        error: (error: HttpErrorResponse) => {
          this.branchesLoading.set(false);
          if (activeBranchId) {
            const branchOption: BranchOption = {
              id: activeBranchId,
              label: `فرع ${activeBranchId}`,
            };
            this.branches.set([branchOption]);
            this.selectedBranchId.set(activeBranchId);
            this.loadConfiguration(activeBranchId);
          } else {
            this.handleApiError(error, null);
          }
        },
        complete: () => this.branchesLoading.set(false),
      });
  }

  private selectInitialBranch(branches: readonly BranchOption[]): void {
    const queryBranchId = Number(this.route.snapshot.queryParamMap.get('branchId'));
    const sessionActiveBranchId = this.authSessionService.currentSession()?.activeBranchId
      ? Number(this.authSessionService.currentSession()?.activeBranchId)
      : null;

    const nextBranchId = branches.some((branch) => branch.id === queryBranchId)
      ? queryBranchId
      : sessionActiveBranchId && branches.some((branch) => branch.id === sessionActiveBranchId)
        ? sessionActiveBranchId
        : (branches[0]?.id ?? null);

    this.selectedBranchId.set(nextBranchId);

    if (nextBranchId) {
      this.syncSelectedBranchQuery(nextBranchId);
      this.loadConfiguration(nextBranchId);
    }
  }

  private loadConfiguration(branchId: number, clearMsg: boolean = true): void {
    this.configLoading.set(true);
    if (clearMsg) {
      this.clearMessage();
    }

    this.branchConfigurationApiService.getBranchConfiguration(branchId).subscribe({
      next: (response) => {
        this.applyConfiguration(response);
      },
      error: (error: HttpErrorResponse) => {
        this.configLoading.set(false);
        this.handleApiError(error, branchId);
      },
      complete: () => this.configLoading.set(false),
    });
  }

  private applyConfiguration(response: BranchConfigurationResponse): void {
    this.configuration.set(response);
    const { hours, minutes, seconds } = this.parseTime(response.allowedTime || '00:00:00');

    const rawAttempts =
      response.maximumTicketCallAttempts ??
      response.maxCallAttempts ??
      (response as any).MaximumTicketCallAttempts ??
      (response as any).MaxCallAttempts;
    const callAttempts = rawAttempts !== undefined && rawAttempts !== null ? Number(rawAttempts) : 3;

    const rawNoShow =
      response.ticketNoShowAutoCancellationMinutes ??
      response.noShowAutoCancellationMinutes ??
      (response as any).TicketNoShowAutoCancellationMinutes ??
      (response as any).NoShowAutoCancellationMinutes;
    const noShowMinutes = rawNoShow !== undefined && rawNoShow !== null ? Number(rawNoShow) : 30;

    const rawRetention =
      response.ticketArchiveRetentionDays ??
      (response.ticketHistoricalUsageHours ? Math.round(response.ticketHistoricalUsageHours / 24) : undefined) ??
      (response as any).TicketArchiveRetentionDays ??
      ((response as any).TicketHistoricalUsageHours
        ? Math.round((response as any).TicketHistoricalUsageHours / 24)
        : undefined);
    const retentionDays = rawRetention !== undefined && rawRetention !== null ? Number(rawRetention) : 30;

    this.configForm.reset({
      hours,
      minutes,
      seconds,
      maximumTicketCallAttempts: !isNaN(callAttempts) && callAttempts > 0 ? callAttempts : 3,
      ticketNoShowAutoCancellationMinutes: !isNaN(noShowMinutes) && noShowMinutes > 0 ? noShowMinutes : 30,
      ticketArchiveRetentionDays: !isNaN(retentionDays) && retentionDays > 0 ? retentionDays : 30,
    });
  }

  private formatTime(hours: number, minutes: number, seconds: number): string {
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  private parseTime(timeStr: string): { hours: number; minutes: number; seconds: number } {
    const parts = timeStr.split(':').map((item) => parseInt(item, 10) || 0);
    return {
      hours: Math.min(23, Math.max(0, parts[0] ?? 0)),
      minutes: Math.min(59, Math.max(0, parts[1] ?? 0)),
      seconds: Math.min(59, Math.max(0, parts[2] ?? 0)),
    };
  }

  private positiveIntegerValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    if (val === null || val === undefined || val === '') {
      return { required: true };
    }
    const num = Number(val);
    if (!Number.isInteger(num) || num <= 0) {
      return { positiveInteger: true };
    }
    return null;
  }

  private integerValidator(control: AbstractControl): ValidationErrors | null {
    const val = control.value;
    if (val === null || val === undefined || val === '') {
      return { required: true };
    }
    const num = Number(val);
    if (!Number.isInteger(num) || num < 0) {
      return { integer: true };
    }
    return null;
  }

  private handleApiError(error: HttpErrorResponse, currentBranchId: number | null): void {
    if (
      error.status === 401 ||
      (this.authSessionService as any).shouldClearSessionForHttpStatus?.(error.status)
    ) {
      if (error.status === 401) {
        this.authSessionService.clearSession();
        void this.router.navigateByUrl('/auth/login');
        return;
      }
    }

    if (error.status === 403) {
      this.showMessage(
        'error',
        formatApiError(
          error,
          this.language() === 'ar'
            ? 'تم رفض الوصول. ليس لديك الصلاحية لتنفيذ هذه العملية.'
            : 'Access denied. You do not have authorization for this operation.',
        ),
      );
      return;
    }

    if (error.status === 409 && currentBranchId !== null) {
      this.showMessage('error', this.copy().concurrencyConflictMessage);
      this.loadConfiguration(currentBranchId, false);
      return;
    }

    if (error.status === 404 && currentBranchId !== null && this.isConfigured()) {
      this.showMessage(
        'info',
        this.language() === 'ar'
          ? 'لم تعد التهيئة موجودة على الخادم. تم التحويل إلى وضع الإنشاء.'
          : 'The configuration no longer exists on the server. Switched to create mode.',
      );
      this.loadConfiguration(currentBranchId, false);
      return;
    }

    this.showMessage(
      'error',
      formatApiError(
        error,
        this.language() === 'ar'
          ? 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.'
          : 'An unexpected error occurred while communicating with the server.',
      ),
    );
  }

  private showMessage(tone: UiMessageTone, text: string): void {
    this.clearTimeout();
    this.message.set({ tone, text });
    this.messageTimeoutId = setTimeout(
      () => {
        this.message.set(null);
        this.messageTimeoutId = null;
      },
      tone === 'error' ? 7000 : 4500,
    );
  }

  private clearTimeout(): void {
    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = null;
    }
  }

  private mapBranchOption(branch: BranchListItem): BranchOption {
    const preferredName = this.language() === 'ar' ? branch.arabicName : branch.englishName;
    const fallbackName = this.language() === 'ar' ? branch.englishName : branch.arabicName;
    const label = preferredName?.trim() || fallbackName?.trim() || `BR-${branch.branchId}`;

    return {
      id: branch.branchId,
      label,
    };
  }

  private syncSelectedBranchQuery(branchId: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { branchId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  formatUnit(val: number | undefined | null): string {
    const num = Number(val ?? 0);
    if (isNaN(num) || num < 0) {
      return '00';
    }
    return num.toString().padStart(2, '0');
  }

  get formattedTotalDuration(): string {
    const h = Number(this.configForm.controls.hours.value || 0);
    const m = Number(this.configForm.controls.minutes.value || 0);
    const s = Number(this.configForm.controls.seconds.value || 0);
    const isAr = this.language() === 'ar';

    const parts: string[] = [];
    if (h > 0) {
      parts.push(isAr ? `${h} ساعة` : `${h}h`);
    }
    if (m > 0) {
      parts.push(isAr ? `${m} دقيقة` : `${m}m`);
    }
    if (s > 0) {
      parts.push(isAr ? `${s} ثانية` : `${s}s`);
    }
    if (parts.length === 0) {
      return isAr ? '0 دقيقة (فوري عند بدء الخدمة)' : '0m (Instant at service time)';
    }

    return parts.join(isAr ? ' و ' : ' & ');
  }
}
