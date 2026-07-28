import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AssignSegmentItem,
  AssignedBranchServiceSegmentItem,
  AssignedBranchServiceSegmentsResponse,
  AvailableSegmentItem,
} from '../../models/segment.model';
import { SegmentTranslations } from '../../i18n/segment.translations';
import { AssignAvailableSegmentsModalComponent } from '../assign-available-segments-modal/assign-available-segments-modal.component';

@Component({
  selector: 'app-leaf-service-segments-drawer',
  standalone: true,
  imports: [FormsModule, AssignAvailableSegmentsModalComponent],
  templateUrl: './leaf-service-segments-drawer.component.html',
  styleUrl: './leaf-service-segments-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeafServiceSegmentsDrawerComponent {
  @Input() open = false;
  @Input() serviceTitle = '';
  @Input() responseData: AssignedBranchServiceSegmentsResponse | null = null;
  @Input() availableSegments: AvailableSegmentItem[] = [];
  @Input() loading = false;
  @Input() availableLoading = false;
  @Input() assigning = false;
  @Input() updatingQuota = false;
  @Input() unassigning = false;
  @Input() translations!: SegmentTranslations;
  @Input() canAssign = false;
  @Input() canUpdateQuota = false;
  @Input() canUnassign = false;

  @Output() closed = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();
  @Output() openAddAvailableModal = new EventEmitter<void>();
  @Output() assignSubmitted = new EventEmitter<AssignSegmentItem[]>();
  @Output() quotaUpdated = new EventEmitter<{ segmentId: number; quota: number; rowVersion: string }>();
  @Output() segmentUnassigned = new EventEmitter<{ segmentId: number; rowVersion: string }>();

  showAvailableModal = signal(false);
  editingSegmentId = signal<number | null>(null);
  editQuotaValue = signal<number>(0);
  unassignConfirmItem = signal<AssignedBranchServiceSegmentItem | null>(null);
  errorMessage = signal<string | null>(null);

  get formattedRange(): string {
    if (!this.responseData) return '—';
    const prefix = this.responseData.rangePrefix ? `${this.responseData.rangePrefix}-` : '';
    const start = this.responseData.rangeStartNumber.toString().padStart(3, '0');
    const end = this.responseData.rangeEndNumber.toString().padStart(3, '0');
    return `${prefix}${start} → ${prefix}${end}`;
  }

  closeDrawer(): void {
    this.closed.emit();
  }

  onOpenAddModal(): void {
    this.showAvailableModal.set(true);
    this.openAddAvailableModal.emit();
  }

  closeAddModal(): void {
    this.showAvailableModal.set(false);
  }

  onAssignSubmitted(items: AssignSegmentItem[]): void {
    this.assignSubmitted.emit(items);
    this.showAvailableModal.set(false);
  }

  startEditQuota(item: AssignedBranchServiceSegmentItem): void {
    if (item.isSystemDefault || !this.canUpdateQuota) return;
    this.editingSegmentId.set(item.segmentId);
    this.editQuotaValue.set(item.quota);
    this.errorMessage.set(null);
  }

  cancelEditQuota(): void {
    this.editingSegmentId.set(null);
    this.errorMessage.set(null);
  }

  saveQuota(item: AssignedBranchServiceSegmentItem): void {
    const val = Number(this.editQuotaValue());
    if (isNaN(val) || val < 0) {
      this.errorMessage.set('Quota must be an integer >= 0.');
      return;
    }

    const remaining = this.responseData?.remainingQuota || 0;
    const maxEditableQuota = item.quota + remaining;

    if (val > maxEditableQuota) {
      this.errorMessage.set(`Quota cannot exceed max available capacity (${maxEditableQuota}).`);
      return;
    }

    this.quotaUpdated.emit({
      segmentId: item.segmentId,
      quota: Math.floor(val),
      rowVersion: item.rowVersion,
    });
    this.editingSegmentId.set(null);
  }

  promptUnassign(item: AssignedBranchServiceSegmentItem): void {
    if (item.isSystemDefault || !this.canUnassign) return;
    this.unassignConfirmItem.set(item);
  }

  cancelUnassignPrompt(): void {
    this.unassignConfirmItem.set(null);
  }

  confirmUnassign(): void {
    const item = this.unassignConfirmItem();
    if (!item) return;
    this.segmentUnassigned.emit({
      segmentId: item.segmentId,
      rowVersion: item.rowVersion,
    });
    this.unassignConfirmItem.set(null);
  }
}
