import { ChangeDetectionStrategy, Component, HostListener, input, output } from '@angular/core';

import { BranchServicesTranslations } from '../../i18n/branch-services.translations';
import { BranchServiceUnassignConfirmState } from '../../models/branch-services.model';

@Component({
  selector: 'app-unassign-branch-service-dialog',
  standalone: true,
  imports: [],
  templateUrl: './unassign-branch-service-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnassignBranchServiceDialogComponent {
  readonly state = input.required<BranchServiceUnassignConfirmState>();
  readonly translations = input.required<BranchServicesTranslations>();
  readonly unassigning = input.required<boolean>();

  readonly closed = output<void>();
  readonly confirmed = output<void>();

  @HostListener('document:keydown.escape')
  requestClose(): void {
    if (!this.unassigning()) {
      this.closed.emit();
    }
  }

  requestConfirm(): void {
    if (!this.unassigning()) {
      this.confirmed.emit();
    }
  }

  closeFromBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.requestClose();
    }
  }
}
