import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem } from '../../../technical-admin/models/branch-management.model';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { AssignBranchServicesDialogComponent } from '../../components/assign-branch-services-dialog/assign-branch-services-dialog.component';
import { BranchGlobalizationRequestsComponent } from '../../components/branch-globalization-requests/branch-globalization-requests.component';
import { BranchServiceLifecycleDialogComponent } from '../../components/branch-service-lifecycle-dialog/branch-service-lifecycle-dialog.component';
import { CreateBranchServiceTreeDialogComponent } from '../../components/create-branch-service-tree-dialog/create-branch-service-tree-dialog.component';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { ServiceMediaManagerComponent } from '../../components/service-media-manager/service-media-manager.component';
import { UnassignBranchServiceDialogComponent } from '../../components/unassign-branch-service-dialog/unassign-branch-service-dialog.component';
import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { SERVICE_GLOBALIZATION_TRANSLATIONS } from '../../i18n/service-globalization.translations';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { SERVICE_SCHEDULE_TRANSLATIONS } from '../../i18n/service-schedule.translations';
import {
  BranchServiceLifecycleAction,
  CreateBranchServiceSubtreeResponse,
  CreateBranchServiceTreeRequest,
  CreateBranchServiceTreeResponse,
} from '../../models/branch-services.model';
import { ServiceGlobalizationRequestSummary } from '../../models/service-globalization.model';
import {
  ServiceDeleteResponse,
  ServiceDetails,
  ServicePermanentDeleteResponse,
  ServiceRestoreResponse,
  ServiceTreeNode,
} from '../../models/service-management.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { BranchServicesStore } from '../../store/branch-services.store';
import { ServiceDataInvalidationService } from '../../services/service-data-invalidation.service';
import {
  ServiceActionPermissions,
  canAssignServiceLeaf,
  canPermanentDeleteService,
  canRestoreService,
  canSoftDeleteService,
  canUnassignService,
} from '../../utils/service-action-rules.util';

const STATUS_POLL_INTERVAL_MS = 15_000;

@Component({
  selector: 'app-branch-services-page',
  standalone: true,
  imports: [
    AssignBranchServicesDialogComponent,
    BranchGlobalizationRequestsComponent,
    BranchServiceLifecycleDialogComponent,
    CreateBranchServiceTreeDialogComponent,
    ServiceHierarchyTreeComponent,
    ServiceMediaManagerComponent,
    NiletronixLoadingStateComponent,
    TechnicalAdminPageHeroComponent,
    UnassignBranchServiceDialogComponent,
  ],
  providers: [BranchServicesStore],
  templateUrl: './branch-services.component.html',
  styleUrl: './branch-services.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchServicesComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly branchApiService = inject(BranchManagementApiService);
  private readonly branchServicesApiService = inject(BranchServicesApiService);
  private readonly serviceManagementApiService = inject(ServiceManagementApiService);
  private readonly serviceGlobalizationApiService = inject(ServiceGlobalizationApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);
  private readonly invalidationService = inject(ServiceDataInvalidationService);

  protected readonly store = inject(BranchServicesStore);
  protected readonly translations = computed(
    () => BRANCH_SERVICES_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly serviceTranslations = computed(
    () => SERVICE_MANAGEMENT_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly globalizationTranslations = computed(
    () => SERVICE_GLOBALIZATION_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly scheduleTranslations = computed(
    () => SERVICE_SCHEDULE_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly canViewBranchServices = this.permissionService.canViewBranchServices;
  protected readonly canViewDetails = this.permissionService.canViewDetails;
  protected readonly canUpdate = this.permissionService.canUpdate;
  protected readonly canViewWorkflows = this.permissionService.canViewWorkflows;
  protected readonly canViewSchedules = this.permissionService.canViewSchedules;
  protected readonly canAssignBranchServices = this.permissionService.canAssignBranchServices;
  protected readonly canUnassignBranchServices =
    this.permissionService.canUnassignBranchServices;
  protected readonly canDeleteBranchServices = this.permissionService.canDelete;
  protected readonly canRestoreBranchServices = this.permissionService.canRestore;
  protected readonly canDeletePermanentBranchServices = this.permissionService.canDeletePermanent;
  protected readonly canCreateBranchServiceTree = this.permissionService.canCreateBranchServiceTree;
  protected readonly canViewOwnGlobalizationRequests =
    this.permissionService.canViewOwnGlobalizationRequests ?? computed(() => false);
  protected readonly canViewGlobalizationRequests =
    this.permissionService.canViewGlobalizationRequests ?? computed(() => false);
  protected readonly canApproveGlobalizationRequests =
    this.permissionService.canApproveGlobalizationRequests ?? computed(() => false);
  protected readonly canRejectGlobalizationRequests =
    this.permissionService.canRejectGlobalizationRequests ?? computed(() => false);
  protected readonly canOpenGlobalizationRequests = computed(
    () =>
      this.canViewOwnGlobalizationRequests() ||
      this.canViewGlobalizationRequests() ||
      this.canApproveGlobalizationRequests() ||
      this.canRejectGlobalizationRequests(),
  );
  protected readonly branches = signal<readonly BranchListItem[]>([]);
  protected readonly mediaDetails = signal<ServiceDetails | null>(null);
  protected readonly mediaLoading = signal(false);
  protected readonly createTreeResetKey = signal(0);
  protected readonly creationRequestSummary = signal<ServiceGlobalizationRequestSummary | null>(null);
  protected readonly pendingRequestsBadge = computed(() => {
    if (!this.store.hasUnreadPendingGlobalizationRequests()) {
      return null;
    }

    const count = this.store.pendingGlobalizationRequestsCount();
    return count > 99 ? '99+' : count > 0 ? String(count) : null;
  });
  protected readonly isBranchAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'BranchAdmin',
  );
  protected readonly canOpenCreateTree = computed(
    () => this.isBranchAdmin() && this.canCreateBranchServiceTree() && this.store.hasSelectedBranch(),
  );
  protected readonly canCreateBranchSubtreeFor = (node: ServiceTreeNode): boolean =>
    this.canOpenCreateTree() &&
    !node.isDeleted &&
    (node.scope === 'Global' ||
      (node.scope === 'BranchScoped' && node.isOwnedByCurrentBranch && node.canEditDefinition));
  protected readonly canAssignBranchService = (node: ServiceTreeNode): boolean =>
    canAssignServiceLeaf(node, this.branchActionPermissions());
  protected readonly canDeleteBranchService = (node: ServiceTreeNode): boolean =>
    canSoftDeleteService(node, this.branchActionPermissions()) &&
    node.ownerBranchId === this.store.selectedBranchId();
  protected readonly canRestoreBranchService = (node: ServiceTreeNode): boolean =>
    canRestoreService(node, this.branchActionPermissions()) &&
    node.ownerBranchId === this.store.selectedBranchId();
  protected readonly canPermanentDeleteBranchService = (node: ServiceTreeNode): boolean =>
    canPermanentDeleteService(node, this.branchActionPermissions()) &&
    node.ownerBranchId === this.store.selectedBranchId();
  protected readonly canUnassignBranchService = (node: ServiceTreeNode): boolean =>
    canUnassignService(node, this.branchActionPermissions());
  protected readonly canManageWorkflowFor = (node: ServiceTreeNode): boolean =>
    this.canViewWorkflows() && this.isScheduleEligibleService(node);
  protected readonly canManageScheduleFor = (node: ServiceTreeNode): boolean =>
    this.canViewSchedules() && this.isScheduleEligibleService(node);
  protected readonly canManageMediaFor = (node: ServiceTreeNode): boolean =>
    this.canViewDetails() && node.canEditDefinition;
  protected readonly branchActionsDisabled = computed(
    () => this.store.lifecyclePreparing() || this.store.lifecycleMutating(),
  );

  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private branchTreeSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private centralTreeSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private branchTreeRequestId = 0;
  private centralTreeRequestId = 0;
  private branchTreeExpansionSnapshot: ReadonlySet<number> | null = null;
  private centralTreeExpansionSnapshot: ReadonlySet<number> | null = null;
  private pendingCountRequestId = 0;
  private pendingCountBranchId: number | null = null;
  private lastPendingRequestsCount: number | null = null;
  private statusPollingIntervalId: ReturnType<typeof setInterval> | null = null;
  private branchTreeInitialized = false;

  constructor() {
    effect(() => {
      const branchId = this.store.selectedBranchId();
      const canViewRequests = this.canOpenGlobalizationRequests();
      const invalidation = this.invalidationService.branchRequestsInvalidation();
      const branchChanged = branchId !== this.pendingCountBranchId;
      this.pendingCountBranchId = branchId;

      if (branchChanged) {
        this.lastPendingRequestsCount = null;
      }

      if (!branchId || !canViewRequests) {
        untracked(() => {
          this.pendingCountRequestId += 1;
          this.store.pendingGlobalizationRequestsCount.set(0);
          this.store.pendingGlobalizationRequestsNewestId.set(null);
          this.store.pendingGlobalizationRequestsLoading.set(false);
          this.store.closeGlobalizationRequestsDialog();
        });
        return;
      }

      if (branchChanged || !invalidation || invalidation.branchId === branchId) {
        untracked(() => this.loadPendingRequestsCount(branchId, true));
      }
    });

    effect(() => {
      const invalidation = this.invalidationService.branchTreeInvalidation();
      const branchId = this.store.selectedBranchId();

      if (
        !this.branchTreeInitialized ||
        !invalidation ||
        !branchId ||
        invalidation.branchId !== branchId
      ) {
        return;
      }

      untracked(() => {
        this.loadBranchTree();

        if (this.canAssignBranchServices()) {
          this.loadServiceCentralTree();
        }
      });
    });
  }

  ngOnInit(): void {
    this.startStatusPolling();
    const session = this.authSessionService.currentSession();

    if (session?.userType === 'BranchAdmin') {
      const branchId = session.activeBranchId;
      const branch = session.branches.find((item) => item.branchId === branchId) ?? null;

      this.store.selectBranch(
        branchId,
        branch ? this.branchSessionName(branch) : this.translations().activeBranch,
      );
      this.loadBranchTree();
      this.branchTreeInitialized = true;
      return;
    }

    this.loadBranches();
    this.branchTreeInitialized = true;
  }

  ngOnDestroy(): void {
    this.pendingCountRequestId += 1;

    if (this.statusPollingIntervalId !== null) {
      clearInterval(this.statusPollingIntervalId);
      this.statusPollingIntervalId = null;
    }

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    if (this.branchTreeSearchDebounceId !== null) {
      clearTimeout(this.branchTreeSearchDebounceId);
    }

    if (this.centralTreeSearchDebounceId !== null) {
      clearTimeout(this.centralTreeSearchDebounceId);
    }
  }

  protected clearMessage(): void {
    this.store.message.set(null);

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  protected onBranchChange(event: Event): void {
    const branchId = this.toOptionalNumber((event.target as HTMLSelectElement).value);
    const branch = this.branches().find((item) => item.branchId === branchId) ?? null;

    this.store.selectBranch(branchId, branch ? this.branchName(branch) : null);

    if (branchId) {
      this.loadBranchTree();
    }
  }

  protected refresh(): void {
    this.loadBranchTree();

    const branchId = this.store.selectedBranchId();
    if (branchId && this.canOpenGlobalizationRequests()) {
      this.loadPendingRequestsCount(branchId, true);
    }
  }

  protected openGlobalizationRequests(): void {
    if (!this.canOpenGlobalizationRequests() || !this.store.hasSelectedBranch()) {
      return;
    }

    this.store.markPendingGlobalizationRequestsAsSeen();
    this.store.openGlobalizationRequestsDialog();
  }

  protected updateBranchTreeSearch(value: string): void {
    const searchText = this.normalizeSearchText(value);
    const hadSearch = this.store.branchTreeSearchText().trim().length > 0;

    if (searchText && !hadSearch) {
      this.branchTreeExpansionSnapshot = new Set(this.store.expandedBranchNodeIds());
    }

    if (!searchText && hadSearch) {
      this.store.expandedBranchNodeIds.set(this.branchTreeExpansionSnapshot ?? new Set());
      this.branchTreeExpansionSnapshot = null;
    }

    this.store.branchTreeSearchText.set(searchText);

    if (this.branchTreeSearchDebounceId !== null) {
      clearTimeout(this.branchTreeSearchDebounceId);
    }

    this.branchTreeSearchDebounceId = setTimeout(() => this.loadBranchTree(), 400);
  }

  protected updateCentralTreeSearch(value: string): void {
    const searchText = this.normalizeSearchText(value);
    const hadSearch = this.store.centralTreeSearchText().trim().length > 0;

    if (searchText && !hadSearch) {
      this.centralTreeExpansionSnapshot = new Set(this.store.expandedCentralNodeIds());
    }

    if (!searchText && hadSearch) {
      this.store.expandedCentralNodeIds.set(this.centralTreeExpansionSnapshot ?? new Set());
      this.centralTreeExpansionSnapshot = null;
    }

    this.store.centralTreeSearchText.set(searchText);

    if (this.centralTreeSearchDebounceId !== null) {
      clearTimeout(this.centralTreeSearchDebounceId);
    }

    this.centralTreeSearchDebounceId = setTimeout(() => this.loadServiceCentralTree(), 400);
  }
  protected updateTreeToggle(kind: 'inactive' | 'deleted', checked: boolean): void {
    if (kind === 'inactive') {
      this.store.includeInactive.set(checked);
    } else {
      this.store.includeDeleted.set(checked);
    }

    this.loadBranchTree();
  }

  protected toggleBranchNode(node: ServiceTreeNode): void {
    if (node.children.length > 0) {
      this.store.toggleBranchNode(node.id);
    }
  }

  protected toggleCentralNode(node: ServiceTreeNode): void {
    if (node.children.length > 0) {
      this.store.toggleCentralNode(node.id);
    }
  }

  protected selectBranchNode(node: ServiceTreeNode): void {
    this.store.selectBranchNode(node.id);
  }

  protected openServiceWorkflows(node: ServiceTreeNode): void {
    const branchId = this.store.selectedBranchId();

    if (!branchId || !this.canManageWorkflowFor(node)) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    void this.router.navigate([
      '/admin/services/branches',
      branchId,
      'services',
      node.id,
      'workflows',
    ]);
  }

  protected openServiceSchedule(node: ServiceTreeNode): void {
    const branchId = this.store.selectedBranchId();

    if (!branchId || !this.canManageScheduleFor(node)) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    void this.router.navigate([
      '/admin/services/branches',
      branchId,
      'services',
      node.id,
      'schedule',
    ]);
  }


  protected openServiceMedia(node: ServiceTreeNode): void {
    if (!this.canManageMediaFor(node) || this.mediaLoading()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    this.mediaLoading.set(true);
    this.serviceManagementApiService
      .getServiceDetails(node.id)
      .pipe(finalize(() => this.mediaLoading.set(false)))
      .subscribe({
        next: (details) => {
          if (!details.canEditDefinition) {
            this.showMessage('error', this.translations().accessDenied);
            return;
          }

          this.store.selectBranchNode(details.id);
          this.mediaDetails.set(details);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  protected closeServiceMedia(): void {
    if (!this.mediaLoading()) {
      this.mediaDetails.set(null);
    }
  }

  protected canManageLoadedMedia(details: ServiceDetails): boolean {
    return this.canUpdate() && details.canEditDefinition && !details.isDeleted;
  }

  protected handleMediaMessage(message: { readonly tone: 'success' | 'error' | 'info'; readonly text: string }): void {
    this.showMessage(message.tone, message.text);
  }

  protected handleMediaServiceChange(details: ServiceDetails): void {
    this.mediaDetails.set(details);
    this.loadBranchTree();
  }

  protected handleMediaChanged(): void {
    this.loadBranchTree();
  }
  protected openAssignDialog(): void {
    if (!this.canAssignBranchServices() || !this.store.selectedBranchId()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    this.store.openAssignDialog();
    this.loadServiceCentralTree();
  }

  protected openCreateTreeDialog(): void {
    if (!this.canOpenCreateTree()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    this.store.openCreateTreeDialog();
  }

  protected openCreateSubtreeDialog(parent: ServiceTreeNode): void {
    if (!this.canCreateBranchSubtreeFor(parent)) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    this.store.openCreateSubtreeDialog({
      id: parent.id,
      label: this.serviceName(parent),
      scope: parent.scope,
      ownerBranchId: parent.ownerBranchId,
      isOwnedByCurrentBranch: parent.isOwnedByCurrentBranch,
      canEditDefinition: parent.canEditDefinition,
    });
  }

  protected requestUnassign(node: ServiceTreeNode): void {
    const branchId = this.store.selectedBranchId();

    if (!this.canUnassignBranchServices() || !branchId) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    if (!this.canUnassignBranchService(node)) {
      this.showMessage('error', this.translations().invalidSelection);
      return;
    }

    this.store.openUnassignConfirm({
      branchId,
      leafServiceId: node.id,
      serviceName: this.serviceName(node),
    });
  }

  protected requestLifecycle(
    node: ServiceTreeNode,
    action: BranchServiceLifecycleAction,
  ): void {
    const branchId = this.store.selectedBranchId();
    const hasPermission = this.hasLifecyclePermission(action);
    const canUseAction = this.canUseLifecycleAction(node, action);

    if (
      !branchId ||
      !hasPermission ||
      !canUseAction ||
      this.store.lifecyclePreparing() ||
      this.store.lifecycleMutating()
    ) {
      this.showMessage('error', this.translations().lifecycleActionUnavailable);
      return;
    }

    this.store.lifecyclePreparing.set(true);
    this.serviceManagementApiService
      .getServiceDetails(node.id)
      .pipe(finalize(() => this.store.lifecyclePreparing.set(false)))
      .subscribe({
        next: (details) => this.openLifecycleConfirm(details, action, branchId),
        error: (error: HttpErrorResponse) => this.handleLifecycleApiError(error),
      });
  }

  protected confirmLifecycle(): void {
    const state = this.store.lifecycleConfirmState();

    if (!state || this.store.lifecycleMutating()) {
      return;
    }

    const hasPermission = this.hasLifecyclePermission(state.action);

    if (
      !this.isBranchAdmin() ||
      !hasPermission ||
      this.store.selectedBranchId() !== state.branchId
    ) {
      this.store.lifecycleConfirmState.set(null);
      this.showMessage('error', this.translations().lifecycleActionUnavailable);
      return;
    }

    const request$: Observable<ServiceDeleteResponse | ServiceRestoreResponse | ServicePermanentDeleteResponse> =
      state.action === 'delete'
        ? this.serviceManagementApiService.deleteService(state.serviceId, state.rowVersion)
        : state.action === 'restore'
          ? this.serviceManagementApiService.restoreService(state.serviceId, state.rowVersion)
          : this.serviceManagementApiService.permanentlyDeleteService(state.serviceId, state.rowVersion);

    this.store.lifecycleMutating.set(true);
    request$
      .pipe(finalize(() => this.store.lifecycleMutating.set(false)))
      .subscribe({
        next: (response) => {
          const restoredButDisabled =
            state.action === 'restore' &&
            'effectiveIsActive' in response &&
            !response.effectiveIsActive;

          if (state.action === 'permanentDelete' && this.mediaDetails()?.id === state.serviceId) {
            this.mediaDetails.set(null);
          }

          this.store.lifecycleConfirmState.set(null);
          this.store.selectBranchNode(null);
          this.showMessage(
            restoredButDisabled ? 'info' : 'success',
            restoredButDisabled
              ? this.serviceTranslations().restoredButDisabled
              : response.message || this.translations().fallbackSuccess,
          );
          this.loadBranchTree();

          if (this.canAssignBranchServices()) {
            this.loadServiceCentralTree();
          }
        },
        error: (error: HttpErrorResponse) => this.handleLifecycleApiError(error),
      });
  }

  protected confirmUnassign(): void {
    const state = this.store.unassignConfirmState();

    if (!state || this.store.unassigning()) {
      return;
    }

    if (
      !this.canUnassignBranchServices() ||
      this.store.selectedBranchId() !== state.branchId
    ) {
      this.store.unassignConfirmState.set(null);
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    this.store.unassigning.set(true);
    this.branchServicesApiService
      .unassignLeafService(state.branchId, state.leafServiceId)
      .pipe(finalize(() => this.store.unassigning.set(false)))
      .subscribe({
        next: (response) => {
          const message = this.translations()
            .unassignSuccess.replace('{service}', state.serviceName)
            .replace('{count}', String(response.removedAssignmentsCount));
          const selectedNodeId = this.store.selectedBranchNodeId();

          if (
            selectedNodeId !== null &&
            response.unassignedServiceIds.includes(selectedNodeId)
          ) {
            this.store.selectBranchNode(null);
          }

          this.store.unassignConfirmState.set(null);
          this.showMessage('success', message);
          this.loadBranchTree();

          if (this.canAssignBranchServices()) {
            this.loadServiceCentralTree();
          }
        },
        error: (error: HttpErrorResponse) => this.handleUnassignApiError(error),
      });
  }

  protected assignServices(serviceIds: readonly number[]): void {
    const branchId = this.store.selectedBranchId();

    const selectedNodes = serviceIds
      .map((serviceId) => this.findTreeNode(this.store.serviceCentralTree(), serviceId))
      .filter((node): node is ServiceTreeNode => node !== null);
    const hasInvalidSelection =
      selectedNodes.length !== serviceIds.length ||
      selectedNodes.some((node) => !this.canAssignBranchService(node));

    if (!branchId || serviceIds.length === 0 || hasInvalidSelection) {
      this.showMessage('error', this.translations().invalidSelection);
      this.loadServiceCentralTree();
      return;
    }

    this.store.assigning.set(true);
    this.branchServicesApiService
      .assignServices(branchId, { serviceIds })
      .pipe(finalize(() => this.store.assigning.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage(
            'success',
            `${response.message} ${this.translations().createdAssignments}: ${response.createdAssignmentsCount}. ${this.translations().existingAssignments}: ${response.existingAssignmentsCount}.`,
          );
          this.store.closeAssignDialog();
          this.loadBranchTree();
          this.loadServiceCentralTree();
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  protected createBranchTree(request: CreateBranchServiceTreeRequest): void {
    const branchId = this.store.selectedBranchId();

    if (!branchId) {
      this.showMessage('error', this.translations().branchNotFound);
      return;
    }

    const createRequest$: Observable<CreateBranchServiceTreeResponse | CreateBranchServiceSubtreeResponse> | null =
      this.store.createTreeMode() === 'subtree'
      ? this.createBranchSubtree(branchId, request)
      : this.branchServicesApiService.createBranchServiceTree(branchId, request);

    if (!createRequest$) {
      return;
    }

    this.store.creatingTree.set(true);
    createRequest$
      .pipe(finalize(() => this.store.creatingTree.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.creationRequestSummary.set(response.globalizationRequest);
          if (response.globalizationRequest) {
            this.invalidationService.invalidateBranchRequests(branchId);
          }
          this.store.closeCreateTreeDialog();
          this.createTreeResetKey.update((value) => value + 1);
          this.loadBranchTree();
          this.loadServiceCentralTree();
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  protected branchName(branch: BranchListItem): string {
    return this.language() === 'ar' ? branch.arabicName : branch.englishName;
  }

  private createBranchSubtree(
    branchId: number,
    request: CreateBranchServiceTreeRequest,
  ): Observable<CreateBranchServiceSubtreeResponse> | null {
    const parent = this.store.createSubtreeParent();

    if (!parent) {
      this.showMessage('error', this.translations().accessDenied);
      return null;
    }

    const isValidGlobalParent = parent.scope === 'Global' && request.root.children.length === 0;
    const isValidOwnedParent =
      parent.scope === 'BranchScoped' &&
      parent.ownerBranchId === branchId &&
      parent.isOwnedByCurrentBranch &&
      parent.canEditDefinition;

    if (!isValidGlobalParent && !isValidOwnedParent) {
      this.showMessage('error', this.translations().invalidSelection);
      return null;
    }

    return this.branchServicesApiService.createBranchServiceSubtree(branchId, parent.id, request);
  }

  private serviceName(node: ServiceTreeNode): string {
    return this.language() === 'ar' ? node.arabicName : node.englishName;
  }
  private branchSessionName(branch: { readonly arabicName: string; readonly englishName: string }): string {
    return this.language() === 'ar' ? branch.arabicName : branch.englishName;
  }

  private isScheduleEligibleService(node: ServiceTreeNode): boolean {
    return (
      node.isAssignedToCurrentBranch !== false &&
      node.children.length === 0 &&
      !node.hasChildren &&
      node.isActive &&
      !node.isDeleted &&
      node.effectiveIsActive &&
      node.isTicketIssuable &&
      node.canIssueTicket
    );
  }

  private branchActionPermissions(): ServiceActionPermissions {
    return {
      canAssignBranchServices: this.canAssignBranchServices(),
      canUnassignBranchServices: this.canUnassignBranchServices(),
      canUpdate: this.canUpdate(),
      canDelete: this.canDeleteBranchServices(),
      canRestore: this.canRestoreBranchServices(),
      canDeletePermanent: this.canDeletePermanentBranchServices(),
    };
  }

  private hasLifecyclePermission(action: BranchServiceLifecycleAction): boolean {
    if (action === 'delete') {
      return this.canDeleteBranchServices();
    }

    if (action === 'restore') {
      return this.canRestoreBranchServices();
    }

    return this.canDeletePermanentBranchServices();
  }

  private canUseLifecycleAction(
    service: ServiceTreeNode | ServiceDetails,
    action: BranchServiceLifecycleAction,
  ): boolean {
    const ownedBySelectedBranch = service.ownerBranchId === this.store.selectedBranchId();

    if (!this.isBranchAdmin() || !ownedBySelectedBranch) {
      return false;
    }

    if (action === 'delete') {
      return canSoftDeleteService(service, this.branchActionPermissions());
    }

    if (action === 'restore') {
      return canRestoreService(service, this.branchActionPermissions());
    }

    return canPermanentDeleteService(service, this.branchActionPermissions());
  }

  private normalizeSearchText(value: string): string {
    return value.trim().slice(0, 200);
  }

  private collectTreeNodeIds(nodes: readonly ServiceTreeNode[]): readonly number[] {
    return nodes.flatMap((node) => [node.id, ...this.collectTreeNodeIds(node.children)]);
  }
  private findTreeNode(nodes: readonly ServiceTreeNode[], serviceId: number): ServiceTreeNode | null {
    for (const node of nodes) {
      if (node.id === serviceId) {
        return node;
      }

      const child = this.findTreeNode(node.children, serviceId);

      if (child) {
        return child;
      }
    }

    return null;
  }

  private openLifecycleConfirm(
    details: ServiceDetails,
    action: BranchServiceLifecycleAction,
    branchId: number,
  ): void {
    const hasValidState =
      this.store.selectedBranchId() === branchId &&
      details.ownerBranchId === branchId &&
      this.canUseLifecycleAction(details, action);

    if (!hasValidState) {
      this.showMessage('error', this.translations().lifecycleActionUnavailable);
      this.loadBranchTree();
      return;
    }

    this.store.openLifecycleConfirm({
      action,
      branchId,
      serviceId: details.id,
      rowVersion: details.rowVersion,
      serviceName: this.language() === 'ar' ? details.arabicName : details.englishName,
      hasChildren: details.hasChildren,
    });
  }

  private loadBranches(): void {
    this.store.branchesLoading.set(true);
    this.branchApiService
      .getBranches({
        searchText: '',
        orderSort: 'Newest',
        pageNumber: 1,
        pageSize: 100,
        isActive: true,
      })
      .pipe(finalize(() => this.store.branchesLoading.set(false)))
      .subscribe({
        next: (response) => this.branches.set(response.data),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadBranchTree(): void {
    const branchId = this.store.selectedBranchId();

    if (!branchId || !this.canViewBranchServices()) {
      return;
    }

    const requestId = ++this.branchTreeRequestId;
    const searchText = this.store.branchTreeSearchText();
    this.store.branchTreeLoading.set(true);
    this.branchServicesApiService
      .getBranchServicesTree(branchId, {
        includeInactive: this.store.includeInactive(),
        includeDeleted: this.store.includeDeleted(),
        searchText,
      })
      .pipe(
        finalize(() => {
          if (requestId === this.branchTreeRequestId) {
            this.store.branchTreeLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.branchTreeRequestId) {
            return;
          }

          this.store.branchTree.set(response);

          if (searchText.trim()) {
            this.store.expandBranchNodes(this.collectTreeNodeIds(response));
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.branchTreeRequestId) {
            this.handleApiError(error);
          }
        },
      });
  }

  private loadPendingRequestsCount(branchId: number, force = false): void {
    if (this.store.pendingGlobalizationRequestsLoading() && !force) {
      return;
    }

    const requestId = ++this.pendingCountRequestId;
    this.store.pendingGlobalizationRequestsLoading.set(true);
    this.serviceGlobalizationApiService
      .getBranchRequests(branchId, {
        status: 'Pending',
        requestType: null,
        searchText: '',
        orderSort: 'Newest',
        pageNumber: 1,
        pageSize: 1,
      })
      .pipe(
        finalize(() => {
          if (requestId === this.pendingCountRequestId) {
            this.store.pendingGlobalizationRequestsLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (requestId === this.pendingCountRequestId && this.store.selectedBranchId() === branchId) {
            const previousCount = this.lastPendingRequestsCount;
            this.lastPendingRequestsCount = response.totalItems;
            this.store.pendingGlobalizationRequestsCount.set(response.totalItems);
            this.store.pendingGlobalizationRequestsNewestId.set(
              response.data[0]?.requestId ?? null,
            );

            if (previousCount !== null && response.totalItems < previousCount) {
              this.loadBranchTree();

              if (this.canAssignBranchServices()) {
                this.loadServiceCentralTree();
              }
            }
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.pendingCountRequestId && this.store.selectedBranchId() === branchId) {
            this.store.pendingGlobalizationRequestsCount.set(0);
            this.store.pendingGlobalizationRequestsNewestId.set(null);
            this.handleApiError(error);
          }
        },
      });
  }

  private startStatusPolling(): void {
    if (this.statusPollingIntervalId !== null) {
      return;
    }

    this.statusPollingIntervalId = setInterval(() => {
      const branchId = this.store.selectedBranchId();

      if (
        !branchId ||
        !this.canOpenGlobalizationRequests() ||
        this.store.pendingGlobalizationRequestsLoading()
      ) {
        return;
      }

      this.loadPendingRequestsCount(branchId);
    }, STATUS_POLL_INTERVAL_MS);
  }

  protected loadServiceCentralTree(): void {
    const requestId = ++this.centralTreeRequestId;
    const searchText = this.store.centralTreeSearchText();
    this.store.centralTreeLoading.set(true);
    this.serviceManagementApiService
      .getServiceTree({
        includeInactive: false,
        includeDeleted: false,
        scope: 'Global',
        isAssignedToCurrentBranch: false,
        searchText,
      })
      .pipe(
        finalize(() => {
          if (requestId === this.centralTreeRequestId) {
            this.store.centralTreeLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.centralTreeRequestId) {
            return;
          }

          this.store.serviceCentralTree.set(response);

          if (searchText.trim()) {
            this.store.expandCentralNodes(this.collectTreeNodeIds(response));
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.centralTreeRequestId) {
            this.handleApiError(error);
          }
        },
      });
  }

  private handleApiError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (error.status === 403) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    if (error.status === 404) {
      this.showMessage('error', formatTechnicalAdminApiError(error, this.translations().branchNotFound));

      if (this.isBranchAdmin()) {
        this.loadBranchTree();
      } else {
        this.loadBranches();
      }

      return;
    }

    if (this.containsErrorCode(error, 'ServiceCodeAlreadyExists')) {
      this.showMessage('error', formatTechnicalAdminApiError(error, this.translations().serviceCodeAlreadyExists));
      return;
    }

    if (this.containsErrorCode(error, 'DuplicateServiceCodeInTreePayload')) {
      this.showMessage('error', formatTechnicalAdminApiError(error, this.translations().duplicateServiceCodeInTree));
      return;
    }

    this.showMessage('error', formatTechnicalAdminApiError(error, this.translations().fallbackError));
  }

  private handleUnassignApiError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.handleApiError(error);
      return;
    }

    if (error.status === 400 || error.status === 403 || error.status === 409) {
      const fallback =
        error.status === 403
          ? this.translations().accessDenied
          : this.translations().fallbackError;
      this.showMessage('error', formatTechnicalAdminApiError(error, fallback));
      return;
    }

    if (error.status !== 404) {
      this.handleApiError(error);
      return;
    }

    this.store.unassignConfirmState.set(null);
    this.showMessage(
      'error',
      formatTechnicalAdminApiError(error, this.translations().branchNotFound),
    );
    this.loadBranchTree();

    if (!this.isBranchAdmin()) {
      this.loadBranches();
    }
  }

  private handleLifecycleApiError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.handleApiError(error);
      return;
    }

    this.store.lifecycleConfirmState.set(null);

    if (error.status === 400 || error.status === 403 || error.status === 404 || error.status === 409) {
      const fallback =
        error.status === 403
          ? this.translations().accessDenied
          : this.translations().fallbackError;
      this.showMessage('error', formatTechnicalAdminApiError(error, fallback));
      this.loadBranchTree();
      return;
    }

    this.handleApiError(error);
  }

  private containsErrorCode(error: HttpErrorResponse, expected: string): boolean {
    const body = typeof error.error === 'string' ? error.error : JSON.stringify(error.error ?? '');
    return body.toLowerCase().includes(expected.toLowerCase());
  }

  private showMessage(tone: 'success' | 'error' | 'info', text: string): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    if (this.branchTreeSearchDebounceId !== null) {
      clearTimeout(this.branchTreeSearchDebounceId);
    }

    if (this.centralTreeSearchDebounceId !== null) {
      clearTimeout(this.centralTreeSearchDebounceId);
    }

    this.store.message.set({ tone, text });
    this.toastTimeoutId = setTimeout(
      () => {
        this.store.message.set(null);
        this.toastTimeoutId = null;
      },
      tone === 'error' ? 6500 : 4200,
    );
  }

  private toOptionalNumber(value: string): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }
}
