import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { BranchListItem } from '@features/branch-management/public-api';
import { BranchManagementApiService } from '@features/branch-management/public-api';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';

import { SegmentFormModalComponent } from '../../components/segment-form-modal/segment-form-modal.component';
import { SegmentDetailsModalComponent } from '../../components/segment-details-modal/segment-details-modal.component';
import { GlobalizationRequestDetailsModalComponent } from '../../components/globalization-request-details-modal/globalization-request-details-modal.component';
import { SEGMENT_TRANSLATIONS_AR, SEGMENT_TRANSLATIONS_EN, SegmentTranslations } from '../../i18n/segment.translations';
import {
  CreateGlobalSegmentRequest,
  Segment,
  SegmentDetails,
  SegmentGlobalizationRequest,
  SegmentScope,
  UpdateSegmentRequest,
} from '../../models/segment/segment.model';
import { SegmentApiService } from '../../services/segment-api/segment-api.service';
import { SegmentPermissionService } from '../../services/segment-permission/segment-permission.service';

@Component({
  selector: 'app-segment-list-page',
  standalone: true,
  imports: [
    FormsModule,
    PageHeroComponent,
    SegmentFormModalComponent,
    SegmentDetailsModalComponent,
    GlobalizationRequestDetailsModalComponent,
  ],
  templateUrl: './segment-list.component.html',
  styleUrl: './segment-list.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentListComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(AdminI18nStore);
  private readonly segmentApiService = inject(SegmentApiService);
  protected readonly permissionService = inject(SegmentPermissionService);
  private readonly branchApiService = inject(BranchManagementApiService);

  segments = signal<Segment[]>([]);
  loading = signal(false);
  saving = signal(false);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);

  searchText = signal('');
  selectedScope = signal<SegmentScope | ''>('');
  selectedOwnerBranchId = signal<number | null>(null);
  selectedPriority = signal<number | null>(null);

  branches = signal<readonly BranchListItem[]>([]);

  formModalOpen = signal(false);
  formModalMode = signal<'createGlobal' | 'createBranch' | 'edit'>('createGlobal');
  selectedSegmentForEdit = signal<Segment | null>(null);

  detailsModalOpen = signal(false);
  segmentDetails = signal<SegmentDetails | null>(null);

  globalizationRequestModalOpen = signal(false);
  globalizationRequestDetails = signal<SegmentGlobalizationRequest | null>(null);
  requestProcessing = signal(false);

  toastMessage = signal<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);

  protected readonly language = computed(() => this.i18nStore.language());
  protected readonly direction = computed(() => this.i18nStore.direction());
  protected readonly translations = computed<SegmentTranslations>(() =>
    this.language() === 'ar' ? SEGMENT_TRANSLATIONS_AR : SEGMENT_TRANSLATIONS_EN,
  );

  protected readonly isTechnicalAdmin = this.permissionService.isTechnicalAdmin;
  protected readonly isBranchAdmin = this.permissionService.isBranchAdmin;

  ngOnInit(): void {
    if (this.isTechnicalAdmin()) {
      this.loadBranches();
    }
    this.loadSegments();
  }

  loadBranches(): void {
    this.branchApiService
      .getBranches({
        pageSize: 100,
        pageNumber: 1,
        searchText: '',
        orderSort: 'Newest',
        isActive: null,
      })
      .subscribe({
        next: (res) => this.branches.set(res.data),
        error: () => {},
      });
  }

  loadSegments(): void {
    this.loading.set(true);
    this.segmentApiService
      .getSegments({
        searchText: this.searchText() || undefined,
        scope: this.selectedScope() || undefined,
        ownerBranchId: this.selectedOwnerBranchId() ?? undefined,
        priority: this.selectedPriority() ?? undefined,
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (res) => {
          this.segments.set(res.data);
          this.totalItems.set(res.totalItems);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.showToast(formatApiError(err, 'Failed to load segments'), 'error');
        },
      });
  }

  onSearch(value: string): void {
    this.searchText.set(value);
    this.currentPage.set(1);
    this.loadSegments();
  }

  onScopeFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as SegmentScope | '';
    this.selectedScope.set(val);
    this.currentPage.set(1);
    this.loadSegments();
  }

  onBranchFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedOwnerBranchId.set(val ? Number(val) : null);
    this.currentPage.set(1);
    this.loadSegments();
  }

  onPriorityFilter(value: string): void {
    const val = value ? Number(value) : null;
    this.selectedPriority.set(val);
    this.currentPage.set(1);
    this.loadSegments();
  }

  resetFilters(): void {
    this.searchText.set('');
    this.selectedScope.set('');
    this.selectedOwnerBranchId.set(null);
    this.selectedPriority.set(null);
    this.currentPage.set(1);
    this.loadSegments();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage.set(newPage);
      this.loadSegments();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize()) || 1;
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}/${m}/${day}`;
    } catch {
      return String(dateStr);
    }
  }

  openCreateGlobalModal(): void {
    this.formModalMode.set('createGlobal');
    this.selectedSegmentForEdit.set(null);
    this.formModalOpen.set(true);
  }

  openCreateBranchModal(): void {
    this.formModalMode.set('createBranch');
    this.selectedSegmentForEdit.set(null);
    this.formModalOpen.set(true);
  }

  openEditModal(segment: Segment): void {
    this.formModalMode.set('edit');
    this.selectedSegmentForEdit.set(segment);
    this.formModalOpen.set(true);
  }

  closeFormModal(): void {
    this.formModalOpen.set(false);
  }

  onFormSubmitted(payload: CreateGlobalSegmentRequest | UpdateSegmentRequest): void {
    this.saving.set(true);

    if (this.formModalMode() === 'createGlobal') {
      this.segmentApiService
        .createGlobalSegment(payload as CreateGlobalSegmentRequest)
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.formModalOpen.set(false);
            this.showToast(res.message || 'Global Segment created successfully', 'success');
            this.loadSegments();
          },
          error: (err) => {
            this.saving.set(false);
            this.showToast(formatApiError(err, 'Failed to create global segment'), 'error');
          },
        });
    } else if (this.formModalMode() === 'createBranch') {
      const activeBranchId = this.authSessionService.currentSession()?.activeBranchId;
      if (!activeBranchId) {
        this.saving.set(false);
        this.showToast('No active branch selected', 'error');
        return;
      }
      this.segmentApiService
        .createBranchSegment(activeBranchId, payload as CreateGlobalSegmentRequest)
        .subscribe({
          next: (res) => {
            this.saving.set(false);
            this.formModalOpen.set(false);
            this.showToast(
              res.message || 'Branch Segment created successfully and globalization request submitted',
              'success',
            );
            this.loadSegments();
          },
          error: (err) => {
            this.saving.set(false);
            this.showToast(formatApiError(err, 'Failed to create branch segment'), 'error');
          },
        });
    } else if (this.formModalMode() === 'edit' && this.selectedSegmentForEdit()) {
      const segId = this.selectedSegmentForEdit()!.id;
      this.segmentApiService.updateSegment(segId, payload as UpdateSegmentRequest).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.formModalOpen.set(false);
          this.showToast(res.message || 'Segment updated successfully', 'success');
          this.loadSegments();
        },
        error: (err) => {
          this.saving.set(false);
          if (err?.status === 409) {
            this.showToast(this.translations().concurrencyError, 'error');
            this.loadSegments();
          } else {
            this.showToast(formatApiError(err, 'Failed to update segment'), 'error');
          }
        },
      });
    }
  }

  openDetails(segment: Segment): void {
    this.segmentApiService.getSegmentDetails(segment.id).subscribe({
      next: (res) => {
        this.segmentDetails.set(res);
        this.detailsModalOpen.set(true);
      },
      error: (err) => {
        this.showToast(formatApiError(err, 'Failed to load segment details'), 'error');
      },
    });
  }

  closeDetailsModal(): void {
    this.detailsModalOpen.set(false);
  }

  openRequestFromDetails(requestId: number): void {
    this.detailsModalOpen.set(false);
    this.segmentApiService.getGlobalizationRequestDetails(requestId).subscribe({
      next: (res) => {
        this.globalizationRequestDetails.set(res);
        this.globalizationRequestModalOpen.set(true);
      },
      error: (err) => {
        this.showToast(formatApiError(err, 'Failed to load request details'), 'error');
      },
    });
  }

  closeGlobalizationRequestModal(): void {
    this.globalizationRequestModalOpen.set(false);
  }

  onApproveRequest(event: { requestId: number; rowVersion: string }): void {
    this.requestProcessing.set(true);
    this.segmentApiService
      .approveGlobalizationRequest(event.requestId, event.rowVersion)
      .subscribe({
        next: (res) => {
          this.requestProcessing.set(false);
          this.globalizationRequestModalOpen.set(false);
          this.showToast(res.message || 'Globalization Request approved successfully', 'success');
          this.loadSegments();
        },
        error: (err) => {
          this.requestProcessing.set(false);
          this.showToast(formatApiError(err, 'Failed to approve request'), 'error');
        },
      });
  }

  onRejectRequest(event: { requestId: number; rowVersion: string; rejectionReason?: string }): void {
    this.requestProcessing.set(true);
    this.segmentApiService
      .rejectGlobalizationRequest(event.requestId, event.rowVersion, {
        rejectionReason: event.rejectionReason,
      })
      .subscribe({
        next: (res) => {
          this.requestProcessing.set(false);
          this.globalizationRequestModalOpen.set(false);
          this.showToast(res.message || 'Globalization Request rejected', 'info');
          this.loadSegments();
        },
        error: (err) => {
          this.requestProcessing.set(false);
          this.showToast(formatApiError(err, 'Failed to reject request'), 'error');
        },
      });
  }

  canEditSegment(segment: Segment): boolean {
    if (!this.permissionService.canUpdateSegment()) return false;
    if (this.isTechnicalAdmin()) return true;
    if (this.isBranchAdmin()) {
      const activeBranchId = this.authSessionService.currentSession()?.activeBranchId;
      return segment.scope === 'BranchScoped' && segment.ownerBranchId === activeBranchId;
    }
    return false;
  }

  showToast(text: string, tone: 'success' | 'error' | 'info'): void {
    this.toastMessage.set({ text, tone });
  }

  clearToast(): void {
    this.toastMessage.set(null);
  }
}
