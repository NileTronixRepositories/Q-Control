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
import { UnassignBranchServiceDialogComponent } from '../../components/unassign-branch-service-dialog/unassign-branch-service-dialog.component';
import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { SERVICE_GLOBALIZATION_TRANSLATIONS } from '../../i18n/service-globalization.translations';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
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
  ServiceRestoreResponse,
  ServiceTreeNode,
} from '../../models/service-management.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { BranchServicesStore } from '../../store/branch-services.store';
import { ServiceDataInvalidationService } from '../../services/service-data-invalidation.service';

@Component({
  selector: 'app-branch-services-page',
  standalone: true,
  imports: [
    AssignBranchServicesDialogComponent,
    BranchGlobalizationRequestsComponent,
    BranchServiceLifecycleDialogComponent,
    CreateBranchServiceTreeDialogComponent,
    ServiceHierarchyTreeComponent,
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
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly canViewBranchServices = this.permissionService.canViewBranchServices;
  protected readonly canAssignBranchServices = this.permissionService.canAssignBranchServices;
  protected readonly canUnassignBranchServices =
    this.permissionService.canUnassignBranchServices;
  protected readonly canDeleteBranchServices = this.permissionService.canDelete;
  protected readonly canRestoreBranchServices = this.permissionService.canRestore;
  protected readonly canCreateBranchServiceTree = this.permissionService.canCreateBranchServiceTree;
  protected readonly canViewOwnGlobalizationRequests =
    this.permissionService.canViewOwnGlobalizationRequests ?? computed(() => false);
  protected readonly branches = signal<readonly BranchListItem[]>([]);
  protected readonly createTreeResetKey = signal(0);
  protected readonly creationRequestSummary = signal<ServiceGlobalizationRequestSummary | null>(null);
  protected readonly pendingRequestsBadge = computed(() => {
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
  protected readonly canDeleteBranchService = (node: ServiceTreeNode): boolean =>
    this.canManageBranchService(node) && this.canDeleteBranchServices() && !node.isDeleted;
  protected readonly canRestoreBranchService = (node: ServiceTreeNode): boolean =>
    this.canManageBranchService(node) && this.canRestoreBranchServices() && node.isDeleted;
  protected readonly canUnassignBranchService = (node: ServiceTreeNode): boolean =>
    node.scope === 'Global';
  protected readonly branchActionsDisabled = computed(
    () => this.store.lifecyclePreparing() || this.store.lifecycleMutating(),
  );

  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pendingCountRequestId = 0;
  private pendingCountBranchId: number | null = null;

  constructor() {
    effect(() => {
      const branchId = this.store.selectedBranchId();
      const canViewRequests = this.canViewOwnGlobalizationRequests();
      const invalidation = this.invalidationService.branchRequestsInvalidation();
      const branchChanged = branchId !== this.pendingCountBranchId;
      this.pendingCountBranchId = branchId;

      if (!branchId || !canViewRequests) {
        untracked(() => {
          this.pendingCountRequestId += 1;
          this.store.pendingGlobalizationRequestsCount.set(0);
          this.store.pendingGlobalizationRequestsLoading.set(false);
          this.store.closeGlobalizationRequestsDialog();
        });
        return;
      }

      if (branchChanged || !invalidation || invalidation.branchId === branchId) {
        untracked(() => this.loadPendingRequestsCount(branchId, true));
      }
    });
  }

  ngOnInit(): void {
    const session = this.authSessionService.currentSession();

    if (session?.userType === 'BranchAdmin') {
      const branchId = session.activeBranchId;
      const branch = session.branches.find((item) => item.branchId === branchId) ?? null;

      this.store.selectBranch(
        branchId,
        branch ? this.branchSessionName(branch) : this.translations().activeBranch,
      );
      this.loadBranchTree();
      return;
    }

    this.loadBranches();
  }

  ngOnDestroy(): void {
    this.pendingCountRequestId += 1;
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
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
    if (branchId && this.canViewOwnGlobalizationRequests()) {
      this.loadPendingRequestsCount(branchId, true);
    }
  }

  protected openGlobalizationRequests(): void {
    if (!this.canViewOwnGlobalizationRequests() || !this.store.hasSelectedBranch()) {
      return;
    }

    this.store.openGlobalizationRequestsDialog();
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

    if (node.scope !== 'Global' || node.children.length > 0 || node.hasChildren) {
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
    const hasPermission =
      action === 'delete' ? this.canDeleteBranchServices() : this.canRestoreBranchServices();

    if (
      !branchId ||
      !hasPermission ||
      !this.canManageBranchService(node) ||
      this.store.lifecyclePreparing() ||
      this.store.lifecycleMutating()
    ) {
      this.showMessage('error', this.translations().lifecycleActionUnavailable);
      return;
    }

    if ((action === 'delete' && node.isDeleted) || (action === 'restore' && !node.isDeleted)) {
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
    const hasPermission = state?.action === 'delete'
      ? this.canDeleteBranchServices()
      : this.canRestoreBranchServices();

    if (!state || this.store.lifecycleMutating()) {
      return;
    }

    if (
      !this.isBranchAdmin() ||
      !hasPermission ||
      this.store.selectedBranchId() !== state.branchId
    ) {
      this.store.lifecycleConfirmState.set(null);
      this.showMessage('error', this.translations().lifecycleActionUnavailable);
      return;
    }

    const request$: Observable<ServiceDeleteResponse | ServiceRestoreResponse> =
      state.action === 'delete'
        ? this.serviceManagementApiService.deleteService(state.serviceId, state.rowVersion)
        : this.serviceManagementApiService.restoreService(state.serviceId, state.rowVersion);

    this.store.lifecycleMutating.set(true);
    request$
      .pipe(finalize(() => this.store.lifecycleMutating.set(false)))
      .subscribe({
        next: (response) => {
          const restoredButDisabled =
            state.action === 'restore' &&
            'effectiveIsActive' in response &&
            !response.effectiveIsActive;

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

    if (!branchId || serviceIds.length === 0) {
      this.showMessage('error', this.translations().invalidSelection);
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

  private canManageBranchService(node: ServiceTreeNode): boolean {
    return (
      this.isBranchAdmin() &&
      node.scope === 'BranchScoped' &&
      node.isOwnedByCurrentBranch &&
      node.canEditDefinition &&
      node.ownerBranchId === this.store.selectedBranchId()
    );
  }

  private openLifecycleConfirm(
    details: ServiceDetails,
    action: BranchServiceLifecycleAction,
    branchId: number,
  ): void {
    const hasValidState =
      this.store.selectedBranchId() === branchId &&
      details.scope === 'BranchScoped' &&
      details.isOwnedByCurrentBranch &&
      details.ownerBranchId === branchId &&
      ((action === 'delete' && !details.isDeleted) ||
        (action === 'restore' && details.isDeleted));

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

    this.store.branchTreeLoading.set(true);
    this.branchServicesApiService
      .getBranchServicesTree(branchId, {
        includeInactive: this.store.includeInactive(),
        includeDeleted: this.store.includeDeleted(),
      })
      .pipe(finalize(() => this.store.branchTreeLoading.set(false)))
      .subscribe({
        next: (response) => this.store.branchTree.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
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
            this.store.pendingGlobalizationRequestsCount.set(response.totalItems);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.pendingCountRequestId && this.store.selectedBranchId() === branchId) {
            this.store.pendingGlobalizationRequestsCount.set(0);
            this.handleApiError(error);
          }
        },
      });
  }

  protected loadServiceCentralTree(): void {
    if (this.store.centralTreeLoading()) {
      return;
    }

    this.store.centralTreeLoading.set(true);
    this.serviceManagementApiService
      .getServiceTree({ includeInactive: false, includeDeleted: false, scope: 'Global' })
      .pipe(finalize(() => this.store.centralTreeLoading.set(false)))
      .subscribe({
        next: (response) => this.store.serviceCentralTree.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
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

  private showMessage(tone: 'success' | 'error' | 'info', text: string): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
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
