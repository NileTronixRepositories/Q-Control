import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { BranchServicesTranslations } from '../../i18n/branch-services.translations';
import { ServiceManagementTranslations } from '../../i18n/service-management.translations';
import { ServiceTreeNode } from '../../models/service-management.model';
import { ServiceHierarchyTreeComponent } from '../service-hierarchy-tree/service-hierarchy-tree.component';

@Component({
  selector: 'app-assign-branch-services-dialog',
  standalone: true,
  imports: [ServiceHierarchyTreeComponent],
  templateUrl: './assign-branch-services-dialog.component.html',
  styleUrl: './assign-branch-services-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssignBranchServicesDialogComponent {
  readonly open = input.required<boolean>();
  readonly nodes = input.required<readonly ServiceTreeNode[]>();
  readonly expandedNodeIds = input.required<ReadonlySet<number>>();
  readonly loading = input.required<boolean>();
  readonly searchText = input('');
  readonly searchLabel = input('');
  readonly searchPlaceholder = input('');
  readonly searchHelp = input('');
  readonly assigning = input.required<boolean>();
  readonly translations = input.required<BranchServicesTranslations>();
  readonly serviceTranslations = input.required<ServiceManagementTranslations>();
  readonly language = input.required<AppLanguage>();
  readonly direction = input<AppDirection>('ltr');
  readonly canSelectNode = input<(node: ServiceTreeNode) => boolean>(() => true);

  readonly closed = output<void>();
  readonly refresh = output<void>();
  readonly searchTextChange = output<string>();
  readonly toggleNode = output<ServiceTreeNode>();
  readonly assigned = output<readonly number[]>();

  readonly selectedLeafIds = signal<ReadonlySet<number>>(new Set());
  readonly selectedCount = computed(() => this.selectedLeafIds().size);

  protected updateSelection(event: { readonly node: ServiceTreeNode; readonly selected: boolean }): void {
    if (event.selected && !this.canSelectNode()(event.node)) {
      return;
    }

    this.selectedLeafIds.update((current) => {
      const next = new Set(current);

      if (event.selected) {
        next.add(event.node.id);
      } else {
        next.delete(event.node.id);
      }

      return next;
    });
  }

  protected submit(): void {
    if (this.selectedLeafIds().size === 0 || this.assigning()) {
      return;
    }

    const selectedIds = [...this.selectedLeafIds()].filter((serviceId) =>
      this.hasSelectableNode(this.nodes(), serviceId),
    );

    if (selectedIds.length === 0) {
      this.selectedLeafIds.set(new Set());
      return;
    }

    this.selectedLeafIds.set(new Set(selectedIds));
    this.assigned.emit(selectedIds);
  }


  private hasSelectableNode(nodes: readonly ServiceTreeNode[], serviceId: number): boolean {
    for (const node of nodes) {
      if (node.id === serviceId) {
        return this.canSelectNode()(node);
      }

      if (this.hasSelectableNode(node.children, serviceId)) {
        return true;
      }
    }

    return false;
  }
  protected close(): void {
    if (!this.assigning()) {
      this.selectedLeafIds.set(new Set());
      this.closed.emit();
    }
  }
}
