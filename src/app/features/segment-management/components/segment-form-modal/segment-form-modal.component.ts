import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppModalComponent } from '@shared';
import { CreateGlobalSegmentRequest, Segment, UpdateSegmentRequest } from '../../models/segment/segment.model';
import { SegmentTranslations } from '../../i18n/segment.translations';

@Component({
  selector: 'app-segment-form-modal',
  standalone: true,
  imports: [FormsModule, AppModalComponent],
  templateUrl: './segment-form-modal.component.html',
  styleUrl: './segment-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SegmentFormModalComponent {
  @Input() open = false;
  @Input() mode: 'createGlobal' | 'createBranch' | 'edit' = 'createGlobal';
  @Input() segment: Segment | null = null;
  @Input() translations!: SegmentTranslations;
  @Input() isTechnicalAdmin = false;
  @Input() saving = false;
  @Input() direction: 'rtl' | 'ltr' = 'rtl';

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<CreateGlobalSegmentRequest | UpdateSegmentRequest>();

  arabicName = signal('');
  englishName = signal('');
  priority = signal<number>(0);
  errorMessage = signal<string | null>(null);

  ngOnChanges(): void {
    if (this.segment && this.mode === 'edit') {
      this.arabicName.set(this.segment.arabicName);
      this.englishName.set(this.segment.englishName);
      this.priority.set(this.segment.isSystemDefault ? 0 : this.segment.priority);
    } else if (this.mode !== 'edit') {
      this.arabicName.set('');
      this.englishName.set('');
      this.priority.set(0);
    }
    this.errorMessage.set(null);
  }

  get isDefaultSegment(): boolean {
    return !!this.segment?.isSystemDefault;
  }

  get isPriorityDisabled(): boolean {
    return this.isDefaultSegment;
  }

  get isNamesDisabled(): boolean {
    return this.isDefaultSegment && !this.isTechnicalAdmin;
  }

  get modalTitle(): string {
    if (!this.translations) return '';
    if (this.mode === 'createGlobal') return this.translations.createGlobalSegment;
    if (this.mode === 'createBranch') return this.translations.createBranchSegment;
    return this.translations.editSegment;
  }

  get modalSubtitle(): string {
    return this.translations?.priorityHelpText ?? '';
  }

  closeModal(): void {
    this.closed.emit();
  }

  onSubmit(): void {
    const ar = this.arabicName().trim();
    const en = this.englishName().trim();
    const p = Number(this.priority());

    if (!ar) {
      this.errorMessage.set(`${this.translations.arabicName}: ${this.translations.nameRequired}`);
      return;
    }
    if (ar.length > 100) {
      this.errorMessage.set(`${this.translations.arabicName}: ${this.translations.nameMaxLength}`);
      return;
    }
    if (!en) {
      this.errorMessage.set(`${this.translations.englishName}: ${this.translations.nameRequired}`);
      return;
    }
    if (en.length > 100) {
      this.errorMessage.set(`${this.translations.englishName}: ${this.translations.nameMaxLength}`);
      return;
    }
    if (isNaN(p) || p < 0) {
      this.errorMessage.set(`${this.translations.priority}: ${this.translations.priorityNonNegative}`);
      return;
    }

    this.errorMessage.set(null);

    if (this.mode === 'edit' && this.segment) {
      const updatePayload: UpdateSegmentRequest = {
        arabicName: ar,
        englishName: en,
        priority: this.isDefaultSegment ? 0 : Math.floor(p),
        rowVersion: this.segment.rowVersion,
      };
      this.submitted.emit(updatePayload);
    } else {
      const createPayload: CreateGlobalSegmentRequest = {
        arabicName: ar,
        englishName: en,
        priority: Math.floor(p),
      };
      this.submitted.emit(createPayload);
    }
  }
}
