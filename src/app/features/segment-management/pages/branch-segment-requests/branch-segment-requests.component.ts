import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';

import { GlobalizationRequestDetailsModalComponent } from '../../components/globalization-request-details-modal/globalization-request-details-modal.component';
import { SEGMENT_TRANSLATIONS_AR, SEGMENT_TRANSLATIONS_EN, SegmentTranslations } from '../../i18n/segment.translations';
import { SegmentGlobalizationRequest, SegmentGlobalizationRequestStatus } from '../../models/segment/segment.model';
import { SegmentApiService } from '../../services/segment-api/segment-api.service';

@Component({
  selector: 'app-branch-segment-requests-page',
  standalone: true,
  imports: [
    FormsModule,
    PageHeroComponent,
    GlobalizationRequestDetailsModalComponent,
  ],
  templateUrl: './branch-segment-requests.component.html',
  styleUrl: './branch-segment-requests.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchSegmentRequestsComponent implements OnInit {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(AdminI18nStore);
  private readonly segmentApiService = inject(SegmentApiService);

  requests = signal<SegmentGlobalizationRequest[]>([]);
  loading = signal(false);
  totalItems = signal(0);
  currentPage = signal(1);
  pageSize = signal(10);

  searchText = signal('');
  selectedStatus = signal<SegmentGlobalizationRequestStatus | ''>('');

  detailsModalOpen = signal(false);
  selectedRequest = signal<SegmentGlobalizationRequest | null>(null);

  toastMessage = signal<{ text: string; tone: 'success' | 'error' | 'info' } | null>(null);

  protected readonly language = computed(() => this.i18nStore.language());
  protected readonly direction = computed(() => this.i18nStore.direction());
  protected readonly translations = computed<SegmentTranslations>(() =>
    this.language() === 'ar' ? SEGMENT_TRANSLATIONS_AR : SEGMENT_TRANSLATIONS_EN,
  );

  private readonly router = inject(Router);

  ngOnInit(): void {
    this.loadRequests();
  }

  loadRequests(): void {
    const branchId = this.authSessionService.currentSession()?.activeBranchId;
    if (!branchId) {
      this.router.navigate(['/admin/segment-globalization-requests']);
      return;
    }

    this.loading.set(true);
    this.segmentApiService
      .getBranchGlobalizationRequests(branchId, {
        searchText: this.searchText() || undefined,
        status: this.selectedStatus() || undefined,
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
          this.showToast(formatApiError(err, 'Failed to load branch requests'), 'error');
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

  resetFilters(): void {
    this.searchText.set('');
    this.selectedStatus.set('');
    this.currentPage.set(1);
    this.loadRequests();
  }

  getRequestId(req: SegmentGlobalizationRequest): number | string {
    return req.id ?? req.requestId ?? req.globalizationRequestId ?? '—';
  }

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hours = String(d.getHours()).padStart(2, '0');
      const mins = String(d.getMinutes()).padStart(2, '0');
      return `${y}/${m}/${day} ${hours}:${mins}`;
    } catch {
      return String(dateStr);
    }
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

  showToast(text: string, tone: 'success' | 'error' | 'info'): void {
    this.toastMessage.set({ text, tone });
  }

  clearToast(): void {
    this.toastMessage.set(null);
  }
}
