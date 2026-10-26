import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppModalComponent } from '@shared';
import { SegmentDetails } from '../../models/segment/segment.model';
import { SegmentTranslations } from '../../i18n/segment.translations';

@Component({
  selector: 'app-segment-details-modal',
  standalone: true,
  imports: [DatePipe, AppModalComponent],
  templateUrl: './segment-details-modal.component.html',
  styleUrl: './segment-details-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentDetailsModalComponent {
  @Input() open = false;
  @Input() details: SegmentDetails | null = null;
  @Input() translations!: SegmentTranslations;
  @Input() canViewRequest = false;
  @Input() direction: 'rtl' | 'ltr' = 'rtl';
  @Input() language: string = 'ar';

  @Output() closed = new EventEmitter<void>();
  @Output() openRequest = new EventEmitter<number>();

  get modalTitle(): string {
    if (!this.translations || !this.details) return '';
    return `${this.translations.viewDetails}: ${this.details.arabicName}`;
  }

  get modalSubtitle(): string {
    return this.details?.englishName || '';
  }

  closeModal(): void {
    this.closed.emit();
  }

  onOpenRequest(requestId: number): void {
    this.openRequest.emit(requestId);
  }
}
