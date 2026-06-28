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
import { WaitingAreaApiService } from '../../services/waiting-area-api.service';
import { WindowManagementApiService } from '../../services/window-management-api.service';
import { WindowPermissionService } from '../../services/window-permission.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../utils/api-error-message.util';
import {
  CreateWindowRequest,
  CreateWindowResponse,
  GetWindowsParams,
  PaginationResponse,
  PermanentDeleteWindowResponse,
  UpdateWindowRequest,
  WindowDetailsResponse,
  WindowListItemResponse,
} from '../../models/window-management.model';

type WindowTab = 'active' | 'deleted';
type WindowPanelMode = 'closed' | 'create' | 'edit' | 'view';
type DeletedWindowListItemResponse = WindowListItemResponse;
type MessageTone = 'success' | 'error' | 'info';
type DeleteDialogKind = 'deactivate' | 'reactivate' | 'permanent';

interface UiMessage {
  readonly tone: MessageTone;
  readonly text: string;
}

interface WindowTranslations {
  readonly title: string;
  readonly description: string;
  readonly activeTab: string;
  readonly deletedTab: string;
  readonly addWindow: string;
  readonly searchPlaceholder: string;
  readonly waitingAreaFilter: string;
  readonly allWaitingAreas: string;
  readonly pageSize: string;
  readonly loading: string;
  readonly noItems: string;
  readonly totalItems: string;
  readonly previous: string;
  readonly next: string;
  readonly windowNumber: string;
  readonly descriptiveName: string;
  readonly waitingArea: string;
  readonly ipAddress: string;
  readonly waitingAreaNumberLabel: string;
  readonly ticketBooking: string;
  readonly directCall: string;
  readonly deletedOn: string;
  readonly actions: string;
  readonly view: string;
  readonly edit: string;
  readonly deactivate: string;
  readonly reactivate: string;
  readonly permanentDelete: string;
  readonly enabled: string;
  readonly disabled: string;
  readonly yes: string;
  readonly no: string;
  readonly details: string;
  readonly windowDetails: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly close: string;
  readonly cancel: string;
  readonly save: string;
  readonly requiredField: string;
  readonly maxLength20: string;
  readonly maxLength100: string;
  readonly invalidIp: string;
  readonly selectWaitingArea: string;
  readonly refresh: string;
  readonly deleteConfirm: string;
  readonly permanentDeleteConfirm: string;
  readonly deleteConfirmBody: string;
  readonly permanentDeleteConfirmBody: string;
  readonly permanentDeleteAdditionalBody: string;
  readonly fallbackSuccess: string;
  readonly fallbackError: string;
  readonly accessDenied: string;
  readonly noPermissionHint: string;
  readonly createdOn: string;
  readonly modifiedOn: string;
  readonly traceIdLabel: string;
  readonly notAvailable: string;
}

interface WindowConfirmState {
  readonly kind: DeleteDialogKind;
  readonly windowId: number;
  readonly title: string;
  readonly windowNumber: string;
  readonly rowVersion: string;
}

interface WaitingAreaOption {
  readonly id: number;
  readonly number: number;
  readonly descriptiveName: string | null;
}

const WINDOW_TRANSLATIONS: Record<AppLanguage, WindowTranslations> = {
  ar: {
    title: '\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0646\u0648\u0627\u0641\u0630',
    description: '\u0625\u062f\u0627\u0631\u0629 \u0646\u0648\u0627\u0641\u0630 \u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631 \u0648\u0639\u0645\u0644\u064a\u0627\u062a\u0647\u0627.',
    activeTab: '\u0627\u0644\u0646\u0648\u0627\u0641\u0630 \u0627\u0644\u0646\u0634\u0637\u0629',
    deletedTab: '\u0627\u0644\u0646\u0648\u0627\u0641\u0630 \u063a\u064a\u0631 \u0627\u0644\u0646\u0634\u0637\u0629',
    addWindow: '\u0625\u0636\u0627\u0641\u0629 \u0646\u0627\u0641\u0630\u0629',
    searchPlaceholder: '\u0627\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u0623\u0648 \u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0639\u0646\u0648\u0627\u0646 IP',
    waitingAreaFilter: '\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    allWaitingAreas: '\u0643\u0644 \u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    pageSize: '\u062d\u062c\u0645 \u0627\u0644\u0635\u0641\u062d\u0629',
    loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    noItems: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0646\u0648\u0627\u0641\u0630.',
    totalItems: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0646\u0627\u0635\u0631',
    previous: '\u0627\u0644\u0633\u0627\u0628\u0642',
    next: '\u0627\u0644\u062a\u0627\u0644\u064a',
    windowNumber: '\u0631\u0642\u0645 \u0627\u0644\u0646\u0627\u0641\u0630\u0629',
    descriptiveName: '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0648\u0635\u0641\u064a',
    waitingArea: '\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    ipAddress: '\u0639\u0646\u0648\u0627\u0646 IP',
    waitingAreaNumberLabel: '\u0631\u0642\u0645 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    ticketBooking: '\u062d\u062c\u0632 \u0627\u0644\u062a\u0630\u0627\u0643\u0631',
    directCall: '\u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0645\u0628\u0627\u0634\u0631',
    deletedOn: '\u0627\u0644\u062d\u0627\u0644\u0629',
    actions: '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    view: '\u0639\u0631\u0636',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    deactivate: '\u0625\u064a\u0642\u0627\u0641',
    reactivate: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0646\u0634\u064a\u0637',
    permanentDelete: '\u062d\u0630\u0641 \u062f\u0627\u0626\u0645',
    enabled: '\u0645\u0641\u0639\u0644',
    disabled: '\u0645\u0639\u0637\u0644',
    yes: '\u0646\u0639\u0645',
    no: '\u0644\u0627',
    details: '\u062a\u0641\u0627\u0635\u064a\u0644',
    windowDetails: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0646\u0627\u0641\u0630\u0629',
    createTitle: '\u0625\u0646\u0634\u0627\u0621 \u0646\u0627\u0641\u0630\u0629',
    editTitle: '\u062a\u0639\u062f\u064a\u0644 \u0646\u0627\u0641\u0630\u0629',
    close: '\u0625\u063a\u0644\u0627\u0642',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    save: '\u062d\u0641\u0638',
    requiredField: '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.',
    maxLength20: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 20 \u062d\u0631\u0641\u064b\u0627.',
    maxLength100: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 100 \u062d\u0631\u0641.',
    invalidIp: '\u0639\u0646\u0648\u0627\u0646 IP \u063a\u064a\u0631 \u0635\u062d\u064a\u062d.',
    selectWaitingArea: '\u062d\u062f\u062f \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    refresh: '\u062a\u062d\u062f\u064a\u062b',
    deleteConfirm: '\u062a\u0623\u0643\u064a\u062f \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0646\u0627\u0641\u0630\u0629',
    permanentDeleteConfirm: '\u062a\u0623\u0643\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u0646\u0647\u0627\u0626\u064a\u064b\u0627',
    deleteConfirmBody: '\u0647\u0644 \u062a\u0631\u064a\u062f \u0625\u064a\u0642\u0627\u0641 \u0647\u0630\u0647 \u0627\u0644\u0646\u0627\u0641\u0630\u0629\u061f',
    permanentDeleteConfirmBody: '\u0633\u064a\u062a\u0645 \u062d\u0630\u0641 \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u0646\u0647\u0627\u0626\u064a\u064b\u0627 \u0648\u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646 \u0630\u0644\u0643.',
    permanentDeleteAdditionalBody:
      '\u0642\u062f \u062a\u0641\u0634\u0644 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0625\u0630\u0627 \u0643\u0627\u0646\u062a \u0627\u0644\u0646\u0627\u0641\u0630\u0629 \u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u062c\u0647\u0627\u0632 \u0637\u0631\u0641\u064a \u0623\u0648 \u0646\u0627\u0641\u0630\u0629 \u0639\u0631\u0636.',
    fallbackSuccess: '\u062a\u0645\u062a \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0628\u0646\u062c\u0627\u062d.',
    fallbackError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639.',
    accessDenied: '\u0627\u0644\u0635\u0644\u0627\u062d\u064a\u0629 \u0627\u0644\u0645\u0637\u0644\u0648\u0628\u0629 \u063a\u064a\u0631 \u0643\u0627\u0641\u064a\u0629.',
    noPermissionHint: '\u0644\u064a\u0633\u062a \u0644\u062f\u064a\u0643 \u0635\u0644\u0627\u062d\u064a\u0629 \u0644\u062a\u0646\u0641\u064a\u0630 \u0647\u0630\u0627 \u0627\u0644\u0625\u062c\u0631\u0627\u0621.',
    createdOn: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621',
    modifiedOn: '\u062a\u0627\u0631\u064a\u062e \u0622\u062e\u0631 \u062a\u0639\u062f\u064a\u0644',
    traceIdLabel: '\u0645\u0639\u0631\u0641 \u0627\u0644\u062a\u062a\u0628\u0639',
    notAvailable: '-',
  },
  en: {
    title: 'Window Management',
    description: 'Manage all waiting queue windows with full CRUD operations.',
    activeTab: 'Active Windows',
    deletedTab: 'Deleted Windows',
    addWindow: 'Add Window',
    searchPlaceholder: 'Search by window number, name, or IP',
    waitingAreaFilter: 'Waiting Area',
    allWaitingAreas: 'All Waiting Areas',
    pageSize: 'Page size',
    loading: 'Loading...',
    noItems: 'No windows found.',
    totalItems: 'Total items',
    previous: 'Previous',
    next: 'Next',
    windowNumber: 'Window Number',
    descriptiveName: 'Descriptive Name',
    waitingArea: 'Waiting Area',
    ipAddress: 'IP Address',
    waitingAreaNumberLabel: 'Waiting Area Number',
    ticketBooking: 'Ticket Booking',
    directCall: 'Direct Call',
    deletedOn: 'Status',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    permanentDelete: 'Permanent Delete',
    enabled: 'Enabled',
    disabled: 'Disabled',
    yes: 'Yes',
    no: 'No',
    details: 'Details',
    windowDetails: 'Window Details',
    createTitle: 'Create Window',
    editTitle: 'Edit Window',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    requiredField: 'This field is required.',
    maxLength20: 'Maximum length is 20 characters.',
    maxLength100: 'Maximum length is 100 characters.',
    invalidIp: 'IP Address is invalid.',
    selectWaitingArea: 'Select waiting area',
    refresh: 'Refresh',
    deleteConfirm: 'Deactivate Window',
    permanentDeleteConfirm: 'Permanently Delete Window',
    deleteConfirmBody: 'Are you sure you want to deactivate this window?',
    permanentDeleteConfirmBody: 'This action permanently deletes the window and cannot be undone.',
    permanentDeleteAdditionalBody:
      'Operation will fail when the window is linked to a terminal or display window.',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    accessDenied: 'Access denied.',
    noPermissionHint: 'You do not have permission for this action.',
    createdOn: 'Created On',
    modifiedOn: 'Modified On',
    traceIdLabel: 'Trace ID',
    notAvailable: '-',
  },
};

const EMPTY_WINDOW_PAGE: PaginationResponse<WindowListItemResponse> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

const EMPTY_DELETED_WINDOW_PAGE: PaginationResponse<DeletedWindowListItemResponse> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

@Component({
  selector: 'app-windows',
  imports: [ReactiveFormsModule],
  templateUrl: './windows.component.html',
  styleUrl: './windows.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowsComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly permissionService = inject(WindowPermissionService);
  private readonly waitingAreaApiService = inject(WaitingAreaApiService);
  private readonly windowsApiService = inject(WindowManagementApiService);

  private activeSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private deletedSearchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private panelRequestId = 0;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly translations = computed(() => WINDOW_TRANSLATIONS[this.i18nStore.language()]);

  protected readonly canViewActive = this.permissionService.canViewAll;
  protected readonly canViewDetails = this.permissionService.canViewDetails;
  protected readonly canCreate = this.permissionService.canCreate;
  protected readonly canUpdate = this.permissionService.canUpdate;
  protected readonly canDeactivate = this.permissionService.canDeactivate;
  protected readonly canReactivate = this.permissionService.canReactivate;
  protected readonly canDeletePermanent = this.permissionService.canDeletePermanent;
  protected readonly canViewDeleted = computed(() => this.canReactivate() || this.canDeletePermanent());

  protected readonly activeTab = signal<WindowTab>(this.canViewActive() ? 'active' : 'deleted');
  protected readonly hasWindowAccess = computed(
    () => this.canViewActive() || this.canViewDeleted(),
  );

  protected readonly activeWindowsPage =
    signal<PaginationResponse<WindowListItemResponse>>(EMPTY_WINDOW_PAGE);
  protected readonly deletedWindowsPage =
    signal<PaginationResponse<DeletedWindowListItemResponse>>(EMPTY_DELETED_WINDOW_PAGE);
  protected readonly activeSearch = signal('');
  protected readonly deletedSearch = signal('');
  protected readonly activeWaitingAreaId = signal<number | null>(null);
  protected readonly deletedWaitingAreaId = signal<number | null>(null);
  protected readonly activePageSize = signal(10);
  protected readonly deletedPageSize = signal(10);
  protected readonly activeLoading = signal(false);
  protected readonly deletedLoading = signal(false);
  protected readonly deleting = signal(false);
  protected readonly saving = signal(false);
  protected readonly selectedDetails = signal<WindowDetailsResponse | null>(null);
  protected readonly selectedEditId = signal<number | null>(null);
  protected readonly panelMode = signal<WindowPanelMode>('closed');
  protected readonly waitingAreas = signal<readonly WaitingAreaOption[]>([]);
  protected readonly confirmDialog = signal<WindowConfirmState | null>(null);
  protected readonly traceId = signal<string | null>(null);
  protected readonly message = signal<UiMessage | null>(null);

  protected readonly windowForm = this.formBuilder.group({
    waitingAreaId: [0, [Validators.required, Validators.min(1)]],
    number: ['', [Validators.required, Validators.maxLength(20), this.notWhitespaceValidator]],
    descriptiveName: ['', [Validators.maxLength(100)]],
    ipAddress: ['', [Validators.maxLength(45), (control: AbstractControl<string>) => this.ipAddressValidator(control)]],
    enableTicketBooking: [false],
    enableDirectCall: [false],
  });

  protected readonly waitingAreaIdControl = this.windowForm.controls.waitingAreaId;
  protected readonly numberControl = this.windowForm.controls.number;
  protected readonly descriptiveNameControl = this.windowForm.controls.descriptiveName;
  protected readonly ipAddressControl = this.windowForm.controls.ipAddress;

  ngOnInit(): void {
    this.loadWaitingAreas();
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
  protected switchTab(tab: WindowTab): void {
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
      this.loadActiveWindows(1);
      return;
    }

    if (this.canViewDeleted()) {
      this.loadDeletedWindows(1);
    }
  }

  protected updateActiveSearch(event: Event): void {
    this.activeSearch.set(this.readInputValue(event));
    this.loadActiveWindowsWithReset();
  }

  protected updateDeletedSearch(event: Event): void {
    this.deletedSearch.set(this.readInputValue(event));
    this.loadDeletedWindowsWithReset();
  }

  protected updateActiveWaitingAreaFilter(event: Event): void {
    this.activeWaitingAreaId.set(this.toOptionalNumber(this.readInputValue(event)));
    this.loadActiveWindows(1);
  }

  protected updateDeletedWaitingAreaFilter(event: Event): void {
    this.deletedWaitingAreaId.set(this.toOptionalNumber(this.readInputValue(event)));
    this.loadDeletedWindows(1);
  }

  protected updateActivePageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    this.activePageSize.set(this.normalizePageSize(value));
    this.loadActiveWindows(1);
  }

  protected updateDeletedPageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    this.deletedPageSize.set(this.normalizePageSize(value));
    this.loadDeletedWindows(1);
  }

  protected previousActivePage(): void {
    if (this.activeWindowsPage().hasPreviousPage) {
      this.loadActiveWindows(this.activeWindowsPage().currentPage - 1);
    }
  }

  protected nextActivePage(): void {
    if (this.activeWindowsPage().hasNextPage) {
      this.loadActiveWindows(this.activeWindowsPage().currentPage + 1);
    }
  }

  protected previousDeletedPage(): void {
    if (this.deletedWindowsPage().hasPreviousPage) {
      this.loadDeletedWindows(this.deletedWindowsPage().currentPage - 1);
    }
  }

  protected nextDeletedPage(): void {
    if (this.deletedWindowsPage().hasNextPage) {
      this.loadDeletedWindows(this.deletedWindowsPage().currentPage + 1);
    }
  }

  protected refreshActive(): void {
    this.loadActiveWindows(this.activeWindowsPage().currentPage);
  }

  protected refreshDeleted(): void {
    this.loadDeletedWindows(this.deletedWindowsPage().currentPage);
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
    this.windowForm.enable();
    this.windowForm.reset({
      waitingAreaId: this.activeWaitingAreaId() ?? 0,
      number: '',
      descriptiveName: '',
      ipAddress: '',
      enableTicketBooking: false,
      enableDirectCall: false,
    });
  }

  protected openView(windowId: number): void {
    if (!this.canViewDetails()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.openWindowDetails(windowId, 'view');
  }

  protected openEdit(windowId: number): void {
    if (!this.canUpdate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.openWindowDetails(windowId, 'edit');
  }

  protected closePanel(): void {
    this.panelRequestId += 1;
    this.panelMode.set('closed');
    this.selectedEditId.set(null);
    this.selectedDetails.set(null);
    this.windowForm.markAsPristine();
    this.windowForm.enable();
    this.confirmDialog.set(null);
  }

  protected panelTitle(): string {
    if (this.panelMode() === 'create') {
      return this.translations().createTitle;
    }

    if (this.panelMode() === 'edit') {
      return this.translations().editTitle;
    }

    return this.translations().windowDetails;
  }

  protected saveWindow(): void {
    if (this.saving()) {
      return;
    }

    if (!this.isWindowFormValid()) {
      this.windowForm.markAllAsTouched();
      return;
    }

    if (this.panelMode() === 'create') {
      this.createWindow();
      return;
    }

    if (this.panelMode() === 'edit') {
      this.updateWindow();
    }
  }

  protected requestSoftDelete(item: WindowListItemResponse): void {
    if (!this.canDeactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.confirmDialog.set({
      kind: 'deactivate',
      windowId: item.id,
      title: this.translations().deleteConfirm,
      windowNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected requestReactivate(item: DeletedWindowListItemResponse): void {
    if (!this.canReactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.confirmDialog.set({
      kind: 'reactivate',
      windowId: item.id,
      title: this.translations().reactivate,
      windowNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected requestPermanentDelete(item: DeletedWindowListItemResponse): void {
    if (!this.canDeletePermanent()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.confirmDialog.set({
      kind: 'permanent',
      windowId: item.id,
      title: this.translations().permanentDeleteConfirm,
      windowNumber: item.number,
      rowVersion: item.rowVersion,
    });
  }

  protected confirmDelete(): void {
    const state = this.confirmDialog();

    if (!state || this.deleting()) {
      return;
    }

    if (state.kind === 'deactivate') {
      this.deactivateWindow(state);
      return;
    }

    if (state.kind === 'reactivate') {
      this.reactivateWindow(state);
      return;
    }

    this.permanentlyDeleteWindow(state);
  }

  protected closeConfirmDialog(): void {
    if (this.deleting()) {
      return;
    }

    this.confirmDialog.set(null);
  }

  protected hasWindowFormError(
    controlName: 'waitingAreaId' | 'number' | 'descriptiveName' | 'ipAddress',
  ): boolean {
    const control = this.windowForm.controls[controlName];
    return control.touched && control.invalid;
  }

  protected waitingAreaLabel(area: WaitingAreaOption): string {
    const name = area.descriptiveName?.trim()?.length
      ? area.descriptiveName
      : this.translations().notAvailable;

    return `${area.number} - ${name}`;
  }

  protected displayBoolean(value: boolean): string {
    return value ? this.translations().yes : this.translations().no;
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
    if (!this.hasWindowAccess()) {
      this.showMessage('error', this.translations().accessDenied);
      return;
    }

    if (this.activeTab() === 'active') {
      this.loadActiveWindows(1);
      return;
    }

    this.loadDeletedWindows(1);
  }

  private loadActiveWindows(pageNumber = this.activeWindowsPage().currentPage, force = false): void {
    if (!this.canViewActive() || (this.activeLoading() && !force)) {
      return;
    }

    this.activeLoading.set(true);
    this.traceId.set(null);

    this.windowsApiService
      .getWindows(
        this.buildQuery(this.activeSearch(), this.activeWaitingAreaId(), pageNumber, this.activePageSize(), true),
      )
      .subscribe({
        next: (response) => {
          this.activeWindowsPage.set(response);
          this.clearMessage();
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.activeLoading.set(false),
      });
  }

  private loadDeletedWindows(pageNumber = this.deletedWindowsPage().currentPage): void {
    if (!this.canViewDeleted() || this.deletedLoading()) {
      return;
    }

    this.deletedLoading.set(true);
    this.traceId.set(null);

    this.windowsApiService
      .getWindows(this.buildQuery(this.deletedSearch(), this.deletedWaitingAreaId(), pageNumber, this.deletedPageSize(), false),
      )
      .subscribe({
        next: (response) => this.deletedWindowsPage.set(response),
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.deletedLoading.set(false),
      });
  }

  private loadWaitingAreas(): void {
    this.waitingAreaApiService
      .getWaitingAreas({
        branchId: null,
        search: '',
        pageNumber: 1,
        pageSize: 100,
      isActive: true,
      })
      .subscribe({
        next: (response) => {
          this.waitingAreas.set(
            response.data.map((area) => ({
              id: area.id,
              number: area.number,
              descriptiveName: area.descriptiveName ?? null,
            })),
          );
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
      });
  }

  private openWindowDetails(
    windowId: number,
    mode: Extract<WindowPanelMode, 'view' | 'edit'>,
  ): void {
    const requestId = ++this.panelRequestId;

    this.panelMode.set(mode);
    this.selectedEditId.set(mode === 'edit' ? windowId : null);
    this.selectedDetails.set(null);
    this.confirmDialog.set(null);
    this.clearMessage();

    this.windowForm.enable({ emitEvent: false });

    if (mode === 'edit') {
      this.waitingAreaIdControl.disable({ emitEvent: false });
    }

    this.windowsApiService.getWindowById(windowId).subscribe({
      next: (response) => {
        if (requestId !== this.panelRequestId || this.panelMode() !== mode) {
          return;
        }

        this.selectedDetails.set(response);

        this.windowForm.reset({
          waitingAreaId: response.waitingAreaId,
          number: response.number,
          descriptiveName: response.descriptiveName ?? '',
          ipAddress: response.ipAddress ?? '',
          enableTicketBooking: response.enableTicketBooking,
          enableDirectCall: response.enableDirectCall,
        });

        if (mode === 'edit') {
          this.waitingAreaIdControl.disable({ emitEvent: false });
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

  private createWindow(): void {
    if (!this.canCreate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.saving.set(true);

    this.windowsApiService.createWindow(this.mapCreateRequest()).subscribe({
      next: (response: CreateWindowResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.closePanel();
        this.activeTab.set('active');
        this.loadActiveWindows(1, true);
        if (this.canViewDeleted()) {
          this.loadDeletedWindows(this.deletedWindowsPage().currentPage);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private updateWindow(): void {
    const windowId = this.selectedEditId();

    if (!windowId || !this.canUpdate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.saving.set(true);

    this.windowsApiService.updateWindow(windowId, this.mapUpdateRequest()).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.closePanel();
        this.loadActiveWindows(this.activeWindowsPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.saving.set(false);
      },
      complete: () => this.saving.set(false),
    });
  }

  private deactivateWindow(state: WindowConfirmState): void {
    if (!this.canDeactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.windowsApiService.deactivateWindow(state.windowId, state.rowVersion).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.activeWindowsPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadActiveWindows(nextPage);

        if (this.canViewDeleted()) {
          this.loadDeletedWindows(this.deletedWindowsPage().currentPage);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private reactivateWindow(state: WindowConfirmState): void {
    if (!this.canReactivate()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.windowsApiService.reactivateWindow(state.windowId, state.rowVersion).subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.deletedWindowsPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadDeletedWindows(nextPage);
        this.loadActiveWindows(this.activeWindowsPage().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private permanentlyDeleteWindow(state: WindowConfirmState): void {
    if (!this.canDeletePermanent()) {
      this.showMessage('error', this.translations().noPermissionHint);
      return;
    }

    this.deleting.set(true);

    this.windowsApiService.permanentlyDeleteWindow(state.windowId, state.rowVersion).subscribe({
      next: (response: PermanentDeleteWindowResponse) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        this.confirmDialog.set(null);
        const currentPage = this.deletedWindowsPage();
        const nextPage =
          currentPage.data.length === 1 && currentPage.currentPage > 1
            ? currentPage.currentPage - 1
            : currentPage.currentPage;
        this.loadDeletedWindows(nextPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleApiError(error);
        if (error.status === 409 || error.status === 404) {
          this.loadActiveWindows(this.activeWindowsPage().currentPage);
          this.loadDeletedWindows(this.deletedWindowsPage().currentPage);
        }
        this.confirmDialog.set(null);
      },
      complete: () => this.deleting.set(false),
    });
  }

  private loadActiveWindowsWithReset(): void {
    if (this.activeSearchDebounceId) {
      clearTimeout(this.activeSearchDebounceId);
    }

    this.activeSearchDebounceId = setTimeout(() => this.loadActiveWindows(1), 350);
  }

  private loadDeletedWindowsWithReset(): void {
    if (this.deletedSearchDebounceId) {
      clearTimeout(this.deletedSearchDebounceId);
    }

    this.deletedSearchDebounceId = setTimeout(() => this.loadDeletedWindows(1), 350);
  }

  private buildQuery(
    search: string,
    waitingAreaId: number | null,
    pageNumber: number,
    pageSize: number,
    isActive: boolean,
  ): GetWindowsParams {
    return {
      waitingAreaId: waitingAreaId ?? undefined,
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

  private isWindowFormValid(): boolean {
    return this.windowForm.valid;
  }

  private mapCreateRequest(): CreateWindowRequest {
    const value = this.windowForm.getRawValue();

    return {
      waitingAreaId: Number(value.waitingAreaId),
      number: value.number.trim(),
      descriptiveName: this.toOptionalString(value.descriptiveName),
      ipAddress: this.toOptionalString(value.ipAddress),
      enableTicketBooking: value.enableTicketBooking,
      enableDirectCall: value.enableDirectCall,
    };
  }

  private mapUpdateRequest(): UpdateWindowRequest {
    const value = this.windowForm.getRawValue();

    return {
      number: value.number.trim(),
      descriptiveName: this.toOptionalString(value.descriptiveName),
      ipAddress: this.toOptionalString(value.ipAddress),
      enableTicketBooking: value.enableTicketBooking,
      enableDirectCall: value.enableDirectCall,
      rowVersion: this.selectedDetails()?.rowVersion ?? '',
    };
  }

  private toOptionalString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private toOptionalNumber(value: string): number | null {
    const parsed = Number(value);

    if (!value || !Number.isInteger(parsed) || parsed <= 0) {
      return null;
    }

    return parsed;
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

    const message = this.extractApiMessage(error);
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
      if (!/^(\d{1,3})$/.test(octet)) {
        return false;
      }

      const numeric = Number(octet);
      return numeric >= 0 && numeric <= 255;
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
