import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AppLanguage } from '../../../../shared/models/app-language.model';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import {
  ApiProblemDetails,
  BranchAuditUser,
  BranchDetails,
  BranchListItem,
  BranchLocation,
  BranchMutationRequest,
  BranchOrderSort,
  PagedBranchResponse
} from '../../models/branch-management.model';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';

type BranchManagementPageKey = 'branch-editor' | 'online-monitoring';
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
  readonly isUpdatesAvailable: boolean;
  readonly lastUpdated: string;
  readonly createdBy: string;
}

interface BranchTableMeta {
  readonly currentPage: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly totalItems: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
}

interface MonitoringRow {
  readonly name: string;
  readonly status: 'Online' | 'Delayed' | 'Offline';
  readonly activeTickets: number;
  readonly servedToday: number;
  readonly avgWait: string;
  readonly lastHeartbeat: string;
}

interface UiMessage {
  readonly tone: MessageTone;
  readonly text: string;
}

interface BranchEditorTranslations {
  readonly addBranch: string;
  readonly view: string;
  readonly edit: string;
  readonly delete: string;
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
}

const BRANCH_EDITOR_TRANSLATIONS: Record<AppLanguage, BranchEditorTranslations> = {
  ar: {
    addBranch: '\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639',
    view: '\u0639\u0631\u0636',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    delete: '\u062d\u0630\u0641',
    actions: '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    createTitle: '\u0625\u0636\u0627\u0641\u0629 \u0641\u0631\u0639',
    editTitle: '\u062a\u0639\u062f\u064a\u0644 \u0641\u0631\u0639',
    detailsTitle: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0641\u0631\u0639',
    save: '\u062d\u0641\u0638',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    close: '\u0625\u063a\u0644\u0627\u0642',
    license: '\u0627\u0644\u0631\u062e\u0635\u0629',
    location: '\u0627\u0644\u0645\u0648\u0642\u0639',
    area: '\u0627\u0644\u0645\u0646\u0637\u0642\u0629',
    address: '\u0627\u0644\u0639\u0646\u0648\u0627\u0646',
    longitude: '\u062e\u0637 \u0627\u0644\u0637\u0648\u0644',
    latitude: '\u062e\u0637 \u0627\u0644\u0639\u0631\u0636',
    createdOn: '\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u0625\u0646\u0634\u0627\u0621',
    lastModifiedBy: '\u0622\u062e\u0631 \u062a\u0639\u062f\u064a\u0644 \u0628\u0648\u0627\u0633\u0637\u0629',
    modifiedOn: '\u062a\u0627\u0631\u064a\u062e \u0622\u062e\u0631 \u062a\u0639\u062f\u064a\u0644',
    requiredField: '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.',
    nameRequired: '\u0623\u062f\u062e\u0644 \u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0639\u0631\u0628\u064a \u0623\u0648 \u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.',
    invalidIp: 'IP Address \u063a\u064a\u0631 \u0635\u062d\u064a\u062d.',
    max100: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 100 \u062d\u0631\u0641.',
    max500: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 500 \u062d\u0631\u0641.',
    deleteConfirm: '\u062a\u0623\u0643\u064a\u062f \u062d\u0630\u0641 \u0627\u0644\u0641\u0631\u0639',
    fallbackSuccess: '\u062a\u0645 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0628\u0646\u062c\u0627\u062d.',
    fallbackError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639.',
    emptyValue: '-'
  },
  en: {
    addBranch: 'Add Branch',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
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
    nameRequired: 'Arabic name or English name is required.',
    invalidIp: 'IP Address is invalid.',
    max100: 'Maximum length is 100 characters.',
    max500: 'Maximum length is 500 characters.',
    deleteConfirm: 'Delete branch',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    emptyValue: '-'
  }
};

const EMPTY_BRANCH_TABLE_META: BranchTableMeta = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  hasPreviousPage: false,
  hasNextPage: false
};

@Component({
  selector: 'app-legacy-page',
  imports: [ReactiveFormsModule],
  templateUrl: './legacy-page.component.html',
  styleUrl: './legacy-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LegacyPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly branchManagementApiService = inject(BranchManagementApiService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);

  protected readonly translations = this.i18nStore.translations;
  protected readonly branchEditorTranslations = computed(() => BRANCH_EDITOR_TRANSLATIONS[this.i18nStore.language()]);
  protected readonly branchSearchText = signal('');
  protected readonly branchOrderSort = signal<BranchOrderSort>('Newest');
  protected readonly branchPageSize = signal(10);
  protected readonly branchTableLoading = signal(false);
  protected readonly branchTableError = signal(false);
  protected readonly branchPanelLoading = signal(false);
  protected readonly branchSaving = signal(false);
  protected readonly deletingBranchId = signal<number | null>(null);
  protected readonly branchPanelMode = signal<BranchPanelMode>('closed');
  protected readonly selectedBranchId = signal<number | null>(null);
  protected readonly selectedBranchDetails = signal<BranchDetails | null>(null);
  protected readonly branchMessage = signal<UiMessage | null>(null);
  protected readonly branchTableMeta = signal<BranchTableMeta>(EMPTY_BRANCH_TABLE_META);
  protected readonly branches = signal<readonly BranchEditorRow[]>([]);

  protected readonly branchForm = this.formBuilder.group({
    arabicName: ['', [Validators.maxLength(100)]],
    englishName: ['', [Validators.maxLength(100)]],
    ipAddress: ['', [Validators.required, Validators.maxLength(45)]],
    license: [''],
    governorate: ['', [Validators.maxLength(100)]],
    city: ['', [Validators.maxLength(100)]],
    area: ['', [Validators.maxLength(100)]],
    address: ['', [Validators.maxLength(500)]],
    longitude: ['', [Validators.maxLength(50)]],
    latitude: ['', [Validators.maxLength(50)]]
  });

  protected readonly pageKey = computed<BranchManagementPageKey>(
    () => this.route.snapshot.data['pageKey'] as BranchManagementPageKey
  );
  protected readonly title = computed(() => {
    const translations = this.translations();

    return this.pageKey() === 'branch-editor'
      ? translations.branchEditorLabel
      : translations.onlineMonitoringLabel;
  });
  protected readonly description = computed(() => {
    const translations = this.translations();

    return this.pageKey() === 'branch-editor'
      ? translations.branchEditorDescription
      : translations.monitoringDescription;
  });

  protected readonly branchSummaries = computed<readonly BranchPageSummary[]>(() => {
    const translations = this.translations();
    const meta = this.branchTableMeta();
    const rows = this.branches();
    const updatesAvailable = rows.filter((branch) => branch.isUpdatesAvailable).length;

    return [
      { label: translations.totalBranchesLabel, value: String(meta.totalItems), tone: 'default' },
      { label: translations.pageSizeLabel, value: String(meta.pageSize), tone: 'default' },
      { label: translations.updatesAvailableLabel, value: String(updatesAvailable), tone: 'warning' },
      { label: translations.totalItemsLabel, value: String(rows.length), tone: 'success' }
    ];
  });

  protected readonly monitoringSummaries = computed<readonly BranchPageSummary[]>(() => {
    const translations = this.translations();

    return [
      { label: translations.onlineBranchesLabel, value: '9', tone: 'success' },
      { label: translations.delayedHeartbeatLabel, value: '2', tone: 'warning' },
      { label: translations.offlineBranchesLabel, value: '1', tone: 'danger' },
      { label: translations.ticketsWaitingLabel, value: '84', tone: 'default' }
    ];
  });

  protected readonly monitoringRows: readonly MonitoringRow[] = [
    { name: 'Hayah Main Branch', status: 'Online', activeTickets: 31, servedToday: 218, avgWait: '06:20', lastHeartbeat: '12 sec ago' },
    { name: 'New Cairo Clinic', status: 'Online', activeTickets: 22, servedToday: 174, avgWait: '05:45', lastHeartbeat: '18 sec ago' },
    { name: 'Alexandria Center', status: 'Delayed', activeTickets: 19, servedToday: 143, avgWait: '09:10', lastHeartbeat: '3 min ago' },
    { name: 'Mansoura Branch', status: 'Offline', activeTickets: 0, servedToday: 41, avgWait: '--', lastHeartbeat: '28 min ago' }
  ];

  protected readonly summaries = computed(() =>
    this.pageKey() === 'branch-editor' ? this.branchSummaries() : this.monitoringSummaries()
  );

  ngOnInit(): void {
    if (this.pageKey() === 'branch-editor') {
      this.loadBranches();
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
    this.branchMessage.set(null);
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
      latitude: ''
    });
  }

  protected openViewBranch(branchId: number): void {
    this.openBranchDetails(branchId, 'view');
  }

  protected openEditBranch(branchId: number): void {
    this.openBranchDetails(branchId, 'edit');
  }

  protected closeBranchPanel(): void {
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

  protected deleteBranch(branch: BranchEditorRow): void {
    const label = branch.englishName !== '-' ? branch.englishName : branch.arabicName;
    const confirmed = window.confirm(this.branchEditorTranslations().deleteConfirm + ': ' + label + '?');

    if (!confirmed) {
      return;
    }

    this.deletingBranchId.set(branch.id);
    this.branchManagementApiService.deleteBranch(branch.id).subscribe({
      next: () => {
        this.branchMessage.set({ tone: 'success', text: this.branchEditorTranslations().fallbackSuccess });
        const meta = this.branchTableMeta();
        const nextPage = this.branches().length === 1 && meta.currentPage > 1
          ? meta.currentPage - 1
          : meta.currentPage;
        this.loadBranches(nextPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleBranchApiError(error);
        this.deletingBranchId.set(null);
      },
      complete: () => this.deletingBranchId.set(null)
    });
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

  protected isBranchNameMissing(): boolean {
    const value = this.branchForm.getRawValue();
    return value.arabicName.trim().length === 0 && value.englishName.trim().length === 0;
  }

  protected isIpAddressInvalid(): boolean {
    const value = this.branchForm.controls.ipAddress.value.trim();
    return value.length > 0 && !this.isValidIpAddress(value);
  }

  protected detailValue(value: string | null | undefined): string {
    return value && value.trim().length > 0 ? value : this.branchEditorTranslations().emptyValue;
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
        pageSize: this.branchPageSize()
      })
      .subscribe({
        next: (response) => this.applyBranchResponse(response),
        error: (error: HttpErrorResponse) => {
          this.branchTableError.set(true);
          this.handleBranchApiError(error);
          this.branchTableLoading.set(false);
        },
        complete: () => this.branchTableLoading.set(false)
      });
  }

  private openBranchDetails(branchId: number, mode: Extract<BranchPanelMode, 'edit' | 'view'>): void {
    this.branchPanelLoading.set(true);
    this.branchPanelMode.set(mode);
    this.selectedBranchId.set(branchId);
    this.selectedBranchDetails.set(null);

    this.branchManagementApiService.getBranchDetails(branchId).subscribe({
      next: (details) => {
        this.selectedBranchDetails.set(details);
        if (mode === 'edit') {
          this.fillBranchForm(details);
        }
      },
      error: (error: HttpErrorResponse) => {
        this.handleBranchApiError(error);
        this.branchPanelLoading.set(false);
        this.closeBranchPanel();
        if (error.status === 404) {
          this.loadBranches(this.branchTableMeta().currentPage);
        }
      },
      complete: () => this.branchPanelLoading.set(false)
    });
  }

  private createBranch(): void {
    this.branchSaving.set(true);

    this.branchManagementApiService.createBranch(this.createBranchRequest()).subscribe({
      next: () => {
        this.branchMessage.set({ tone: 'success', text: this.branchEditorTranslations().fallbackSuccess });
        this.closeBranchPanel();
        this.loadBranches(1, true);
      },
      error: (error: HttpErrorResponse) => {
        this.handleBranchApiError(error);
        this.branchSaving.set(false);
      },
      complete: () => this.branchSaving.set(false)
    });
  }

  private updateBranch(): void {
    const branchId = this.selectedBranchId();

    if (!branchId) {
      return;
    }

    this.branchSaving.set(true);

    this.branchManagementApiService.updateBranch(branchId, this.createBranchRequest()).subscribe({
      next: () => {
        this.branchMessage.set({ tone: 'success', text: this.branchEditorTranslations().fallbackSuccess });
        this.closeBranchPanel();
        this.loadBranches(this.branchTableMeta().currentPage);
      },
      error: (error: HttpErrorResponse) => {
        this.handleBranchApiError(error);
        this.branchSaving.set(false);
      },
      complete: () => this.branchSaving.set(false)
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
      longitude: details.location?.longitude ?? '',
      latitude: details.location?.latitude ?? ''
    });
  }

  private createBranchRequest(): BranchMutationRequest {
    const value = this.branchForm.getRawValue();
    const location = {
      governorate: this.toOptionalString(value.governorate),
      city: this.toOptionalString(value.city),
      area: this.toOptionalString(value.area),
      address: this.toOptionalString(value.address),
      longitude: this.toOptionalString(value.longitude),
      latitude: this.toOptionalString(value.latitude)
    };
    const hasLocation = Object.values(location).some((field) => field !== null);

    return {
      arabicName: this.toOptionalString(value.arabicName),
      englishName: this.toOptionalString(value.englishName),
      ipAddress: value.ipAddress.trim(),
      license: this.toOptionalString(value.license),
      location: hasLocation ? location : null
    };
  }

  private isBranchFormValid(): boolean {
    return this.branchForm.valid && !this.isBranchNameMissing() && !this.isIpAddressInvalid();
  }

  private isValidIpAddress(value: string): boolean {
    const ipv4Pattern = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    const ipv6Pattern = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    return ipv4Pattern.test(value) || ipv6Pattern.test(value);
  }

  private applyBranchResponse(response: PagedBranchResponse<BranchListItem>): void {
    this.branches.set(response.data.map((branch) => this.mapBranchRow(branch)));
    this.branchTableMeta.set({
      currentPage: response.currentPage,
      pageSize: response.pageSize,
      totalPages: response.totalPages,
      totalItems: response.totalItems,
      hasPreviousPage: response.hasPreviousPage,
      hasNextPage: response.hasNextPage
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
      isUpdatesAvailable: branch.isUpdatesAvailable,
      lastUpdated: this.formatDate(branch.lastUpdated),
      createdBy: this.resolveUserName(branch.createdBy)
    };
  }

  private handleBranchApiError(error: HttpErrorResponse): void {
    if (error.status === 401) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    this.branchMessage.set({
      tone: 'error',
      text: this.extractApiMessage(error)
    });
  }

  private extractApiMessage(error: HttpErrorResponse): string {
    const body = error.error as ApiProblemDetails | string | null;

    if (typeof body === 'string' && body.trim().length > 0) {
      return body;
    }

    if (body && typeof body === 'object') {
      const firstError = body.errors?.[0];

      if (firstError?.message) {
        return firstError.message;
      }

      if (body.detail) {
        return body.detail;
      }

      if (body.title) {
        return body.title;
      }
    }

    return this.branchEditorTranslations().fallbackError;
  }

  private resolveUserName(user: BranchAuditUser | null): string {
    if (!user) {
      return this.branchEditorTranslations().emptyValue;
    }

    return this.i18nStore.language() === 'ar'
      ? this.withFallback(user.nameAr ?? user.nameEn ?? user.userName)
      : this.withFallback(user.nameEn ?? user.nameAr ?? user.userName);
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return this.branchEditorTranslations().emptyValue;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(this.i18nStore.language(), {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  }

  private withFallback(value: string | null): string {
    return value && value.trim().length > 0 ? value : this.branchEditorTranslations().emptyValue;
  }

  private toOptionalString(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}

