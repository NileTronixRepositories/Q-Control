import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';

import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem } from '../../../technical-admin/models/branch-management.model';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { SERVICE_GLOBALIZATION_TRANSLATIONS } from '../../i18n/service-globalization.translations';
import {
  ApproveServiceGlobalizationRequestResponse,
  RejectServiceGlobalizationRequestResponse,
  ServiceGlobalizationDecisionAction,
  ServiceGlobalizationRequestListItem,
  ServiceGlobalizationRequestServiceNode,
  ServiceGlobalizationRequestStatus,
  ServiceGlobalizationRequestType,
} from '../../models/service-globalization.model';
import { ServiceDataInvalidationService } from '../../services/service-data-invalidation.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceGlobalizationStore } from '../../store/service-globalization.store';

interface FlatRequestServiceNode {
  readonly node: ServiceGlobalizationRequestServiceNode;
  readonly depth: number;
}

@Component({
  selector: 'app-globalization-requests',
  standalone: true,
  imports: [TechnicalAdminPageHeroComponent],
  providers: [ServiceGlobalizationStore],
  templateUrl: './globalization-requests.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalizationRequestsComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly apiService = inject(ServiceGlobalizationApiService);
  private readonly branchApiService = inject(BranchManagementApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);
  private readonly invalidationService = inject(ServiceDataInvalidationService);

  protected readonly store = inject(ServiceGlobalizationStore);
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly translations = computed(() => SERVICE_GLOBALIZATION_TRANSLATIONS[this.language()]);
  protected readonly branches = signal<readonly BranchListItem[]>([]);
  protected readonly branchesLoading = signal(false);
  protected readonly rejectionReason = signal('');
  protected readonly canViewDetails = this.permissionService.canViewGlobalizationRequestDetails;
  protected readonly canApprove = this.permissionService.canApproveGlobalizationRequests;
  protected readonly canReject = this.permissionService.canRejectGlobalizationRequests;
  protected readonly flatDetailsNodes = computed(() =>
    this.flattenNodes(this.store.selectedDetails()?.services ?? []),
  );
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private listRequestId = 0;
  private detailsRequestId = 0;

  ngOnInit(): void {
    this.loadRequests(1);
    this.loadBranches();
  }

  ngOnDestroy(): void {
    this.listRequestId += 1;
    this.detailsRequestId += 1;
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
  }

  protected loadRequests(
    pageNumber = this.store.page().currentPage,
    force = false,
  ): void {
    if (this.store.loading() && !force) return;
    const requestId = ++this.listRequestId;
    this.store.loading.set(true);
    this.apiService
      .getRequests({
        status: this.store.status(),
        requestType: this.store.requestType(),
        branchId: this.store.branchId(),
        searchText: this.store.searchText(),
        orderSort: this.store.orderSort(),
        pageNumber,
        pageSize: this.store.pageSize(),
      })
      .pipe(
        finalize(() => {
          if (requestId === this.listRequestId) {
            this.store.loading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (requestId === this.listRequestId) {
            this.store.applyPageResponse(response);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.listRequestId) {
            this.handleError(error);
          }
        },
      });
  }

  protected updateStatus(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.status.set((value || null) as ServiceGlobalizationRequestStatus | null);
    this.loadRequests(1);
  }

  protected updateType(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.requestType.set((value || null) as ServiceGlobalizationRequestType | null);
    this.loadRequests(1);
  }

  protected updateBranch(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.store.branchId.set(Number.isInteger(value) && value > 0 ? value : null);
    this.loadRequests(1);
  }

  protected updateSearch(event: Event): void {
    this.store.searchText.set((event.target as HTMLInputElement).value.slice(0, 200));
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    this.loadRequests(1);
  }

  protected updateOrder(event: Event): void {
    this.store.orderSort.set((event.target as HTMLSelectElement).value === 'Oldest' ? 'Oldest' : 'Newest');
    this.loadRequests(1);
  }

  protected updatePageSize(event: Event): void {
    this.store.pageSize.set(Math.min(100, Math.max(1, Number((event.target as HTMLSelectElement).value) || 10)));
    this.loadRequests(1);
  }

  protected openDetails(requestId: number): void {
    if (!this.canViewDetails() || this.store.detailsLoading()) return;
    this.store.openDetails();
    this.loadDetails(requestId);
  }

  protected requestDecision(item: ServiceGlobalizationRequestListItem, action: ServiceGlobalizationDecisionAction): void {
    const details = this.store.selectedDetails();
    const rowVersion = details?.requestId === item.requestId ? details.rowVersion : item.rowVersion;
    if (!this.canStartDecision(item.status, action)) return;
    this.rejectionReason.set('');
    this.store.decisionState.set({
      action,
      requestId: item.requestId,
      serviceName: this.serviceName(item),
      rowVersion,
    });
  }

  protected requestDetailsDecision(action: ServiceGlobalizationDecisionAction): void {
    const details = this.store.selectedDetails();
    if (!details || !this.canStartDecision(details.status, action)) return;
    const root = details.services[0];
    this.rejectionReason.set('');
    this.store.decisionState.set({
      action,
      requestId: details.requestId,
      serviceName: root ? this.nodeName(root) : `#${details.requestId}`,
      rowVersion: details.rowVersion,
    });
  }

  protected confirmDecision(): void {
    const state = this.store.decisionState();
    if (!state || this.store.mutating()) return;
    if (state.action === 'reject' && this.rejectionReason().length > 1000) return;
    this.store.mutating.set(true);
    const request$: Observable<
      ApproveServiceGlobalizationRequestResponse | RejectServiceGlobalizationRequestResponse
    > =
      state.action === 'approve'
        ? this.apiService.approveRequest(state.requestId, state.rowVersion)
        : this.apiService.rejectRequest(state.requestId, state.rowVersion, {
            rejectionReason: this.rejectionReason().trim() || null,
          });
    request$.pipe(finalize(() => this.store.mutating.set(false))).subscribe({
      next: (response) => {
        this.store.decisionState.set(null);
        this.store.applyDecisionResponse(response);
        this.showMessage('success', response.message);
        if (response.status === 'Approved') {
          this.invalidationService.invalidateAfterApproval(response.branchId);
        } else {
          this.invalidationService.invalidateAfterRejection(response.branchId);
        }
        this.loadRequests(this.store.page().currentPage, true);
        if (this.store.detailsOpen()) {
          this.loadDetails(response.requestId, true);
        }
      },
      error: (error: HttpErrorResponse) => this.handleMutationError(error, state.requestId),
    });
  }

  protected canStartDecision(status: ServiceGlobalizationRequestStatus, action: ServiceGlobalizationDecisionAction): boolean {
    return status === 'Pending' && (action === 'approve' ? this.canApprove() : this.canReject());
  }

  protected serviceName(item: ServiceGlobalizationRequestListItem): string {
    return this.language() === 'ar' ? item.rootServiceArabicName : item.rootServiceEnglishName;
  }

  protected branchName(item: ServiceGlobalizationRequestListItem | BranchListItem): string {
    return this.language() === 'ar'
      ? ('branchArabicName' in item ? item.branchArabicName : item.arabicName)
      : ('branchEnglishName' in item ? item.branchEnglishName : item.englishName);
  }

  protected parentName(item: ServiceGlobalizationRequestListItem): string {
    return (
      (this.language() === 'ar' ? item.parentServiceArabicName : item.parentServiceEnglishName) ||
      '—'
    );
  }

  protected nodeName(node: ServiceGlobalizationRequestServiceNode): string {
    return this.language() === 'ar' ? node.arabicName : node.englishName;
  }

  protected parentDetailsName(parent: { readonly arabicName: string; readonly englishName: string }): string {
    return this.language() === 'ar' ? parent.arabicName : parent.englishName;
  }

  protected statusLabel(status: ServiceGlobalizationRequestStatus): string {
    const translations = this.translations();
    return status === 'Pending' ? translations.pending : status === 'Approved' ? translations.approved : translations.rejected;
  }

  protected statusClasses(status: ServiceGlobalizationRequestStatus): string {
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    if (status === 'Rejected') return 'bg-rose-50 text-rose-700 ring-rose-200';
    return 'bg-amber-50 text-amber-700 ring-amber-200';
  }

  protected statusIcon(status: ServiceGlobalizationRequestStatus): string {
    if (status === 'Approved') return 'bi bi-check-circle-fill';
    if (status === 'Rejected') return 'bi bi-x-circle-fill';
    return 'bi bi-hourglass-split';
  }

  protected messageClasses(tone: 'success' | 'error' | 'info'): string {
    if (tone === 'success') return 'border-emerald-200 text-emerald-800';
    if (tone === 'error') return 'border-rose-200 text-rose-800';
    return 'border-sky-200 text-sky-800';
  }

  protected messageIcon(tone: 'success' | 'error' | 'info'): string {
    if (tone === 'success') return 'bi bi-check-circle-fill text-emerald-600';
    if (tone === 'error') return 'bi bi-exclamation-triangle-fill text-rose-600';
    return 'bi bi-info-circle-fill text-sky-600';
  }

  protected nodeScopeClasses(node: ServiceGlobalizationRequestServiceNode): string {
    return node.scope === 'Global'
      ? 'bg-violet-50 text-violet-700 ring-violet-200'
      : 'bg-cyan-50 text-cyan-700 ring-cyan-200';
  }

  protected nodeScopeLabel(node: ServiceGlobalizationRequestServiceNode): string {
    return node.scope === 'Global' ? this.translations().global : this.translations().branchScoped;
  }

  protected nodeStateClasses(node: ServiceGlobalizationRequestServiceNode): string {
    if (node.isDeleted) return 'bg-rose-50 text-rose-700 ring-rose-200';
    if (node.isActive) return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    return 'bg-slate-100 text-slate-600 ring-slate-200';
  }

  protected nodeStateLabel(node: ServiceGlobalizationRequestServiceNode): string {
    if (node.isDeleted) return this.translations().deleted;
    return node.isActive ? this.translations().active : this.translations().inactive;
  }

  protected typeLabel(type: ServiceGlobalizationRequestType): string {
    return type === 'BranchServiceTree'
      ? this.translations().branchServiceTree
      : this.translations().leafUnderGlobalParent;
  }

  protected formatDate(value: string | null): string {
    if (!value) return this.translations().notReviewed;
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? value
      : new Intl.DateTimeFormat(this.language() === 'ar' ? 'ar-EG' : 'en-GB', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
  }

  private loadDetails(requestId: number, force = false): void {
    if (this.store.detailsLoading() && !force) return;
    const detailsRequestId = ++this.detailsRequestId;
    this.store.detailsLoading.set(true);
    this.apiService
      .getRequestDetails(requestId)
      .pipe(
        finalize(() => {
          if (detailsRequestId === this.detailsRequestId) {
            this.store.detailsLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (details) => {
          if (detailsRequestId === this.detailsRequestId) {
            this.store.applyDetailsResponse(details);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (detailsRequestId === this.detailsRequestId) {
            this.handleDetailsError(error);
          }
        },
      });
  }

  private loadBranches(): void {
    this.branchesLoading.set(true);
    this.branchApiService
      .getBranches({ searchText: '', orderSort: 'Newest', pageNumber: 1, pageSize: 100, isActive: null })
      .pipe(finalize(() => this.branchesLoading.set(false)))
      .subscribe({
        next: (response) => this.branches.set(response.data),
        error: () => this.branches.set([]),
      });
  }

  private handleMutationError(error: HttpErrorResponse, requestId: number): void {
    if (error.status === 409) {
      this.store.decisionState.set(null);
      this.showMessage('error', formatTechnicalAdminApiError(error, this.translations().conflictReloaded));
      this.loadRequests(this.store.page().currentPage);
      if (this.store.detailsOpen()) this.loadDetails(requestId);
      return;
    }
    if (error.status === 404) {
      this.store.decisionState.set(null);
      this.store.closeDetails();
      this.showMessage('error', formatTechnicalAdminApiError(error, this.translations().fallbackError));
      this.loadRequests(this.store.page().currentPage);
      return;
    }
    this.handleError(error);
  }

  private handleDetailsError(error: HttpErrorResponse): void {
    if (error.status === 404) this.store.closeDetails();
    this.handleError(error);
  }

  private handleError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }
    const fallback = error.status === 403 ? this.translations().accessDenied : this.translations().fallbackError;
    this.showMessage('error', formatTechnicalAdminApiError(error, fallback));
  }

  private flattenNodes(nodes: readonly ServiceGlobalizationRequestServiceNode[], depth = 0): readonly FlatRequestServiceNode[] {
    return nodes.flatMap((node) => [
      { node, depth },
      ...this.flattenNodes(node.children, depth + 1),
    ]);
  }

  private showMessage(tone: 'success' | 'error' | 'info', text: string): void {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.store.message.set({ tone, text });
    this.toastTimeoutId = setTimeout(() => this.store.message.set(null), tone === 'error' ? 6500 : 4200);
  }
}
