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
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AppLanguage, AuthSessionService } from '@core';
import { MobileRecordCardComponent } from '../../../../shared/components/mobile-record-card/mobile-record-card.component';
import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import {
  MapLocationPickerComponent,
  MapLocationCoords,
} from '../../../../shared/components/map-location-picker';
import { CreateBranchAdminDialogComponent } from '@features/branch-management/components/create-branch-admin-dialog/create-branch-admin-dialog.component';
import { BRANCH_ADMINS_TRANSLATIONS } from '@features/branch-management/i18n/branch-admins.translations';
import {
  BranchAuditUser,
  BranchDetails,
  BranchListItem,
  CreateBranchRequest,
  UpdateBranchRequest,
  BranchOrderSort,
  PagedBranchResponse,
} from '@features/branch-management/models/branch-management/branch-management.model';
import { BranchManagementApiService } from '@features/branch-management/services/branch-management-api/branch-management-api.service';
import { BranchPermissionService } from '@features/branch-management/services/branch-permission/branch-permission.service';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';
import { localizeToastMessage } from '@shared/utils/toast-message.util';

type BranchManagementPageKey = 'branch-editor';
type BranchFormValidationError = 'required' | 'maxlength' | 'min' | 'max';
type BranchPanelMode = 'closed' | 'create' | 'edit' | 'view';
type MessageTone = 'success' | 'error';

interface BranchPageSummary {
  readonly label: string;
  readonly value: string;
  readonly tone: 'default' | 'success' | 'warning' | 'danger';
}

interface BranchEditorRow {
  readonly id: number;
  readonly arabicName: string;
  readonly englishName: string;
  readonly ipAddress: string;
  readonly governorate: string;
  readonly city: string;
  readonly isActive: boolean;
  readonly effectiveIsActive: boolean;
  readonly rowVersion: string;
  readonly createdBy: string;
}

interface BranchAdminDialogTarget {
  readonly branchId: number;
  readonly branchLabel: string;
}

interface BranchTableMeta {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

interface UiMessage {
  readonly tone: MessageTone;
  readonly text: string;
}

interface BranchEditorTranslations {
  readonly addBranch: string;
  readonly view: string;
  readonly edit: string;
  readonly branding: string;
  readonly displayVideos: string;
  readonly status: string;
  readonly active: string;
  readonly inactive: string;
  readonly operationalStatus: string;
  readonly operationalAvailable: string;
  readonly operationalUnavailable: string;
  readonly deactivate: string;
  readonly reactivate: string;
  readonly permanentDelete: string;
  readonly allStatuses: string;
  readonly actions: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly detailsTitle: string;
  readonly save: string;
  readonly cancel: string;
  readonly close: string;
  readonly license: string;
  readonly location: string;
  readonly area: string;
  readonly address: string;
  readonly longitude: string;
  readonly latitude: string;
  readonly createdOn: string;
  readonly lastModifiedBy: string;
  readonly modifiedOn: string;
  readonly requiredField: string;
  readonly nameRequired: string;
  readonly invalidIp: string;
  readonly max100: string;
  readonly max500: string;
  readonly deleteConfirm: string;
  readonly fallbackSuccess: string;
  readonly fallbackError: string;
  readonly emptyValue: string;
  readonly searchPlaceholder: string;
  readonly createSubtitle: string;
  readonly editSubtitle: string;
  readonly detailsSubtitle: string;
  readonly basicInfoAndStatus: string;
  readonly systemAudit: string;
  readonly basicBranchInfo: string;
  readonly arabicNamePlaceholder: string;
  readonly governoratePlaceholder: string;
  readonly cityPlaceholder: string;
  readonly areaPlaceholder: string;
  readonly addressPlaceholder: string;
  readonly pickFromMap: string;
  readonly mapHelperText: string;
}

const BRANCH_EDITOR_TRANSLATIONS: Record<AppLanguage, BranchEditorTranslations> = {
  ar: {
    addBranch: 'إضافة فرع',
    view: 'عرض',
    edit: 'تعديل',
    branding: 'الهوية والإعلانات',
    displayVideos: 'فيديوهات الشاشات',
    status: 'الحالة',
    active: 'نشط',
    inactive: 'غير نشط',
    operationalStatus: 'الحالة التشغيلية',
    operationalAvailable: 'متاح',
    operationalUnavailable: 'غير متاح بسبب حالة العنصر الأب',
    deactivate: 'إيقاف',
    reactivate: 'إعادة تنشيط',
    permanentDelete: 'حذف نهائي',
    allStatuses: 'كل الحالات',
    actions: 'الإجراءات',
    createTitle: 'إضافة فرع',
    editTitle: 'تعديل فرع',
    detailsTitle: 'تفاصيل الفرع',
    save: 'حفظ',
    cancel: 'إلغاء',
    close: 'إغلاق',
    license: 'الرخصة',
    location: 'الموقع',
    area: 'المنطقة',
    address: 'العنوان',
    longitude: 'خط الطول',
    latitude: 'خط العرض',
    createdOn: 'تاريخ الإنشاء',
    lastModifiedBy: 'آخر تعديل بواسطة',
    modifiedOn: 'تاريخ آخر تعديل',
    requiredField: 'هذا الحقل مطلوب.',
    nameRequired: 'الاسم العربي والإنجليزي مطلوبان.',
    invalidIp: 'IP Address غير صحيح.',
    max100: 'الحد الأقصى 100 حرف.',
    max500: 'الحد الأقصى 500 حرف.',
    deleteConfirm: 'تأكيد حذف الفرع',
    fallbackSuccess: 'تم تنفيذ العملية بنجاح.',
    fallbackError: 'حدث خطأ غير متوقع.',
    emptyValue: '-',
    searchPlaceholder: 'البحث باسم الفرع، الـ IP، أو المحافظة...',
    createSubtitle: 'إضافة فرع جديد وتحديد بيانات الاتصال والموقع',
    editSubtitle: 'تعديل بيانات وإعدادات الفرع والموقع الجغرافي',
    detailsSubtitle: 'عرض تفاصيل الفرع وحالته وبيانات النظام',
    basicInfoAndStatus: 'البيانات الأساسية والحالة',
    systemAudit: 'سجل النظام والتعديلات',
    basicBranchInfo: 'بيانات الفرع الأساسية',
    arabicNamePlaceholder: 'مثال: فرع القاهرة الرئيسي',
    governoratePlaceholder: 'مثال: القاهرة',
    cityPlaceholder: 'مثال: مدينة نصر',
    areaPlaceholder: 'مثال: المنطقة السادسة',
    addressPlaceholder: 'مثال: شارع عباس العقاد، مبنى رقم 14، الدور الثاني',
    pickFromMap: 'تحديد الموقع من الخريطة',
    mapHelperText: 'انقر في أي مكان على الخريطة أو اسحب العلامة لتحديد خط الطول والعرض تلقائياً.',
  },
  en: {
    addBranch: 'Add Branch',
    view: 'View',
    edit: 'Edit',
    branding: 'Branding & Ads',
    displayVideos: 'Display Videos',
    status: 'Status',
    active: 'Active',
    inactive: 'Inactive',
    operationalStatus: 'Operational Status',
    operationalAvailable: 'Available',
    operationalUnavailable: 'Unavailable',
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    permanentDelete: 'Permanent Delete',
    allStatuses: 'All statuses',
    actions: 'Actions',
    createTitle: 'Add Branch',
    editTitle: 'Edit Branch',
    detailsTitle: 'Branch Details',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    license: 'License',
    location: 'Location',
    area: 'Area',
    address: 'Address',
    longitude: 'Longitude',
    latitude: 'Latitude',
    createdOn: 'Created On',
    lastModifiedBy: 'Last Modified By',
    modifiedOn: 'Modified On',
    requiredField: 'This field is required.',
    nameRequired: 'Arabic name and English name are required.',
    invalidIp: 'IP Address is invalid.',
    max100: 'Maximum length is 100 characters.',
    max500: 'Maximum length is 500 characters.',
    deleteConfirm: 'Delete branch',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    emptyValue: '-',
    searchPlaceholder: 'Search by branch name, IP, or governorate...',
    createSubtitle: 'Add a new branch and set contact details and location',
    editSubtitle: 'Edit branch data, settings, and geographic location',
    detailsSubtitle: 'View branch details, operational status, and system audit',
    basicInfoAndStatus: 'Basic Information & Status',
    systemAudit: 'System Audit & History',
    basicBranchInfo: 'Basic Branch Details',
    arabicNamePlaceholder: 'e.g. Cairo Main Branch',
    governoratePlaceholder: 'e.g. Cairo',
    cityPlaceholder: 'e.g. Nasr City',
    areaPlaceholder: 'e.g. District 6',
    addressPlaceholder: 'e.g. Abbas El Akkad St, Building 14, 2nd Floor',
    pickFromMap: 'Select Location from Map',
    mapHelperText:
      'Click anywhere on the map or drag the pin to set latitude and longitude automatically.',
  },
};

const EMPTY_BRANCH_TABLE_META: BranchTableMeta = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  hasPreviousPage: false,
  hasNextPage: false,
};

@Component({
  selector: 'app-legacy-page',
  imports: [
    ReactiveFormsModule,
    CreateBranchAdminDialogComponent,
    MobileRecordCardComponent,
    PageHeroComponent,
    MapLocationPickerComponent,
  ],
  templateUrl: './legacy-page.component.html',
  styleUrl: './legacy-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LegacyPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly branchManagementApiService = inject(BranchManagementApiService);
  private readonly branchPermissionService = inject(BranchPermissionService);
  private readonly branchContextStore = inject(AdminBranchContextStore);
  private readonly i18nStore = inject(AdminI18nStore);
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  private branchPanelRequestId = 0;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly translations = this.i18nStore.translations;
  protected readonly branchEditorTranslations = computed(
    () => BRANCH_EDITOR_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly branchAdminTranslations = computed(
    () => BRANCH_ADMINS_TRANSLATIONS[this.i18nStore.language()],
  );
  protected readonly branchSearchText = signal('');
  protected readonly branchOrderSort = signal<BranchOrderSort>('Newest');
  protected readonly branchStatusFilter = signal<boolean | null>(null);
  protected readonly branchPageSize = signal(10);
  protected readonly branchTableLoading = signal(false);
  protected readonly branchTableError = signal(false);
  protected readonly branchPanelLoading = signal(false);
  protected readonly branchSaving = signal(false);
  protected readonly deletingBranchId = signal<number | null>(null);
  protected readonly branchPanelMode = signal<BranchPanelMode>('closed');
  protected readonly selectedBranchId = signal<number | null>(null);
  protected readonly selectedBranchDetails = signal<BranchDetails | null>(null);
  protected readonly selectedBranchForAdmin = signal<BranchAdminDialogTarget | null>(null);
  protected readonly branchMessage = signal<UiMessage | null>(null);
  protected readonly branchTableMeta = signal<BranchTableMeta>(EMPTY_BRANCH_TABLE_META);
  protected readonly branches = signal<readonly BranchEditorRow[]>([]);
  protected readonly skeletonRows = [1, 2, 3, 4, 5];
  protected readonly skeletonCards = [1, 2, 3];
  protected readonly canCreateBranchAdmin = this.branchPermissionService.canCreateBranchAdmin;
  protected readonly selectedContextBranchId = this.branchContextStore.selectedBranchId;
  protected readonly canSelectBranchContext = computed(
    () => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin',
  );

  protected readonly branchForm = this.formBuilder.group({
    arabicName: ['', [Validators.required, Validators.maxLength(100)]],
    englishName: ['', [Validators.required, Validators.maxLength(100)]],
    ipAddress: ['', [Validators.required, Validators.maxLength(45)]],
    license: [''],
    governorate: ['', [Validators.required, Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    area: ['', [Validators.required, Validators.maxLength(100)]],
    address: ['', [Validators.required, Validators.maxLength(500)]],
    longitude: ['', [Validators.required, Validators.min(-180), Validators.max(180)]],
    latitude: ['', [Validators.required, Validators.min(-90), Validators.max(90)]],
  });

  protected readonly pageKey = computed<BranchManagementPageKey>(
    () => this.route.snapshot.data['pageKey'] as BranchManagementPageKey,
  );
  protected readonly title = computed(() => this.translations().branchEditorLabel);
  protected readonly description = computed(() => this.translations().branchEditorDescription);

  protected readonly branchSummaries = computed<readonly BranchPageSummary[]>(() => {
    const translations = this.translations();
    const meta = this.branchTableMeta();
    const rows = this.branches();
    const activeCount = rows.filter((branch) => branch.isActive).length;
    const inactiveCount = rows.length - activeCount;

    return [
      { label: translations.totalBranchesLabel, value: String(meta.totalItems), tone: 'default' },
      { label: translations.pageSizeLabel, value: String(meta.pageSize), tone: 'default' },
      {
        label: this.branchEditorTranslations().active,
        value: String(activeCount),
        tone: 'success',
      },
      {
        label: this.branchEditorTranslations().inactive,
        value: String(inactiveCount),
        tone: 'warning',
      },
    ];
  });

  protected readonly summaries = this.branchSummaries;

  ngOnInit(): void {
    this.loadBranches();
  }

  ngOnDestroy(): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
  }

  protected clearBranchMessage(): void {
    this.branchMessage.set(null);

    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  protected updateBranchSearch(event: Event): void {
    this.branchSearchText.set(this.readInputValue(event));
    this.loadBranches(1);
  }

  protected updateBranchOrderSort(event: Event): void {
    const value = this.readInputValue(event);
    this.branchOrderSort.set(value === 'Oldest' ? 'Oldest' : 'Newest');
    this.loadBranches(1);
  }

  protected updateBranchStatusFilter(event: Event): void {
    const value = this.readInputValue(event);
    this.branchStatusFilter.set(value === '' ? null : value === 'true');
    this.loadBranches(1);
  }

  protected updateBranchPageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    const pageSize = Number.isFinite(value) && value > 0 ? Math.min(value, 100) : 10;

    this.branchPageSize.set(pageSize);
    this.loadBranches(1);
  }

  protected refreshBranches(): void {
    this.loadBranches(this.branchTableMeta().currentPage);
  }

  protected previousBranchPage(): void {
    const meta = this.branchTableMeta();

    if (meta.hasPreviousPage) {
      this.loadBranches(meta.currentPage - 1);
    }
  }

  protected nextBranchPage(): void {
    const meta = this.branchTableMeta();

    if (meta.hasNextPage) {
      this.loadBranches(meta.currentPage + 1);
    }
  }

  protected openCreateBranch(): void {
    this.branchPanelRequestId += 1;
    this.branchPanelLoading.set(false);
    this.clearBranchMessage();
    this.selectedBranchId.set(null);
    this.selectedBranchDetails.set(null);
    this.branchPanelMode.set('create');
    this.branchForm.reset({
      arabicName: '',
      englishName: '',
      ipAddress: '',
      license: '',
      governorate: '',
      city: '',
      area: '',
      address: '',
      longitude: '',
      latitude: '',
    });
  }

  protected onMapLocationChange(coords: MapLocationCoords): void {
    const patch: Partial<{
      latitude: string;
      longitude: string;
      governorate: string;
      city: string;
      address: string;
    }> = {
      latitude: coords.latitude.toString(),
      longitude: coords.longitude.toString(),
    };

    if (this.branchPanelMode() === 'create') {
      const currentGov = this.branchForm.controls.governorate.value?.trim();
      const currentCity = this.branchForm.controls.city.value?.trim();
      const currentAddr = this.branchForm.controls.address.value?.trim();

      if (!currentGov && coords.governorate) {
        patch.governorate = coords.governorate;
      }
      if (!currentCity && coords.city) {
        patch.city = coords.city;
      }
      if (!currentAddr && coords.address) {
        patch.address = coords.address;
      }
    }

    this.branchForm.patchValue(patch);
    this.branchForm.controls.latitude.markAsTouched();
    this.branchForm.controls.latitude.markAsDirty();
    this.branchForm.controls.longitude.markAsTouched();
    this.branchForm.controls.longitude.markAsDirty();
  }

  protected selectBranchContext(branch: BranchEditorRow): void {
    if (!this.canSelectBranchContext()) {
      return;
    }

    this.branchContextStore.selectBranch({
      branchId: branch.id,
      arabicName: branch.arabicName,
      englishName: branch.englishName,
      isActive: branch.isActive,
      effectiveIsActive: branch.effectiveIsActive,
    });
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { branchId: branch.id },
      queryParamsHandling: 'merge',
    });
  }

  protected openViewBranch(branchId: number): void {
    this.openBranchDetails(branchId, 'view');
  }

  protected openEditBranch(branchId: number): void {
    this.openBranchDetails(branchId, 'edit');
  }

  protected openBranchBranding(branchId: number): void {
    void this.router.navigate(['/admin/branch-branding'], {
      queryParams: { branchId },
    });
  }

  protected openDisplayVideos(branchId: number): void {
    void this.router.navigate(['/admin/display-videos'], {
      queryParams: { branchId },
    });
  }

  protected openCreateBranchAdmin(branch: BranchEditorRow): void {
    if (!this.canCreateBranchAdmin() || !branch.isActive) {
      return;
    }

    this.selectedBranchForAdmin.set({
      branchId: branch.id,
      branchLabel: `BR-${branch.id} - ${branch.englishName}`,
    });
  }

  protected closeCreateBranchAdminDialog(): void {
    this.selectedBranchForAdmin.set(null);
  }

  protected handleBranchAdminCreated(message: string): void {
    this.selectedBranchForAdmin.set(null);
    this.showBranchMessage('success', message);
  }

  protected closeBranchPanel(): void {
    this.branchPanelRequestId += 1;
    this.branchPanelLoading.set(false);
    this.branchPanelMode.set('closed');
    this.selectedBranchId.set(null);
    this.selectedBranchDetails.set(null);
    this.branchForm.markAsPristine();
  }

  protected saveBranch(): void {
    if (!this.isBranchFormValid()) {
      this.branchForm.markAllAsTouched();
      return;
    }

    if (this.branchPanelMode() === 'create') {
      this.createBranch();
      return;
    }

    if (this.branchPanelMode() === 'edit') {
      this.updateBranch();
    }
  }

  protected deactivateBranch(branch: BranchEditorRow): void {
    if (!window.confirm(`${this.branchEditorTranslations().deactivate}: ${branch.englishName}?`)) {
      return;
    }

    this.runBranchLifecycleAction(branch, 'deactivate');
  }

  protected reactivateBranch(branch: BranchEditorRow): void {
    if (!window.confirm(`${this.branchEditorTranslations().reactivate}: ${branch.englishName}?`)) {
      return;
    }

    this.runBranchLifecycleAction(branch, 'reactivate');
  }

  protected permanentlyDeleteBranch(branch: BranchEditorRow): void {
    if (
      !window.confirm(`${this.branchEditorTranslations().permanentDelete}: ${branch.englishName}?`)
    ) {
      return;
    }

    this.runBranchLifecycleAction(branch, 'permanent');
  }

  protected branchFormTitle(): string {
    const translations = this.branchEditorTranslations();

    if (this.branchPanelMode() === 'create') {
      return translations.createTitle;
    }

    if (this.branchPanelMode() === 'edit') {
      return translations.editTitle;
    }

    return translations.detailsTitle;
  }

  protected hasBranchControlError(controlName: keyof typeof this.branchForm.controls): boolean {
    const control = this.branchForm.controls[controlName];
    return control.touched && control.invalid;
  }

  protected hasBranchControlValidationError(
    controlName: keyof typeof this.branchForm.controls,
    errorCode: BranchFormValidationError,
  ): boolean {
    const control = this.branchForm.controls[controlName];
    return control.touched && control.hasError(errorCode);
  }

  protected isBranchNameMissing(): boolean {
    const value = this.branchForm.getRawValue();
    return value.arabicName.trim().length === 0 || value.englishName.trim().length === 0;
  }

  protected isIpAddressInvalid(): boolean {
    const value = this.branchForm.controls.ipAddress.value.trim();
    return value.length > 0 && !this.isValidIpAddress(value);
  }

  protected detailValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) {
      return this.branchEditorTranslations().emptyValue;
    }

    const text = String(value);
    return text.trim().length > 0 ? text : this.branchEditorTranslations().emptyValue;
  }

  protected userName(user: BranchAuditUser | null): string {
    return this.resolveUserName(user);
  }

  protected formatNullableDate(value: string | null | undefined): string {
    return this.formatDate(value ?? null);
  }

  private loadBranches(pageNumber = this.branchTableMeta().currentPage, force = false): void {
    if (this.branchTableLoading() && !force) {
      return;
    }

    this.branchTableLoading.set(true);
    this.branchTableError.set(false);

    this.branchManagementApiService
      .getBranches({
        searchText: this.branchSearchText().trim(),
        orderSort: this.branchOrderSort(),
        pageNumber,
        pageSize: this.branchPageSize(),
        isActive: this.branchStatusFilter(),
      })
      .subscribe({
        next: (response) => this.applyBranchResponse(response),
        error: (error: HttpErrorResponse) => {
          this.branchTableError.set(true);
          this.handleBranchApiError(error);
          this.branchTableLoading.set(false);
        },
        complete: () => this.branchTableLoading.set(false),
      });
  }

  private openBranchDetails(
    branchId: number,
    mode: Extract<BranchPanelMode, 'edit' | 'view'>,
  ): void {
    const requestId = ++this.branchPanelRequestId;

    this.branchPanelLoading.set(true);
    this.branchPanelMode.set(mode);
    this.selectedBranchId.set(branchId);
    this.selectedBranchDetails.set(null);

    this.branchManagementApiService.getBranchDetails(branchId).subscribe({
      next: (details) => {
        if (requestId !== this.branchPanelRequestId || this.branchPanelMode() !== mode) {
          return;
        }

        this.selectedBranchDetails.set(details);
        if (mode === 'edit') {
          this.fillBranchForm(details);
        }
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.branchPanelRequestId || this.branchPanelMode() !== mode) {
          return;
        }

        this.handleBranchApiError(error);
        this.branchPanelLoading.set(false);
        this.closeBranchPanel();
        if (error.status === 404) {
          this.loadBranches(this.branchTableMeta().currentPage);
        }
      },
      complete: () => {
        if (requestId === this.branchPanelRequestId && this.branchPanelMode() === mode) {
          this.branchPanelLoading.set(false);
        }
      },
    });
  }

  private createBranch(): void {
    this.branchSaving.set(true);

    this.branchManagementApiService.createBranch(this.createBranchRequest()).subscribe({
      next: () => {
        this.showBranchMessage('success', this.branchEditorTranslations().fallbackSuccess);
        this.closeBranchPanel();
        this.loadBranches(1, true);
      },
      error: (error: HttpErrorResponse) => {
        this.handleBranchApiError(error);
        this.branchSaving.set(false);
      },
      complete: () => this.branchSaving.set(false),
    });
  }

  private updateBranch(): void {
    const branchId = this.selectedBranchId();

    if (!branchId) {
      return;
    }

    this.branchSaving.set(true);

    this.branchManagementApiService
      .updateBranch(branchId, this.createUpdateBranchRequest())
      .subscribe({
        next: () => {
          this.showBranchMessage('success', this.branchEditorTranslations().fallbackSuccess);
          this.closeBranchPanel();
          this.loadBranches(this.branchTableMeta().currentPage);
        },
        error: (error: HttpErrorResponse) => {
          this.handleBranchApiError(error);
          this.branchSaving.set(false);
        },
        complete: () => this.branchSaving.set(false),
      });
  }

  private fillBranchForm(details: BranchDetails): void {
    this.branchForm.reset({
      arabicName: details.arabicName ?? '',
      englishName: details.englishName ?? '',
      ipAddress: details.ipAddress,
      license: details.license ?? '',
      governorate: details.location?.governorate ?? '',
      city: details.location?.city ?? '',
      area: details.location?.area ?? '',
      address: details.location?.address ?? '',
      longitude: details.location?.longitude?.toString() ?? '',
      latitude: details.location?.latitude?.toString() ?? '',
    });
  }

  private createBranchRequest(): CreateBranchRequest {
    const value = this.branchForm.getRawValue();

    return {
      arabicName: value.arabicName.trim(),
      englishName: value.englishName.trim(),
      ipAddress: value.ipAddress.trim(),
      license: this.toOptionalString(value.license),
      location: {
        governorate: value.governorate.trim(),
        city: value.city.trim(),
        area: value.area.trim(),
        address: value.address.trim(),
        longitude: Number(value.longitude),
        latitude: Number(value.latitude),
      },
    };
  }

  private createUpdateBranchRequest(): UpdateBranchRequest {
    return {
      ...this.createBranchRequest(),
      rowVersion: this.selectedBranchDetails()?.rowVersion ?? '',
    };
  }

  private isBranchFormValid(): boolean {
    return this.branchForm.valid && !this.isBranchNameMissing() && !this.isIpAddressInvalid();
  }

  private isValidIpAddress(value: string): boolean {
    const ipv4Pattern =
      /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv4Pattern.test(value) || ipv6Pattern.test(value);
  }

  private toOptionalString(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private withFallback(value: string | null | undefined): string {
    return value && value.trim().length > 0 ? value : this.branchEditorTranslations().emptyValue;
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return this.branchEditorTranslations().emptyValue;
    }

    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.i18nStore.language() === 'ar' ? 'ar-EG' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(parsedDate);
  }

  private resolveUserName(user: BranchAuditUser | null): string {
    if (!user) {
      return this.branchEditorTranslations().emptyValue;
    }

    const preferredName = this.i18nStore.language() === 'ar' ? user.nameAr : user.nameEn;
    const fallbackName = this.i18nStore.language() === 'ar' ? user.nameEn : user.nameAr;
    const fallbackUserName =
      user.userName.trim().length > 0 ? user.userName : user.applicationUserId;
    return this.withFallback(preferredName ?? fallbackName ?? fallbackUserName);
  }

  private applyBranchResponse(response: PagedBranchResponse<BranchListItem>): void {
    this.branches.set(response.data.map((branch) => this.mapBranchRow(branch)));
    this.branchTableMeta.set({
      currentPage: response.currentPage,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      totalItems: response.totalItems,
      hasPreviousPage: response.hasPreviousPage,
      hasNextPage: response.hasNextPage,
    });
  }

  private mapBranchRow(branch: BranchListItem): BranchEditorRow {
    return {
      id: branch.branchId,
      arabicName: this.withFallback(branch.arabicName),
      englishName: this.withFallback(branch.englishName),
      ipAddress: this.withFallback(branch.ipAddress),
      governorate: this.withFallback(branch.governorate),
      city: this.withFallback(branch.city),
      isActive: branch.isActive,
      effectiveIsActive: branch.effectiveIsActive,
      rowVersion: branch.rowVersion,
      createdBy: this.resolveUserName(branch.createdBy),
    };
  }

  protected branchStatusLabel(branch: BranchEditorRow): string {
    return branch.isActive
      ? this.branchEditorTranslations().active
      : this.branchEditorTranslations().inactive;
  }

  protected branchOperationalLabel(branch: BranchEditorRow): string {
    return branch.effectiveIsActive
      ? this.branchEditorTranslations().operationalAvailable
      : this.branchEditorTranslations().operationalUnavailable;
  }

  protected showBranchOperationalWarning(branch: BranchEditorRow): boolean {
    return branch.isActive && !branch.effectiveIsActive;
  }

  private runBranchLifecycleAction(
    branch: BranchEditorRow,
    action: 'deactivate' | 'reactivate' | 'permanent',
  ): void {
    this.deletingBranchId.set(branch.id);
    const request =
      action === 'deactivate'
        ? this.branchManagementApiService.deactivateBranch(branch.id, branch.rowVersion)
        : action === 'reactivate'
          ? this.branchManagementApiService.reactivateBranch(branch.id, branch.rowVersion)
          : this.branchManagementApiService.permanentlyDeleteBranch(branch.id, branch.rowVersion);

    request.subscribe({
      next: (response) => {
        this.showBranchMessage(
          'success',
          response.message || this.branchEditorTranslations().fallbackSuccess,
        );
        const meta = this.branchTableMeta();
        const nextPage =
          action === 'permanent' && this.branches().length === 1 && meta.currentPage > 1
            ? meta.currentPage - 1
            : meta.currentPage;
        this.loadBranches(nextPage, true);
      },
      error: (error: HttpErrorResponse) => this.handleBranchApiError(error),
      complete: () => this.deletingBranchId.set(null),
    });
  }

  private handleBranchApiError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    this.showBranchMessage('error', this.extractApiMessage(error));
  }

  private showBranchMessage(tone: MessageTone, text: string): void {
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }

    const localizedText = localizeToastMessage(text, this.i18nStore.language());
    this.branchMessage.set({ tone, text: localizedText });

    this.toastTimeoutId = setTimeout(
      () => {
        this.branchMessage.set(null);
        this.toastTimeoutId = null;
      },
      tone === 'error' ? 6500 : 4200,
    );
  }

  private extractApiMessage(error: HttpErrorResponse): string {
    return formatApiError(error, this.branchEditorTranslations().fallbackError);
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
