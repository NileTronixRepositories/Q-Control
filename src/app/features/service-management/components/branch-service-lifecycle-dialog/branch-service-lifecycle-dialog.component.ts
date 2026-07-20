import { ChangeDetectionStrategy, Component, computed, HostListener, input, output } from '@angular/core';

import { BranchServicesTranslations } from '../../i18n/branch-services.translations';
import { ServiceManagementTranslations } from '../../i18n/service-management.translations';
import { BranchServiceLifecycleConfirmState } from '../../models/branch-services.model';

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
    `inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
      this.isDelete() || this.isPermanentDelete()
        ? 'bg-rose-600 hover:bg-rose-700'
        : 'bg-emerald-600 hover:bg-emerald-700'
    }`,
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
