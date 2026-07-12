import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem } from '../../../technical-admin/models/branch-management.model';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { AssignBranchServicesDialogComponent } from '../../components/assign-branch-services-dialog/assign-branch-services-dialog.component';
import { CreateBranchServiceTreeDialogComponent } from '../../components/create-branch-service-tree-dialog/create-branch-service-tree-dialog.component';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import {
  CreateBranchServiceSubtreeResponse,
  CreateBranchServiceTreeRequest,
  CreateBranchServiceTreeResponse,
} from '../../models/branch-services.model';
import { ServiceTreeNode } from '../../models/service-management.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { BranchServicesStore } from '../../store/branch-services.store';

@Component({
  selector: 'app-branch-services-page',
  standalone: true,
  imports: [
    AssignBranchServicesDialogComponent,
    CreateBranchServiceTreeDialogComponent,
    ServiceHierarchyTreeComponent,
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
  private readonly permissionService = inject(ServiceManagementPermissionService);

  protected readonly store = inject(BranchServicesStore);
  protected readonly translations = computed(
    () => BRANCH_SERVICES_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly serviceTranslations = computed(
    () => SERVICE_MANAGEMENT_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly canViewBranchServices = this.permissionService.canViewBranchServices;
  protected readonly canAssignBranchServices = this.permissionService.canAssignBranchServices;
  protected readonly canCreateBranchServiceTree = this.permissionService.canCreateBranchServiceTree;
  protected readonly branches = signal<readonly BranchListItem[]>([]);
  protected readonly createTreeResetKey = signal(0);
  protected readonly isBranchAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'BranchAdmin',
  );
  protected readonly canOpenCreateTree = computed(
    () => this.isBranchAdmin() && this.canCreateBranchServiceTree() && this.store.hasSelectedBranch(),
  );
  protected readonly canCreateBranchSubtreeFor = (node: ServiceTreeNode): boolean =>
    this.canOpenCreateTree() && node.scope === 'BranchScoped' && node.isOwnedByCurrentBranch && !node.isDeleted;

  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

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

    this.store.openCreateSubtreeDialog({ id: parent.id, label: this.serviceName(parent) });
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

    return this.branchServicesApiService.createBranchServiceSubtree(branchId, parent.id, request);
  }

  private serviceName(node: ServiceTreeNode): string {
    return this.language() === 'ar' ? node.arabicName : node.englishName;
  }
  private branchSessionName(branch: { readonly arabicName: string; readonly englishName: string }): string {
    return this.language() === 'ar' ? branch.arabicName : branch.englishName;
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

  protected loadServiceCentralTree(): void {
    if (this.store.centralTreeLoading()) {
      return;
    }

    this.store.centralTreeLoading.set(true);
    this.serviceManagementApiService
      .getServiceTree({ includeInactive: false, includeDeleted: false })
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
