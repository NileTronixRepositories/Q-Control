import { NgTemplateOutlet } from '@angular/common';
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
import { finalize, Observable } from 'rxjs';

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { ServiceMediaManagerComponent } from '../../components/service-media-manager/service-media-manager.component';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import {
  CreateBranchServiceSubtreeResponse,
  CreateBranchServiceTreeNodeRequest,
  CreateBranchServiceTreeRequest,
  CreateBranchServiceTreeResponse,
} from '../../models/branch-services.model';
import {
  CreateServiceRequest,
  ServiceBooleanFilter,
  ServiceConfirmAction,
  ServiceConfirmState,
  ServiceDetails,
  ServiceListItem,
  ServiceManagementTab,
  ServiceParentOption,
  ServicePanelMode,
  ServiceScope,
  ServiceTreeNode,
  UpdateServiceRequest,
} from '../../models/service-management.model';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceManagementStore } from '../../store/service-management.store';
import {
  ServiceActionPermissions,
  canAssignServiceLeaf as canAssignServiceLeafRule,
  canPermanentDeleteService as canPermanentDeleteServiceRule,
  canRestoreService as canRestoreServiceRule,
  canSoftDeleteService as canSoftDeleteServiceRule,
  canUpdateService as canUpdateServiceRule,
} from '../../utils/service-action-rules.util';

type BooleanSelectValue = 'all' | 'true' | 'false';
type TicketIssuableValue = '' | 'true' | 'false';
type ServiceScopeFilterValue = 'all' | ServiceScope;
type TreeMutationAction = ServiceConfirmAction;
type ServiceNameControlName = 'arabicName' | 'englishName';
type FormControlName =
  | 'arabicName'
  | 'englishName'
  | 'arabicUserMessage'
  | 'englishUserMessage'
  | 'rangePrefix'
  | 'serviceCode'
  | 'isTicketIssuable'
  | 'noOfTicketCopies'
  | 'rangeStartNumber'
  | 'rangeEndNumber';

@Component({
  selector: 'app-service-management-services',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    ReactiveFormsModule,
    ServiceHierarchyTreeComponent,
    ServiceMediaManagerComponent,
    TechnicalAdminPageHeroComponent,
    NiletronixLoadingStateComponent,
  ],
  providers: [ServiceManagementStore],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css', './services-form-switches.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly apiService = inject(ServiceManagementApiService);
  private readonly branchServicesApiService = inject(BranchServicesApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);

  public readonly store = inject(ServiceManagementStore);
  public readonly canUpdateServiceDefinition = (
    service: ServiceListItem | ServiceDetails | ServiceTreeNode,
  ): boolean => canUpdateServiceRule(service, this.serviceActionPermissions());
  public readonly canSoftDeleteService = (
    service: ServiceListItem | ServiceDetails | ServiceTreeNode,
  ): boolean => canSoftDeleteServiceRule(service, this.serviceActionPermissions());
  public readonly canRestoreService = (
    service: ServiceListItem | ServiceDetails | ServiceTreeNode,
  ): boolean => canRestoreServiceRule(service, this.serviceActionPermissions());
  public readonly canPermanentDeleteService = (
    service: ServiceListItem | ServiceDetails | ServiceTreeNode,
  ): boolean => canPermanentDeleteServiceRule(service, this.serviceActionPermissions());
  public readonly canAssignBranchService = (node: ServiceTreeNode): boolean =>
    canAssignServiceLeafRule(node, this.serviceActionPermissions());
  public readonly translations = computed(
    () => SERVICE_MANAGEMENT_TRANSLATIONS[this.i18nStore.language()],
  );
  public readonly language = this.i18nStore.language;
  public readonly direction = this.i18nStore.direction;
  public readonly canViewAll = this.permissionService.canViewAll;
  public readonly canViewDetails = this.permissionService.canViewDetails;
  public readonly canCreate = this.permissionService.canCreate;
  public readonly canUpdate = this.permissionService.canUpdate;
  public readonly canDelete = this.permissionService.canDelete;
  public readonly canRestore = this.permissionService.canRestore;
  public readonly canDeletePermanent = this.permissionService.canDeletePermanent;
  public readonly canAssignBranchServices = this.permissionService.canAssignBranchServices;
  public readonly canCreateBranchServiceTree = this.permissionService.canCreateBranchServiceTree;
  public readonly isBranchAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'BranchAdmin',
  );
  public readonly activeBranchId = computed(
    () => this.authSessionService.currentSession()?.activeBranchId ?? null,
  );
  public readonly canUseBranchAssignment = computed(
    () => this.isBranchAdmin() && this.canAssignBranchServices() && this.activeBranchId() !== null,
  );
  public readonly canUseCatalog = computed(
    () => this.canViewAll() || this.canUseBranchAssignment(),
  );
  public readonly isTechnicalAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin',
  );
  public readonly canCreateGlobal = computed(() => this.isTechnicalAdmin() && this.canCreate());
  public readonly canCreateBranchScoped = computed(
    () => this.canUseBranchAssignment() && this.canCreateBranchServiceTree(),
  );
  public readonly canCreateBranchScopedChild = (node: ServiceTreeNode): boolean =>
    this.canCreateBranchScoped() &&
    !node.isDeleted &&
    (node.scope === 'Global' ||
      (node.scope === 'BranchScoped' && node.isOwnedByCurrentBranch && node.canEditDefinition));

  public readonly includeInactiveTree = signal(false);
  public readonly includeDeletedTree = signal(false);
  public readonly formError = signal<string | null>(null);
  public readonly reloadConflictServiceId = signal<number | null>(null);
  public readonly createParentLabel = computed(
    () => this.store.createParentName() ?? this.translations().treeRoot,
  );

  public readonly serviceForm = this.formBuilder.group(
    {
      parentServiceId: [0],
      arabicName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
          this.notWhitespace,
          (control: AbstractControl<string>) => this.nameConflictValidator('arabicName', control),
        ],
      ],
      englishName: [
        '',
        [
          Validators.required,
          Validators.maxLength(100),
          this.notWhitespace,
          (control: AbstractControl<string>) => this.nameConflictValidator('englishName', control),
        ],
      ],
      arabicUserMessage: ['', [Validators.maxLength(500)]],
      englishUserMessage: ['', [Validators.maxLength(500)]],
      isServiceCodeRequired: [false],
      serviceCode: [
        '',
        [
          Validators.maxLength(100),
          (control: AbstractControl<string>) => this.serviceCodeValidator(control),
        ],
      ],
      isTicketIssuable: ['' as TicketIssuableValue, [Validators.required]],
      isClientInputRequired: [false],
      hasReservation: [false],
      orderNo: [0, [Validators.required, Validators.min(0)]],
      priority: [0, [Validators.required, Validators.min(0)]],
      weight: [0, [Validators.required, Validators.min(0)]],
      rangePrefix: ['', [Validators.required, Validators.maxLength(10), this.notWhitespace]],
      rangeStartNumber: [1, [Validators.required, Validators.min(0)]],
      rangeEndNumber: [999, [Validators.required, Validators.min(0)]],
      waitingDuration: [0, [Validators.required, Validators.min(0)]],
      noOfTicketCopies: [1, [Validators.required, Validators.min(1)]],
    },
    { validators: [this.rangeValidator] },
  );

  public readonly arabicNameControl = this.serviceForm.controls.arabicName;
  public readonly englishNameControl = this.serviceForm.controls.englishName;
  public readonly arabicUserMessageControl = this.serviceForm.controls.arabicUserMessage;
  public readonly englishUserMessageControl = this.serviceForm.controls.englishUserMessage;
  public readonly serviceCodeControl = this.serviceForm.controls.serviceCode;
  public readonly rangePrefixControl = this.serviceForm.controls.rangePrefix;
  public readonly isTicketIssuableControl = this.serviceForm.controls.isTicketIssuable;
  public readonly noOfTicketCopiesControl = this.serviceForm.controls.noOfTicketCopies;
  public readonly rangeStartNumberControl = this.serviceForm.controls.rangeStartNumber;
  public readonly rangeEndNumberControl = this.serviceForm.controls.rangeEndNumber;

  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private panelRequestId = 0;
  private serviceCodeConflict = false;
  private nameConflictControl: ServiceNameControlName | null = null;
  private branchCreateParentNode: ServiceTreeNode | null = null;

  ngOnInit(): void {
    this.store.activeTab.set('tree');

    if (this.canViewAll()) {
      this.loadParentOptions();
    }

    this.loadTree();

    if (this.canUseBranchAssignment()) {
      this.loadAssignedBranchTree();
    }
  }

  ngOnDestroy(): void {
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
  }

  public clearMessage(): void {
    this.store.message.set(null);

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  public switchTab(tab: ServiceManagementTab): void {
    if (tab === this.store.activeTab()) {
      return;
    }

    this.store.activeTab.set(tab);
    this.store.confirmState.set(null);
    this.closePanel();

    if (tab === 'tree') {
      this.loadTree();
      return;
    }

    this.loadServices();
  }

  public updateSearch(event: Event): void {
    this.store.updateQuery({ searchText: this.readInputValue(event), pageNumber: 1 });

    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }

    this.searchDebounceId = setTimeout(() => this.loadServices(), 350);
  }

  public updateBooleanFilter(
    key: 'isActive' | 'isDeleted' | 'isTicketIssuable',
    event: Event,
  ): void {
    this.store.updateQuery({
      [key]: this.toBooleanFilter(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadServices();
  }

  public updateParentFilter(event: Event): void {
    this.store.updateQuery({
      parentServiceId: this.toOptionalNumber(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadServices();
  }

  public updatePageSize(event: Event): void {
    this.store.updateQuery({
      pageSize: this.normalizePageSize(Number(this.readInputValue(event))),
      pageNumber: 1,
    });
    this.loadServices();
  }

  public previousPage(): void {
    const page = this.store.servicePage();

    if (page.hasPreviousPage) {
      this.loadServices(page.currentPage - 1);
    }
  }

  public nextPage(): void {
    const page = this.store.servicePage();

    if (page.hasNextPage) {
      this.loadServices(page.currentPage + 1);
    }
  }

  public refresh(): void {
    this.loadTree();

    if (this.canViewAll()) {
      this.loadParentOptions();
    }

    if (this.canUseBranchAssignment()) {
      this.loadAssignedBranchTree();
    }
  }

  public openCreate(): void {
    this.openCreateRoot();
  }

  public openCreateRoot(): void {
    if (this.canCreateBranchScoped() && !this.canCreateGlobal()) {
      this.openCreateForParent(null, this.translations().treeRoot, null);
      return;
    }

    this.openCreateForParent(null, this.translations().treeRoot);
  }

  public openCreateChild(parent: ServiceTreeNode): void {
    if (this.canCreateBranchScopedChild(parent) && !this.canCreateGlobal()) {
      this.store.expandAssignedBranchNodes([parent.id]);
      this.openCreateForParent(parent.id, this.serviceName(parent), parent);
      this.store.selectTreeNode(parent.id);
      return;
    }

    this.store.expandTreeNode(parent.id);
    this.openCreateForParent(parent.id, this.serviceName(parent));
    this.store.selectTreeNode(parent.id);
  }

  public openView(serviceId: number): void {
    if (!this.canViewDetails()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.loadDetails(serviceId, 'view');
  }

  public openViewFromTree(node: ServiceTreeNode): void {
    this.openView(node.id);
  }

  public openEdit(serviceId: number): void {
    if (!this.canUpdate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.loadDetails(serviceId, 'edit');
  }

  public openEditFromTree(node: ServiceTreeNode): void {
    this.openEdit(node.id);
  }

  public selectTreeNode(node: ServiceTreeNode): void {
    this.store.selectTreeNode(node.id);

    if (this.canViewDetails()) {
      this.openView(node.id);
    }
  }

  public toggleAssignedBranchNode(node: ServiceTreeNode): void {
    if (node.children.length > 0) {
      this.store.toggleAssignedBranchNode(node.id);
    }
  }

  public selectAssignedBranchNode(node: ServiceTreeNode): void {
    this.store.selectTreeNode(node.id);
  }

  public startBranchAssignmentDrag(node: ServiceTreeNode): void {
    this.store.draggedBranchAssignmentNode.set(node);
  }

  public clearBranchAssignmentDrag(): void {
    this.store.draggedBranchAssignmentNode.set(null);
  }

  public dropBranchAssignment(serviceId: number): void {
    const draggedNode = this.store.draggedBranchAssignmentNode();
    const node =
      draggedNode?.id === serviceId
        ? draggedNode
        : this.findTreeNode(this.store.serviceTree(), serviceId);

    if (!node || !this.isAssignableBranchService(node)) {
      this.showMessage('error', this.translations().branchAssignmentInvalidLeaf);
      this.clearBranchAssignmentDrag();
      return;
    }

    if (node.isAssignedToCurrentBranch === true) {
      this.showMessage('info', this.translations().branchAssignmentAlreadyAssigned);
      this.clearBranchAssignmentDrag();
      return;
    }

    this.assignBranchService(node);
  }

  public closePanel(): void {
    this.panelRequestId += 1;
    this.store.closePanel();
    this.formError.set(null);
    this.reloadConflictServiceId.set(null);
    this.serviceCodeConflict = false;
    this.nameConflictControl = null;
    this.branchCreateParentNode = null;
    this.serviceForm.markAsPristine();
    this.serviceForm.enable({ emitEvent: false });
  }

  public saveService(): void {
    if (this.store.saving()) {
      return;
    }

    if (!this.isServiceFormValid()) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    if (this.store.panelMode() === 'create') {
      if (
        this.branchCreateParentNode !== null ||
        (this.canCreateBranchScoped() && !this.canCreateGlobal())
      ) {
        this.createBranchScopedService();
      } else {
        this.createService();
      }
      return;
    }

    if (this.store.panelMode() === 'edit') {
      this.updateService();
    }
  }

  public requestDelete(item: ServiceListItem | ServiceDetails): void {
    if (!this.canSoftDeleteService(item)) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.prepareLifecycleAction(item.id, 'delete');
  }

  public requestRestore(item: ServiceListItem | ServiceDetails): void {
    if (!this.canRestoreService(item)) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.prepareLifecycleAction(item.id, 'restore');
  }

  public requestPermanentDelete(item: ServiceListItem | ServiceDetails): void {
    if (!this.canPermanentDeleteService(item)) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.prepareLifecycleAction(item.id, 'permanentDelete');
  }

  public requestTreeDelete(node: ServiceTreeNode): void {
    if (!this.canSoftDeleteService(node)) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.prepareLifecycleAction(node.id, 'delete');
  }

  public requestTreeRestore(node: ServiceTreeNode): void {
    if (!this.canRestoreService(node)) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.prepareLifecycleAction(node.id, 'restore');
  }

  public requestTreePermanentDelete(node: ServiceTreeNode): void {
    if (!this.canPermanentDeleteService(node)) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.prepareLifecycleAction(node.id, 'permanentDelete');
  }

  public closeConfirmDialog(): void {
    if (!this.store.mutating()) {
      this.store.confirmState.set(null);
    }
  }

  public confirmAction(): void {
    const state = this.store.confirmState();

    if (!state || this.store.mutating()) {
      return;
    }

    if (state.action === 'delete') {
      this.deleteService(state);
      return;
    }

    if (state.action === 'restore') {
      this.restoreService(state);
      return;
    }

    this.permanentlyDeleteService(state);
  }

  public handleMediaMessage(message: {
    readonly tone: 'success' | 'error' | 'info';
    readonly text: string;
  }): void {
    this.showMessage(message.tone, message.text);
  }

  public handleMediaServiceChange(details: ServiceDetails): void {
    this.store.selectedDetails.set(details);
    this.store.selectTreeNode(details.id);
    this.loadServices(this.store.servicePage().currentPage || 1);
    this.loadTree();
  }

  public handleMediaChanged(): void {
    this.loadServices(this.store.servicePage().currentPage || 1);
    this.loadTree();
  }
  public updateTreeToggle(kind: 'inactive' | 'deleted', checked: boolean): void {
    if (kind === 'inactive') {
      this.includeInactiveTree.set(checked);
    } else {
      this.includeDeletedTree.set(checked);
    }

    this.loadTree();

    if (this.canUseBranchAssignment()) {
      this.loadAssignedBranchTree();
    }
  }

  public toggleTreeNode(node: ServiceTreeNode): void {
    if (node.children.length > 0) {
      this.store.toggleTreeNode(node.id);
    }
  }

  public statusClass(item: ServiceListItem | ServiceDetails | ServiceTreeNode): string {
    if (item.isDeleted) {
      return 'status-deleted';
    }

    if (!item.isActive) {
      return 'status-inactive';
    }

    return 'status-active';
  }

  public statusLabel(item: ServiceListItem | ServiceDetails | ServiceTreeNode): string {
    if (item.isDeleted) {
      return this.translations().deleted;
    }

    return item.isActive ? this.translations().active : this.translations().inactive;
  }

  public effectiveStatusLabel(item: ServiceListItem | ServiceDetails | ServiceTreeNode): string {
    return item.effectiveIsActive
      ? this.translations().active
      : this.translations().operationallyDisabled;
  }

  public serviceName(
    item: ServiceListItem | ServiceDetails | ServiceTreeNode | ServiceParentOption,
  ): string {
    return this.i18nStore.language() === 'ar' ? item.arabicName : item.englishName;
  }

  public parentName(item: ServiceListItem | ServiceDetails): string {
    const value =
      this.i18nStore.language() === 'ar' ? item.parentServiceNameAr : item.parentServiceNameEn;
    return this.formatText(value);
  }

  public displayBoolean(value: boolean): string {
    return value ? this.translations().yes : this.translations().no;
  }

  public formatText(value: string | null | undefined): string {
    return value && value.trim().length > 0 ? value : this.translations().notAvailable;
  }

  public logoUrl(value: string | null): string | null {
    return this.apiService.resolveMediaUrl(value);
  }

  public panelTitle(): string {
    if (this.store.panelMode() === 'create') {
      return this.translations().createTitle;
    }

    if (this.store.panelMode() === 'edit') {
      return this.translations().editTitle;
    }

    return this.translations().details;
  }

  public confirmTitle(state: ServiceConfirmState): string {
    if (state.action === 'permanentDelete') {
      return this.translations().permanentDeleteConfirmTitle;
    }

    if (state.action === 'restore') {
      return this.translations().restoreConfirmTitle;
    }

    return this.translations().deleteConfirmTitle;
  }

  public confirmBody(state: ServiceConfirmState): string {
    if (state.action === 'permanentDelete') {
      return this.translations().permanentDeleteConfirmBody;
    }

    if (state.action === 'restore') {
      return this.translations().restoreConfirmBody;
    }

    return this.translations().deleteConfirmBody;
  }

  public confirmButtonLabel(state: ServiceConfirmState): string {
    if (state.action === 'permanentDelete') {
      return this.translations().deletePermanently;
    }

    if (state.action === 'restore') {
      return this.translations().restore;
    }

    return this.translations().delete;
  }
  public hasControlError(controlName: FormControlName): boolean {
    const control = this.serviceForm.controls[controlName];
    return control.touched && control.invalid;
  }

  public hasRangeError(): boolean {
    return this.serviceForm.touched && this.serviceForm.hasError('rangeOrder');
  }

  public nameError(controlName: ServiceNameControlName): string {
    const control = this.serviceForm.controls[controlName];

    if (control.hasError('duplicateName')) {
      return controlName === 'arabicName'
        ? this.translations().duplicateArabicName
        : this.translations().duplicateEnglishName;
    }

    if (control.hasError('maxlength')) {
      return this.translations().maxLength100;
    }

    return this.translations().requiredField;
  }
  public serviceCodeError(): string {
    const control = this.serviceCodeControl;

    if (control.hasError('serviceCodeExists')) {
      return this.translations().serviceCodeAlreadyExists;
    }

    if (control.hasError('maxlength')) {
      return this.translations().serviceCodeMaxLength;
    }

    if (control.hasError('serviceCodeMustBeEmpty')) {
      return this.translations().serviceCodeMustBeEmpty;
    }

    return this.translations().serviceCodeRequiredError;
  }

  public onServiceCodeRequiredChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (!checked) {
      this.serviceCodeControl.setValue('', { emitEvent: false });
      this.serviceCodeControl.markAsPristine();
    }

    this.clearServiceCodeConflict();
    this.applyServiceCodeValidation();
  }

  public onServiceCodeInput(): void {
    this.clearServiceCodeConflict();
    this.applyServiceCodeValidation();
  }

  public onNameInput(controlName: ServiceNameControlName): void {
    if (this.nameConflictControl !== controlName) {
      return;
    }

    this.nameConflictControl = null;
    this.serviceForm.controls[controlName].updateValueAndValidity({ emitEvent: false });
  }

  public reloadLatestServiceDetails(): void {
    const serviceId = this.reloadConflictServiceId() ?? this.store.selectedDetails()?.id;

    if (!serviceId) {
      return;
    }

    this.reloadConflictServiceId.set(null);
    this.loadDetails(serviceId, 'edit');
  }

  public readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  public isActiveFilterValue(): BooleanSelectValue {
    return this.toBooleanSelectValue(this.store.listQuery().isActive);
  }

  public isDeletedFilterValue(): BooleanSelectValue {
    return this.toBooleanSelectValue(this.store.listQuery().isDeleted);
  }

  public isTicketFilterValue(): BooleanSelectValue {
    return this.toBooleanSelectValue(this.store.listQuery().isTicketIssuable);
  }

  public scopeFilterValue(): ServiceScopeFilterValue {
    return this.store.listQuery().scope ?? 'all';
  }

  public assignedFilterValue(): BooleanSelectValue {
    return this.toBooleanSelectValue(this.store.listQuery().isAssignedToCurrentBranch);
  }

  public updateScopeFilter(event: Event): void {
    const value = this.readInputValue(event);
    this.store.updateQuery({
      scope: value === 'Global' || value === 'BranchScoped' ? value : null,
      pageNumber: 1,
    });
    this.loadServices();
    this.loadTree();
  }

  public updateOwnerBranchFilter(event: Event): void {
    this.store.updateQuery({
      ownerBranchId: this.toOptionalNumber(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadServices();
    this.loadTree();
  }

  public updateAssignedFilter(event: Event): void {
    this.store.updateQuery({
      isAssignedToCurrentBranch: this.toBooleanFilter(this.readInputValue(event)),
      pageNumber: 1,
    });
    this.loadServices();
    this.loadTree();
  }

  public ownerBranchLabel(
    item: ServiceListItem | ServiceDetails | ServiceTreeNode | ServiceParentOption,
  ): string {
    const value =
      this.language() === 'ar' ? item.ownerBranchArabicName : item.ownerBranchEnglishName;
    return this.formatText(value);
  }

  public scopeLabel(scope: ServiceScope): string {
    return scope === 'Global'
      ? this.translations().globalScope
      : this.translations().branchScopedScope;
  }
  private openCreateForParent(
    parentServiceId: number | null,
    parentName: string,
    branchParentNode?: ServiceTreeNode | null,
  ): void {
    const isBranchScopedCreate = branchParentNode !== undefined;

    if (
      isBranchScopedCreate ? !this.canOpenBranchCreate(branchParentNode) : !this.canCreateGlobal()
    ) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.panelRequestId += 1;
    this.store.selectedDetails.set(null);
    this.branchCreateParentNode = branchParentNode ?? null;
    this.store.setCreateParentContext(parentServiceId, parentName);
    this.store.openPanel('create');
    this.formError.set(null);
    this.reloadConflictServiceId.set(null);
    this.serviceCodeConflict = false;
    this.nameConflictControl = null;
    if (!isBranchScopedCreate) {
      this.loadParentOptions();
    }

    this.serviceForm.enable({ emitEvent: false });
    this.serviceForm.reset({
      parentServiceId: parentServiceId ?? 0,
      arabicName: '',
      englishName: '',
      arabicUserMessage: '',
      englishUserMessage: '',
      isServiceCodeRequired: false,
      serviceCode: '',
      isTicketIssuable: '',
      isClientInputRequired: false,
      hasReservation: false,
      orderNo: 0,
      priority: 0,
      weight: 0,
      rangePrefix: '',
      rangeStartNumber: 1,
      rangeEndNumber: 999,
      waitingDuration: 0,
      noOfTicketCopies: 1,
    });
    this.serviceForm.controls.parentServiceId.disable({ emitEvent: false });
  }

  private loadServices(pageNumber = this.store.listQuery().pageNumber): void {
    if (!this.canViewAll() || this.store.listLoading()) {
      return;
    }

    this.store.updateQuery({ pageNumber });
    this.store.listLoading.set(true);

    this.apiService.getServices(this.store.listQuery()).subscribe({
      next: (response) => {
        this.store.servicePage.set(response);
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.store.listLoading.set(false),
    });
  }

  private loadTree(): void {
    if (!this.canUseCatalog() || this.store.treeLoading()) {
      return;
    }

    this.store.treeLoading.set(true);

    this.apiService
      .getServiceTree({
        includeInactive: this.includeInactiveTree(),
        includeDeleted: this.includeDeletedTree(),
        scope: this.store.listQuery().scope,
        ownerBranchId: this.store.listQuery().ownerBranchId,
        isAssignedToCurrentBranch: this.store.listQuery().isAssignedToCurrentBranch,
      })
      .subscribe({
        next: (response) => {
          this.store.serviceTree.set(response);
          const selectedId = this.store.selectedTreeServiceId();

          if (selectedId && !this.treeContains(response, selectedId)) {
            this.store.selectTreeNode(null);
          }
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.store.treeLoading.set(false),
      });
  }

  private loadAssignedBranchTree(expandServiceId?: number): void {
    const branchId = this.activeBranchId();

    if (!branchId || !this.canUseBranchAssignment() || this.store.assignedBranchTreeLoading()) {
      return;
    }

    this.store.assignedBranchTreeLoading.set(true);
    this.branchServicesApiService
      .getBranchServicesTree(branchId, {
        includeInactive: this.includeInactiveTree(),
        includeDeleted: this.includeDeletedTree(),
      })
      .pipe(finalize(() => this.store.assignedBranchTreeLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.store.assignedBranchServiceTree.set(response);

          if (expandServiceId) {
            this.expandAssignedPathFor(expandServiceId);
          }
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private assignBranchService(node: ServiceTreeNode): void {
    const branchId = this.activeBranchId();

    if (!branchId || !this.canUseBranchAssignment()) {
      this.showMessage('error', this.translations().branchAssignmentMissingBranch);
      this.clearBranchAssignmentDrag();
      return;
    }

    this.store.branchAssigning.set(true);
    this.branchServicesApiService
      .assignServices(branchId, { serviceIds: [node.id] })
      .pipe(finalize(() => this.store.branchAssigning.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage(
            response.createdAssignmentsCount > 0 ? 'success' : 'info',
            response.message || this.translations().fallbackSuccess,
          );
          this.clearBranchAssignmentDrag();
          this.loadTree();
          this.loadAssignedBranchTree(node.id);
        },
        error: (error: HttpErrorResponse) => {
          this.clearBranchAssignmentDrag();
          this.handleApiError(error);
        },
      });
  }
  private loadParentOptions(excludeServiceId?: number): void {
    if (!this.canViewAll()) {
      return;
    }

    this.store.parentsLoading.set(true);

    this.apiService.getAvailableParents({ excludeServiceId }).subscribe({
      next: (response) => this.store.parentOptions.set(response),
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.store.parentsLoading.set(false),
    });
  }

  private loadDetails(serviceId: number, mode: Extract<ServicePanelMode, 'view' | 'edit'>): void {
    const requestId = ++this.panelRequestId;

    this.store.openPanel(mode);
    this.store.selectedDetails.set(null);
    this.store.selectTreeNode(serviceId);
    this.store.clearCreateParentContext();
    this.store.detailsLoading.set(true);
    this.formError.set(null);

    this.apiService
      .getServiceDetails(serviceId)
      .pipe(finalize(() => this.store.detailsLoading.set(false)))
      .subscribe({
        next: (response) => {
          if (requestId !== this.panelRequestId || this.store.panelMode() !== mode) {
            return;
          }

          this.store.selectedDetails.set(response);
          this.store.selectTreeNode(response.id);

          if (mode === 'edit') {
            if (response.isDeleted || !response.canEditDefinition) {
              this.showMessage('error', this.translations().noPermissionHint);
              this.closePanel();
              return;
            }

            this.loadParentOptions(response.id);
            this.populateForm(response);
          }
        },
        error: (error: HttpErrorResponse) => {
          if (requestId === this.panelRequestId) {
            this.handleApiError(error);
            this.closePanel();
          }
        },
      });
  }

  private prepareLifecycleAction(serviceId: number, action: TreeMutationAction): void {
    if (this.store.detailsLoading()) {
      return;
    }

    this.store.detailsLoading.set(true);

    this.apiService
      .getServiceDetails(serviceId)
      .pipe(finalize(() => this.store.detailsLoading.set(false)))
      .subscribe({
        next: (details) => {
          this.store.selectTreeNode(details.id);
          this.openLifecycleConfirm(details, action);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private openLifecycleConfirm(details: ServiceDetails, action: TreeMutationAction): void {
    const canUseAction =
      action === 'delete'
        ? this.canSoftDeleteService(details)
        : action === 'restore'
          ? this.canRestoreService(details)
          : this.canPermanentDeleteService(details);

    if (!canUseAction) {
      this.showMessage('error', this.translations().noPermissionHint);
      this.loadTree();
      return;
    }

    this.store.confirmState.set({
      action,
      serviceId: details.id,
      rowVersion: details.rowVersion,
      serviceName: this.serviceName(details),
      hasChildren: details.hasChildren,
    });
  }
  private createService(): void {
    const parentServiceId = this.serviceForm.getRawValue().parentServiceId;
    this.store.saving.set(true);

    this.apiService
      .createService(this.mapCreateRequest())
      .pipe(finalize(() => this.store.saving.set(false)))
      .subscribe({
        next: (response) => {
          if (parentServiceId > 0) {
            this.store.expandTreeNode(parentServiceId);
          }

          this.store.selectTreeNode(response.id);
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.closePanel();
          this.loadServices(1);
          this.loadParentOptions();
          this.loadTree();
          this.loadDetails(response.id, 'view');
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private createBranchScopedService(): void {
    const branchId = this.activeBranchId();
    const parent = this.branchCreateParentNode;

    if (!branchId || !this.canOpenBranchCreate(parent)) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    const request$: Observable<
      CreateBranchServiceTreeResponse | CreateBranchServiceSubtreeResponse
    > = parent
      ? this.branchServicesApiService.createBranchServiceSubtree(
          branchId,
          parent.id,
          this.mapBranchCreateRequest(),
        )
      : this.branchServicesApiService.createBranchServiceTree(
          branchId,
          this.mapBranchCreateRequest(),
        );

    this.store.saving.set(true);
    request$.pipe(finalize(() => this.store.saving.set(false))).subscribe({
      next: (response) => {
        if (parent) {
          this.store.expandAssignedBranchNodes([parent.id]);
        }

        this.store.selectTreeNode(response.root.id);
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.closePanel();
        this.loadTree();
        this.loadAssignedBranchTree(response.root.id);
        this.loadDetails(response.root.id, 'view');
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
    });
  }
  private updateService(): void {
    const details = this.store.selectedDetails();

    if (!details) {
      return;
    }

    this.store.saving.set(true);

    this.apiService
      .updateService(details.id, this.mapUpdateRequest(details.rowVersion))
      .pipe(finalize(() => this.store.saving.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.loadServices(this.store.servicePage().currentPage || 1);
          this.loadParentOptions();
          this.loadTree();
          this.loadDetails(details.id, 'view');
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private deleteService(state: ServiceConfirmState): void {
    this.store.mutating.set(true);

    this.apiService
      .deleteService(state.serviceId, state.rowVersion)
      .pipe(finalize(() => this.store.mutating.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.afterMutation(state.serviceId);
          this.store.confirmState.set(null);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private restoreService(state: ServiceConfirmState): void {
    this.store.mutating.set(true);

    this.apiService
      .restoreService(state.serviceId, state.rowVersion)
      .pipe(finalize(() => this.store.mutating.set(false)))
      .subscribe({
        next: (response) => {
          const message = response.effectiveIsActive
            ? response.message || this.translations().fallbackSuccess
            : this.translations().restoredButDisabled;
          this.showMessage(response.effectiveIsActive ? 'success' : 'info', message);
          this.afterMutation(state.serviceId);
          this.store.confirmState.set(null);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private permanentlyDeleteService(state: ServiceConfirmState): void {
    this.store.mutating.set(true);

    this.apiService
      .permanentlyDeleteService(state.serviceId, state.rowVersion)
      .pipe(finalize(() => this.store.mutating.set(false)))
      .subscribe({
        next: (response) => {
          this.showMessage('success', response.message || this.translations().fallbackSuccess);
          this.afterMutation(state.serviceId, true);
          this.store.confirmState.set(null);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private afterMutation(serviceId: number, permanentlyDeleted = false): void {
    this.loadServices(this.store.servicePage().currentPage || 1);
    this.loadParentOptions();
    this.loadTree();

    if (this.canUseBranchAssignment()) {
      this.loadAssignedBranchTree();
    }

    if (this.store.selectedDetails()?.id === serviceId) {
      this.closePanel();
    }

    if (permanentlyDeleted && this.store.selectedTreeServiceId() === serviceId) {
      this.store.selectTreeNode(null);
    }
  }

  private serviceActionPermissions(): ServiceActionPermissions {
    return {
      canAssignBranchServices: this.canAssignBranchServices(),
      canUpdate: this.canUpdate(),
      canDelete: this.canDelete(),
      canRestore: this.canRestore(),
      canDeletePermanent: this.canDeletePermanent(),
    };
  }

  private canOpenBranchCreate(parent: ServiceTreeNode | null): boolean {
    return parent ? this.canCreateBranchScopedChild(parent) : this.canCreateBranchScoped();
  }

  private populateForm(details: ServiceDetails): void {
    this.serviceCodeConflict = false;
    this.nameConflictControl = null;
    this.reloadConflictServiceId.set(null);
    this.serviceForm.enable({ emitEvent: false });
    this.serviceForm.reset({
      parentServiceId: details.parentServiceId ?? 0,
      arabicName: details.arabicName,
      englishName: details.englishName,
      arabicUserMessage: details.arabicUserMessage ?? '',
      englishUserMessage: details.englishUserMessage ?? '',
      isServiceCodeRequired: details.isServiceCodeRequired,
      serviceCode: details.serviceCode ?? '',
      isTicketIssuable: details.isTicketIssuable ? 'true' : 'false',
      isClientInputRequired: details.isClientInputRequired,
      hasReservation: details.hasReservation,
      orderNo: details.orderNo,
      priority: details.priority,
      weight: details.weight,
      rangePrefix: details.rangePrefix,
      rangeStartNumber: details.rangeStartNumber,
      rangeEndNumber: details.rangeEndNumber,
      waitingDuration: details.waitingDuration,
      noOfTicketCopies: details.noOfTicketCopies,
    });
  }

  private isServiceFormValid(): boolean {
    this.formError.set(null);

    this.applyServiceCodeValidation();

    if (this.serviceForm.invalid) {
      return false;
    }

    const details = this.store.selectedDetails();
    const value = this.serviceForm.getRawValue();

    if (details?.hasChildren && value.isTicketIssuable === 'true') {
      this.formError.set(this.translations().childTicketDisabled);
      return false;
    }

    return true;
  }

  private mapCreateRequest(): CreateServiceRequest {
    return this.mapMutationRequest();
  }

  private mapUpdateRequest(rowVersion: string): UpdateServiceRequest {
    return {
      ...this.mapMutationRequest(),
      rowVersion,
    };
  }

  private mapBranchCreateRequest(): CreateBranchServiceTreeRequest {
    return {
      root: this.mapBranchCreateNodeRequest(),
    };
  }

  private mapBranchCreateNodeRequest(): CreateBranchServiceTreeNodeRequest {
    const value = this.serviceForm.getRawValue();
    const isTicketIssuable = value.isTicketIssuable === 'true';

    return {
      arabicName: value.arabicName.trim(),
      englishName: value.englishName.trim(),
      arabicUserMessage: this.toOptionalString(value.arabicUserMessage),
      englishUserMessage: this.toOptionalString(value.englishUserMessage),
      serviceCode: value.isServiceCodeRequired ? this.toOptionalString(value.serviceCode) : null,
      isServiceCodeRequired: value.isServiceCodeRequired,
      isTicketIssuable,
      isClientInputRequired: value.isClientInputRequired,
      hasReservation: value.hasReservation,
      orderNo: Number(value.orderNo),
      priority: Number(value.priority),
      rangePrefix: isTicketIssuable ? this.toOptionalString(value.rangePrefix) : null,
      rangeStartNumber: isTicketIssuable ? Number(value.rangeStartNumber) : null,
      rangeEndNumber: isTicketIssuable ? Number(value.rangeEndNumber) : null,
      waitingDuration: isTicketIssuable ? Number(value.waitingDuration) : null,
      noOfTicketCopies: isTicketIssuable ? Number(value.noOfTicketCopies) : null,
      children: [],
    };
  }
  private mapMutationRequest(): CreateServiceRequest {
    const value = this.serviceForm.getRawValue();
    const isTicketIssuable = value.isTicketIssuable === 'true';

    return {
      parentServiceId: value.parentServiceId > 0 ? Number(value.parentServiceId) : null,
      arabicName: value.arabicName.trim(),
      englishName: value.englishName.trim(),
      arabicUserMessage: this.toOptionalString(value.arabicUserMessage),
      englishUserMessage: this.toOptionalString(value.englishUserMessage),
      serviceCode: value.isServiceCodeRequired ? this.toOptionalString(value.serviceCode) : null,
      isServiceCodeRequired: value.isServiceCodeRequired,
      isTicketIssuable,
      isClientInputRequired: value.isClientInputRequired,
      hasReservation: value.hasReservation,
      orderNo: Number(value.orderNo),
      priority: Number(value.priority),
      weight: Number(value.weight),
      rangePrefix: isTicketIssuable ? this.toOptionalString(value.rangePrefix) : null,
      rangeStartNumber: isTicketIssuable ? Number(value.rangeStartNumber) : null,
      rangeEndNumber: isTicketIssuable ? Number(value.rangeEndNumber) : null,
      waitingDuration: isTicketIssuable ? Number(value.waitingDuration) : null,
      noOfTicketCopies: isTicketIssuable ? Number(value.noOfTicketCopies) : null,
    };
  }

  private toBooleanFilter(value: string): ServiceBooleanFilter {
    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return null;
  }

  private toBooleanSelectValue(value: ServiceBooleanFilter): BooleanSelectValue {
    if (value === true) {
      return 'true';
    }

    if (value === false) {
      return 'false';
    }

    return 'all';
  }

  private toOptionalString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
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

  private treeContains(nodes: readonly ServiceTreeNode[], serviceId: number): boolean {
    return nodes.some(
      (node) => node.id === serviceId || this.treeContains(node.children, serviceId),
    );
  }

  private findTreeNode(
    nodes: readonly ServiceTreeNode[],
    serviceId: number,
  ): ServiceTreeNode | null {
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

  private isAssignableBranchService(node: ServiceTreeNode): boolean {
    return this.canAssignBranchService(node);
  }

  private expandAssignedPathFor(serviceId: number): void {
    const path = this.findTreePath(this.store.assignedBranchServiceTree(), serviceId);

    if (path.length > 1) {
      this.store.expandAssignedBranchNodes(path.slice(0, -1));
    }
  }

  private findTreePath(
    nodes: readonly ServiceTreeNode[],
    serviceId: number,
    currentPath: readonly number[] = [],
  ): readonly number[] {
    for (const node of nodes) {
      const nextPath = [...currentPath, node.id];

      if (node.id === serviceId) {
        return nextPath;
      }

      const childPath = this.findTreePath(node.children, serviceId, nextPath);

      if (childPath.length > 0) {
        return childPath;
      }
    }

    return [];
  }

  private handleApiError(error: HttpErrorResponse): void {
    this.reloadConflictServiceId.set(null);
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    if (error.status === 403) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    if (this.containsErrorCode(error, 'DuplicateArabicName')) {
      this.markNameConflict('arabicName', this.translations().duplicateArabicName);
      return;
    }

    if (this.containsErrorCode(error, 'DuplicateEnglishName')) {
      this.markNameConflict('englishName', this.translations().duplicateEnglishName);
      return;
    }

    if (this.containsErrorCode(error, 'ServiceCodeAlreadyExists')) {
      this.serviceCodeConflict = true;
      this.serviceCodeControl.updateValueAndValidity({ emitEvent: false });
      this.serviceCodeControl.markAsTouched();
      this.formError.set(this.translations().serviceCodeAlreadyExists);
      this.showMessage('error', this.translations().serviceCodeAlreadyExists);
      return;
    }

    if (this.isConcurrencyError(error)) {
      const serviceId =
        this.store.panelMode() === 'edit' ? (this.store.selectedDetails()?.id ?? null) : null;
      this.reloadConflictServiceId.set(serviceId);
      this.formError.set(this.translations().concurrencyError);
      this.showMessage('error', this.translations().concurrencyError);
      return;
    }

    if (error.status === 409) {
      const message = formatTechnicalAdminApiError(error, this.translations().fallbackError);
      this.formError.set(message);
      this.showMessage('error', message);
      return;
    }

    this.showMessage(
      'error',
      formatTechnicalAdminApiError(error, this.translations().fallbackError),
    );
  }

  private isConcurrencyError(error: HttpErrorResponse): boolean {
    return (
      this.containsErrorCode(error, 'concurrency') || this.containsErrorCode(error, 'rowversion')
    );
  }

  private containsErrorCode(error: HttpErrorResponse, expected: string): boolean {
    const body = typeof error.error === 'string' ? error.error : JSON.stringify(error.error ?? '');
    return body.toLowerCase().includes(expected.toLowerCase());
  }

  private applyServiceCodeValidation(): void {
    this.serviceCodeControl.updateValueAndValidity({ emitEvent: false });
  }

  private clearServiceCodeConflict(): void {
    if (!this.serviceCodeConflict) {
      return;
    }

    this.serviceCodeConflict = false;
    this.serviceCodeControl.updateValueAndValidity({ emitEvent: false });
  }

  private markNameConflict(controlName: ServiceNameControlName, message: string): void {
    this.nameConflictControl = controlName;
    this.serviceForm.controls[controlName].updateValueAndValidity({ emitEvent: false });
    this.serviceForm.controls[controlName].markAsTouched();
    this.formError.set(message);
    this.showMessage('error', message);
  }

  private nameConflictValidator(
    controlName: ServiceNameControlName,
    _control: AbstractControl<string>,
  ): ValidationErrors | null {
    return this.nameConflictControl === controlName ? { duplicateName: true } : null;
  }
  private serviceCodeValidator(control: AbstractControl<string>): ValidationErrors | null {
    const errors: ValidationErrors = {};
    const normalizedCode = control.value.trim();

    if (this.serviceCodeConflict) {
      errors['serviceCodeExists'] = true;
    }

    if (this.serviceForm?.controls.isServiceCodeRequired.value) {
      if (!normalizedCode) {
        errors['serviceCodeRequired'] = true;
      }
    } else if (normalizedCode) {
      errors['serviceCodeMustBeEmpty'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
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

  private rangeValidator(control: AbstractControl): ValidationErrors | null {
    const start = Number(control.get('rangeStartNumber')?.value);
    const end = Number(control.get('rangeEndNumber')?.value);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return null;
    }

    return end >= start ? null : { rangeOrder: true };
  }
}
