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

import { AppLanguage } from '../../../../shared/models/app-language.model';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { DisplayManagementApiService } from '../../services/display-management-api.service';
import { DisplayPermissionService } from '../../services/display-permission.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../utils/api-error-message.util';
import {
  CreateDisplayRequest,
  CreateDisplayResponse,
  GetDisplaysParams,
  PaginationResponse,
  PermanentDeleteDisplayResponse,
  DisplayDetailsResponse,
  DisplayListItemResponse,
  UpdateDisplayRequest,
  UpdateDisplayResponse,
} from '../../models/display-management.model';
import { BranchListItem } from '../../models/branch-management.model';

type DisplayTab = 'active' | 'deleted';
type DisplayPanelMode = 'closed' | 'create' | 'edit' | 'view';
type DeletedDisplayListItemResponse = DisplayListItemResponse;
type MessageTone = 'success' | 'error' | 'info';
type DisplayDeleteAction = 'deactivate' | 'reactivate' | 'permanent';

interface UiMessage {
  readonly tone: MessageTone;
  readonly text: string;
}

interface DisplayTranslations {
  readonly title: string;
  readonly description: string;
  readonly activeTab: string;
  readonly deletedTab: string;
  readonly addDisplay: string;
  readonly searchPlaceholder: string;
  readonly branchFilter: string;
  readonly allBranches: string;
  readonly pageSize: string;
  readonly loading: string;
  readonly noItems: string;
  readonly noItemsWithFilter: string;
  readonly totalItems: string;
  readonly previous: string;
  readonly next: string;
  readonly displayNumber: string;
  readonly typeLabel: string;
  readonly ipAddress: string;
  readonly serialNumber: string;
  readonly branch: string;
  readonly deletedOn: string;
  readonly actions: string;
  readonly view: string;
  readonly edit: string;
  readonly delete: string;
  readonly restore: string;
  readonly permanentDelete: string;
  readonly createdOn: string;
  readonly modifiedOn: string;
  readonly details: string;
  readonly displayDetails: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly close: string;
  readonly cancel: string;
  readonly save: string;
  readonly requiredField: string;
  readonly maxLength20: string;
  readonly maxLength45: string;
  readonly maxLength100: string;
  readonly invalidIp: string;
  readonly selectBranch: string;
  readonly refresh: string;
  readonly loadingBranches: string;
  readonly deleteConfirm: string;
  readonly restoreConfirm: string;
  readonly permanentDeleteConfirm: string;
  readonly deleteConfirmBody: string;
  readonly restoreConfirmBody: string;
  readonly permanentDeleteConfirmBody: string;
  readonly fallbackSuccess: string;
  readonly fallbackError: string;
  readonly accessDenied: string;
  readonly noPermissionHint: string;
  readonly traceIdLabel: string;
  readonly notAvailable: string;
}

interface DisplayConfirmState {
  readonly kind: DisplayDeleteAction;
  readonly displayId: number;
  readonly displayNumber: string;
  readonly rowVersion: string;
}

interface BranchOption {
  readonly id: number;
  readonly arabicName: string | null;
  readonly englishName: string | null;
}

const DISPLAY_TRANSLATIONS: Record<AppLanguage, DisplayTranslations> = {
  ar: {
    title: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0634\u0627\u0634\u0627\u062a',
    description: '\u0625\u062f\u0627\u0631\u0629 \u0634\u0627\u0634\u0627\u062a Display \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0639\u0645\u0644\u064a\u0627\u062a CRUD.',
    activeTab: '\u0627\u0644\u0634\u0627\u0634\u0627\u062a \u0627\u0644\u0646\u0634\u0637\u0629',
    deletedTab: '\u0627\u0644\u0634\u0627\u0634\u0627\u062a \u063a\u064a\u0631 \u0627\u0644\u0646\u0634\u0637\u0629',
    addDisplay: '\u0625\u0636\u0627\u0641\u0629 \u0634\u0627\u0634\u0629',
    searchPlaceholder: '\u0628\u062d\u062b \u0628\u0631\u0642\u0645 Display \u0623\u0648 IP \u0623\u0648 Serial \u0623\u0648 \u0627\u0644\u0646\u0648\u0639',
    branchFilter: '\u0627\u0644\u0641\u0631\u0639',
    allBranches: '\u0643\u0644 \u0627\u0644\u0641\u0631\u0648\u0639',
    pageSize: '\u062d\u062c\u0645 \u0627\u0644\u0635\u0641\u062d\u0629',
    loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    noItems: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0634\u0627\u0634\u0627\u062a.',
    noItemsWithFilter: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0634\u0627\u0634\u0627\u062a \u062a\u0637\u0627\u0628\u0642 \u0627\u0644\u0645\u0631\u0634\u062d\u0627\u062a \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629.',
    totalItems: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0646\u0627\u0635\u0631',
    previous: '\u0627\u0644\u0633\u0627\u0628\u0642',
    next: '\u0627\u0644\u062a\u0627\u0644\u064a',
    displayNumber: '\u0631\u0642\u0645 Display',
    typeLabel: '\u0627\u0644\u0646\u0648\u0639',
    ipAddress: '\u0639\u0646\u0648\u0627\u0646 IP',
    serialNumber: '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u062a\u0633\u0644\u0633\u0644\u064a',
    branch: '\u0627\u0644\u0641\u0631\u0639',
    deletedOn: '\u0627\u0644\u062d\u0627\u0644\u0629',
    actions: '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    view: '\u0639\u0631\u0636',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    delete: '\u0625\u064a\u0642\u0627\u0641',
    restore: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0646\u0634\u064a\u0637',
    permanentDelete: '\u062d\u0630\u0641 \u062f\u0627\u0626\u0645',
    createdOn: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621',
    modifiedOn: '\u062a\u0627\u0631\u064a\u062e \u0622\u062e\u0631 \u062a\u0639\u062f\u064a\u0644',
    details: '\u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644',
    displayDetails: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u0637\u0631\u0641\u064a',
    createTitle: '\u0625\u0646\u0634\u0627\u0621 \u062c\u0647\u0627\u0632',
    editTitle: '\u062a\u0639\u062f\u064a\u0644 \u062c\u0647\u0627\u0632',
    close: '\u0625\u063a\u0644\u0627\u0642',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    save: '\u062d\u0641\u0638',
    requiredField: '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.',
    maxLength20: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 20 \u062d\u0631\u0641.',
    maxLength45: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 45 \u062d\u0631\u0641.',
    maxLength100: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 100 \u062d\u0631\u0641.',
    invalidIp: '\u0639\u0646\u0648\u0627\u0646 IP \u063a\u064a\u0631 \u0635\u062d\u064a\u062d.',
    selectBranch: '\u0627\u062e\u062a\u0631 \u0641\u0631\u0639',
    refresh: '\u062a\u062d\u062f\u064a\u062b',
    loadingBranches: '\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0641\u0631\u0648\u0639...',
    deleteConfirm: '\u062a\u0623\u0643\u064a\u062f \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u062c\u0647\u0627\u0632',
    restoreConfirm: '\u062a\u0623\u0643\u064a\u062f \u0625\u0639\u0627\u062f\u0629 \u062a\u0646\u0634\u064a\u0637 \u0627\u0644\u062c\u0647\u0627\u0632',
    permanentDeleteConfirm: '\u062a\u0623\u0643\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u062c\u0647\u0627\u0632 \u0646\u0647\u0627\u0626\u064a\u0627',
    deleteConfirmBody: '\u0647\u0644 \u062a\u0631\u064a\u062f \u0625\u064a\u0642\u0627\u0641 \u0647\u0630\u0627 \u0627\u0644\u062c\u0647\u0627\u0632\u061f',
    restoreConfirmBody: '\u0647\u0644 \u062a\u0631\u064a\u062f \u0625\u0639\u0627\u062f\u0629 \u062a\u0646\u0634\u064a\u0637 \u0647\u0630\u0627 \u0627\u0644\u062c\u0647\u0627\u0632\u061f',
    permanentDeleteConfirmBody: '\u0633\u064a\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u062c\u0647\u0627\u0632 \u0628\u0634\u0643\u0644 \u062f\u0627\u0626\u0645 \u0648\u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646\u0647.',
    fallbackSuccess: '\u062a\u0645\u062a \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0628\u0646\u062c\u0627\u062d.',
    fallbackError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639.',
    accessDenied: '\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u063a\u064a\u0631 \u0643\u0627\u0641\u064a\u0629.',
    noPermissionHint: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0644\u0627\u062d\u064a\u0627\u062a \u0643\u0627\u0641\u064a\u0629 \u0644\u0647\u0630\u0627 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.',
    traceIdLabel: '\u0645\u0639\u0631\u0641 \u0627\u0644\u062a\u062a\u0628\u0639',
    notAvailable: '-',
  },
  en: {
    title: 'Display Management',
    description: 'Manage display records and perform display CRUD operations.',
    activeTab: 'Active Displays',
    deletedTab: 'Inactive Displays',
    addDisplay: 'Add Display',
    searchPlaceholder: 'Search by display number, IP, serial number, or type',
    branchFilter: 'Branch',
    allBranches: 'All Branches',
    pageSize: 'Page size',
    loading: 'Loading...',
    noItems: 'No displays found.',
    noItemsWithFilter: 'No displays match selected filters.',
    totalItems: 'Total items',
    previous: 'Previous',
    next: 'Next',
    displayNumber: 'Display Number',
    typeLabel: 'Type',
    ipAddress: 'IP Address',
    serialNumber: 'Serial Number',
    branch: 'Branch',
    deletedOn: 'Status',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Deactivate',
    restore: 'Reactivate',
    permanentDelete: 'Permanent Delete',
    createdOn: 'Created On',
    modifiedOn: 'Modified On',
    details: 'Details',
    displayDetails: 'Display Details',
    createTitle: 'Create Display',
    editTitle: 'Edit Display',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    requiredField: 'This field is required.',
    maxLength20: 'Maximum length is 20 characters.',
    maxLength45: 'Maximum length is 45 characters.',
    maxLength100: 'Maximum length is 100 characters.',
    invalidIp: 'IP Address is invalid.',
    selectBranch: 'Select branch',
    refresh: 'Refresh',
    loadingBranches: 'Loading branches...',
    deleteConfirm: 'Deactivate Display',
    restoreConfirm: 'Reactivate Display',
    permanentDeleteConfirm: 'Permanently Delete Display',
    deleteConfirmBody: 'Are you sure you want to deactivate this display?',
    restoreConfirmBody: 'Are you sure you want to reactivate this display?',
    permanentDeleteConfirmBody: 'This action permanently deletes the display and cannot be undone.',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    accessDenied: 'Access denied.',
    noPermissionHint: 'You do not have permission for this action.',
    traceIdLabel: 'Trace ID',
    notAvailable: '-',
  },
};

const EMPTY_DISPLAY_PAGE: PaginationResponse<DisplayListItemResponse> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

const EMPTY_DELETED_DISPLAY_PAGE: PaginationResponse<DeletedDisplayListItemResponse> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

@Component({
  selector: 'app-displays',
  imports: [ReactiveFormsModule],
  templateUrl: './displays.component.html',
  styleUrl: './displays.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplaysComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly permissionService = inject(DisplayPermissionService);
  private readonly branchManagementApiService = inject(BranchManagementApiService);
  private readonly displayManagementApiService = inject(DisplayManagementApiService);

  private activeSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private deletedSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private activeDisplaysRequestSerial = 0;
  private panelRequestId = 0;
  private readonly pendingCreatedDisplays = new Map<number, DisplayListItemResponse>();

  protected readonly translations = computed(() => DISPLAY_TRANSLATIONS[this.i18nStore.language()]);

  protected readonly canViewActive = this.permissionService.canViewAll;
  protected readonly canViewDetails = this.permissionService.canViewDetails;
  protected readonly canCreate = this.permissionService.canCreate;
  protected readonly canUpdate = this.permissionService.canUpdate;
  protected readonly canDeactivate = this.permissionService.canDeactivate;
  protected readonly canReactivate = this.permissionService.canReactivate;
  protected readonly canDeletePermanent = this.permissionService.canDeletePermanent;
  protected readonly canViewDeleted = computed(() => this.canReactivate() || this.canDeletePermanent());

  protected readonly activeTab = signal<DisplayTab>(this.canViewActive() ? 'active' : 'deleted');
  protected readonly hasDisplayAccess = computed(() => this.canViewActive() || this.canViewDeleted());

  protected readonly activeDisplaysPage = signal<PaginationResponse<DisplayListItemResponse>>(
    EMPTY_DISPLAY_PAGE
  );
  protected readonly deletedDisplaysPage =
    signal<PaginationResponse<DeletedDisplayListItemResponse>>(EMPTY_DELETED_DISPLAY_PAGE);
  protected readonly activeSearch = signal('');
  protected readonly deletedSearch = signal('');
  protected readonly activeBranchId = signal<number | null>(null);
  protected readonly deletedBranchId = signal<number | null>(null);
  protected readonly activePageSize = signal(10);
  protected readonly deletedPageSize = signal(10);
  protected readonly activeLoading = signal(false);
  protected readonly deletedLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly selectedDetails = signal<DisplayDetailsResponse | null>(null);
  protected readonly selectedEditId = signal<number | null>(null);
  protected readonly panelMode = signal<DisplayPanelMode>('closed');
  protected readonly branches = signal<readonly BranchOption[]>([]);
  protected readonly confirmDialog = signal<DisplayConfirmState | null>(null);
  protected readonly traceId = signal<string | null>(null);
  protected readonly message = signal<UiMessage | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly displayForm = this.formBuilder.group({
    branchId: [0, [Validators.required, Validators.min(1)]],
    number: ['', [Validators.required, Validators.maxLength(20), this.notWhitespaceValidator]],
    ipAddress: ['', [Validators.required, Validators.maxLength(45), (control: AbstractControl<string>) => this.ipAddressValidator(control)]],
    serialNo: ['', [Validators.required, Validators.maxLength(100), this.notWhitespaceValidator]],
    type: ['', [Validators.required, Validators.maxLength(100), this.notWhitespaceValidator]],
  });

  protected readonly branchIdControl = this.displayForm.controls.branchId;
  protected readonly numberControl = this.displayForm.controls.number;
  protected readonly ipAddressControl = this.displayForm.controls.ipAddress;
  protected readonly serialNoControl = this.displayForm.controls.serialNo;
  protected readonly typeControl = this.displayForm.controls.type;

  ngOnInit(): void {
    this.loadBranches();
    this.initializeTab();
  }

  ngOnDestroy(): void {
    if (this.activeSearchDebounceId) {
      clearTimeout(this.activeSearchDebounceId);
    }

    if (this.deletedSearchDebounceId) {
      clearTimeout(this.deletedSearchDebounceId);
    }

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
  }

  protected clearMessage(): void {
    this.message.set(null);

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  protected switchTab(tab: DisplayTab): void {
    if (tab === 'active' && !this.canViewActive()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    if (tab === 'deleted' && !this.canViewDeleted()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    if (tab === this.activeTab()) {
      return;
    }

    this.activeTab.set(tab);
    this.clearMessage();
    this.confirmDialog.set(null);

    if (tab === 'active') {
      this.loadActiveDisplays(1);
      return;
    }

    this.loadDeletedDisplays(1);
  }

  protected updateActiveSearch(event: Event): void {
    this.activeSearch.set(this.readInputValue(event));
    this.loadActiveDisplaysWithReset();
  }

  protected updateDeletedSearch(event: Event): void {
    this.deletedSearch.set(this.readInputValue(event));
    this.loadDeletedDisplaysWithReset();
  }

  protected updateActiveBranchFilter(event: Event): void {
    this.activeBranchId.set(this.toOptionalNumber(this.readInputValue(event)));
    this.loadActiveDisplays(1);
  }

  protected updateDeletedBranchFilter(event: Event): void {
    this.deletedBranchId.set(this.toOptionalNumber(this.readInputValue(event)));
    this.loadDeletedDisplays(1);
  }

  protected updateActivePageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    this.activePageSize.set(this.normalizePageSize(value));
    this.loadActiveDisplays(1);
  }

  protected updateDeletedPageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    this.deletedPageSize.set(this.normalizePageSize(value));
    this.loadDeletedDisplays(1);
  }

  protected previousActivePage(): void {
    if (this.activeDisplaysPage().hasPreviousPage) {
      this.loadActiveDisplays(this.activeDisplaysPage().currentPage - 1);
    }
  }

  protected nextActivePage(): void {
    if (this.activeDisplaysPage().hasNextPage) {
      this.loadActiveDisplays(this.activeDisplaysPage().currentPage + 1);
    }
  }

  protected previousDeletedPage(): void {
    if (this.deletedDisplaysPage().hasPreviousPage) {
      this.loadDeletedDisplays(this.deletedDisplaysPage().currentPage - 1);
    }
  }

  protected nextDeletedPage(): void {
    if (this.deletedDisplaysPage().hasNextPage) {
      this.loadDeletedDisplays(this.deletedDisplaysPage().currentPage + 1);
    }
  }

  protected refreshActive(): void {
    this.loadActiveDisplays(this.activeDisplaysPage().currentPage);
  }

  protected refreshDeleted(): void {
    this.loadDeletedDisplays(this.deletedDisplaysPage().currentPage);
  }

  protected openCreate(): void {
    if (!this.canCreate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.panelRequestId += 1;
    this.panelMode.set('create');
    this.selectedEditId.set(null);
    this.selectedDetails.set(null);
    this.confirmDialog.set(null);
    this.clearMessage();
    this.displayForm.enable();
    this.displayForm.reset({
      branchId: this.activeBranchId() ?? 0,
      number: '',
      ipAddress: '',
      serialNo: '',
      type: '',
    });
  }

  protected openView(displayId: number): void {
    if (!this.canViewDetails()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.openDisplayDetails(displayId, 'view');
  }

  protected openEdit(displayId: number): void {
    if (!this.canUpdate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.openDisplayDetails(displayId, 'edit');
  }

  protected closePanel(): void {
    this.panelRequestId += 1;
    this.panelMode.set('closed');
    this.selectedEditId.set(null);
    this.selectedDetails.set(null);
    this.displayForm.markAsPristine();
    this.displayForm.enable();
    this.confirmDialog.set(null);
  }

  protected panelTitle(): string {
    if (this.panelMode() === 'create') {
      return this.translations().createTitle;
    }

    if (this.panelMode() === 'edit') {
      return this.translations().editTitle;
    }

    return this.translations().displayDetails;
  }

  protected saveDisplay(): void {
    if (this.saving()) {
      return;
    }

    if (this.displayForm.invalid) {
      this.displayForm.markAllAsTouched();
      return;
    }

    if (this.panelMode() === 'create') {
      this.createDisplay();
      return;
    }

    if (this.panelMode() === 'edit') {
      this.updateDisplay();
    }
  }

  protected requestSoftDelete(item: DisplayListItemResponse): void {
    if (!this.canDeactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.confirmDialog.set({
      kind: 'deactivate',
      displayId: item.id,
      displayNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected requestRestore(item: DeletedDisplayListItemResponse): void {
    if (!this.canReactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.confirmDialog.set({
      kind: 'reactivate',
      displayId: item.id,
      displayNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected requestPermanentDelete(item: DeletedDisplayListItemResponse): void {
    if (!this.canDeletePermanent()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.confirmDialog.set({
      kind: 'permanent',
      displayId: item.id,
      displayNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected confirmAction(): void {
    const action = this.confirmDialog();

    if (!action || this.deleting()) {
      return;
    }

    if (action.kind === 'deactivate') {
      this.deactivateDisplay(action);
      return;
    }

    if (action.kind === 'reactivate') {
      this.reactivateDisplay(action);
      return;
    }

    this.permanentlyDeleteDisplay(action);
  }

  protected closeConfirmDialog(): void {
    if (this.deleting()) {
      return;
    }

    this.confirmDialog.set(null);
  }

  protected hasDisplayFormError(
    controlName: 'branchId' | 'number' | 'ipAddress' | 'serialNo' | 'type',
  ): boolean {
    const control = this.displayForm.controls[controlName];
    return control.touched && control.invalid;
  }

  protected branchOptionLabel(branch: BranchOption): string {
    return this.branchLabel(branch.arabicName, branch.englishName);
  }

  protected branchLabel(arabicName: string | null, englishName: string | null): string {
    const primary = this.i18nStore.language() === 'ar' ? arabicName : englishName;
    const fallback = this.i18nStore.language() === 'ar' ? englishName : arabicName;
    return this.formatText(primary ?? fallback);
  }

  protected formatDate(dateValue: string | null): string {
    if (!dateValue) {
      return this.translations().notAvailable;
    }

    const parsed = new Date(dateValue);

    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }

    return new Intl.DateTimeFormat(this.i18nStore.language(), {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZoneName: 'short',
    }).format(parsed);
  }

  protected formatText(value: string | null | undefined): string {
    return value && value.trim().length > 0 ? value : this.translations().notAvailable;
  }

  protected readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private initializeTab(): void {
    if (!this.hasDisplayAccess()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    if (this.activeTab() === 'active') {
      this.loadActiveDisplays(1);
      return;
    }

    this.loadDeletedDisplays(1);
  }

  private loadActiveDisplays(pageNumber = this.activeDisplaysPage().currentPage, force = false): void {
    if (!this.canViewActive() || (this.activeLoading() && !force)) {
      return;
    }

    const requestSerial = ++this.activeDisplaysRequestSerial;

    this.activeLoading.set(true);
    this.traceId.set(null);

    this.displayManagementApiService
      .getDisplays(this.buildQuery(this.activeSearch(), this.activeBranchId(), pageNumber, this.activePageSize(), true))
      .subscribe({
        next: (response) => {
          if (requestSerial !== this.activeDisplaysRequestSerial) {
            return;
          }

          this.activeDisplaysPage.set(this.mergePendingCreatedDisplays(response));
        },
        error: (error: HttpErrorResponse) => {
          if (requestSerial === this.activeDisplaysRequestSerial) {
            this.handleApiError(error);
          }
        },
        complete: () => {
          if (requestSerial === this.activeDisplaysRequestSerial) {
            this.activeLoading.set(false);
          }
        },
      });
  }

  private loadDeletedDisplays(pageNumber = this.deletedDisplaysPage().currentPage): void {
    if (!this.canViewDeleted() || this.deletedLoading()) {
      return;
    }

    this.deletedLoading.set(true);
    this.traceId.set(null);

    this.displayManagementApiService
      .getDisplays(this.buildQuery(this.deletedSearch(), this.deletedBranchId(), pageNumber, this.deletedPageSize(), false))
      .subscribe({
        next: (response) => this.deletedDisplaysPage.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.deletedLoading.set(false),
      });
  }

  private loadBranches(): void {
    const query = {
      searchText: '',
      orderSort: 'Newest' as const,
      pageNumber: 1,
      pageSize: 100,
      isActive: true,
    };

    this.branchManagementApiService.getBranches(query).subscribe({
      next: (response) => {
        this.branches.set(
          response.data.map((branch: BranchListItem) => ({
            id: branch.branchId,
            arabicName: branch.arabicName,
            englishName: branch.englishName,
          })),
        );
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
    });
  }

  private openDisplayDetails(
    displayId: number,
    mode: Extract<DisplayPanelMode, 'view' | 'edit'>,
  ): void {
    const requestId = ++this.panelRequestId;

    this.panelMode.set(mode);
    this.selectedEditId.set(mode === 'edit' ? displayId : null);
    this.selectedDetails.set(null);
    this.confirmDialog.set(null);
    this.clearMessage();
    this.displayForm.enable();

    this.displayManagementApiService.getDisplayById(displayId).subscribe({
      next: (response) => {
        if (requestId !== this.panelRequestId || this.panelMode() !== mode) {
          return;
        }

        this.selectedDetails.set(response);
        this.displayForm.reset({
          branchId: response.branchId,
          number: response.number,
          ipAddress: response.ipAddress,
          serialNo: response.serialNo,
          type: response.type,
        });

        if (mode === 'edit') {
          this.branchIdControl.disable({ emitEvent: false });
        }
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.panelRequestId || this.panelMode() !== mode) {
          return;
        }

        this.handleApiError(error);
        this.closePanel();
      },
    });
  }

  private createDisplay(): void {
    if (!this.canCreate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.saving.set(true);

    const request = this.mapCreateRequest();

    this.displayManagementApiService.createDisplay(request).subscribe({
      next: (response: CreateDisplayResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.closePanel();
        this.activeTab.set('active');
        this.prependCreatedDisplay(response, request);
        setTimeout(() => this.loadActiveDisplays(1, true), 900);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private updateDisplay(): void {
    const displayId = this.selectedEditId();

    if (!displayId || !this.canUpdate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.saving.set(true);

    this.displayManagementApiService.updateDisplay(displayId, this.mapUpdateRequest()).subscribe({
      next: (response: UpdateDisplayResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.closePanel();
        this.loadActiveDisplays(this.activeDisplaysPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private deactivateDisplay(action: DisplayConfirmState): void {
    if (!this.canDeactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.displayManagementApiService.deactivateDisplay(action.displayId, action.rowVersion).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.activeDisplaysPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadActiveDisplays(nextPage);
        this.loadDeletedDisplays(this.deletedDisplaysPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private reactivateDisplay(action: DisplayConfirmState): void {
    if (!this.canReactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.displayManagementApiService.reactivateDisplay(action.displayId, action.rowVersion).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.deletedDisplaysPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadDeletedDisplays(nextPage);
        this.loadActiveDisplays(this.activeDisplaysPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private permanentlyDeleteDisplay(action: DisplayConfirmState): void {
    if (!this.canDeletePermanent()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.displayManagementApiService.permanentlyDeleteDisplay(action.displayId, action.rowVersion).subscribe({
      next: (response: PermanentDeleteDisplayResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.deletedDisplaysPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadDeletedDisplays(nextPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        if (error.status === 409 || error.status === 404) {
          this.loadDeletedDisplays(this.deletedDisplaysPage().currentPage);
        }
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private loadActiveDisplaysWithReset(): void {
    if (this.activeSearchDebounceId) {
      clearTimeout(this.activeSearchDebounceId);
    }

    this.activeSearchDebounceId = setTimeout(() => this.loadActiveDisplays(1), 350);
  }

  private loadDeletedDisplaysWithReset(): void {
    if (this.deletedSearchDebounceId) {
      clearTimeout(this.deletedSearchDebounceId);
    }

    this.deletedSearchDebounceId = setTimeout(() => this.loadDeletedDisplays(1), 350);
  }

  private prependCreatedDisplay(response: CreateDisplayResponse, request: CreateDisplayRequest): void {
    const responseFallback = response as Partial<CreateDisplayResponse>;
    const branchId = responseFallback.branchId ?? request.branchId;
    const branch = this.branches().find((item) => item.id === branchId);
    const createdDisplay: DisplayListItemResponse = {
      id: responseFallback.id ?? -Date.now(),
      branchId,
      branchArabicName: branch?.arabicName ?? null,
      branchEnglishName: branch?.englishName ?? null,
      number: responseFallback.number ?? request.number,
      ipAddress: responseFallback.ipAddress ?? request.ipAddress,
      serialNo: responseFallback.serialNo ?? request.serialNo,
      type: responseFallback.type ?? request.type,
      isActive: responseFallback.isActive ?? true,
      effectiveIsActive: responseFallback.effectiveIsActive ?? true,
      rowVersion: responseFallback.rowVersion ?? '',
    };

    this.pendingCreatedDisplays.set(createdDisplay.id, createdDisplay);
    this.activeDisplaysPage.update((page) => this.insertCreatedDisplayIntoPage(page, createdDisplay));
  }

  private insertCreatedDisplayIntoPage(
    page: PaginationResponse<DisplayListItemResponse>,
    createdDisplay: DisplayListItemResponse,
  ): PaginationResponse<DisplayListItemResponse> {
    if (!this.matchesActiveFilters(createdDisplay)) {
      return page;
    }

    const pageSize = page.pageSize || this.activePageSize();
    const alreadyExists = page.data.some((item) => item.id === createdDisplay.id);
    const mergedData = [
      createdDisplay,
      ...page.data.filter((item) => item.id !== createdDisplay.id),
    ].slice(0, pageSize);
    const totalItems = alreadyExists ? page.totalItems : page.totalItems + 1;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      ...page,
      currentPage: 1,
      pageSize,
      totalItems,
      totalPages,
      data: mergedData,
      hasPreviousPage: false,
      hasNextPage: 1 < totalPages,
    };
  }
  private mergePendingCreatedDisplays(
    page: PaginationResponse<DisplayListItemResponse>,
  ): PaginationResponse<DisplayListItemResponse> {
    if (page.currentPage !== 1) {
      return page;
    }

    const serverIds = new Set(page.data.map((item) => item.id));
    const pendingItems = Array.from(this.pendingCreatedDisplays.values()).filter((item) => {
      const existsOnServer = serverIds.has(item.id) || page.data.some((serverItem) => this.isSameDisplay(item, serverItem));

      if (existsOnServer) {
        this.pendingCreatedDisplays.delete(item.id);
        return false;
      }

      return this.matchesActiveFilters(item);
    });

    if (pendingItems.length === 0) {
      return page;
    }

    const pageSize = page.pageSize || this.activePageSize();
    const mergedData = [
      ...pendingItems,
      ...page.data.filter((item) => !this.pendingCreatedDisplays.has(item.id)),
    ].slice(0, pageSize);
    const totalItems = page.totalItems + pendingItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    return {
      ...page,
      currentPage: page.currentPage,
      pageSize,
      totalItems,
      totalPages,
      data: mergedData,
      hasPreviousPage: page.currentPage > 1,
      hasNextPage: page.currentPage < totalPages,
    };
  }

  private isSameDisplay(left: DisplayListItemResponse, right: DisplayListItemResponse): boolean {
    return (
      left.branchId === right.branchId &&
      left.number === right.number &&
      left.ipAddress === right.ipAddress &&
      left.serialNo === right.serialNo &&
      left.type === right.type
    );
  }
  private matchesActiveFilters(item: DisplayListItemResponse): boolean {
    const branchId = this.activeBranchId();

    if (branchId && item.branchId !== branchId) {
      return false;
    }

    const search = this.activeSearch().trim().toLowerCase();

    if (!search) {
      return true;
    }

    return [item.number, item.ipAddress, item.serialNo, item.type]
      .some((value) => value.toLowerCase().includes(search));
  }
  private buildQuery(
    search: string,
    branchId: number | null,
    pageNumber: number,
    pageSize: number,
    isActive: boolean,
  ): GetDisplaysParams {
    return {
      branchId: branchId ?? undefined,
      search: search.trim(),
      pageNumber,
      pageSize,
      isActive,
    };
  }

  private normalizePageSize(pageSize: number): number {
    if (!Number.isFinite(pageSize) || pageSize <= 0) {
      return 10;
    }

    return Math.min(pageSize, 100);
  }

  private mapCreateRequest(): CreateDisplayRequest {
    const value = this.displayForm.getRawValue();

    return {
      branchId: Number(value.branchId),
      number: value.number.trim(),
      ipAddress: value.ipAddress.trim(),
      serialNo: value.serialNo.trim(),
      type: value.type.trim(),
    };
  }

  private mapUpdateRequest(): UpdateDisplayRequest {
    const value = this.displayForm.getRawValue();

    return {
      number: value.number.trim(),
      ipAddress: value.ipAddress.trim(),
      serialNo: value.serialNo.trim(),
      type: value.type.trim(),
      rowVersion: this.selectedDetails()?.rowVersion ?? '',
    };
  }

  private toOptionalNumber(value: string): number | null {
    const parsed = Number(value);

    if (!value || !Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
  }

  private handleApiError(error: HttpErrorResponse): void {
    const message = this.extractApiMessage(error);

    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    if (error.status === 403) {
      this.showMessage('error', message === this.translations().fallbackError ? this.translations().accessDenied : message);
      return;
    }

    this.showMessage('error', message);
  }

  private extractApiMessage(error: HttpErrorResponse): string {
    return formatTechnicalAdminApiError(error, this.translations().fallbackError);
  }

  private showMessage(tone: MessageTone, text: string): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    this.message.set({ tone, text });

    this.toastTimeoutId = setTimeout(() => {
      this.message.set(null);
      this.toastTimeoutId = null;
    }, tone === 'error' ? 6500 : 4200);
  }

  private notWhitespaceValidator(control: AbstractControl<string>): ValidationErrors | null {
    return control.value.trim().length > 0 ? null : { whitespace: true };
  }

  private ipAddressValidator(control: AbstractControl<string>): ValidationErrors | null {
    const value = control.value.trim();

    if (!value) {
      return null;
    }

    return this.isIpAddressValid(value) ? null : { ipAddress: true };
  }

  private isIpAddressValid(value: string): boolean {
    if (value.length > 45) {
      return false;
    }

    if (value.includes(':')) {
      return this.isValidIpv6Address(value);
    }

    return this.isValidIpv4Address(value);
  }
  private isValidIpv4Address(value: string): boolean {
    const octets = value.split('.');
    if (octets.length !== 4) {
      return false;
    }

    return octets.every((octet) => {
      if (!/^\d{1,3}$/.test(octet)) {
        return false;
      }

      const numeric = Number(octet);
      return Number.isInteger(numeric) && numeric >= 0 && numeric <= 255;
    });
  }
  private isValidIpv6Address(value: string): boolean {
    const ipv6Pattern =
      /^(?:[0-9A-Fa-f]{1,4}:){7}[0-9A-Fa-f]{1,4}$|^(?:[0-9A-Fa-f]{1,4}:){1,7}:$|^:(?::[0-9A-Fa-f]{1,4}){1,7}$|^(?:[0-9A-Fa-f]{1,4}:){1,7}:[0-9A-Fa-f]{1,4}$|^(?:[0-9A-Fa-f]{1,4}:){0,7}(?:[0-9A-Fa-f]{1,4})?::(?:[0-9A-Fa-f]{1,4}:){0,7}(?:[0-9A-Fa-f]{1,4})?$/;

    if (!ipv6Pattern.test(value)) {
      return false;
    }

    return value.includes('::')
      ? value.indexOf('::') === value.lastIndexOf('::')
      : value.split(':').length <= 8;
  }
}