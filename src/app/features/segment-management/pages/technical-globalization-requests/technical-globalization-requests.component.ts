import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';
import { BranchListItem } from '../../../technical-admin/models/branch-management.model';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';

import { GlobalizationRequestDetailsModalComponent } from '../../components/globalization-request-details-modal/globalization-request-details-modal.component';
import { SEGMENT_TRANSLATIONS_AR, SEGMENT_TRANSLATIONS_EN, SegmentTranslations } from '../../i18n/segment.translations';
import { SegmentGlobalizationRequest, SegmentGlobalizationRequestStatus } from '../../models/segment.model';
import { SegmentApiService } from '../../services/segment-api.service';
import { SegmentPermissionService } from '../../services/segment-permission.service';

@Component({
  selector: 'app-technical-globalization-requests-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    TechnicalAdminPageHeroComponent,
    GlobalizationRequestDetailsModalComponent,
  ],
  templateUrl: './technical-globalization-requests.component.html',
  styleUrl: './technical-globalization-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalGlobalizationRequestsComponent implements OnInit {
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly segmentApiService = inject(SegmentApiService);
  protected readonly permissionService = inject(SegmentPermissionService);
  private readonly branchApiService = inject(BranchManagementApiService);

  requests = signal<SegmentGlobalizationRequest[]>([]);
  loading = signal(false);
  processing = signal(false);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);

  searchText = signal('');
  selectedStatus = signal<SegmentGlobalizationRequestStatus | ''>('');
  selectedBranchId = signal<number | null>(null);

  branches = signal<readonly BranchListItem[]>([]);

  detailsModalOpen = signal(false);
  selectedRequest = signal<SegmentGlobalizationRequest | null>(null);

  toastMessage = signal<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);

  protected readonly language = computed(() => this.i18nStore.language());
  protected readonly direction = computed(() => this.i18nStore.direction());
  protected readonly translations = computed<SegmentTranslations>(() =>
    this.language() === 'ar' ? SEGMENT_TRANSLATIONS_AR : SEGMENT_TRANSLATIONS_EN,
  );

  ngOnInit(): void {
    this.loadBranches();
    this.loadRequests();
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

  loadRequests(): void {
    this.loading.set(true);
    this.segmentApiService
      .getTechnicalGlobalizationRequests({
        searchText: this.searchText() || undefined,
        status: this.selectedStatus() || undefined,
        branchId: this.selectedBranchId() ?? undefined,
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (res) => {
          this.requests.set(res.data);
          this.totalItems.set(res.totalItems);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.showToast(formatTechnicalAdminApiError(err, 'Failed to load requests'), 'error');
        },
      });
  }

  onSearch(value: string): void {
    this.searchText.set(value);
    this.currentPage.set(1);
    this.loadRequests();
  }

  onStatusFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as SegmentGlobalizationRequestStatus | '';
    this.selectedStatus.set(val);
    this.currentPage.set(1);
    this.loadRequests();
  }

  onBranchFilter(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedBranchId.set(val ? Number(val) : null);
    this.currentPage.set(1);
    this.loadRequests();
  }

  onPageChange(newPage: number): void {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.currentPage.set(newPage);
      this.loadRequests();
    }
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize()) || 1;
  }

  openDetails(req: SegmentGlobalizationRequest): void {
    this.selectedRequest.set(req);
    this.detailsModalOpen.set(true);
  }

  closeDetailsModal(): void {
    this.detailsModalOpen.set(false);
  }

  onApproveRequest(event: { requestId: number; rowVersion: string }): void {
    this.processing.set(true);
    this.segmentApiService
      .approveGlobalizationRequest(event.requestId, event.rowVersion)
      .subscribe({
        next: (res) => {
          this.processing.set(false);
          this.detailsModalOpen.set(false);
          this.showToast(res.message || 'Globalization Request approved', 'success');
          this.loadRequests();
        },
        error: (err) => {
          this.processing.set(false);
          this.showToast(formatTechnicalAdminApiError(err, 'Failed to approve request'), 'error');
        },
      });
  }

  onRejectRequest(event: { requestId: number; rowVersion: string; rejectionReason?: string }): void {
    this.processing.set(true);
    this.segmentApiService
      .rejectGlobalizationRequest(event.requestId, event.rowVersion, {
        rejectionReason: event.rejectionReason,
      })
      .subscribe({
        next: (res) => {
          this.processing.set(false);
          this.detailsModalOpen.set(false);
          this.showToast(res.message || 'Globalization Request rejected', 'info');
          this.loadRequests();
        },
        error: (err) => {
          this.processing.set(false);
          this.showToast(formatTechnicalAdminApiError(err, 'Failed to reject request'), 'error');
        },
      });
  }

  showToast(text: string, tone: 'success' | 'error' | 'info'): void {
    this.toastMessage.set({ text, tone });
  }

  clearToast(): void {
    this.toastMessage.set(null);
  }
}
