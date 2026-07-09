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
  AbstractControl,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { SERVICE_WORKFLOW_TRANSLATIONS } from '../../i18n/service-workflow.translations';
import { ServiceSelectionOption } from '../../models/service-management.model';
import {
  ServiceRelatedWorkflow,
  ServiceWorkflowDetails,
  ServiceWorkflowListItem,
  ServiceWorkflowStep,
  WorkflowBuilderStep,
  WorkflowCandidateService,
  WorkflowConfirmState,
  WorkflowStartOptionItem,
  WorkflowStartOptions,
} from '../../models/service-workflow.model';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceWorkflowApiService } from '../../services/service-workflow-api.service';
import { ServiceWorkflowStore } from '../../store/service-workflow.store';

type BooleanSelectValue = 'all' | 'true' | 'false';
type WorkflowFormControlName = 'arabicName' | 'englishName';
type WorkflowSelectionMode =
  | { readonly kind: 'add' }
  | { readonly kind: 'replace'; readonly stepUid: string };

interface WorkflowSelectionLevel {
  readonly parentServiceId: number | null;
  readonly items: readonly ServiceSelectionOption[];
  readonly selectedServiceId: number | null;
  readonly loading: boolean;
  readonly error: string | null;
}

@Component({
  selector: 'app-service-workflows',
  standalone: true,
  imports: [ReactiveFormsModule],
  providers: [ServiceWorkflowStore],
  templateUrl: './service-workflows.component.html',
  styleUrls: [
    './service-workflows.component.css',
    './service-workflows-layout.component.css',
    './service-workflows-responsive.component.css',
    './service-workflows-visual-path.component.css',
    './service-workflows-suggestions.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceWorkflowsComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly apiService = inject(ServiceWorkflowApiService);
  private readonly serviceManagementApiService = inject(ServiceManagementApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);

  readonly store = inject(ServiceWorkflowStore);
  readonly translations = computed(() => SERVICE_WORKFLOW_TRANSLATIONS[this.i18nStore.language()]);
  readonly language = this.i18nStore.language;
  readonly direction = this.i18nStore.direction;

  readonly canViewAll = this.permissionService.canViewWorkflows;
  readonly canViewDetails = this.permissionService.canViewWorkflowDetails;
  readonly canCreate = this.permissionService.canCreateWorkflow;
  readonly canUpdate = this.permissionService.canUpdateWorkflow;
  readonly canDeactivate = this.permissionService.canDeactivateWorkflow;
  readonly canReactivate = this.permissionService.canReactivateWorkflow;
  readonly canViewCandidates = this.permissionService.canViewCandidateServices;
  readonly canViewServiceWorkflows = this.permissionService.canViewServiceWorkflows;
  readonly canUseServiceSelection = this.permissionService.canViewAll;

  readonly builderSteps = signal<readonly WorkflowBuilderStep[]>([]);
  readonly selectionLevels = signal<readonly WorkflowSelectionLevel[]>([]);
  readonly selectedSelectionPath = signal<readonly ServiceSelectionOption[]>([]);
  readonly selectionMode = signal<WorkflowSelectionMode>({ kind: 'add' });
  readonly selectionError = signal<string | null>(null);
  readonly workflowStartOptions = signal<WorkflowStartOptions | null>(null);
  readonly workflowStartOptionsLoading = signal(false);
  readonly filtersExpanded = signal(false);
  readonly formError = signal<string | null>(null);
  readonly workflows = computed(() => this.store.page().data);
  readonly hasWorkflows = computed(() => this.workflows().length > 0);
  readonly candidateOptions = computed(() => this.store.candidates().data);
  readonly suggestedWorkflows = computed(() => this.store.suggestedWorkflows());
  readonly hasSuggestedWorkflows = computed(() => this.suggestedWorkflows().length > 0);

  readonly workflowForm = this.formBuilder.group({
    arabicName: ['', [Validators.required, Validators.maxLength(100), this.notWhitespace]],
    englishName: ['', [Validators.required, Validators.maxLength(100), this.notWhitespace]],
  });

  readonly arabicNameControl = this.workflowForm.controls.arabicName;
  readonly englishNameControl = this.workflowForm.controls.englishName;

  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private candidateSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private stepUid = 0;
  private readonly pendingWorkflowStartServiceId = signal<number | null>(null);
  private readonly draggedSuggestedWorkflowStep = signal<ServiceWorkflowStep | null>(null);

  ngOnInit(): void {
    this.loadWorkflows();

    if (this.canViewCandidates()) {
      this.loadCandidates();
    }
  }

  ngOnDestroy(): void {
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }

    if (this.candidateSearchDebounceId) {
      clearTimeout(this.candidateSearchDebounceId);
    }

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
  }

  clearMessage(): void {
    this.store.message.set(null);
  }

  openCreate(): void {
    if (!this.canCreate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.store.selectedDetails.set(null);
    this.store.clearSuggestions();
    this.store.openPanel('create');
    this.formError.set(null);
    this.clearServiceSelection();
    this.workflowForm.reset({ arabicName: '', englishName: '' });
    this.builderSteps.set([]);
    this.initializeServiceSelection();
  }

  openView(item: ServiceWorkflowListItem): void {
    if (!this.canViewDetails()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.loadDetails(this.workflowId(item), 'view');
  }

  openEdit(item: ServiceWorkflowListItem | ServiceWorkflowDetails): void {
    if (!this.canUpdate() || !item.isActive) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.loadDetails(this.workflowId(item), 'edit');
  }

  closePanel(): void {
    this.store.closePanel();
    this.builderSteps.set([]);
    this.formError.set(null);
    this.clearServiceSelection();
    this.workflowForm.reset({ arabicName: '', englishName: '' });
  }

  saveWorkflow(): void {
    if (this.store.saving()) {
      return;
    }

    if (!this.isFormValid()) {
      this.workflowForm.markAllAsTouched();
      return;
    }

    if (this.store.panelMode() === 'create') {
      this.createWorkflow();
      return;
    }

    if (this.store.panelMode() === 'edit') {
      this.updateWorkflow();
    }
  }

  requestDeactivate(item: ServiceWorkflowListItem | ServiceWorkflowDetails): void {
    if (!this.canDeactivate() || !item.isActive) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.store.confirmState.set({
      action: 'deactivate',
      workflowId: this.workflowId(item),
      rowVersion: item.rowVersion,
      workflowName: this.workflowName(item),
    });
  }

  requestReactivate(item: ServiceWorkflowListItem | ServiceWorkflowDetails): void {
    if (!this.canReactivate() || item.isActive) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.store.confirmState.set({
      action: 'reactivate',
      workflowId: this.workflowId(item),
      rowVersion: item.rowVersion,
      workflowName: this.workflowName(item),
    });
  }

  closeConfirmDialog(): void {
    if (!this.store.mutating()) {
      this.store.confirmState.set(null);
    }
  }

  confirmAction(): void {
    const state = this.store.confirmState();

    if (!state || this.store.mutating()) {
      return;
    }

    this.store.mutating.set(true);
    const request =
      state.action === 'deactivate'
        ? this.apiService.deactivateWorkflow(state.workflowId, state.rowVersion)
        : this.apiService.reactivateWorkflow(state.workflowId, state.rowVersion);

    request.pipe(finalize(() => this.store.mutating.set(false))).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.store.confirmState.set(null);
        this.loadWorkflows(this.store.page().currentPage || 1);
        this.loadDetails(state.workflowId, 'view');
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
    });
  }

  updateSearch(event: Event): void {
    this.store.updateQuery({ searchText: this.readInputValue(event), pageNumber: 1 });

    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }

    this.searchDebounceId = setTimeout(() => this.loadWorkflows(), 350);
  }

  updateStatusFilter(event: Event): void {
    this.store.updateQuery({
      isActive: this.toBooleanFilter(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadWorkflows();
  }

  updateStartServiceFilter(event: Event): void {
    this.store.updateQuery({
      startServiceId: this.toOptionalNumber(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadWorkflows();
  }

  updatePageSize(event: Event): void {
    this.store.updateQuery({
      pageSize: this.normalizePageSize(Number(this.readInputValue(event))),
      pageNumber: 1,
    });
    this.loadWorkflows();
  }

  updateCandidateSearch(event: Event): void {
    this.store.updateCandidateQuery({ searchText: this.readInputValue(event), pageNumber: 1 });

    if (this.candidateSearchDebounceId) {
      clearTimeout(this.candidateSearchDebounceId);
    }

    this.candidateSearchDebounceId = setTimeout(() => this.loadCandidates(), 300);
  }

  updateCandidateToggle(key: 'includeInactive' | 'includeDeleted', event: Event): void {
    this.store.updateCandidateQuery({
      [key]: (event.target as HTMLInputElement).checked,
      pageNumber: 1,
    });
    this.loadCandidates();
  }

  previousPage(): void {
    const page = this.store.page();
    if (page.hasPreviousPage) {
      this.loadWorkflows(page.currentPage - 1);
    }
  }

  nextPage(): void {
    const page = this.store.page();
    if (page.hasNextPage) {
      this.loadWorkflows(page.currentPage + 1);
    }
  }

  previousCandidatesPage(): void {
    const page = this.store.candidates();
    if (page.hasPreviousPage) {
      this.store.updateCandidateQuery({ pageNumber: page.currentPage - 1 });
      this.loadCandidates();
    }
  }

  nextCandidatesPage(): void {
    const page = this.store.candidates();
    if (page.hasNextPage) {
      this.store.updateCandidateQuery({ pageNumber: page.currentPage + 1 });
      this.loadCandidates();
    }
  }

  refresh(): void {
    this.loadWorkflows(this.store.page().currentPage || 1);
    this.loadCandidates();
  }

  toggleFilters(): void {
    this.filtersExpanded.update((isExpanded) => !isExpanded);
  }

  isEditorMode(): boolean {
    const mode = this.store.panelMode();
    return mode === 'create' || mode === 'edit';
  }

  isReplacingStep(uid: string): boolean {
    const mode = this.selectionMode();
    return mode.kind === 'replace' && mode.stepUid === uid;
  }

  selectionModeLabel(): string {
    return this.selectionMode().kind === 'replace'
      ? this.translations().replaceStepMode
      : this.translations().addStepMode;
  }

  startAddStepSelection(): void {
    this.selectionMode.set({ kind: 'add' });
    this.initializeServiceSelection();
  }

  startReplaceStepSelection(uid: string): void {
    if (!this.builderSteps().some((step) => step.uid === uid)) {
      return;
    }

    this.selectionMode.set({ kind: 'replace', stepUid: uid });
    this.initializeServiceSelection();
  }

  cancelReplaceStepSelection(): void {
    this.startAddStepSelection();
  }

  selectSelectionOption(levelIndex: number, event: Event): void {
    const serviceId = this.toOptionalNumber(this.readInputValue(event));
    const level = this.selectionLevels()[levelIndex];

    if (!level) {
      return;
    }

    if (!serviceId) {
      this.selectedSelectionPath.set(this.selectedSelectionPath().slice(0, levelIndex));
      this.selectionLevels.update((levels) => [
        ...levels.slice(0, levelIndex),
        { ...level, selectedServiceId: null, error: null },
      ]);
      this.clearWorkflowStartOptions();
      this.selectionError.set(null);
      return;
    }

    const selectedOption = level.items.find((item) => item.serviceId === serviceId);

    if (!selectedOption) {
      this.selectionError.set(this.translations().selectedServiceNotFound);
      return;
    }

    const nextPath = [...this.selectedSelectionPath().slice(0, levelIndex), selectedOption];
    this.selectedSelectionPath.set(nextPath);
    this.selectionLevels.update((levels) => [
      ...levels.slice(0, levelIndex),
      { ...level, selectedServiceId: selectedOption.serviceId, error: null },
    ]);
    this.clearWorkflowStartOptions();
    this.selectionError.set(null);

    if (!this.isSelectionOptionSelectable(selectedOption)) {
      this.selectionError.set(this.translations().invalidStep);
      return;
    }

    if (selectedOption.canIssueTicket) {
      this.commitSelectionOptionAsStep(selectedOption, nextPath);
      return;
    }

    if (selectedOption.hasChildren) {
      this.loadSelectionLevel(selectedOption.serviceId, levelIndex + 1);
      return;
    }

    this.selectionError.set(this.translations().serviceCannotIssueTicket);
  }

  isSelectionOptionSelectable(option: ServiceSelectionOption): boolean {
    return option.effectiveIsActive !== false;
  }

  selectionOptionName(option: ServiceSelectionOption): string {
    return this.language() === 'ar'
      ? this.formatText(option.arabicName)
      : this.formatText(option.englishName);
  }

  workflowStartOptionName(workflow: WorkflowStartOptionItem): string {
    const localized = this.language() === 'ar' ? workflow.arabicName : workflow.englishName;
    const fallback = this.language() === 'ar' ? workflow.englishName : workflow.arabicName;
    return this.formatText(localized || fallback);
  }

  workflowStartOptionSteps(workflow: WorkflowStartOptionItem): readonly ServiceWorkflowStep[] {
    return workflow.steps;
  }

  workflowStartOptionStepCount(workflow: WorkflowStartOptionItem): number {
    return workflow.stepsCount || workflow.steps.length;
  }

  canDragWorkflowStep(step: ServiceWorkflowStep): boolean {
    return !this.isInvalidWorkflowStep(step);
  }

  canApplyWorkflowStartOption(workflow: WorkflowStartOptionItem): boolean {
    const steps = this.workflowStartOptionSteps(workflow);
    return steps.length > 0 && steps.every((step) => this.canDragWorkflowStep(step));
  }

  isAutoApplyWorkflow(workflow: WorkflowStartOptionItem, options: WorkflowStartOptions): boolean {
    return options.mode === 'AutoApply' && workflow.workflowId === options.autoApplyWorkflowId;
  }

  applyWorkflowStartOption(workflow: WorkflowStartOptionItem): void {
    const steps = this.workflowStartOptionSteps(workflow);

    if (steps.length === 0) {
      this.selectionError.set(this.translations().stepServiceRequired);
      return;
    }

    if (!this.canApplyWorkflowStartOption(workflow)) {
      this.selectionError.set(this.translations().invalidStep);
      return;
    }

    this.applyWorkflowSteps(steps);
    this.startAddStepSelection();
  }

  applyWorkflowStartOptionFromEvent(workflow: WorkflowStartOptionItem, event: Event): void {
    event.stopPropagation();
    this.applyWorkflowStartOption(workflow);
  }

  addStep(): void {
    this.startAddStepSelection();
  }

  removeStep(uid: string): void {
    this.store.selectedSuggestionWorkflowId.set(null);
    this.builderSteps.update((steps) => steps.filter((step) => step.uid !== uid));

    const mode = this.selectionMode();
    if (mode.kind === 'replace' && mode.stepUid === uid) {
      this.startAddStepSelection();
    }
  }

  moveStep(index: number, direction: -1 | 1): void {
    const nextIndex = index + direction;
    this.store.selectedSuggestionWorkflowId.set(null);
    const steps = [...this.builderSteps()];

    if (nextIndex < 0 || nextIndex >= steps.length) {
      return;
    }

    const current = steps[index];
    steps[index] = steps[nextIndex];
    steps[nextIndex] = current;
    this.builderSteps.set(steps);
  }

  selectStepService(uid: string, event: Event): void {
    const serviceId = this.toOptionalNumber(this.readInputValue(event));
    const service = serviceId ? this.findCandidate(serviceId) : null;

    this.store.selectedSuggestionWorkflowId.set(null);
    this.builderSteps.update((steps) =>
      steps.map((step) => (step.uid === uid ? { ...step, service } : step)),
    );

    if (service) {
      this.store.suggestionStepUid.set(uid);
      this.loadSuggestedWorkflows(service);
    } else {
      this.store.clearSuggestions();
    }
  }

  applySuggestedWorkflow(workflow: ServiceRelatedWorkflow): void {
    const orderedSteps = this.sortedSteps(workflow);

    if (orderedSteps.length === 0) {
      return;
    }

    const anchorStepUid = this.store.suggestionStepUid();
    const anchorServiceId = this.store.suggestionAnchorServiceId();
    const matchedIndex = orderedSteps.findIndex(
      (step) =>
        step.isMatchedService === true || (!!anchorServiceId && step.serviceId === anchorServiceId),
    );

    if (anchorStepUid && matchedIndex >= 0) {
      this.builderSteps.update((steps) => {
        const anchorIndex = steps.findIndex((step) => step.uid === anchorStepUid);

        if (anchorIndex < 0) {
          return orderedSteps.map((step) => ({
            uid: this.createStepUid(),
            service: this.candidateFromStep(step),
          }));
        }

        return [
          ...steps.slice(0, anchorIndex + 1),
          ...orderedSteps.slice(matchedIndex + 1).map((step) => ({
            uid: this.createStepUid(),
            service: this.candidateFromStep(step),
          })),
        ];
      });
    } else {
      this.builderSteps.set(
        orderedSteps.map((step) => ({
          uid: this.createStepUid(),
          service: this.candidateFromStep(step),
        })),
      );
    }

    this.store.selectedSuggestionWorkflowId.set(this.workflowId(workflow));
    this.store.suggestionStepUid.set(null);
  }

  startNewWorkflowFromService(service: WorkflowCandidateService): void {
    const anchorStepUid = this.store.suggestionStepUid();

    this.builderSteps.update((steps) => {
      const anchorIndex = steps.findIndex((step) => step.uid === anchorStepUid);
      const pinnedStep: WorkflowBuilderStep = {
        uid: anchorIndex >= 0 ? steps[anchorIndex].uid : this.createStepUid(),
        service,
      };

      if (anchorIndex < 0) {
        return [pinnedStep, this.createEmptyStep()];
      }

      return [...steps.slice(0, anchorIndex), pinnedStep, this.createEmptyStep()];
    });
    this.store.clearSuggestions();
  }

  shouldShowSuggestionsForStep(uid: string): boolean {
    return this.store.suggestionStepUid() === uid && this.store.suggestionAnchorService() !== null;
  }

  dragWorkflowStepStart(step: ServiceWorkflowStep, event: DragEvent): void {
    if (!this.canDragWorkflowStep(step)) {
      event.preventDefault();
      this.draggedSuggestedWorkflowStep.set(null);
      this.selectionError.set(this.translations().invalidStep);
      return;
    }

    this.draggedSuggestedWorkflowStep.set(step);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'copy';
      event.dataTransfer.setData('application/x-service-workflow-step', String(step.serviceId));
      event.dataTransfer.setData('text/plain', this.serviceName(step));
    }
  }

  dragWorkflowStepEnd(): void {
    this.draggedSuggestedWorkflowStep.set(null);
  }

  allowWorkflowStepDrop(event: DragEvent): void {
    const draggedStep = this.draggedSuggestedWorkflowStep();

    if (!draggedStep || this.isInvalidWorkflowStep(draggedStep)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  dropWorkflowStepAfter(uid: string, event: DragEvent): void {
    const draggedStep = this.draggedSuggestedWorkflowStep();

    if (!draggedStep) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.addSuggestedStepAfter(uid, draggedStep);
    this.dragWorkflowStepEnd();
  }

  dropWorkflowStepAtEnd(event: DragEvent): void {
    const draggedStep = this.draggedSuggestedWorkflowStep();

    if (!draggedStep) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    this.addSuggestedStepAfter('', draggedStep);
    this.dragWorkflowStepEnd();
  }

  addSuggestedStepAfter(uid: string, step: ServiceWorkflowStep): void {
    if (this.isInvalidWorkflowStep(step)) {
      this.selectionError.set(this.translations().invalidStep);
      return;
    }

    const service = this.candidateFromStep(step);

    this.store.selectedSuggestionWorkflowId.set(null);
    this.builderSteps.update((steps) => {
      const anchorIndex = steps.findIndex((builderStep) => builderStep.uid === uid);
      const insertIndex = anchorIndex >= 0 ? anchorIndex + 1 : steps.length;
      const nextSteps = [...steps];

      nextSteps.splice(insertIndex, 0, { uid: this.createStepUid(), service });
      return nextSteps;
    });
  }

  isInvalidWorkflowStep(step: ServiceWorkflowStep): boolean {
    return (
      step.isActive === false ||
      step.isDeleted === true ||
      step.effectiveIsActive === false ||
      step.isTicketIssuable === false
    );
  }

  isMatchedWorkflowStep(step: ServiceWorkflowStep): boolean {
    const anchorServiceId = this.store.suggestionAnchorServiceId();
    return (
      step.isMatchedService === true || (!!anchorServiceId && step.serviceId === anchorServiceId)
    );
  }

  isWorkflowStartingBeforeAnchor(workflow: ServiceRelatedWorkflow): boolean {
    const anchorServiceId = this.store.suggestionAnchorServiceId();

    if (!anchorServiceId) {
      return false;
    }

    const orderedSteps = this.sortedSteps(workflow);
    const matchedIndex = orderedSteps.findIndex(
      (step) => step.isMatchedService === true || step.serviceId === anchorServiceId,
    );

    return matchedIndex > 0;
  }

  hasControlError(controlName: WorkflowFormControlName): boolean {
    const control = this.workflowForm.controls[controlName];
    return control.touched && control.invalid;
  }

  isActiveFilterValue(): BooleanSelectValue {
    return this.toBooleanSelectValue(this.store.query().isActive);
  }

  workflowId(item: ServiceWorkflowListItem | ServiceWorkflowDetails): number {
    return item.id ?? item.workflowId ?? 0;
  }

  workflowName(item: ServiceWorkflowListItem | ServiceWorkflowDetails): string {
    const localized = this.language() === 'ar' ? item.arabicName : item.englishName;
    const fallback = this.language() === 'ar' ? item.englishName : item.arabicName;
    return this.formatText(localized || fallback);
  }

  serviceName(item: WorkflowCandidateService | ServiceWorkflowStep): string {
    const arabicName =
      'serviceArabicName' in item ? (item.serviceArabicName ?? item.arabicName) : item.arabicName;
    const englishName =
      'serviceEnglishName' in item
        ? (item.serviceEnglishName ?? item.englishName)
        : item.englishName;
    return this.language() === 'ar' ? this.formatText(arabicName) : this.formatText(englishName);
  }

  parentName(item: WorkflowCandidateService | ServiceWorkflowStep): string {
    const parentAliases = item as ServiceWorkflowStep & {
      readonly parentArabicName?: string | null;
      readonly parentEnglishName?: string | null;
    };
    const arabicName = item.parentServiceArabicName ?? parentAliases.parentArabicName;
    const englishName = item.parentServiceEnglishName ?? parentAliases.parentEnglishName;
    return this.language() === 'ar' ? this.formatText(arabicName) : this.formatText(englishName);
  }

  startServiceName(item: ServiceWorkflowListItem): string {
    const localized =
      this.language() === 'ar' ? item.startServiceArabicName : item.startServiceEnglishName;
    const fallback = this.previewSteps(item)[0];
    return localized && localized.trim().length > 0
      ? localized
      : fallback
        ? this.serviceName(fallback)
        : this.translations().notAvailable;
  }
  suggestionAnchorName(): string {
    const anchorService = this.store.suggestionAnchorService();
    return anchorService ? this.serviceName(anchorService) : this.translations().notAvailable;
  }

  suggestionEmptyMessage(): string {
    return this.translations().noSuggestedWorkflows.replace(
      '{{ serviceName }}',
      this.suggestionAnchorName(),
    );
  }

  workflowStepCount(item: ServiceWorkflowListItem | ServiceWorkflowDetails): number {
    return item.stepsCount ?? item.steps?.length ?? this.previewSteps(item).length;
  }

  candidateId(item: WorkflowCandidateService): number {
    return item.serviceId ?? item.id ?? 0;
  }

  stepServiceId(step: WorkflowBuilderStep): number {
    return step.service ? this.candidateId(step.service) : 0;
  }

  sortedSteps(details: ServiceWorkflowDetails): readonly ServiceWorkflowStep[] {
    return [...details.steps].sort((a, b) => a.stepOrder - b.stepOrder);
  }

  previewSteps(
    item: ServiceWorkflowListItem | ServiceWorkflowDetails,
  ): readonly ServiceWorkflowStep[] {
    const steps = [...(item.steps ?? [])].sort((a, b) => a.stepOrder - b.stepOrder);

    if (steps.length > 0) {
      return steps.slice(0, 5);
    }

    if (!item.startServiceId && !item.startServiceArabicName && !item.startServiceEnglishName) {
      return [];
    }

    return [
      {
        serviceId: item.startServiceId ?? 0,
        stepOrder: 1,
        serviceArabicName: item.startServiceArabicName ?? null,
        serviceEnglishName: item.startServiceEnglishName ?? null,
      },
    ];
  }

  formatDate(value: string | null | undefined): string {
    if (!value) {
      return this.translations().notAvailable;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return this.translations().notAvailable;
    }

    return new Intl.DateTimeFormat(this.language() === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  formatText(value: string | null | undefined): string {
    return value && value.trim().length > 0 ? value : this.translations().notAvailable;
  }

  readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private initializeServiceSelection(): void {
    this.clearWorkflowStartOptions();
    this.selectedSelectionPath.set([]);
    this.selectionError.set(null);
    this.store.clearSuggestions();

    if (!this.canUseServiceSelection()) {
      this.selectionLevels.set([]);
      this.selectionError.set(this.translations().selectionAccessDenied);
      return;
    }

    this.loadSelectionLevel(null, 0);
  }

  private clearServiceSelection(): void {
    this.selectionLevels.set([]);
    this.selectedSelectionPath.set([]);
    this.selectionMode.set({ kind: 'add' });
    this.clearWorkflowStartOptions();
    this.selectionError.set(null);
  }

  private loadSelectionLevel(parentServiceId: number | null, levelIndex: number): void {
    if (!this.canUseServiceSelection()) {
      this.selectionError.set(this.translations().selectionAccessDenied);
      return;
    }

    const loadingLevel: WorkflowSelectionLevel = {
      parentServiceId,
      items: [],
      selectedServiceId: null,
      loading: true,
      error: null,
    };

    this.selectionError.set(null);
    this.selectionLevels.update((levels) => [...levels.slice(0, levelIndex), loadingLevel]);

    this.serviceManagementApiService
      .getServiceSelectionOptions(parentServiceId ?? undefined)
      .pipe(finalize(() => this.setSelectionLevelLoading(levelIndex, false)))
      .subscribe({
        next: (response) => {
          const items = response.items ?? [];
          const error = items.length === 0 ? this.translations().noSelectionOptions : null;

          this.selectionLevels.update((levels) => [
            ...levels.slice(0, levelIndex),
            {
              parentServiceId: response.parentServiceId ?? parentServiceId,
              items,
              selectedServiceId: null,
              loading: false,
              error,
            },
          ]);
          this.selectionError.set(error);
        },
        error: (error: HttpErrorResponse) => this.handleSelectionApiError(error, levelIndex),
      });
  }

  private setSelectionLevelLoading(levelIndex: number, loading: boolean): void {
    this.selectionLevels.update((levels) => {
      const level = levels[levelIndex];

      if (!level) {
        return levels;
      }

      return levels.map((item, index) => (index === levelIndex ? { ...item, loading } : item));
    });
  }

  private handleSelectionApiError(error: HttpErrorResponse, levelIndex: number): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    const message = this.selectionErrorMessage(error);
    this.selectionError.set(message);
    this.showMessage('error', message);
    this.selectionLevels.update((levels) => {
      const level = levels[levelIndex];

      if (!level) {
        return levels;
      }

      return levels.map((item, index) =>
        index === levelIndex ? { ...item, loading: false, error: message } : item,
      );
    });
  }

  private selectionErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return this.translations().selectionAccessDenied;
    }

    if (error.status === 404) {
      return this.translations().selectedServiceNotFound;
    }

    return formatTechnicalAdminApiError(error, this.translations().fallbackError);
  }

  private commitSelectionOptionAsStep(
    option: ServiceSelectionOption,
    path: readonly ServiceSelectionOption[],
  ): void {
    const service = this.candidateFromSelectionOption(option, path);
    this.loadWorkflowStartOptionsForSelection(option.serviceId, service);
  }

  private loadWorkflowStartOptionsForSelection(
    serviceId: number,
    fallbackService: WorkflowCandidateService,
  ): void {
    this.pendingWorkflowStartServiceId.set(serviceId);
    this.workflowStartOptions.set(null);
    this.workflowStartOptionsLoading.set(true);
    this.selectionError.set(null);

    this.apiService
      .getWorkflowStartOptions(serviceId)
      .pipe(finalize(() => this.workflowStartOptionsLoading.set(false)))
      .subscribe({
        next: (options) => {
          if (this.pendingWorkflowStartServiceId() !== serviceId) {
            return;
          }

          const workflows = options.workflows.filter(
            (workflow) => workflow.isActive && workflow.steps.length > 0,
          );
          const nextOptions: WorkflowStartOptions = { ...options, workflows };

          if (options.mode === 'NoWorkflow' || workflows.length === 0) {
            this.commitServiceAsStep(fallbackService);
            return;
          }

          this.workflowStartOptions.set(nextOptions);
        },
        error: (error: HttpErrorResponse) => this.handleWorkflowStartOptionsError(error),
      });
  }

  private handleWorkflowStartOptionsError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    const message = this.selectionErrorMessage(error);
    this.clearWorkflowStartOptions();
    this.selectionError.set(message);
    this.showMessage('error', message);
  }

  private commitServiceAsStep(service: WorkflowCandidateService): void {
    const mode = this.selectionMode();
    this.formError.set(null);

    if (mode.kind === 'replace') {
      this.builderSteps.update((steps) =>
        steps.map((step) => (step.uid === mode.stepUid ? { ...step, service } : step)),
      );
    } else {
      this.builderSteps.update((steps) => [...steps, { uid: this.createStepUid(), service }]);
    }

    this.startAddStepSelection();
  }

  private applyWorkflowSteps(steps: readonly ServiceWorkflowStep[]): void {
    const builderSteps = steps.map((step) => ({
      uid: this.createStepUid(),
      service: this.candidateFromStep(step),
    }));
    this.formError.set(null);

    this.builderSteps.update((currentSteps) => [...currentSteps, ...builderSteps]);
  }

  private clearWorkflowStartOptions(): void {
    this.workflowStartOptions.set(null);
    this.workflowStartOptionsLoading.set(false);
    this.pendingWorkflowStartServiceId.set(null);
  }

  private candidateFromSelectionOption(
    option: ServiceSelectionOption,
    path: readonly ServiceSelectionOption[],
  ): WorkflowCandidateService {
    const parent = [...path]
      .slice(0, -1)
      .reverse()
      .find((item) => item.serviceId === option.parentServiceId);

    return {
      serviceId: option.serviceId,
      id: option.serviceId,
      arabicName: option.arabicName,
      englishName: option.englishName,
      parentServiceId: option.parentServiceId,
      parentServiceArabicName: parent?.arabicName ?? null,
      parentServiceEnglishName: parent?.englishName ?? null,
      isActive: option.isActive,
      isDeleted: false,
      isTicketIssuable: option.canIssueTicket,
      relatedWorkflows: [],
    };
  }

  private loadWorkflows(pageNumber = this.store.query().pageNumber): void {
    if (!this.canViewAll() || this.store.listLoading()) {
      return;
    }

    this.store.updateQuery({ pageNumber });
    this.store.listLoading.set(true);

    this.apiService
      .getWorkflows(this.store.query())
      .pipe(finalize(() => this.store.listLoading.set(false)))
      .subscribe({
        next: (response) => this.store.page.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadSuggestedWorkflows(service: WorkflowCandidateService): void {
    if (!this.canViewServiceWorkflows()) {
      this.store.clearSuggestions();
      return;
    }

    const serviceId = this.candidateId(service);

    if (serviceId <= 0) {
      this.store.clearSuggestions();
      return;
    }

    this.store.suggestionAnchorServiceId.set(serviceId);
    this.store.suggestionAnchorService.set(service);
    this.store.selectedSuggestionWorkflowId.set(null);
    this.store.suggestionsLoading.set(true);

    this.apiService
      .getServiceWorkflows(serviceId)
      .pipe(
        finalize(() => {
          if (this.store.suggestionAnchorServiceId() === serviceId) {
            this.store.suggestionsLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (this.store.suggestionAnchorServiceId() === serviceId) {
            this.store.suggestedWorkflows.set(response);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (this.store.suggestionAnchorServiceId() === serviceId) {
            this.handleApiError(error);
          }
        },
      });
  }

  private loadCandidates(): void {
    if (!this.canViewCandidates() || this.store.candidatesLoading()) {
      return;
    }

    this.store.candidatesLoading.set(true);

    this.apiService
      .getCandidateServices(this.store.candidateQuery())
      .pipe(finalize(() => this.store.candidatesLoading.set(false)))
      .subscribe({
        next: (response) => this.store.candidates.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private loadDetails(workflowId: number, mode: 'view' | 'edit'): void {
    if (workflowId <= 0 || this.store.detailsLoading()) {
      return;
    }

    this.store.openPanel(mode);
    this.store.detailsLoading.set(true);
    this.formError.set(null);

    this.apiService
      .getWorkflowDetails(workflowId)
      .pipe(finalize(() => this.store.detailsLoading.set(false)))
      .subscribe({
        next: (details) => {
          this.store.selectedDetails.set(details);
          if (mode === 'edit') {
            this.store.clearSuggestions();
            this.populateForm(details);
            this.initializeServiceSelection();
          }
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private createWorkflow(): void {
    this.store.saving.set(true);

    this.apiService
      .createWorkflow(this.mapCreateRequest())
      .pipe(finalize(() => this.store.saving.set(false)))
      .subscribe({
        next: (response) => {
          const id = response.id ?? response.workflowId ?? 0;
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.loadWorkflows(1);
          if (id > 0) {
            this.loadDetails(id, 'view');
          } else {
            this.closePanel();
          }
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private updateWorkflow(): void {
    const details = this.store.selectedDetails();

    if (!details) {
      return;
    }

    const id = this.workflowId(details);
    this.store.saving.set(true);

    this.apiService
      .updateWorkflow(id, { ...this.mapCreateRequest(), rowVersion: details.rowVersion })
      .pipe(finalize(() => this.store.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.loadWorkflows(this.store.page().currentPage || 1);
          this.loadDetails(id, 'view');
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
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
  }

  private mapCreateRequest() {
    const value = this.workflowForm.getRawValue();
    return {
      arabicName: value.arabicName.trim(),
      englishName: value.englishName.trim(),
      steps: this.builderSteps().map((step, index) => ({
        serviceId: step.service ? this.candidateId(step.service) : 0,
        stepOrder: index + 1,
      })),
    };
  }

  private isFormValid(): boolean {
    this.formError.set(null);

    if (this.workflowForm.invalid) {
      return false;
    }

    const steps = this.builderSteps();

    if (steps.length < 2) {
      this.formError.set(this.translations().minimumSteps);
      return false;
    }

    if (steps.some((step) => !step.service || this.candidateId(step.service) <= 0)) {
      this.formError.set(this.translations().stepServiceRequired);
      return false;
    }

    return true;
  }

  private createEmptyStep(): WorkflowBuilderStep {
    return { uid: this.createStepUid(), service: null };
  }

  private createStepUid(): string {
    this.stepUid += 1;
    return `workflow-step-${this.stepUid}`;
  }

  private findCandidate(serviceId: number): WorkflowCandidateService | null {
    return this.candidateOptions().find((item) => this.candidateId(item) === serviceId) ?? null;
  }

  private candidateFromStep(step: ServiceWorkflowStep): WorkflowCandidateService {
    return {
      serviceId: step.serviceId,
      arabicName: step.serviceArabicName ?? step.arabicName ?? this.translations().notAvailable,
      englishName: step.serviceEnglishName ?? step.englishName ?? this.translations().notAvailable,
      parentServiceId: step.parentServiceId ?? null,
      parentServiceArabicName: step.parentServiceArabicName ?? null,
      parentServiceEnglishName: step.parentServiceEnglishName ?? null,
      isActive: step.isActive ?? true,
      isDeleted: step.isDeleted ?? false,
      isTicketIssuable: step.isTicketIssuable ?? false,
      relatedWorkflows: [],
    };
  }

  private toBooleanFilter(value: string): boolean | null {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return null;
  }

  private toBooleanSelectValue(value: boolean | null): BooleanSelectValue {
    if (value === true) {
      return 'true';
    }

    if (value === false) {
      return 'false';
    }

    return 'all';
  }

  private toOptionalNumber(value: string): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private normalizePageSize(value: number): number {
    if (!Number.isFinite(value) || value <= 0) {
      return 10;
    }

    return Math.min(value, 100);
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

    if (this.isConcurrencyError(error)) {
      this.showMessage('error', this.translations().concurrencyError);
      return;
    }

    this.showMessage(
      'error',
      formatTechnicalAdminApiError(error, this.translations().fallbackError),
    );
  }

  private isConcurrencyError(error: HttpErrorResponse): boolean {
    const body = error.error;

    if (typeof body === 'string') {
      return body.toLowerCase().includes('concurrency');
    }

    if (!body || typeof body !== 'object') {
      return false;
    }

    return Object.values(body as Record<string, unknown>).some(
      (value) => typeof value === 'string' && value.toLowerCase().includes('concurrency'),
    );
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

  private notWhitespace(control: AbstractControl<string>): ValidationErrors | null {
    return control.value.trim().length > 0 ? null : { whitespace: true };
  }
}




