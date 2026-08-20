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
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem } from '../../models/branch-management.model';
import { BranchConfigurationResponse } from '../../models/branch-configuration.model';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { BranchConfigurationApiService } from '../../services/branch-configuration-api.service';
import { BranchConfigurationPermissionService } from '../../services/branch-configuration-permission.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../utils/api-error-message.util';

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
  imports: [ReactiveFormsModule, TechnicalAdminPageHeroComponent, NiletronixLoadingStateComponent],
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
  readonly i18nStore = inject(TechnicalAdminI18nStore);

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
    hours: [0, [Validators.required, Validators.min(0), Validators.max(23)]],
    minutes: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
    seconds: [0, [Validators.required, Validators.min(0), Validators.max(59)]],
  });

  readonly isConfigured = computed(() => this.configuration()?.isConfigured ?? false);
  readonly rowVersion = computed(() => this.configuration()?.rowVersion ?? null);

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
    if (!branchId || !this.canModify() || this.saving() || this.configForm.invalid) {
      return;
    }

    const { hours, minutes, seconds } = this.configForm.getRawValue();
    const allowedTime = this.formatTime(hours, minutes, seconds);

    this.saving.set(true);
    this.clearMessage();

    const request$ = this.isConfigured()
      ? this.branchConfigurationApiService.updateBranchConfiguration(branchId, {
          allowedTime,
          rowVersion: this.rowVersion() ?? '',
        })
      : this.branchConfigurationApiService.createBranchConfiguration(branchId, {
          allowedTime,
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

  private loadBranches(): void {
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
          this.handleApiError(error, null);
        },
        complete: () => this.branchesLoading.set(false),
      });
  }

  private selectInitialBranch(branches: readonly BranchOption[]): void {
    const queryBranchId = Number(this.route.snapshot.queryParamMap.get('branchId'));
    const nextBranchId = branches.some((branch) => branch.id === queryBranchId)
      ? queryBranchId
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
    this.configForm.reset({ hours, minutes, seconds });
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
        formatTechnicalAdminApiError(
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
      formatTechnicalAdminApiError(
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
