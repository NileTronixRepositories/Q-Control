import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '@shared';
import { SegmentGlobalizationRequest } from '../../models/segment/segment.model';
import { SegmentTranslations } from '../../i18n/segment.translations';

@Component({
  selector: 'app-globalization-request-details-modal',
  standalone: true,
  imports: [DatePipe, FormsModule, AppModalComponent],
  templateUrl: './globalization-request-details-modal.component.html',
  styleUrl: './globalization-request-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalizationRequestDetailsModalComponent {
  @Input() open = false;
  @Input() request: SegmentGlobalizationRequest | null = null;
  @Input() translations!: SegmentTranslations;
  @Input() canApprove = false;
  @Input() canReject = false;
  @Input() processing = false;
  @Input() direction: 'rtl' | 'ltr' = 'rtl';
  @Input() language: string = 'ar';

  @Output() closed = new EventEmitter<void>();
  @Output() approved = new EventEmitter<{ requestId: number; rowVersion: string }>();
  @Output() rejected = new EventEmitter<{ requestId: number; rowVersion: string; rejectionReason?: string }>();

  showRejectReasonInput = signal(false);
  rejectionReasonText = signal('');
  showApproveConfirm = signal(false);
  errorMessage = signal<string | null>(null);

  get requestId(): number | string | undefined {
    return this.request?.id ?? this.request?.requestId ?? this.request?.globalizationRequestId;
  }

  get modalTitle(): string {
    if (!this.request) return '';
    const id = this.requestId;
    return id ? `#${id}: ${this.request.segmentArabicName}` : this.request.segmentArabicName;
  }

  get modalSubtitle(): string {
    return this.request?.segmentEnglishName || '';
  }

  ngOnChanges(): void {
    this.showRejectReasonInput.set(false);
    this.rejectionReasonText.set('');
    this.showApproveConfirm.set(false);
    this.errorMessage.set(null);
  }

  closeModal(): void {
    this.closed.emit();
  }

  onApproveClick(): void {
    this.showApproveConfirm.set(true);
    this.showRejectReasonInput.set(false);
  }

  cancelApproveConfirm(): void {
    this.showApproveConfirm.set(false);
  }

  confirmApprove(): void {
    if (!this.request) return;
    const reqId =
      this.request.id ??
      (this.request as any).requestId ??
      (this.request as any).globalizationRequestId;
    this.approved.emit({
      requestId: reqId,
      rowVersion: this.request.rowVersion,
    });
  }

  onRejectClick(): void {
    this.showRejectReasonInput.set(true);
    this.showApproveConfirm.set(false);
  }

  cancelRejectInput(): void {
    this.showRejectReasonInput.set(false);
  }

  confirmReject(): void {
    if (!this.request) return;
    const reqId =
      this.request.id ??
      (this.request as any).requestId ??
      (this.request as any).globalizationRequestId;
    const reason = this.rejectionReasonText().trim();
    if (reason.length > 500) {
      this.errorMessage.set(
        this.language === 'ar'
          ? 'سبب الرفض لا يمكن أن يتجاوز 500 حرف.'
          : 'Rejection reason cannot exceed 500 characters.',
      );
      return;
    }
    this.rejected.emit({
      requestId: reqId,
      rowVersion: this.request.rowVersion,
      rejectionReason: reason || undefined,
    });
  }
}
