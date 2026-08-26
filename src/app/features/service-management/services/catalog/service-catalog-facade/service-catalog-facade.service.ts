import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable } from 'rxjs';

import {
  CreateBranchServiceSubtreeResponse,
  CreateBranchServiceTreeRequest,
  CreateBranchServiceTreeResponse,
} from '../../../models/branch-services/branch-services.model';
import {
  CreateServiceRequest,
  ServiceConfirmState,
  ServiceDetails,
  ServiceTreeNode,
  UpdateServiceRequest,
} from '../../../models/service-management/service-management.model';
import { BranchServicesApiService } from '../../branch/branch-services-api/branch-services-api.service';
import { ServiceManagementApiService } from '../service-management-api/service-management-api.service';
import { ServiceManagementPermissionService } from '../service-management-permission/service-management-permission.service';
import { ServiceManagementStore } from '../../../store/service-management.store';

@Injectable()
export class ServiceCatalogFacadeService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly apiService = inject(ServiceManagementApiService);
  private readonly branchServicesApiService = inject(BranchServicesApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);
  private readonly store = inject(ServiceManagementStore);

  private treeRequestId = 0;
  private assignedBranchTreeRequestId = 0;
  private panelRequestId = 0;

  public loadServicesTree(
    includeInactive: boolean,
    includeDeleted: boolean,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    const requestId = ++this.treeRequestId;
    const searchText = this.store.serviceTreeSearchText();
    this.store.treeLoading.set(true);

    this.apiService
      .getServiceTree({
        includeInactive,
        includeDeleted,
        scope: this.store.listQuery().scope,
        ownerBranchId: this.store.listQuery().ownerBranchId,
        isAssignedToCurrentBranch: this.store.listQuery().isAssignedToCurrentBranch,
        searchText,
      })
      .pipe(
        finalize(() => {
          if (requestId === this.treeRequestId) {
            this.store.treeLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.treeRequestId) {
            return;
          }

          this.store.serviceTree.set(response);

          if (searchText.trim()) {
            this.store.expandTreeNodes(this.collectTreeNodeIds(response));
          }

          const selectedId = this.store.selectedTreeServiceId();
          if (selectedId && !this.treeContains(response, selectedId)) {
            this.store.selectTreeNode(null);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.treeRequestId) {
            onError(error);
          }
        },
      });
  }

  public loadAssignedBranchTree(
    branchId: number,
    includeInactive: boolean,
    includeDeleted: boolean,
    onError: (err: HttpErrorResponse) => void,
    onSuccess?: () => void,
  ): void {
    const requestId = ++this.assignedBranchTreeRequestId;
    const searchText = this.store.assignedBranchTreeSearchText();
    this.store.assignedBranchTreeLoading.set(true);

    this.branchServicesApiService
      .getBranchServicesTree(branchId, {
        includeInactive,
        includeDeleted,
        searchText,
      })
      .pipe(
        finalize(() => {
          if (requestId === this.assignedBranchTreeRequestId) {
            this.store.assignedBranchTreeLoading.set(false);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.assignedBranchTreeRequestId) {
            return;
          }

          this.store.assignedBranchServiceTree.set(response);

          if (searchText.trim()) {
            this.store.expandAssignedBranchNodes(this.collectTreeNodeIds(response));
          }

          if (onSuccess) {
            onSuccess();
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.assignedBranchTreeRequestId) {
            onError(error);
          }
        },
      });
  }

  public assignBranchService(
    branchId: number,
    node: ServiceTreeNode,
    onSuccess: (response: { createdAssignmentsCount: number; message?: string }) => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    this.store.branchAssigning.set(true);

    this.branchServicesApiService
      .assignServices(branchId, { serviceIds: [node.id] })
      .pipe(
        finalize(() => this.store.branchAssigning.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => onSuccess(response),
        error: (error: HttpErrorResponse) => onError(error),
      });
  }

  public loadParentOptions(excludeServiceId?: number, onError?: (err: HttpErrorResponse) => void): void {
    this.store.parentsLoading.set(true);

    this.apiService
      .getAvailableParents({ excludeServiceId })
      .pipe(
        finalize(() => this.store.parentsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => this.store.parentOptions.set(response),
        error: (error: HttpErrorResponse) => {
          if (onError) onError(error);
        },
      });
  }

  public loadDetails(
    serviceId: number,
    mode: 'view' | 'edit',
    onSuccessEdit: (details: ServiceDetails) => void,
    onPermissionDenied: () => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    const requestId = ++this.panelRequestId;

    this.store.openPanel(mode);
    this.store.selectedDetails.set(null);
    this.store.selectTreeNode(serviceId);
    this.store.clearCreateParentContext();
    this.store.detailsLoading.set(true);

    this.apiService
      .getServiceDetails(serviceId)
      .pipe(
        finalize(() => this.store.detailsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.panelRequestId || this.store.panelMode() !== mode) {
            return;
          }

          this.store.selectedDetails.set(response);
          this.store.selectTreeNode(response.id);

          if (mode === 'edit') {
            if (response.isDeleted || !response.canEditDefinition) {
              onPermissionDenied();
              return;
            }

            this.loadParentOptions(response.id);
            onSuccessEdit(response);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.panelRequestId) {
            onError(error);
            this.store.closePanel();
          }
        },
      });
  }

  public createService(
    request: CreateServiceRequest,
    onSuccess: (id: number, message: string) => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    this.store.saving.set(true);

    this.apiService
      .createService(request)
      .pipe(
        finalize(() => this.store.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => onSuccess(response.id, response.message || ''),
        error: (error: HttpErrorResponse) => onError(error),
      });
  }

  public createBranchScopedService(
    branchId: number,
    parent: ServiceTreeNode | null,
    request: CreateBranchServiceTreeRequest,
    onSuccess: (rootId: number, message: string) => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    const request$: Observable<
      CreateBranchServiceTreeResponse | CreateBranchServiceSubtreeResponse
    > = parent
      ? this.branchServicesApiService.createBranchServiceSubtree(branchId, parent.id, request)
      : this.branchServicesApiService.createBranchServiceTree(branchId, request);

    this.store.saving.set(true);

    request$
      .pipe(
        finalize(() => this.store.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => onSuccess(response.root.id, response.message || ''),
        error: (error: HttpErrorResponse) => onError(error),
      });
  }

  public updateService(
    serviceId: number,
    request: UpdateServiceRequest,
    onSuccess: (message: string) => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    this.store.saving.set(true);

    this.apiService
      .updateService(serviceId, request)
      .pipe(
        finalize(() => this.store.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => onSuccess(response.message || ''),
        error: (error: HttpErrorResponse) => onError(error),
      });
  }

  public deleteService(
    state: ServiceConfirmState,
    onSuccess: (message: string) => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    this.store.mutating.set(true);

    this.apiService
      .deleteService(state.serviceId, state.rowVersion)
      .pipe(
        finalize(() => this.store.mutating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => onSuccess(response.message || ''),
        error: (error: HttpErrorResponse) => onError(error),
      });
  }

  public restoreService(
    state: ServiceConfirmState,
    onSuccess: (effectiveIsActive: boolean, message: string) => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    this.store.mutating.set(true);

    this.apiService
      .restoreService(state.serviceId, state.rowVersion)
      .pipe(
        finalize(() => this.store.mutating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => onSuccess(response.effectiveIsActive, response.message || ''),
        error: (error: HttpErrorResponse) => onError(error),
      });
  }

  public permanentlyDeleteService(
    state: ServiceConfirmState,
    onSuccess: (message: string) => void,
    onError: (err: HttpErrorResponse) => void,
  ): void {
    this.store.mutating.set(true);

    this.apiService
      .permanentlyDeleteService(state.serviceId, state.rowVersion)
      .pipe(
        finalize(() => this.store.mutating.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => onSuccess(response.message || ''),
        error: (error: HttpErrorResponse) => onError(error),
      });
  }

  private collectTreeNodeIds(nodes: readonly ServiceTreeNode[]): readonly number[] {
    const ids: number[] = [];
    const traverse = (items: readonly ServiceTreeNode[]): void => {
      items.forEach((item) => {
        ids.push(item.id);
        if (item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(nodes);
    return ids;
  }

  private treeContains(nodes: readonly ServiceTreeNode[], targetId: number): boolean {
    return nodes.some(
      (node) => node.id === targetId || this.treeContains(node.children, targetId),
    );
  }
}
