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
import { WindowManagementApiService } from '../../services/window-management-api.service';
import { TerminalManagementApiService } from '../../services/terminal-management-api.service';
import { TerminalPermissionService } from '../../services/terminal-permission.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../utils/api-error-message.util';
import {
  CreateTerminalRequest,
  CreateTerminalResponse,
  GetTerminalsParams,
  PaginationResponse,
  PermanentDeleteTerminalResponse,
  TerminalDetailsResponse,
  TerminalListItemResponse,
  UpdateTerminalRequest,
  UpdateTerminalResponse,
} from '../../models/terminal-management.model';
import { GetWindowsParams, WindowListItemResponse } from '../../models/window-management.model';

type TerminalTab = 'active' | 'deleted';
type TerminalPanelMode = 'closed' | 'create' | 'edit' | 'view';
type DeletedTerminalListItemResponse = TerminalListItemResponse;
type MessageTone = 'success' | 'error' | 'info';
type TerminalDeleteAction = 'deactivate' | 'reactivate' | 'permanent';

interface UiMessage {
  readonly tone: MessageTone;
  readonly text: string;
}

interface TerminalTranslations {
  readonly title: string;
  readonly description: string;
  readonly activeTab: string;
  readonly deletedTab: string;
  readonly addTerminal: string;
  readonly searchPlaceholder: string;
  readonly windowFilter: string;
  readonly allWindows: string;
  readonly pageSize: string;
  readonly loading: string;
  readonly noItems: string;
  readonly noItemsWithFilter: string;
  readonly totalItems: string;
  readonly previous: string;
  readonly next: string;
  readonly terminalNumber: string;
  readonly typeLabel: string;
  readonly ipAddress: string;
  readonly serialNumber: string;
  readonly windowNumber: string;
  readonly waitingAreaNumber: string;
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
  readonly terminalDetails: string;
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
  readonly selectWindow: string;
  readonly refresh: string;
  readonly loadingWindows: string;
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

interface TerminalConfirmState {
  readonly kind: TerminalDeleteAction;
  readonly terminalId: number;
  readonly terminalNumber: string;
  readonly rowVersion: string;
}

interface WindowOption {
  readonly id: number;
  readonly number: string;
  readonly waitingAreaNumber: number;
  readonly waitingAreaDescriptiveName: string | null;
}

const TERMINAL_TRANSLATIONS: Record<AppLanguage, TerminalTranslations> = {
  ar: {
    title: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u0637\u0631\u0641\u064a\u0629',
    description: '\u0625\u062f\u0627\u0631\u0629 \u0623\u062c\u0647\u0632\u0629 Terminal \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0627\u0644\u0646\u0648\u0627\u0641\u0630 \u0648\u0639\u0645\u0644\u064a\u0627\u062a CRUD.',
    activeTab: '\u0627\u0644\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u0646\u0634\u0637\u0629',
    deletedTab: '\u0627\u0644\u0623\u062c\u0647\u0632\u0629 \u063a\u064a\u0631 \u0627\u0644\u0646\u0634\u0637\u0629',
    addTerminal: '\u0625\u0636\u0627\u0641\u0629 \u062c\u0647\u0627\u0632',
    searchPlaceholder: '\u0628\u062d\u062b \u0628\u0631\u0642\u0645 Terminal \u0623\u0648 IP \u0623\u0648 Serial \u0623\u0648 \u0627\u0644\u0646\u0648\u0639',
    windowFilter: '\u0627\u0644\u0646\u0627\u0641\u0630\u0629',
    allWindows: '\u0643\u0644 \u0627\u0644\u0646\u0648\u0627\u0641\u0630',
    pageSize: '\u062d\u062c\u0645 \u0627\u0644\u0635\u0641\u062d\u0629',
    loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    noItems: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u062c\u0647\u0632\u0629 \u0637\u0631\u0641\u064a\u0629.',
    noItemsWithFilter: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0623\u062c\u0647\u0632\u0629 \u062a\u0637\u0627\u0628\u0642 \u0627\u0644\u0645\u0631\u0634\u062d\u0627\u062a \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629.',
    totalItems: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0646\u0627\u0635\u0631',
    previous: '\u0627\u0644\u0633\u0627\u0628\u0642',
    next: '\u0627\u0644\u062a\u0627\u0644\u064a',
    terminalNumber: '\u0631\u0642\u0645 Terminal',
    typeLabel: '\u0627\u0644\u0646\u0648\u0639',
    ipAddress: '\u0639\u0646\u0648\u0627\u0646 IP',
    serialNumber: '\u0627\u0644\u0631\u0642\u0645 \u0627\u0644\u062a\u0633\u0644\u0633\u0644\u064a',
    windowNumber: '\u0631\u0642\u0645 \u0627\u0644\u0646\u0627\u0641\u0630\u0629',
    waitingAreaNumber: '\u0631\u0642\u0645 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
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
    terminalDetails: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u0637\u0631\u0641\u064a',
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
    selectWindow: '\u0627\u062e\u062a\u0631 \u0646\u0627\u0641\u0630\u0629',
    refresh: '\u062a\u062d\u062f\u064a\u062b',
    loadingWindows: '\u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0646\u0648\u0627\u0641\u0630...',
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
    title: 'Terminal Management',
    description: 'Manage terminal records and perform terminal CRUD operations.',
    activeTab: 'Active Terminals',
    deletedTab: 'Inactive Terminals',
    addTerminal: 'Add Terminal',
    searchPlaceholder: 'Search by terminal number, IP, serial number, or type',
    windowFilter: 'Window',
    allWindows: 'All Windows',
    pageSize: 'Page size',
    loading: 'Loading...',
    noItems: 'No terminals found.',
    noItemsWithFilter: 'No terminals match selected filters.',
    totalItems: 'Total items',
    previous: 'Previous',
    next: 'Next',
    terminalNumber: 'Terminal Number',
    typeLabel: 'Type',
    ipAddress: 'IP Address',
    serialNumber: 'Serial Number',
    windowNumber: 'Window Number',
    waitingAreaNumber: 'Waiting Area Number',
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
    terminalDetails: 'Terminal Details',
    createTitle: 'Create Terminal',
    editTitle: 'Edit Terminal',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    requiredField: 'This field is required.',
    maxLength20: 'Maximum length is 20 characters.',
    maxLength45: 'Maximum length is 45 characters.',
    maxLength100: 'Maximum length is 100 characters.',
    invalidIp: 'IP Address is invalid.',
    selectWindow: 'Select window',
    refresh: 'Refresh',
    loadingWindows: 'Loading windows...',
    deleteConfirm: 'Deactivate Terminal',
    restoreConfirm: 'Reactivate Terminal',
    permanentDeleteConfirm: 'Permanently Delete Terminal',
    deleteConfirmBody: 'Are you sure you want to deactivate this terminal?',
    restoreConfirmBody: 'Are you sure you want to reactivate this terminal?',
    permanentDeleteConfirmBody: 'This action permanently deletes the terminal and cannot be undone.',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    accessDenied: 'Access denied.',
    noPermissionHint: 'You do not have permission for this action.',
    traceIdLabel: 'Trace ID',
    notAvailable: '-',
  },
};

const EMPTY_TERMINAL_PAGE: PaginationResponse<TerminalListItemResponse> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

const EMPTY_DELETED_TERMINAL_PAGE: PaginationResponse<DeletedTerminalListItemResponse> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

@Component({
  selector: 'app-terminals',
  imports: [ReactiveFormsModule],
  templateUrl: './terminals.component.html',
  styleUrl: './terminals.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TerminalsComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  private readonly permissionService = inject(TerminalPermissionService);
  private readonly windowManagementApiService = inject(WindowManagementApiService);
  private readonly terminalManagementApiService = inject(TerminalManagementApiService);

  private activeSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private deletedSearchDebounceId: ReturnType<typeof setTimeout> | null = null;

  protected readonly translations = computed(() => TERMINAL_TRANSLATIONS[this.i18nStore.language()]);

  protected readonly canViewActive = this.permissionService.canViewAll;
  protected readonly canViewDetails = this.permissionService.canViewDetails;
  protected readonly canCreate = this.permissionService.canCreate;
  protected readonly canUpdate = this.permissionService.canUpdate;
  protected readonly canDeactivate = this.permissionService.canDeactivate;
  protected readonly canReactivate = this.permissionService.canReactivate;
  protected readonly canDeletePermanent = this.permissionService.canDeletePermanent;
  protected readonly canViewDeleted = computed(() => this.canReactivate() || this.canDeletePermanent());

  protected readonly activeTab = signal<TerminalTab>(this.canViewActive() ? 'active' : 'deleted');
  protected readonly hasTerminalAccess = computed(() => this.canViewActive() || this.canViewDeleted());

  protected readonly activeTerminalsPage = signal<PaginationResponse<TerminalListItemResponse>>(
    EMPTY_TERMINAL_PAGE
  );
  protected readonly deletedTerminalsPage =
    signal<PaginationResponse<DeletedTerminalListItemResponse>>(EMPTY_DELETED_TERMINAL_PAGE);
  protected readonly activeSearch = signal('');
  protected readonly deletedSearch = signal('');
  protected readonly activeWindowId = signal<number | null>(null);
  protected readonly deletedWindowId = signal<number | null>(null);
  protected readonly activePageSize = signal(10);
  protected readonly deletedPageSize = signal(10);
  protected readonly activeLoading = signal(false);
  protected readonly deletedLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly deleting = signal(false);
  protected readonly selectedDetails = signal<TerminalDetailsResponse | null>(null);
  protected readonly selectedEditId = signal<number | null>(null);
  protected readonly panelMode = signal<TerminalPanelMode>('closed');
  protected readonly windows = signal<readonly WindowOption[]>([]);
  protected readonly confirmDialog = signal<TerminalConfirmState | null>(null);
  protected readonly traceId = signal<string | null>(null);
  protected readonly message = signal<UiMessage | null>(null);
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private panelRequestId = 0;

  protected readonly terminalForm = this.formBuilder.group({
    windowId: [0, [Validators.required, Validators.min(1)]],
    number: ['', [Validators.required, Validators.maxLength(20), this.notWhitespaceValidator]],
    ipAddress: ['', [Validators.required, Validators.maxLength(45), (control: AbstractControl<string>) => this.ipAddressValidator(control)]],
    serialNo: ['', [Validators.required, Validators.maxLength(100), this.notWhitespaceValidator]],
    type: ['', [Validators.required, Validators.maxLength(100), this.notWhitespaceValidator]],
  });

  protected readonly windowIdControl = this.terminalForm.controls.windowId;
  protected readonly numberControl = this.terminalForm.controls.number;
  protected readonly ipAddressControl = this.terminalForm.controls.ipAddress;
  protected readonly serialNoControl = this.terminalForm.controls.serialNo;
  protected readonly typeControl = this.terminalForm.controls.type;

  ngOnInit(): void {
    this.loadWindows();
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

  protected switchTab(tab: TerminalTab): void {
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
      this.loadActiveTerminals(1);
      return;
    }

    this.loadDeletedTerminals(1);
  }

  protected updateActiveSearch(event: Event): void {
    this.activeSearch.set(this.readInputValue(event));
    this.loadActiveTerminalsWithReset();
  }

  protected updateDeletedSearch(event: Event): void {
    this.deletedSearch.set(this.readInputValue(event));
    this.loadDeletedTerminalsWithReset();
  }

  protected updateActiveWindowFilter(event: Event): void {
    this.activeWindowId.set(this.toOptionalNumber(this.readInputValue(event)));
    this.loadActiveTerminals(1);
  }

  protected updateDeletedWindowFilter(event: Event): void {
    this.deletedWindowId.set(this.toOptionalNumber(this.readInputValue(event)));
    this.loadDeletedTerminals(1);
  }

  protected updateActivePageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    this.activePageSize.set(this.normalizePageSize(value));
    this.loadActiveTerminals(1);
  }

  protected updateDeletedPageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    this.deletedPageSize.set(this.normalizePageSize(value));
    this.loadDeletedTerminals(1);
  }

  protected previousActivePage(): void {
    if (this.activeTerminalsPage().hasPreviousPage) {
      this.loadActiveTerminals(this.activeTerminalsPage().currentPage - 1);
    }
  }

  protected nextActivePage(): void {
    if (this.activeTerminalsPage().hasNextPage) {
      this.loadActiveTerminals(this.activeTerminalsPage().currentPage + 1);
    }
  }

  protected previousDeletedPage(): void {
    if (this.deletedTerminalsPage().hasPreviousPage) {
      this.loadDeletedTerminals(this.deletedTerminalsPage().currentPage - 1);
    }
  }

  protected nextDeletedPage(): void {
    if (this.deletedTerminalsPage().hasNextPage) {
      this.loadDeletedTerminals(this.deletedTerminalsPage().currentPage + 1);
    }
  }

  protected refreshActive(): void {
    this.loadActiveTerminals(this.activeTerminalsPage().currentPage);
  }

  protected refreshDeleted(): void {
    this.loadDeletedTerminals(this.deletedTerminalsPage().currentPage);
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
    this.terminalForm.enable({ emitEvent: false });
    this.resetTerminalForm(this.activeWindowId() ?? 0);
  }

  protected openView(item: TerminalListItemResponse): void {
    if (!this.canViewDetails()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    const terminalId = this.resolveTerminalId(item);

    if (!terminalId) {
      this.showMessage('error', this.translations().fallbackError);
      return;
    }

    this.openTerminalDetails(terminalId, 'view');
  }

  protected openEdit(item: TerminalListItemResponse): void {
    if (!this.canUpdate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    const terminalId = this.resolveTerminalId(item);

    if (!terminalId) {
      this.showMessage('error', this.translations().fallbackError);
      return;
    }

    this.openTerminalDetails(terminalId, 'edit', item);
  }

  protected closePanel(): void {
    this.panelRequestId += 1;
    this.panelMode.set('closed');
    this.selectedEditId.set(null);
    this.selectedDetails.set(null);
    this.terminalForm.enable({ emitEvent: false });
    this.resetTerminalForm();
    this.confirmDialog.set(null);
  }

  protected panelTitle(): string {
    if (this.panelMode() === 'create') {
      return this.translations().createTitle;
    }

    if (this.panelMode() === 'edit') {
      return this.translations().editTitle;
    }

    return this.translations().terminalDetails;
  }

  protected saveTerminal(): void {
    if (this.saving()) {
      return;
    }

    if (this.terminalForm.invalid) {
      this.terminalForm.markAllAsTouched();
      return;
    }

    if (this.panelMode() === 'create') {
      this.createTerminal();
      return;
    }

    if (this.panelMode() === 'edit') {
      this.updateTerminal();
    }
  }

  protected requestSoftDelete(item: TerminalListItemResponse): void {
    if (!this.canDeactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    const terminalId = this.resolveTerminalId(item);

    if (!terminalId) {
      this.showMessage('error', this.translations().fallbackError);
      return;
    }

    this.confirmDialog.set({
      kind: 'deactivate',
      terminalId,
      terminalNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected requestRestore(item: DeletedTerminalListItemResponse): void {
    if (!this.canReactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    const terminalId = this.resolveTerminalId(item);

    if (!terminalId) {
      this.showMessage('error', this.translations().fallbackError);
      return;
    }

    this.confirmDialog.set({
      kind: 'reactivate',
      terminalId,
      terminalNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected requestPermanentDelete(item: DeletedTerminalListItemResponse): void {
    if (!this.canDeletePermanent()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    const terminalId = this.resolveTerminalId(item);

    if (!terminalId) {
      this.showMessage('error', this.translations().fallbackError);
      return;
    }

    this.confirmDialog.set({
      kind: 'permanent',
      terminalId,
      terminalNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected confirmAction(): void {
    const action = this.confirmDialog();

    if (!action || this.deleting()) {
      return;
    }

    if (action.kind === 'deactivate') {
      this.deactivateTerminal(action);
      return;
    }

    if (action.kind === 'reactivate') {
      this.reactivateTerminal(action);
      return;
    }

    this.permanentlyDeleteTerminal(action);
  }

  protected closeConfirmDialog(): void {
    if (this.deleting()) {
      return;
    }

    this.confirmDialog.set(null);
  }

  protected hasTerminalFormError(
    controlName: 'windowId' | 'number' | 'ipAddress' | 'serialNo' | 'type',
  ): boolean {
    const control = this.terminalForm.controls[controlName];
    return control.touched && control.invalid;
  }

  protected windowOptionLabel(windowItem: WindowOption): string {
    const windowLabel = windowItem.number.trim().length > 0 ? windowItem.number : this.translations().notAvailable;
    const waitingAreaLabel = this.formatText(
      windowItem.waitingAreaDescriptiveName ?? String(windowItem.waitingAreaNumber),
    );

    return `${windowLabel} - ${this.translations().waitingAreaNumber}: ${windowItem.waitingAreaNumber} ${waitingAreaLabel}`;
  }

  protected terminalIdentity(terminal: TerminalListItemResponse): number {
    return this.resolveTerminalId(terminal) || Number.NEGATIVE_INFINITY;
  }

  protected hasTerminalIdentity(terminal: TerminalListItemResponse): boolean {
    return this.resolveTerminalId(terminal) > 0;
  }

  protected terminalWindowLabel(terminal: TerminalListItemResponse): string {
    return `${this.translations().windowNumber} ${terminal.windowNumber}`;
  }

  protected terminalWaitingAreaLabel(terminal: TerminalListItemResponse): string {
    return `${this.translations().waitingAreaNumber}: ${terminal.waitingAreaNumber}`;
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
    if (!this.hasTerminalAccess()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    if (this.activeTab() === 'active') {
      this.loadActiveTerminals(1);
      return;
    }

    this.loadDeletedTerminals(1);
  }

  private loadActiveTerminals(pageNumber = this.activeTerminalsPage().currentPage, force = false): void {
    if (!this.canViewActive() || (this.activeLoading() && !force)) {
      return;
    }

    this.activeLoading.set(true);
    this.traceId.set(null);

    this.terminalManagementApiService
      .getTerminals(this.buildQuery(this.activeSearch(), this.activeWindowId(), pageNumber, this.activePageSize(), true))
      .subscribe({
        next: (response) => {
          this.activeTerminalsPage.set(this.normalizeTerminalPage(response));
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.activeLoading.set(false),
      });
  }

  private loadDeletedTerminals(pageNumber = this.deletedTerminalsPage().currentPage): void {
    if (!this.canViewDeleted() || this.deletedLoading()) {
      return;
    }

    this.deletedLoading.set(true);
    this.traceId.set(null);

    this.terminalManagementApiService
      .getTerminals(this.buildQuery(this.deletedSearch(), this.deletedWindowId(), pageNumber, this.deletedPageSize(), false))
      .subscribe({
        next: (response) => this.deletedTerminalsPage.set(this.normalizeTerminalPage(response)),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.deletedLoading.set(false),
      });
  }

  private loadWindows(): void {
    const query: GetWindowsParams = {
      pageNumber: 1,
      pageSize: 100,
      search: '',
      isActive: true,
    };

    this.windowManagementApiService.getWindows(query).subscribe({
      next: (response) => {
        this.windows.set(
          response.data.map((windowItem: WindowListItemResponse) => ({
            id: windowItem.id,
            number: windowItem.number,
            waitingAreaNumber: windowItem.waitingAreaNumber,
            waitingAreaDescriptiveName: windowItem.waitingAreaDescriptiveName,
          }))
        );
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
    });
  }

  private resetTerminalForm(windowId = 0): void {
    this.terminalForm.reset({
      windowId,
      number: '',
      ipAddress: '',
      serialNo: '',
      type: '',
    });
    this.terminalForm.markAsPristine();
    this.terminalForm.markAsUntouched();
  }

  private openTerminalDetails(
    terminalId: number,
    mode: Extract<TerminalPanelMode, 'view' | 'edit'>,
    sourceItem?: TerminalListItemResponse,
  ): void {
    const requestId = ++this.panelRequestId;

    this.selectedEditId.set(mode === 'edit' ? terminalId : null);
    this.selectedDetails.set(null);
    this.confirmDialog.set(null);
    this.clearMessage();
    this.terminalForm.enable({ emitEvent: false });
    this.resetTerminalForm();

    if (mode === 'edit' && sourceItem) {
      this.patchTerminalForm(sourceItem);
      this.windowIdControl.disable({ emitEvent: false });
    }

    this.panelMode.set(mode);

    this.terminalManagementApiService.getTerminalById(terminalId).subscribe({
      next: (response) => {
        if (requestId !== this.panelRequestId || this.panelMode() !== mode) {
          return;
        }

        this.selectedDetails.set(response);
        this.patchTerminalForm(response);

        if (mode === 'edit') {
          this.windowIdControl.disable({ emitEvent: false });
        }
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.panelRequestId || this.panelMode() !== mode) {
          return;
        }

        this.handleApiError(error);

        if (mode !== 'edit' || !sourceItem) {
          this.closePanel();
        }
      },
    });
  }

  private patchTerminalForm(terminal: TerminalListItemResponse): void {
    this.terminalForm.reset({
      windowId: terminal.windowId,
      number: terminal.number,
      ipAddress: terminal.ipAddress,
      serialNo: terminal.serialNo,
      type: terminal.type,
    });
  }

  private normalizeTerminalPage<TItem extends TerminalListItemResponse>(
    page: PaginationResponse<TItem>,
  ): PaginationResponse<TItem> {
    return {
      ...page,
      data: page.data.map((item) => this.normalizeTerminalItem(item)),
    };
  }

  private normalizeTerminalItem<TItem extends TerminalListItemResponse>(item: TItem): TItem {
    const terminalId = this.resolveTerminalId(item);

    if (!terminalId || item.id === terminalId) {
      return item;
    }

    return {
      ...item,
      id: terminalId,
    };
  }

  private resolveTerminalId(item: TerminalListItemResponse): number {
    const terminalId = [
      item.id,
      item.terminalId,
      item.terminalID,
      item.terminal_id,
      item.Id,
      item.ID,
      item.TerminalId,
      item.TerminalID,
    ].find((value) => this.isPositiveNumber(value));

    return terminalId ?? 0;
  }

  private isPositiveNumber(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }

  private createTerminal(): void {
    if (!this.canCreate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.saving.set(true);

    this.terminalManagementApiService.createTerminal(this.mapCreateRequest()).subscribe({
      next: (response: CreateTerminalResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.closePanel();
        this.activeTab.set('active');
        this.loadActiveTerminals(1, true);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private updateTerminal(): void {
    const terminalId = this.selectedEditId();

    if (!terminalId || !this.canUpdate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.saving.set(true);

    this.terminalManagementApiService.updateTerminal(terminalId, this.mapUpdateRequest()).subscribe({
      next: (response: UpdateTerminalResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.closePanel();
        this.loadActiveTerminals(this.activeTerminalsPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private deactivateTerminal(action: TerminalConfirmState): void {
    if (!this.canDeactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.terminalManagementApiService.deactivateTerminal(action.terminalId, action.rowVersion).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.activeTerminalsPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadActiveTerminals(nextPage);
        this.loadDeletedTerminals(this.deletedTerminalsPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private reactivateTerminal(action: TerminalConfirmState): void {
    if (!this.canReactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.terminalManagementApiService.reactivateTerminal(action.terminalId, action.rowVersion).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.deletedTerminalsPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadDeletedTerminals(nextPage);
        this.loadActiveTerminals(this.activeTerminalsPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private permanentlyDeleteTerminal(action: TerminalConfirmState): void {
    if (!this.canDeletePermanent()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.terminalManagementApiService.permanentlyDeleteTerminal(action.terminalId, action.rowVersion).subscribe({
      next: (response: PermanentDeleteTerminalResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.deletedTerminalsPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadDeletedTerminals(nextPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        if (error.status === 409 || error.status === 404) {
          this.loadDeletedTerminals(this.deletedTerminalsPage().currentPage);
        }
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private loadActiveTerminalsWithReset(): void {
    if (this.activeSearchDebounceId) {
      clearTimeout(this.activeSearchDebounceId);
    }

    this.activeSearchDebounceId = setTimeout(() => this.loadActiveTerminals(1), 350);
  }

  private loadDeletedTerminalsWithReset(): void {
    if (this.deletedSearchDebounceId) {
      clearTimeout(this.deletedSearchDebounceId);
    }

    this.deletedSearchDebounceId = setTimeout(() => this.loadDeletedTerminals(1), 350);
  }

  private buildQuery(
    search: string,
    windowId: number | null,
    pageNumber: number,
    pageSize: number,
    isActive: boolean,
  ): GetTerminalsParams {
    return {
      windowId: windowId ?? undefined,
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

  private mapCreateRequest(): CreateTerminalRequest {
    const value = this.terminalForm.getRawValue();

    return {
      windowId: Number(value.windowId),
      number: value.number.trim(),
      ipAddress: value.ipAddress.trim(),
      serialNo: value.serialNo.trim(),
      type: value.type.trim(),
    };
  }

  private mapUpdateRequest(): UpdateTerminalRequest {
    const value = this.terminalForm.getRawValue();

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