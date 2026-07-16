import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';

import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem } from '../../../technical-admin/models/branch-management.model';
import { BranchManagementApiService } from '../../../technical-admin/services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { SERVICE_WORKFLOW_TRANSLATIONS } from '../../i18n/service-workflow.translations';
import { ServiceTreeNode } from '../../models/service-management.model';
import {
  ServiceWorkflowDetails,
  ServiceWorkflowListItem,
  ServiceWorkflowMutationResponse,
  ServiceWorkflowStep,
  WorkflowBuilderStep,
  WorkflowCandidateService,
  WorkflowConfirmAction,
} from '../../models/service-workflow.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceWorkflowApiService } from '../../services/service-workflow-api.service';
import { ServiceWorkflowStore } from '../../store/service-workflow.store';

type BooleanSelectValue = 'all' | 'true' | 'false';
type WorkflowFormControlName = 'arabicName' | 'englishName';
type WorkflowDragKind = 'candidate' | 'step';
type WorkflowDragPayload =
  | { readonly kind: 'candidate'; readonly serviceId: number }
  | { readonly kind: 'step'; readonly uid: string };

const WORKFLOW_DRAG_MIME_TYPE = 'application/x-qsystem-workflow-builder';

interface WorkflowParentOption {
  readonly id: number;
  readonly arabicName: string;
  readonly englishName: string;
}

@Component({
  selector: 'app-service-workflows',
  standalone: true,
  imports: [ReactiveFormsModule, TechnicalAdminPageHeroComponent, ServiceHierarchyTreeComponent],
  providers: [ServiceWorkflowStore],
  templateUrl: './service-workflows.component.html',
  styleUrl: './service-workflows.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceWorkflowsComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly branchApiService = inject(BranchManagementApiService);
  private readonly branchServicesApiService = inject(BranchServicesApiService);
  private readonly apiService = inject(ServiceWorkflowApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);

  readonly store = inject(ServiceWorkflowStore);
  readonly translations = computed(() => SERVICE_WORKFLOW_TRANSLATIONS[this.i18nStore.language()]);
  readonly serviceTranslations = computed(
    () => SERVICE_MANAGEMENT_TRANSLATIONS[this.i18nStore.language()],
  );
  readonly language = this.i18nStore.language;
  readonly direction = this.i18nStore.direction;
  readonly isBranchAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'BranchAdmin',
  );

  readonly canViewAll = this.permissionService.canViewWorkflows;
  readonly canViewDetails = this.permissionService.canViewWorkflowDetails;
  readonly canCreate = this.permissionService.canCreateWorkflow;
  readonly canUpdate = this.permissionService.canUpdateWorkflow;
  readonly canSetDefault = this.permissionService.canSetDefaultWorkflow;
  readonly canDeactivate = this.permissionService.canDeactivateWorkflow;
  readonly canReactivate = this.permissionService.canReactivateWorkflow;
  readonly canViewCandidates = this.permissionService.canViewCandidateServices;
  readonly canViewStartOptions = this.permissionService.canViewStartOptions;

  readonly scopeError = signal<string | null>(null);
  readonly builderSteps = signal<readonly WorkflowBuilderStep[]>([]);
  readonly replacingStepUid = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly filtersExpanded = signal(false);
  readonly activeDragKind = signal<WorkflowDragKind | null>(null);
  readonly activeDropIndex = signal<number | null>(null);
  readonly workflows = computed(() => this.store.page().data);
  readonly candidateOptions = computed(() => this.store.candidates().data);
  readonly selectedTreeNode = computed(() =>
    this.findTreeNode(this.store.branchTree(), this.store.selectedBranchNodeId()),
  );
  readonly parentOptions = computed(() => this.collectParentOptions(this.store.branchTree()));

  readonly workflowForm = this.formBuilder.group({
    arabicName: ['', [Validators.maxLength(100)]],
    englishName: ['', [Validators.maxLength(100)]],
  });
  readonly arabicNameControl = this.workflowForm.controls.arabicName;
  readonly englishNameControl = this.workflowForm.controls.englishName;

  private readonly routeBranchId = this.readPositiveInt(this.route.snapshot.paramMap.get('branchId'));
  private readonly routeLeafServiceId = this.readPositiveInt(
    this.route.snapshot.paramMap.get('leafServiceId'),
  );
  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private candidateSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private stepUid = 0;

  ngOnInit(): void {
    if (!this.canViewAll()) return;
    const session = this.authSessionService.currentSession();

    if (this.isBranchAdmin()) {
      const activeBranchId = session?.activeBranchId ?? null;
      if (!activeBranchId || (this.routeBranchId && this.routeBranchId !== activeBranchId)) {
        this.scopeError.set(this.translations().invalidWorkflowScope);
        return;
      }
      this.store.selectBranch(activeBranchId);
      this.loadBranchTree(activeBranchId);
      return;
    }

    this.loadBranches();
    if (this.routeBranchId) {
      this.store.selectBranch(this.routeBranchId);
      this.loadBranchTree(this.routeBranchId);
    }
  }

  ngOnDestroy(): void {
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
    if (this.candidateSearchDebounceId) clearTimeout(this.candidateSearchDebounceId);
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
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
        next: (response) => this.store.branches.set(response.data),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadBranchTree(branchId: number): void {
    this.scopeError.set(null);
    this.store.branchTreeLoading.set(true);
    this.branchServicesApiService
      .getBranchServicesTree(branchId, { includeInactive: false, includeDeleted: false })
      .pipe(finalize(() => this.store.branchTreeLoading.set(false)))
      .subscribe({
        next: (tree) => {
          this.store.branchTree.set(tree);
          if (this.routeLeafServiceId) this.activateRouteScope(branchId, this.routeLeafServiceId);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private activateRouteScope(branchId: number, leafServiceId: number): void {
    const node = this.findTreeNode(this.store.branchTree(), leafServiceId);
    if (!node || !this.canManageWorkflowFor(node)) {
      this.scopeError.set(this.translations().invalidWorkflowScope);
      return;
    }
    this.activateScope(branchId, node);
  }

  private activateScope(branchId: number, node: ServiceTreeNode): void {
    this.store.setScope({
      branchId,
      leafServiceId: node.id,
      branchName: this.branchLabel(branchId),
      ownerServiceName: this.serviceName(node),
    });
    this.loadScopedData();
  }

  selectBranch(event: Event): void {
    const branchId = this.readPositiveInt(this.readInputValue(event));
    this.store.selectBranch(branchId);
    this.scopeError.set(null);
    if (branchId) this.loadBranchTree(branchId);
  }

  toggleBranchNode(node: ServiceTreeNode): void {
    if (node.children.length > 0) this.store.toggleBranchNode(node.id);
  }

  selectBranchNode(node: ServiceTreeNode): void {
    this.store.selectedBranchNodeId.set(node.id);
  }

  openNodeWorkflows(node: ServiceTreeNode): void {
    const branchId = this.store.selectedBranchId();
    if (!branchId || !this.canManageWorkflowFor(node)) {
      this.showMessage('error', this.translations().ineligibleOwnerService);
      return;
    }
    this.activateScope(branchId, node);
    this.openCreate();
  }

  backToScopeSelection(): void {
    void this.router.navigateByUrl('/admin/services/workflows');
  }

  readonly canManageWorkflowFor = (node: ServiceTreeNode): boolean =>
    node.isAssignedToCurrentBranch !== false &&
    node.children.length === 0 &&
    !node.hasChildren &&
    node.isActive &&
    !node.isDeleted &&
    node.effectiveIsActive &&
    node.isTicketIssuable &&
    node.canIssueTicket;

  updateSearch(event: Event): void {
    this.store.updateQuery({ searchText: this.readInputValue(event), pageNumber: 1 });
    if (this.searchDebounceId) clearTimeout(this.searchDebounceId);
    this.searchDebounceId = setTimeout(() => this.loadWorkflows(), 350);
  }

  updateStatusFilter(event: Event): void {
    this.store.updateQuery({
      isActive: this.toBooleanFilter(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadWorkflows();
  }

  updateSort(event: Event): void {
    this.store.updateQuery({
      orderSort: this.readInputValue(event) === 'Oldest' ? 'Oldest' : 'Newest',
      pageNumber: 1,
    });
    this.loadWorkflows();
  }

  updatePageSize(event: Event): void {
    this.store.updateQuery({
      pageSize: Math.min(Math.max(Number(this.readInputValue(event)) || 10, 1), 100),
      pageNumber: 1,
    });
    this.loadWorkflows();
  }

  updateCandidateSearch(event: Event): void {
    this.store.updateCandidateQuery({ searchText: this.readInputValue(event), pageNumber: 1 });
    if (this.candidateSearchDebounceId) clearTimeout(this.candidateSearchDebounceId);
    this.candidateSearchDebounceId = setTimeout(() => this.loadCandidates(), 300);
  }

  updateCandidateParent(event: Event): void {
    this.store.updateCandidateQuery({
      parentServiceId: this.readPositiveInt(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadCandidates();
  }

  previousPage(): void {
    const page = this.store.page();
    if (page.hasPreviousPage) this.loadWorkflows(page.currentPage - 1);
  }

  nextPage(): void {
    const page = this.store.page();
    if (page.hasNextPage) this.loadWorkflows(page.currentPage + 1);
  }

  previousCandidatesPage(): void {
    const page = this.store.candidates();
    if (!page.hasPreviousPage) return;
    this.store.updateCandidateQuery({ pageNumber: page.currentPage - 1 });
    this.loadCandidates();
  }

  nextCandidatesPage(): void {
    const page = this.store.candidates();
    if (!page.hasNextPage) return;
    this.store.updateCandidateQuery({ pageNumber: page.currentPage + 1 });
    this.loadCandidates();
  }

  refresh(): void {
    this.loadScopedData(this.store.page().currentPage || 1);
  }

  toggleFilters(): void {
    this.filtersExpanded.update((value) => !value);
  }

  openCreate(): void {
    if (!this.canCreate() || !this.store.scope()) return;
    this.store.selectedDetails.set(null);
    this.store.openPanel('create');
    this.workflowForm.reset({ arabicName: '', englishName: '' });
    this.builderSteps.set([]);
    this.replacingStepUid.set(null);
    this.clearWorkflowDragState();
    this.formError.set(null);
  }

  openView(item: ServiceWorkflowListItem): void {
    if (this.canViewDetails()) this.loadDetails(item.workflowId, 'view');
  }

  openEdit(item: ServiceWorkflowListItem | ServiceWorkflowDetails): void {
    if (this.canUpdate() && item.isActive) this.loadDetails(item.workflowId, 'edit');
  }

  closePanel(): void {
    if (this.store.saving()) return;
    this.store.closePanel();
    this.builderSteps.set([]);
    this.replacingStepUid.set(null);
    this.clearWorkflowDragState();
    this.formError.set(null);
    this.workflowForm.reset({ arabicName: '', englishName: '' });
  }

  selectCandidate(candidate: WorkflowCandidateService): void {
    const replacingUid = this.replacingStepUid();
    if (replacingUid) {
      this.builderSteps.update((steps) =>
        steps.map((step) => (step.uid === replacingUid ? { ...step, service: candidate } : step)),
      );
      this.replacingStepUid.set(null);
      return;
    }
    this.builderSteps.update((steps) => [
      ...steps,
      { uid: this.createStepUid(), service: candidate },
    ]);
  }

  replaceStep(uid: string): void {
    this.replacingStepUid.set(uid);
  }

  removeStep(uid: string): void {
    this.builderSteps.update((steps) => steps.filter((step) => step.uid !== uid));
    if (this.replacingStepUid() === uid) this.replacingStepUid.set(null);
  }

  moveStep(index: number, direction: -1 | 1): void {
    const targetIndex = index + direction;
    const steps = [...this.builderSteps()];
    if (targetIndex < 0 || targetIndex >= steps.length) return;
    [steps[index], steps[targetIndex]] = [steps[targetIndex], steps[index]];
    this.builderSteps.set(steps);
  }

  startCandidateDrag(candidate: WorkflowCandidateService, event: DragEvent): void {
    event.stopPropagation();
    this.writeDragPayload(event, { kind: 'candidate', serviceId: candidate.serviceId }, 'copy');
    this.activeDragKind.set('candidate');
  }

  startStepDrag(uid: string, event: DragEvent): void {
    event.stopPropagation();
    this.writeDragPayload(event, { kind: 'step', uid }, 'move');
    this.activeDragKind.set('step');
  }

  endWorkflowDrag(): void {
    this.clearWorkflowDragState();
  }

  onWorkflowDropZoneDragOver(event: DragEvent, dropIndex = this.builderSteps().length): void {
    if (!this.isWorkflowEditorOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.activeDragKind() === 'step' ? 'move' : 'copy';
    }
    this.activeDropIndex.set(this.normalizeDropIndex(dropIndex));
  }

  onWorkflowDropZoneDragLeave(event: DragEvent): void {
    const current = event.currentTarget as HTMLElement | null;
    const related = event.relatedTarget as Node | null;
    if (!current || (related && current.contains(related))) return;
    this.activeDropIndex.set(null);
  }

  dropWorkflowItem(event: DragEvent, dropIndex = this.builderSteps().length): void {
    if (!this.isWorkflowEditorOpen()) return;
    event.preventDefault();
    event.stopPropagation();

    const payload = this.readDragPayload(event);
    const targetIndex = this.normalizeDropIndex(dropIndex);

    if (payload?.kind === 'candidate') {
      const candidate = this.candidateOptions().find(
        (item) => item.serviceId === payload.serviceId,
      );
      if (candidate) this.insertCandidate(candidate, targetIndex);
    }

    if (payload?.kind === 'step') {
      this.moveDraggedStep(payload.uid, targetIndex);
    }

    this.clearWorkflowDragState();
  }
  saveWorkflow(): void {
    if (this.store.saving() || !this.validateForm()) return;
    if (this.store.panelMode() === 'create') this.createWorkflow();
    if (this.store.panelMode() === 'edit') this.updateWorkflow();
  }

  requestSetDefault(item: ServiceWorkflowListItem | ServiceWorkflowDetails): void {
    this.openConfirmation('set-default', item);
  }

  requestDeactivate(item: ServiceWorkflowListItem | ServiceWorkflowDetails): void {
    if (item.isDefault) {
      this.showMessage('error', this.translations().defaultCannotDeactivate);
      return;
    }
    this.openConfirmation('deactivate', item);
  }

  requestReactivate(item: ServiceWorkflowListItem | ServiceWorkflowDetails): void {
    this.openConfirmation('reactivate', item);
  }

  closeConfirmDialog(): void {
    if (!this.store.mutating()) this.store.confirmState.set(null);
  }

  confirmAction(): void {
    const state = this.store.confirmState();
    const scope = this.store.scope();
    if (!state || !scope || this.store.mutating()) return;

    this.store.mutating.set(true);
    const request =
      state.action === 'set-default'
        ? this.apiService.setDefaultWorkflow(
            scope.branchId,
            scope.leafServiceId,
            state.workflowId,
            state.rowVersion,
          )
        : state.action === 'deactivate'
          ? this.apiService.deactivateWorkflow(
              scope.branchId,
              scope.leafServiceId,
              state.workflowId,
              state.rowVersion,
            )
          : this.apiService.reactivateWorkflow(
              scope.branchId,
              scope.leafServiceId,
              state.workflowId,
              state.rowVersion,
            );

    request.pipe(finalize(() => this.store.mutating.set(false))).subscribe({
      next: (response) => {
        this.store.confirmState.set(null);
        this.applyMutationResponse(response, state.action);
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.loadWorkflows(this.store.page().currentPage || 1);
        this.loadStartOptions();
        if (this.store.selectedDetails()?.workflowId === state.workflowId) {
          this.loadDetails(state.workflowId, 'view');
        }
      },
      error: (error: HttpErrorResponse) => this.handleMutationError(error),
    });
  }

  clearMessage(): void {
    this.store.message.set(null);
  }

  private loadScopedData(pageNumber = 1): void {
    this.loadWorkflows(pageNumber);
    if (this.canViewCandidates()) this.loadCandidates();
    if (this.canViewStartOptions()) this.loadStartOptions();
  }

  private loadWorkflows(pageNumber = this.store.query().pageNumber): void {
    const scope = this.store.scope();
    if (!scope || this.store.listLoading()) return;
    this.store.updateQuery({ pageNumber });
    this.store.listLoading.set(true);
    this.apiService
      .getWorkflows(scope.branchId, scope.leafServiceId, this.store.query())
      .pipe(finalize(() => this.store.listLoading.set(false)))
      .subscribe({
        next: (response) => this.store.page.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadCandidates(): void {
    const scope = this.store.scope();
    if (!scope || !this.canViewCandidates() || this.store.candidatesLoading()) return;
    this.store.candidatesLoading.set(true);
    this.apiService
      .getCandidateServices(scope.branchId, this.store.candidateQuery())
      .pipe(finalize(() => this.store.candidatesLoading.set(false)))
      .subscribe({
        next: (response) => this.store.candidates.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadStartOptions(): void {
    const scope = this.store.scope();
    if (!scope || !this.canViewStartOptions() || this.store.startOptionsLoading()) return;
    this.store.startOptionsLoading.set(true);
    this.apiService
      .getWorkflowStartOptions(scope.branchId, scope.leafServiceId)
      .pipe(finalize(() => this.store.startOptionsLoading.set(false)))
      .subscribe({
        next: (response) => this.store.startOptions.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadDetails(workflowId: number, mode: 'view' | 'edit'): void {
    const scope = this.store.scope();
    if (!scope || workflowId <= 0 || this.store.detailsLoading()) return;
    this.store.openPanel(mode);
    this.store.detailsLoading.set(true);
    this.apiService
      .getWorkflowDetails(scope.branchId, scope.leafServiceId, workflowId)
      .pipe(finalize(() => this.store.detailsLoading.set(false)))
      .subscribe({
        next: (details) => {
          this.store.selectedDetails.set(details);
          if (mode === 'edit') this.populateForm(details);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private createWorkflow(): void {
    const scope = this.store.scope();
    if (!scope) return;
    this.store.saving.set(true);
    this.apiService
      .createWorkflow(scope.branchId, scope.leafServiceId, this.mapCreateRequest())
      .pipe(finalize(() => this.store.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.loadWorkflows(1);
          this.loadStartOptions();
          if (response.workflowId > 0 && this.canViewDetails()) {
            this.loadDetails(response.workflowId, 'view');
          } else {
            this.closePanel();
          }
        },
        error: (error: HttpErrorResponse) => this.handleMutationError(error),
      });
  }

  private updateWorkflow(): void {
    const scope = this.store.scope();
    const details = this.store.selectedDetails();
    if (!scope || !details) return;
    this.store.saving.set(true);
    this.apiService
      .updateWorkflow(scope.branchId, scope.leafServiceId, details.workflowId, {
        ...this.mapCreateRequest(),
        rowVersion: details.rowVersion,
      })
      .pipe(finalize(() => this.store.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.store.selectedDetails.set(response);
          this.replaceListItem(response);
          this.store.openPanel('view');
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.loadWorkflows(this.store.page().currentPage || 1);
          this.loadStartOptions();
        },
        error: (error: HttpErrorResponse) => this.handleMutationError(error),
      });
  }

  workflowName(item: ServiceWorkflowListItem | ServiceWorkflowDetails): string {
    return this.formatText(this.language() === 'ar' ? item.arabicName : item.englishName);
  }

  serviceName(item: ServiceTreeNode | WorkflowCandidateService | ServiceWorkflowStep): string {
    return this.formatText(this.language() === 'ar' ? item.arabicName : item.englishName);
  }

  parentName(item: WorkflowCandidateService | ServiceWorkflowStep): string {
    return this.formatText(
      this.language() === 'ar' ? item.parentArabicName : item.parentEnglishName,
    );
  }

  parentOptionName(item: WorkflowParentOption): string {
    return this.formatText(this.language() === 'ar' ? item.arabicName : item.englishName);
  }

  sortedSteps(item: ServiceWorkflowListItem | ServiceWorkflowDetails): readonly ServiceWorkflowStep[] {
    return [...item.steps].sort((a, b) => a.stepOrder - b.stepOrder);
  }

  formatDate(value: string | null): string {
    if (!value) return this.translations().notAvailable;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return this.translations().notAvailable;
    return new Intl.DateTimeFormat(this.language() === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  isActiveFilterValue(): BooleanSelectValue {
    const value = this.store.query().isActive;
    return value === null ? 'all' : value ? 'true' : 'false';
  }

  hasControlError(controlName: WorkflowFormControlName): boolean {
    const control = this.workflowForm.controls[controlName];
    return control.touched && control.invalid;
  }

  confirmTitle(action: WorkflowConfirmAction): string {
    if (action === 'set-default') return this.translations().confirmSetDefaultTitle;
    if (action === 'deactivate') return this.translations().confirmDeactivateTitle;
    return this.translations().confirmReactivateTitle;
  }

  confirmBody(action: WorkflowConfirmAction): string {
    if (action === 'set-default') return this.translations().confirmSetDefaultBody;
    if (action === 'deactivate') return this.translations().confirmDeactivateBody;
    return this.translations().confirmReactivateBody;
  }

  confirmActionLabel(action: WorkflowConfirmAction): string {
    if (action === 'set-default') return this.translations().setDefault;
    if (action === 'deactivate') return this.translations().deactivate;
    return this.translations().reactivate;
  }

  private openConfirmation(
    action: WorkflowConfirmAction,
    item: ServiceWorkflowListItem | ServiceWorkflowDetails,
  ): void {
    const allowed =
      (action === 'set-default' && this.canSetDefault() && item.isActive && !item.isDefault) ||
      (action === 'deactivate' && this.canDeactivate() && item.isActive && !item.isDefault) ||
      (action === 'reactivate' && this.canReactivate() && !item.isActive);
    if (!allowed) return;
    this.store.confirmState.set({
      action,
      workflowId: item.workflowId,
      rowVersion: item.rowVersion,
      workflowName: this.workflowName(item),
    });
  }

  private writeDragPayload(
    event: DragEvent,
    payload: WorkflowDragPayload,
    effectAllowed: 'copy' | 'move',
  ): void {
    if (!event.dataTransfer) return;
    const serialized = JSON.stringify(payload);
    event.dataTransfer.setData(WORKFLOW_DRAG_MIME_TYPE, serialized);
    event.dataTransfer.setData('text/plain', serialized);
    event.dataTransfer.effectAllowed = effectAllowed;
  }

  private readDragPayload(event: DragEvent): WorkflowDragPayload | null {
    const rawValue =
      event.dataTransfer?.getData(WORKFLOW_DRAG_MIME_TYPE) ||
      event.dataTransfer?.getData('text/plain') ||
      '';

    if (!rawValue) return null;

    try {
      const value = JSON.parse(rawValue) as Partial<WorkflowDragPayload>;
      if (value.kind === 'candidate') {
        const serviceId = Number(value.serviceId);
        if (Number.isInteger(serviceId) && serviceId > 0) {
          return { kind: 'candidate', serviceId };
        }
      }
      if (value.kind === 'step' && typeof value.uid === 'string' && value.uid.trim()) {
        return { kind: 'step', uid: value.uid };
      }
    } catch {
      return null;
    }

    return null;
  }

  private insertCandidate(candidate: WorkflowCandidateService, dropIndex: number): void {
    const replacingUid = this.replacingStepUid();
    if (replacingUid) {
      this.selectCandidate(candidate);
      return;
    }

    this.builderSteps.update((steps) => {
      const next = [...steps];
      next.splice(this.normalizeDropIndex(dropIndex), 0, {
        uid: this.createStepUid(),
        service: candidate,
      });
      return next;
    });
  }

  private moveDraggedStep(uid: string, dropIndex: number): void {
    this.builderSteps.update((steps) => {
      const next = [...steps];
      const sourceIndex = next.findIndex((step) => step.uid === uid);
      if (sourceIndex < 0) return steps;

      const [draggedStep] = next.splice(sourceIndex, 1);
      const targetIndex = sourceIndex < dropIndex ? dropIndex - 1 : dropIndex;
      next.splice(Math.min(Math.max(targetIndex, 0), next.length), 0, draggedStep);
      return next;
    });
  }

  private normalizeDropIndex(dropIndex: number): number {
    return Math.min(Math.max(dropIndex, 0), this.builderSteps().length);
  }

  private isWorkflowEditorOpen(): boolean {
    const mode = this.store.panelMode();
    return mode === 'create' || mode === 'edit';
  }

  private clearWorkflowDragState(): void {
    this.activeDragKind.set(null);
    this.activeDropIndex.set(null);
  }
  private populateForm(details: ServiceWorkflowDetails): void {
    this.workflowForm.reset({
      arabicName: details.arabicName,
      englishName: details.englishName,
    });
    this.builderSteps.set(
      this.sortedSteps(details).map((step) => ({
        uid: this.createStepUid(),
        service: this.candidateFromStep(step),
      })),
    );
    this.replacingStepUid.set(null);
  }

  private mapCreateRequest() {
    const value = this.workflowForm.getRawValue();
    return {
      arabicName: value.arabicName.trim(),
      englishName: value.englishName.trim(),
      steps: this.builderSteps().map((step, index) => ({
        serviceId: step.service.serviceId,
        stepOrder: index + 1,
      })),
    };
  }

  private validateForm(): boolean {
    this.formError.set(null);
    if (this.workflowForm.invalid) {
      this.workflowForm.markAllAsTouched();
      return false;
    }
    if (this.builderSteps().length < 2) {
      this.formError.set(this.translations().minimumSteps);
      return false;
    }
    return true;
  }

  private candidateFromStep(step: ServiceWorkflowStep): WorkflowCandidateService {
    return {
      serviceId: step.serviceId,
      parentServiceId: step.parentServiceId,
      parentArabicName: step.parentArabicName,
      parentEnglishName: step.parentEnglishName,
      arabicName: step.arabicName ?? this.translations().notAvailable,
      englishName: step.englishName ?? this.translations().notAvailable,
      isActive: step.isActive,
      isDeleted: step.isDeleted,
      effectiveIsActive: step.effectiveIsActive,
      isTicketIssuable: step.isTicketIssuable,
    };
  }

  private replaceListItem(details: ServiceWorkflowDetails): void {
    this.store.page.update((page) => ({
      ...page,
      data: page.data.map((item) => (item.workflowId === details.workflowId ? details : item)),
    }));
  }

  private applyMutationResponse(
    response: ServiceWorkflowDetails | ServiceWorkflowMutationResponse,
    action: WorkflowConfirmAction,
  ): void {
    this.store.page.update((page) => ({
      ...page,
      data: page.data.map((item) => {
        if (item.workflowId === response.workflowId) return { ...item, ...response };
        if (action === 'set-default' && item.isDefault) return { ...item, isDefault: false };
        return item;
      }),
    }));

    this.store.selectedDetails.update((details) => {
      if (!details) return null;
      if (details.workflowId === response.workflowId) return { ...details, ...response };
      if (action === 'set-default' && details.isDefault) return { ...details, isDefault: false };
      return details;
    });
  }

  private collectParentOptions(nodes: readonly ServiceTreeNode[]): readonly WorkflowParentOption[] {
    return nodes.flatMap((node) => [
      ...(node.hasChildren || node.children.length > 0
        ? [{ id: node.id, arabicName: node.arabicName, englishName: node.englishName }]
        : []),
      ...this.collectParentOptions(node.children),
    ]);
  }

  private findTreeNode(
    nodes: readonly ServiceTreeNode[],
    nodeId: number | null,
  ): ServiceTreeNode | null {
    if (!nodeId) return null;
    for (const node of nodes) {
      if (node.id === nodeId) return node;
      const nested = this.findTreeNode(node.children, nodeId);
      if (nested) return nested;
    }
    return null;
  }

  private branchLabel(branchId: number): string {
    const branch = this.store.branches().find((item) => item.branchId === branchId);
    const sessionBranch = this.authSessionService
      .currentSession()
      ?.branches.find((item) => item.branchId === branchId);
    const item = branch ?? sessionBranch;
    if (!item) return `#${branchId}`;
    return this.language() === 'ar' ? item.arabicName : item.englishName;
  }

  private handleMutationError(error: HttpErrorResponse): void {
    this.store.confirmState.set(null);
    if (this.containsErrorCode(error, 'ServiceWorkflows.Deactivate.DefaultWorkflow')) {
      this.showMessage('error', this.translations().defaultCannotDeactivate);
      this.loadWorkflows();
      return;
    }
    if (this.isConcurrencyError(error)) {
      this.showMessage('error', this.translations().concurrencyError);
      this.loadWorkflows();
      this.loadStartOptions();
      const selectedId = this.store.selectedDetails()?.workflowId;
      if (selectedId) this.loadDetails(selectedId, 'view');
      return;
    }
    this.handleApiError(error);
  }

  private handleApiError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }
    if (error.status === 403) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }
    this.showMessage('error', formatTechnicalAdminApiError(error, this.translations().fallbackError));
  }

  private isConcurrencyError(error: HttpErrorResponse): boolean {
    return this.containsErrorCode(error, 'concurrency') || this.containsErrorCode(error, 'rowversion');
  }

  private containsErrorCode(error: HttpErrorResponse, expected: string): boolean {
    const values: string[] = [];
    const visit = (value: unknown, depth = 0): void => {
      if (depth > 4 || value === null || value === undefined) return;
      if (typeof value === 'string') {
        values.push(value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => visit(item, depth + 1));
        return;
      }
      if (typeof value === 'object') {
        Object.values(value as Record<string, unknown>).forEach((item) => visit(item, depth + 1));
      }
    };
    visit(error.error);
    const normalizedExpected = expected.toLowerCase();
    return values.some((value) => value.toLowerCase().includes(normalizedExpected));
  }

  private showMessage(tone: 'success' | 'error' | 'info', text: string): void {
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.store.message.set({ tone, text });
    this.toastTimeoutId = setTimeout(() => {
      this.store.message.set(null);
      this.toastTimeoutId = null;
    }, 6000);
  }

  private branchName(branch: BranchListItem): string {
    return this.language() === 'ar' ? branch.arabicName : branch.englishName;
  }

  branchOptionName(branch: BranchListItem): string {
    return this.branchName(branch);
  }

  private createStepUid(): string {
    this.stepUid += 1;
    return `workflow-step-${this.stepUid}`;
  }

  private toBooleanFilter(value: string): boolean | null {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return null;
  }

  private readPositiveInt(value: string | null): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private formatText(value: string | null | undefined): string {
    return value?.trim() || this.translations().notAvailable;
  }
}
