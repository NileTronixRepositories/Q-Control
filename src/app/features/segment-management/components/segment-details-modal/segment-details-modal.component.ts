import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SegmentDetails } from '../../models/segment.model';
import { SegmentTranslations } from '../../i18n/segment.translations';

@Component({
  selector: 'app-segment-details-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './segment-details-modal.component.html',
  styleUrl: './segment-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentDetailsModalComponent {
  @Input() open = false;
  @Input() details: SegmentDetails | null = null;
  @Input() translations!: SegmentTranslations;
  @Input() canViewRequest = false;

  @Output() closed = new EventEmitter<void>();
  @Output() openRequest = new EventEmitter<number>();

  closeModal(): void {
    this.closed.emit();
  }

  onOpenRequest(requestId: number): void {
    this.openRequest.emit(requestId);
  }
}
