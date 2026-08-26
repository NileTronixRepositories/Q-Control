import { ChangeDetectionStrategy, Component, computed, HostListener, input, output } from '@angular/core';

import { BranchServicesTranslations } from '../../i18n/branch-services.translations';
import { ServiceManagementTranslations } from '../../i18n/service-management.translations';
import { BranchServiceLifecycleConfirmState } from '../../models/branch-services/branch-services.model';

@Component({
  selector: 'app-branch-service-lifecycle-dialog',
  standalone: true,
  imports: [],
  templateUrl: './branch-service-lifecycle-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchServiceLifecycleDialogComponent {
  readonly state = input.required<BranchServiceLifecycleConfirmState>();
  readonly translations = input.required<BranchServicesTranslations>();
  readonly serviceTranslations = input.required<ServiceManagementTranslations>();
  readonly mutating = input.required<boolean>();

  readonly closed = output<void>();
  readonly confirmed = output<void>();

  readonly isDelete = computed(() => this.state().action === 'delete');
  readonly isPermanentDelete = computed(() => this.state().action === 'permanentDelete');
  readonly title = computed(() =>
    this.isPermanentDelete()
      ? this.translations().lifecyclePermanentDeleteTitle
      : this.isDelete()
        ? this.translations().lifecycleDeleteTitle
        : this.translations().lifecycleRestoreTitle,
  );
  readonly body = computed(() =>
    this.isPermanentDelete()
      ? this.translations().lifecyclePermanentDeleteBody
      : this.isDelete()
        ? this.translations().lifecycleDeleteBody
        : this.translations().lifecycleRestoreBody,
  );
  readonly confirmLabel = computed(() =>
    this.isPermanentDelete()
      ? this.serviceTranslations().deletePermanently
      : this.isDelete()
        ? this.serviceTranslations().delete
        : this.serviceTranslations().restore,
  );
  readonly progressLabel = computed(() =>
    this.isPermanentDelete()
      ? this.translations().lifecyclePermanentlyDeleting
      : this.isDelete()
        ? this.translations().lifecycleDeleting
        : this.translations().lifecycleRestoring,
  );
  readonly confirmButtonClass = computed(() =>
    this.isDelete() || this.isPermanentDelete()
      ? 'q-btn q-btn--danger d-inline-flex align-items-center justify-content-center gap-2'
      : 'q-btn q-btn--success d-inline-flex align-items-center justify-content-center gap-2',
  );

  @HostListener('document:keydown.escape')
  requestClose(): void {
    if (!this.mutating()) {
      this.closed.emit();
    }
  }

  requestConfirm(): void {
    if (!this.mutating()) {
      this.confirmed.emit();
    }
  }

  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }
}


