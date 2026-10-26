import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '../../../../shared/components/app-modal';
import { AssignSegmentItem, AvailableSegmentItem } from '../../models/segment/segment.model';
import { SegmentTranslations } from '../../i18n/segment.translations';

interface SelectableSegmentState {
  item: AvailableSegmentItem;
  selected: boolean;
  quota: number;
}

@Component({
  selector: 'app-assign-available-segments-modal',
  standalone: true,
  imports: [FormsModule, AppModalComponent],
  templateUrl: './assign-available-segments-modal.component.html',
  styleUrl: './assign-available-segments-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignAvailableSegmentsModalComponent {
  @Input() open = false;
  @Input() remainingQuota = 0;
  @Input() availableItems: AvailableSegmentItem[] = [];
  @Input() loading = false;
  @Input() assigning = false;
  @Input() translations!: SegmentTranslations;
  @Input() direction: 'rtl' | 'ltr' = 'rtl';

  @Output() closed = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<AssignSegmentItem[]>();
  @Output() searchChanged = new EventEmitter<string>();

  itemsState = signal<SelectableSegmentState[]>([]);
  validationError = signal<string | null>(null);
  searchText = signal('');

  ngOnChanges(): void {
    if (this.availableItems) {
      this.itemsState.set(
        this.availableItems.map((item) => ({
          item,
          selected: false,
          quota: 0,
        })),
      );
    }
    this.validationError.set(null);
  }

  onSearch(value: string): void {
    this.searchText.set(value);
    this.searchChanged.emit(value);
  }

  toggleSelect(index: number): void {
    const current = [...this.itemsState()];
    current[index] = { ...current[index], selected: !current[index].selected };
    this.itemsState.set(current);
    this.validateQuotas();
  }

  onQuotaChange(index: number, value: number): void {
    const current = [...this.itemsState()];
    current[index] = { ...current[index], quota: Math.max(0, Math.floor(value || 0)) };
    this.itemsState.set(current);
    this.validateQuotas();
  }

  get totalSelectedQuota(): number {
    return this.itemsState()
      .filter((s) => s.selected)
      .reduce((sum, s) => sum + (s.quota || 0), 0);
  }

  get selectedCount(): number {
    return this.itemsState().filter((s) => s.selected).length;
  }

  validateQuotas(): boolean {
    const selectedItems = this.itemsState().filter((s) => s.selected);
    if (selectedItems.length === 0) {
      this.validationError.set(null);
      return false;
    }

    const total = this.totalSelectedQuota;
    if (total > this.remainingQuota) {
      this.validationError.set(this.translations.quotaExceedsRemaining);
      return false;
    }

    this.validationError.set(null);
    return true;
  }

  closeModal(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    const selectedItems = this.itemsState().filter((s) => s.selected);
    if (selectedItems.length === 0) {
      this.validationError.set('Please select at least one segment to assign.');
      return;
    }

    if (!this.validateQuotas()) {
      return;
    }

    const payload: AssignSegmentItem[] = selectedItems.map((s) => ({
      segmentId: s.item.segmentId,
      quota: s.quota,
    }));

    this.assigned.emit(payload);
  }
}
