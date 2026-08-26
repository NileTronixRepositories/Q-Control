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
import { MobileRecordCardComponent } from '../../../../shared/components/mobile-record-card/mobile-record-card.component';
import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { Router } from '@angular/router';

import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { WaitingAreaApiService } from '../../services/waiting-area-api/waiting-area-api.service';
import { WindowManagementApiService } from '../../services/window-management-api/window-management-api.service';
import { WindowPermissionService } from '../../services/window-permission/window-permission.service';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';
import {
  CreateWindowRequest,
  CreateWindowResponse,
  GetWindowsParams,
  PaginationResponse,
  PermanentDeleteWindowResponse,
  UpdateWindowRequest,
  WindowDetailsResponse,
  WindowListItemResponse,
} from '../../models/window-management/window-management.model';

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
  // Trigger HMR

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
    title: 'إدارة أماكن الخدمات',
    description: 'إدارة أماكن خدمات قوائم الانتظار وعملياتها.',
    activeTab: 'أماكن الخدمات النشطة',
    deletedTab: 'أماكن الخدمات غير النشطة',
    addWindow: 'إضافة مكان خدمة',
    searchPlaceholder: 'ابحث برقم مكان الخدمة أو الاسم أو عنوان IP',
    waitingAreaFilter: 'منطقة الانتظار',
    allWaitingAreas: 'كل مناطق الانتظار',
    pageSize: 'حجم الصفحة',
    loading: 'جاري التحميل...',
    noItems: 'لا توجد أماكن خدمات.',
    totalItems: 'إجمالي العناصر',
    previous: 'السابق',
    next: 'التالي',
    windowNumber: 'رقم مكان الخدمة',
    descriptiveName: 'الاسم الوصفي',
    waitingArea: 'منطقة الانتظار',
    ipAddress: 'عنوان IP',
    waitingAreaNumberLabel: 'رقم منطقة الانتظار',
    ticketBooking: 'حجز التذاكر',
    directCall: 'الاتصال المباشر',
    deletedOn: 'الحالة',
    actions: 'الإجراءات',
    view: 'عرض',
    edit: 'تعديل',
    deactivate: 'إيقاف',
    reactivate: 'إعادة تنشيط',
    permanentDelete: 'حذف دائم',
    enabled: 'مفعل',
    disabled: 'معطل',
    yes: 'نعم',
    no: 'لا',
    details: 'تفاصيل',
    windowDetails: 'تفاصيل مكان الخدمة',
    createTitle: 'إنشاء مكان خدمة',
    editTitle: 'تعديل مكان خدمة',
    close: 'إغلاق',
    cancel: 'إلغاء',
    save: 'حفظ',
    requiredField: 'هذا الحقل مطلوب.',
    maxLength20: 'الحد الأقصى 20 حرفًا.',
    maxLength100: 'الحد الأقصى 100 حرف.',
    invalidIp: 'عنوان IP غير صحيح.',
    selectWaitingArea: 'حدد منطقة الانتظار',
    refresh: 'تحديث',
    deleteConfirm: 'تأكيد إيقاف مكان الخدمة',
    permanentDeleteConfirm: 'تأكيد حذف مكان الخدمة نهائيًا',
    deleteConfirmBody: 'هل تريد إيقاف مكان الخدمة هذا؟',
    permanentDeleteConfirmBody: 'سيتم حذف مكان الخدمة نهائيًا ولا يمكن التراجع عن ذلك.',
    permanentDeleteAdditionalBody:
      'قد تفشل العملية إذا كان مكان الخدمة مرتبطًا بجهاز طرفي أو شاشة عرض.',
    fallbackSuccess: 'تمت العملية بنجاح.',
    fallbackError: 'حدث خطأ غير متوقع.',
    accessDenied: 'الصلاحية المطلوبة غير كافية.',
    noPermissionHint: 'ليست لديك صلاحية لتنفيذ هذا الإجراء.',
    createdOn: 'تاريخ الإنشاء',
    modifiedOn: 'تاريخ آخر تعديل',
    traceIdLabel: 'معرف التتبع',
    notAvailable: '-',
  },
  en: {
    title: 'Service Location Management',
    description: 'Manage all waiting queue service locations with full CRUD operations.',
    activeTab: 'Active Service Locations',
    deletedTab: 'Deleted Service Locations',
    addWindow: 'Add Service Location',
    searchPlaceholder: 'Search by service location number, name, or IP',
    waitingAreaFilter: 'Waiting Area',
    allWaitingAreas: 'All Waiting Areas',
    pageSize: 'Page size',
    loading: 'Loading...',
    noItems: 'No service locations found.',
    totalItems: 'Total items',
    previous: 'Previous',
    next: 'Next',
    windowNumber: 'Service Location Number',
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
    windowDetails: 'Service Location Details',
    createTitle: 'Create Service Location',
    editTitle: 'Edit Service Location',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    requiredField: 'This field is required.',
    maxLength20: 'Maximum length is 20 characters.',
    maxLength100: 'Maximum length is 100 characters.',
    invalidIp: 'IP Address is invalid.',
    selectWaitingArea: 'Select waiting area',
    refresh: 'Refresh',
    deleteConfirm: 'Deactivate Service Location',
    permanentDeleteConfirm: 'Permanently Delete Service Location',
    deleteConfirmBody: 'Are you sure you want to deactivate this service location?',
    permanentDeleteConfirmBody: 'This action permanently deletes the service location and cannot be undone.',
    permanentDeleteAdditionalBody:
      'Operation will fail when the service location is linked to a terminal or display service location.',
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
  imports: [ReactiveFormsModule, MobileRecordCardComponent, PageHeroComponent, NiletronixLoadingStateComponent],
  templateUrl: './windows.component.html',
  styleUrl: './windows.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowsComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(AdminI18nStore);
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  private readonly permissionService = inject(WindowPermissionService);
  private readonly waitingAreaApiService = inject(WaitingAreaApiService);
  private readonly windowsApiService = inject(WindowManagementApiService);
  private readonly branchContextStore = inject(AdminBranchContextStore);

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
  protected readonly branchContextId = this.branchContextStore.selectedBranchId;
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
        branchId: this.branchContextId(),
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
      branchId: this.branchContextId() ?? undefined,
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
    return formatApiError(error, this.translations().fallbackError);
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

