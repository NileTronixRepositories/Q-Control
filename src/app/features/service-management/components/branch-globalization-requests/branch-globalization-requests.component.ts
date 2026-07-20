import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { finalize, Observable } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { SERVICE_GLOBALIZATION_TRANSLATIONS } from '../../i18n/service-globalization.translations';
import {
  ApproveServiceGlobalizationRequestResponse,
  PagedServiceGlobalizationRequestsResponse,
  RejectServiceGlobalizationRequestResponse,
  ServiceGlobalizationDecisionAction,
  ServiceGlobalizationDecisionState,
  ServiceGlobalizationOrderSort,
  ServiceGlobalizationRequestListItem,
  ServiceGlobalizationRequestStatus,
  ServiceGlobalizationRequestType,
} from '../../models/service-globalization.model';
import { ServiceDataInvalidationService } from '../../services/service-data-invalidation.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';

const STATUS_POLL_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-branch-globalization-requests',
  standalone: true,
  templateUrl: './branch-globalization-requests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchGlobalizationRequestsComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly apiService = inject(ServiceGlobalizationApiService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly invalidationService = inject(ServiceDataInvalidationService);
  private readonly permissionService = inject(ServiceManagementPermissionService);
  readonly branchId = input.required<number>();
  readonly open = input(false);
  readonly refreshKey = input(0);
  readonly closed = output<void>();

  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly translations = computed(() => SERVICE_GLOBALIZATION_TRANSLATIONS[this.language()]);
  protected readonly page = signal<PagedServiceGlobalizationRequestsResponse>({ currentPage: 1, pageSize: 10, totalItems: 0, data: [] });
  protected readonly status = signal<ServiceGlobalizationRequestStatus | null>(null);
  protected readonly requestType = signal<ServiceGlobalizationRequestType | null>(null);
  protected readonly orderSort = signal<ServiceGlobalizationOrderSort>('Newest');
  protected readonly searchText = signal('');
  protected readonly loading = signal(false);
  protected readonly mutating = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly decisionState = signal<ServiceGlobalizationDecisionState | null>(null);
  protected readonly rejectionReason = signal('');
  protected readonly canApprove = this.permissionService.canApproveGlobalizationRequests;
  protected readonly canReject = this.permissionService.canRejectGlobalizationRequests;
  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.page().totalItems / this.page().pageSize)));
  private requestId = 0;
  private activeBranchId: number | null = null;
  private wasOpen = false;
  private lastRefreshKey = 0;
  private pollingIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const branchId = this.branchId();
      const open = this.open();
      const refreshKey = this.refreshKey();
      const invalidation = this.invalidationService.branchRequestsInvalidation();
      const branchChanged = branchId !== this.activeBranchId;
      const opened = open && !this.wasOpen;
      const refreshed = refreshKey !== this.lastRefreshKey;

      this.activeBranchId = branchId;
      this.wasOpen = open;
      this.lastRefreshKey = refreshKey;

      if (branchChanged) {
        untracked(() => this.resetForBranch());
      }

      if (
        open &&
        (branchChanged || opened || refreshed || invalidation?.branchId === branchId)
      ) {
        const pageNumber = branchChanged ? 1 : untracked(() => this.page().currentPage);
        untracked(() => this.load(pageNumber, branchId, true));
      }
    });

    this.pollingIntervalId = setInterval(() => {
      if (this.open() && !this.loading()) {
        this.load(this.page().currentPage, this.branchId());
      }
    }, STATUS_POLL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    this.requestId += 1;

    if (this.pollingIntervalId !== null) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  @HostListener('document:keydown.escape')
  protected closeOnEscape(): void {
    if (this.open()) {
      this.close();
    }
  }

  protected close(): void {
    if (this.mutating()) return;
    this.closed.emit();
  }

  protected closeDecision(): void {
    if (this.mutating()) return;
    this.decisionState.set(null);
    this.rejectionReason.set('');
  }

  protected load(
    pageNumber = this.page().currentPage,
    branchId = this.branchId(),
    force = false,
  ): void {
    if (this.loading() && !force) return;
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    this.apiService.getBranchRequests(branchId, {
      status: this.status(), requestType: this.requestType(), searchText: this.searchText(),
      orderSort: this.orderSort(), pageNumber, pageSize: this.page().pageSize,
    }).pipe(finalize(() => {
      if (requestId === this.requestId) this.loading.set(false);
    })).subscribe({
      next: (response) => {
        if (requestId === this.requestId && this.branchId() === branchId) {
          this.page.set(response);
        }
      },
      error: (error: HttpErrorResponse) => {
        if (requestId === this.requestId && this.branchId() === branchId) {
          this.handleError(error);
        }
      },
    });
  }

  protected updateFilter(event: Event, kind: 'status' | 'type' | 'order'): void {
    const value = (event.target as HTMLSelectElement).value;
    if (kind === 'status') this.status.set((value || null) as ServiceGlobalizationRequestStatus | null);
    if (kind === 'type') this.requestType.set((value || null) as ServiceGlobalizationRequestType | null);
    if (kind === 'order') this.orderSort.set(value === 'Oldest' ? 'Oldest' : 'Newest');
    this.load(1);
  }

  protected search(event: Event): void {
    event.preventDefault();
    this.load(1);
  }

  protected serviceName(item: ServiceGlobalizationRequestListItem): string {
    return this.language() === 'ar' ? item.rootServiceArabicName : item.rootServiceEnglishName;
  }

  protected statusLabel(status: ServiceGlobalizationRequestStatus): string {
    return status === 'Pending' ? this.translations().pending : status === 'Approved' ? this.translations().approved : this.translations().rejected;
  }

  protected statusClasses(status: ServiceGlobalizationRequestStatus): string {
    if (status === 'Approved') {
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    }

    if (status === 'Rejected') {
      return 'bg-rose-50 text-rose-700 ring-rose-200';
    }

    return 'bg-amber-50 text-amber-700 ring-amber-200';
  }

  protected statusIcon(status: ServiceGlobalizationRequestStatus): string {
    if (status === 'Approved') {
      return 'bi bi-check-circle-fill';
    }

    if (status === 'Rejected') {
      return 'bi bi-x-circle-fill';
    }

    return 'bi bi-hourglass-split';
  }
  protected requestDecision(
    item: ServiceGlobalizationRequestListItem,
    action: ServiceGlobalizationDecisionAction,
  ): void {
    if (!this.canStartDecision(item.status, action)) return;
    this.error.set(null);
    this.rejectionReason.set('');
    this.decisionState.set({
      action,
      requestId: item.requestId,
      serviceName: this.serviceName(item),
      rowVersion: item.rowVersion,
    });
  }

  protected confirmDecision(): void {
    const decision = this.decisionState();
    if (!decision || this.mutating()) return;
    if (decision.action === 'reject' && this.rejectionReason().length > 1000) return;

    this.mutating.set(true);
    this.error.set(null);

    const request$: Observable<
      ApproveServiceGlobalizationRequestResponse | RejectServiceGlobalizationRequestResponse
    > =
      decision.action === 'approve'
        ? this.apiService.approveRequest(decision.requestId, decision.rowVersion)
        : this.apiService.rejectRequest(decision.requestId, decision.rowVersion, {
            rejectionReason: this.rejectionReason().trim() || null,
          });

    request$.pipe(finalize(() => this.mutating.set(false))).subscribe({
      next: (response) => {
        this.decisionState.set(null);
        this.rejectionReason.set('');

        if (response.status === 'Approved') {
          this.invalidationService.invalidateAfterApproval(response.branchId);
        } else {
          this.invalidationService.invalidateAfterRejection(response.branchId);
        }

        this.load(this.page().currentPage, response.branchId, true);
      },
      error: (error: HttpErrorResponse) => this.handleMutationError(error),
    });
  }

  protected canStartDecision(
    status: ServiceGlobalizationRequestStatus,
    action: ServiceGlobalizationDecisionAction,
  ): boolean {
    return status === 'Pending' && (action === 'approve' ? this.canApprove() : this.canReject());
  }

  protected typeLabel(type: ServiceGlobalizationRequestType): string {
    return type === 'BranchServiceTree' ? this.translations().branchServiceTree : this.translations().leafUnderGlobalParent;
  }

  protected formatDate(value: string | null): string {
    if (!value) return this.translations().notReviewed;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(this.language() === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium' }).format(date);
  }
  private handleMutationError(error: HttpErrorResponse): void {
    if (error.status === 409) {
      const message = formatTechnicalAdminApiError(error, this.translations().conflictReloaded);
      this.decisionState.set(null);
      this.rejectionReason.set('');
      this.load(this.page().currentPage, this.branchId(), true);
      this.error.set(message);
      return;
    }

    if (error.status === 404) {
      const message = formatTechnicalAdminApiError(error, this.translations().fallbackError);
      this.decisionState.set(null);
      this.rejectionReason.set('');
      this.load(this.page().currentPage, this.branchId(), true);
      this.error.set(message);
      return;
    }

    this.handleError(error);
  }

  private handleError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    const fallback = error.status === 403 ? this.translations().accessDenied : this.translations().fallbackError;
    this.error.set(formatTechnicalAdminApiError(error, fallback));
  }

  private resetForBranch(): void {
    this.requestId += 1;
    this.page.set({ currentPage: 1, pageSize: 10, totalItems: 0, data: [] });
    this.status.set(null);
    this.requestType.set(null);
    this.orderSort.set('Newest');
    this.searchText.set('');
    this.loading.set(false);
    this.mutating.set(false);
    this.error.set(null);
    this.decisionState.set(null);
    this.rejectionReason.set('');
  }
}
