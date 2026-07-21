import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { ServiceManagementTranslations } from '../../i18n/service-management.translations';
import { ServiceTreeNode } from '../../models/service-management.model';

interface ServiceHierarchyTreeEntry {
  readonly node: ServiceTreeNode;
  readonly level: number;
  readonly offset: number;
  readonly name: string;
  readonly serviceCodeLabel: string | null;
  readonly isExpanded: boolean;
  readonly hasChildren: boolean;
  readonly rowClassList: string;
  readonly toggleClassList: string;
  readonly toggleIconClass: string;
  readonly toggleLabel: string;
  readonly statusClassList: string;
  readonly statusLabel: string;
  readonly operationalClassList: string;
  readonly operationalLabel: string;
  readonly showOperationalBadge: boolean;
  readonly ticketClassList: string;
  readonly ticketLabel: string;
  readonly scopeLabel: string;
  readonly ownerLabel: string | null;
  readonly assignedLabel: string | null;
  readonly ownedLabel: string | null;
  readonly canSelectLeaf: boolean;
  readonly isSelectedLeaf: boolean;
  readonly canDragLeaf: boolean;
  readonly canUnassign: boolean;
  readonly canDelete: boolean;
  readonly canRestore: boolean;
  readonly canPermanentDelete: boolean;
  readonly canManageWorkflow: boolean;
  readonly canManageSchedule: boolean;
  readonly canManageMedia: boolean;
}

interface ServiceHierarchyLoadingRow {
  readonly indent: number;
  readonly nameWidth: number;
  readonly chipWidths: readonly number[];
}

const ROW_BASE_CLASSES = 'svc-tree-node';
const ROW_DEFAULT_CLASSES = 'svc-tree-node--default';
const ROW_SELECTED_CLASSES = 'svc-tree-node--selected';
const TOGGLE_BASE_CLASSES = 'svc-tree-toggle';
const TOGGLE_ENABLED_CLASSES = 'svc-tree-toggle--enabled';
const TOGGLE_DISABLED_CLASSES = 'svc-tree-toggle--disabled';
const BADGE_BASE_CLASSES = 'svc-tree-chip';
const ACTIVE_STATUS_CLASSES = 'svc-tree-chip--active';
const INACTIVE_STATUS_CLASSES = 'svc-tree-chip--inactive';
const DELETED_STATUS_CLASSES = 'svc-tree-chip--deleted';
const INFO_STATUS_CLASSES = 'svc-tree-chip--info';

@Component({
  selector: 'app-service-hierarchy-tree',
  standalone: true,
  imports: [NiletronixLoadingStateComponent],
  templateUrl: './service-hierarchy-tree.component.html',
  styleUrl: './service-hierarchy-tree.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceHierarchyTreeComponent {
  protected readonly loadingSkeletonRows: readonly ServiceHierarchyLoadingRow[] = [
    { indent: 0, nameWidth: 42, chipWidths: [18, 14, 12] },
    { indent: 22, nameWidth: 34, chipWidths: [14, 19] },
    { indent: 44, nameWidth: 48, chipWidths: [17, 12, 15] },
    { indent: 22, nameWidth: 38, chipWidths: [20, 13] },
    { indent: 44, nameWidth: 30, chipWidths: [15, 18, 11] },
  ];

  readonly nodes = input.required<readonly ServiceTreeNode[]>();
  readonly expandedNodeIds = input.required<ReadonlySet<number>>();
  readonly selectedServiceId = input.required<number | null>();
  readonly translations = input.required<ServiceManagementTranslations>();
  readonly language = input.required<AppLanguage>();
  readonly direction = input<AppDirection>('ltr');
  readonly loading = input.required<boolean>();
  readonly showSearch = input(false);
  readonly searchText = input('');
  readonly searchLabel = input('');
  readonly searchPlaceholder = input('');
  readonly searchHelp = input('');
  readonly includeInactive = input.required<boolean>();
  readonly includeDeleted = input.required<boolean>();
  readonly canCreate = input.required<boolean>();
  readonly canViewDetails = input.required<boolean>();
  readonly canUpdate = input.required<boolean>();
  readonly canDelete = input.required<boolean>();
  readonly canRestore = input.required<boolean>();
  readonly canPermanentDelete = input(false);
  readonly canCreateChildFor = input<(node: ServiceTreeNode) => boolean>(() => true);
  readonly selectableLeaves = input(false);
  readonly canSelectLeafNode = input<(node: ServiceTreeNode) => boolean>(() => true);
  readonly selectedLeafIds = input<ReadonlySet<number>>(new Set());
  readonly draggableLeaves = input(false);
  readonly canDragLeafNode = input<(node: ServiceTreeNode) => boolean>(() => true);
  readonly dropTarget = input(false);
  readonly canUnassign = input(false);
  readonly unassigning = input(false);
  readonly unassignLabel = input('');
  readonly canDeleteNode = input<(node: ServiceTreeNode) => boolean>(() => true);
  readonly canRestoreNode = input<(node: ServiceTreeNode) => boolean>(() => true);
  readonly canPermanentDeleteNode = input<(node: ServiceTreeNode) => boolean>(() => true);
  readonly canUnassignNode = input<(node: ServiceTreeNode) => boolean>(() => true);
  readonly actionsDisabled = input(false);
  readonly canManageWorkflows = input(false);
  readonly canManageWorkflowNode = input<(node: ServiceTreeNode) => boolean>(() => false);
  readonly manageWorkflowsLabel = input('');
  readonly canManageSchedules = input(false);
  readonly canManageScheduleNode = input<(node: ServiceTreeNode) => boolean>(() => false);
  readonly manageScheduleLabel = input('');
  readonly canManageMedia = input(false);
  readonly canManageMediaNode = input<(node: ServiceTreeNode) => boolean>(() => false);
  readonly manageMediaLabel = input('');

  readonly refresh = output<void>();
  readonly searchTextChange = output<string>();
  readonly includeInactiveChange = output<boolean>();
  readonly includeDeletedChange = output<boolean>();
  readonly toggleNode = output<ServiceTreeNode>();
  readonly selectNode = output<ServiceTreeNode>();
  readonly createRoot = output<void>();
  readonly createChild = output<ServiceTreeNode>();
  readonly viewNode = output<ServiceTreeNode>();
  readonly editNode = output<ServiceTreeNode>();
  readonly deleteNode = output<ServiceTreeNode>();
  readonly restoreNode = output<ServiceTreeNode>();
  readonly permanentDeleteNode = output<ServiceTreeNode>();
  readonly leafSelectionChange = output<{ readonly node: ServiceTreeNode; readonly selected: boolean }>();
  readonly leafDragStarted = output<ServiceTreeNode>();
  readonly leafDragEnded = output<void>();
  readonly leafDropped = output<number>();
  readonly unassignNode = output<ServiceTreeNode>();
  readonly manageWorkflows = output<ServiceTreeNode>();
  readonly manageSchedule = output<ServiceTreeNode>();
  readonly manageMedia = output<ServiceTreeNode>();

  public readonly isDropActive = signal(false);
  protected readonly normalizedSearchText = computed(() => this.searchText().trim());

  public readonly flatNodes = computed(() =>
    this.flattenNodes(this.nodes(), this.expandedNodeIds(), this.selectedServiceId()),
  );

  public onSearchTextInput(event: Event): void {
    this.searchTextChange.emit((event.target as HTMLInputElement).value.slice(0, 200));
  }

  public clearSearchText(): void {
    if (this.normalizedSearchText()) {
      this.searchTextChange.emit('');
    }
  }

  public onIncludeInactiveChange(event: Event): void {
    this.includeInactiveChange.emit((event.target as HTMLInputElement).checked);
  }

  public onIncludeDeletedChange(event: Event): void {
    this.includeDeletedChange.emit((event.target as HTMLInputElement).checked);
  }

  public requestToggle(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    this.toggleNode.emit(node);
  }

  public requestCreateChild(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    this.createChild.emit(node);
  }

  public requestUnassign(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    if (this.actionsDisabled() || this.unassigning() || !this.isUnassignableLeaf(node)) {
      return;
    }

    this.unassignNode.emit(node);
  }

  public requestManageWorkflows(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.canManageWorkflows() || !this.canManageWorkflowNode()(node)) {
      return;
    }

    this.manageWorkflows.emit(node);
  }

  public requestManageSchedule(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.canManageSchedules() || !this.canManageScheduleNode()(node)) {
      return;
    }

    this.manageSchedule.emit(node);
  }


  public requestManageMedia(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    if (!this.canManageMedia() || !this.canManageMediaNode()(node)) {
      return;
    }

    this.manageMedia.emit(node);
  }
  public onLeafSelectionChange(node: ServiceTreeNode, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.leafSelectionChange.emit({ node, selected: checked });
  }

  public onLeafDragStart(node: ServiceTreeNode, event: DragEvent): void {
    if (!this.canDragLeaf(node)) {
      event.preventDefault();
      return;
    }

    event.stopPropagation();
    event.dataTransfer?.setData('text/plain', String(node.id));
    event.dataTransfer?.setData('application/x-qsystem-service-id', String(node.id));

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
    }

    this.leafDragStarted.emit(node);
  }

  public onLeafDragEnd(): void {
    this.leafDragEnded.emit();
  }

  public onDropTargetDragOver(event: DragEvent): void {
    if (!this.dropTarget()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }

    this.isDropActive.set(true);
  }

  public onDropTargetDragLeave(event: DragEvent): void {
    if (!this.dropTarget()) {
      return;
    }

    const current = event.currentTarget as HTMLElement | null;
    const related = event.relatedTarget as Node | null;

    if (!current || (related && current.contains(related))) {
      return;
    }

    this.isDropActive.set(false);
  }

  public onDropTargetDrop(event: DragEvent): void {
    if (!this.dropTarget()) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.isDropActive.set(false);

    const rawId =
      event.dataTransfer?.getData('application/x-qsystem-service-id') ||
      event.dataTransfer?.getData('text/plain') ||
      '';
    const serviceId = Number(rawId);

    if (Number.isInteger(serviceId) && serviceId > 0) {
      this.leafDropped.emit(serviceId);
    }
  }

  public requestView(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    this.viewNode.emit(node);
  }

  public requestEdit(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    this.editNode.emit(node);
  }

  public requestDelete(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    if (
      this.actionsDisabled() ||
      !this.canDelete() ||
      node.isDeleted ||
      !this.canDeleteNode()(node)
    ) {
      return;
    }

    this.deleteNode.emit(node);
  }

  public requestRestore(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    if (
      this.actionsDisabled() ||
      !this.canRestore() ||
      !node.isDeleted ||
      !this.canRestoreNode()(node)
    ) {
      return;
    }

    this.restoreNode.emit(node);
  }

  public requestPermanentDelete(node: ServiceTreeNode, event: MouseEvent): void {
    event.stopPropagation();

    if (
      this.actionsDisabled() ||
      !this.canPermanentDelete() ||
      !node.isDeleted ||
      !this.canPermanentDeleteNode()(node)
    ) {
      return;
    }

    this.permanentDeleteNode.emit(node);
  }

  private flattenNodes(
    nodes: readonly ServiceTreeNode[],
    expandedIds: ReadonlySet<number>,
    selectedServiceId: number | null,
    depth = 0,
  ): readonly ServiceHierarchyTreeEntry[] {
    return nodes.flatMap((node) => {
      const isExpanded = expandedIds.has(node.id);
      const current = this.toEntry(node, depth, isExpanded, selectedServiceId === node.id);

      if (node.children.length === 0 || !isExpanded) {
        return [current];
      }

      return [current, ...this.flattenNodes(node.children, expandedIds, selectedServiceId, depth + 1)];
    });
  }

  private toEntry(
    node: ServiceTreeNode,
    depth: number,
    isExpanded: boolean,
    isSelected: boolean,
  ): ServiceHierarchyTreeEntry {
    const translations = this.translations();
    const hasChildren = node.children.length > 0;
    const collapsedIconClass = this.direction() === 'rtl' ? 'bi-chevron-left' : 'bi-chevron-right';

    return {
      node,
      level: depth + 1,
      offset: depth * 22,
      name: this.language() === 'ar' ? node.arabicName : node.englishName,
      serviceCodeLabel: this.serviceCodeLabel(node),
      isExpanded,
      hasChildren,
      rowClassList: `${ROW_BASE_CLASSES} ${isSelected ? ROW_SELECTED_CLASSES : ROW_DEFAULT_CLASSES}`,
      toggleClassList: `${TOGGLE_BASE_CLASSES} ${hasChildren ? TOGGLE_ENABLED_CLASSES : TOGGLE_DISABLED_CLASSES}`,
      toggleIconClass: `bi ${isExpanded ? 'bi-chevron-down' : collapsedIconClass}`,
      toggleLabel: isExpanded ? translations.collapse : translations.expand,
      statusClassList: `${BADGE_BASE_CLASSES} ${this.statusClasses(node)}`,
      statusLabel: this.statusLabel(node, translations),
      operationalClassList: `${BADGE_BASE_CLASSES} ${
        node.effectiveIsActive ? ACTIVE_STATUS_CLASSES : INACTIVE_STATUS_CLASSES
      }`,
      operationalLabel: node.effectiveIsActive ? translations.active : translations.operationallyDisabled,
      showOperationalBadge: node.isActive !== node.effectiveIsActive && !node.isDeleted,
      ticketClassList: `${BADGE_BASE_CLASSES} ${node.canIssueTicket ? INFO_STATUS_CLASSES : INACTIVE_STATUS_CLASSES}`,
      ticketLabel: node.canIssueTicket ? translations.canIssueTicket : translations.cannotIssueTicket,
      scopeLabel: node.scope === 'Global' ? translations.globalScope : translations.branchScopedScope,
      ownerLabel: node.scope === 'BranchScoped' ? this.ownerLabel(node) : null,
      assignedLabel: this.assignmentLabel(node),
      ownedLabel: node.isOwnedByCurrentBranch ? translations.ownedByCurrentBranch : null,
      canSelectLeaf: this.canSelectLeaf(node),
      isSelectedLeaf: this.selectedLeafIds().has(node.id),
      canDragLeaf: this.canDragLeaf(node),
      canUnassign: this.isUnassignableLeaf(node),
      canDelete: this.canDelete() && !node.isDeleted && this.canDeleteNode()(node),
      canRestore: this.canRestore() && node.isDeleted && this.canRestoreNode()(node),
      canPermanentDelete: this.canPermanentDelete() && node.isDeleted && this.canPermanentDeleteNode()(node),
      canManageWorkflow:
        this.canManageWorkflows() && this.canManageWorkflowNode()(node),
      canManageSchedule:
        this.canManageSchedules() && this.canManageScheduleNode()(node),
      canManageMedia: this.canManageMedia() && this.canManageMediaNode()(node),
    };
  }

  private isUnassignableLeaf(node: ServiceTreeNode): boolean {
    return (
      this.canUnassign() &&
      node.children.length === 0 &&
      !node.hasChildren &&
      this.canUnassignNode()(node)
    );
  }

  private canSelectLeaf(node: ServiceTreeNode): boolean {
    return (
      this.selectableLeaves() &&
      node.children.length === 0 &&
      !node.hasChildren &&
      !node.isDeleted &&
      node.isActive &&
      node.effectiveIsActive &&
      this.canSelectLeafNode()(node)
    );
  }

  private canDragLeaf(node: ServiceTreeNode): boolean {
    return (
      this.draggableLeaves() &&
      node.children.length === 0 &&
      !node.hasChildren &&
      !node.isDeleted &&
      node.isActive &&
      node.effectiveIsActive &&
      node.isAssignedToCurrentBranch !== true &&
      this.canDragLeafNode()(node)
    );
  }

  private ownerLabel(node: ServiceTreeNode): string | null {
    const value = this.language() === 'ar' ? node.ownerBranchArabicName : node.ownerBranchEnglishName;
    return value?.trim() || null;
  }

  private assignmentLabel(node: ServiceTreeNode): string | null {
    if (node.isAssignedToCurrentBranch === null) {
      return null;
    }

    return node.isAssignedToCurrentBranch
      ? this.translations().assignedToCurrentBranch
      : this.translations().notAssignedToCurrentBranch;
  }

  private serviceCodeLabel(node: ServiceTreeNode): string | null {
    const code = node.serviceCode?.trim();
    return code ? code : null;
  }

  private statusClasses(node: ServiceTreeNode): string {
    if (node.isDeleted) {
      return DELETED_STATUS_CLASSES;
    }

    return node.isActive ? ACTIVE_STATUS_CLASSES : INACTIVE_STATUS_CLASSES;
  }

  private statusLabel(
    node: ServiceTreeNode,
    translations: ServiceManagementTranslations,
  ): string {
    if (node.isDeleted) {
      return translations.deleted;
    }

    return node.isActive ? translations.active : translations.inactive;
  }
}
