import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MobileRecordCardComponent } from '../../../../shared/components/mobile-record-card/mobile-record-card.component';
import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { Router } from '@angular/router';

import { AppLanguage, AuthSessionService } from '@core';
import { BranchListItem } from '@features/branch-management/models/branch-management/branch-management.model';
import { BranchManagementApiService } from '@features/branch-management/services/branch-management-api/branch-management-api.service';
import {
  CreateWaitingAreaRequest,
  Pagination,
  UpdateWaitingAreaRequest,
  WaitingAreaDetails,
  WaitingAreaListItem,
  WaitingAreaMutationResponse,
} from '../../models/waiting-area/waiting-area.model';
import { WaitingAreaApiService } from '../../services/waiting-area-api/waiting-area-api.service';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';

type WaitingAreaPanelMode = 'closed' | 'create' | 'edit' | 'view';
type MessageTone = 'success' | 'error' | 'info';

interface UiMessage {
  readonly tone: MessageTone;
  readonly text: string;
}

interface BranchOption {
  readonly id: number;
  readonly arabicName: string | null;
  readonly englishName: string | null;
}

interface WaitingAreaPageTranslations {
  readonly title: string;
  readonly description: string;
  readonly addButton: string;
  readonly searchPlaceholder: string;
  readonly branchFilter: string;
  readonly allBranches: string;
  readonly pageSize: string;
  readonly number: string;
  readonly descriptiveName: string;
  readonly branch: string;
  readonly audioDevice: string;
  readonly controlDevice: string;
  readonly windowsCount: string;
  readonly actions: string;
  readonly view: string;
  readonly edit: string;
  readonly status: string;
  readonly allStatuses: string;
  readonly active: string;
  readonly inactive: string;
  readonly operationalStatus: string;
  readonly operationalUnavailable: string;
  readonly deactivate: string;
  readonly reactivate: string;
  readonly permanentDelete: string;
  readonly refresh: string;
  readonly loading: string;
  readonly emptyTitle: string;
  readonly emptyDescription: string;
  readonly totalItems: string;
  readonly previous: string;
  readonly next: string;
  readonly createTitle: string;
  readonly editTitle: string;
  readonly detailsTitle: string;
  readonly save: string;
  readonly cancel: string;
  readonly close: string;
  readonly selectBranch: string;
  readonly requiredField: string;
  readonly positiveNumber: string;
  readonly maxLength: string;
  readonly deleteConfirm: string;
  readonly fallbackSuccess: string;
  readonly fallbackError: string;
  readonly notAvailable: string;
}

const WAITING_AREA_TRANSLATIONS: Record<AppLanguage, WaitingAreaPageTranslations> = {
  ar: {
    title: '\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    description: '\u0625\u062f\u0627\u0631\u0629 \u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631 \u0627\u0644\u0645\u0631\u062a\u0628\u0637\u0629 \u0628\u0627\u0644\u0641\u0631\u0648\u0639 \u0648\u0623\u062c\u0647\u0632\u0629 \u0627\u0644\u0635\u0648\u062a \u0648\u0627\u0644\u062a\u062d\u0643\u0645.',
    addButton: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u0637\u0642\u0629 \u0627\u0646\u062a\u0638\u0627\u0631',
    searchPlaceholder: '\u0628\u062d\u062b \u0628\u0627\u0644\u0627\u0633\u0645 \u0623\u0648 \u0627\u0644\u062c\u0647\u0627\u0632 \u0623\u0648 \u0627\u0644\u0631\u0642\u0645',
    branchFilter: '\u0627\u0644\u0641\u0631\u0639',
    allBranches: '\u0643\u0644 \u0627\u0644\u0641\u0631\u0648\u0639',
    pageSize: '\u062d\u062c\u0645 \u0627\u0644\u0635\u0641\u062d\u0629',
    number: '\u0627\u0644\u0631\u0642\u0645',
    descriptiveName: '\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0648\u0635\u0641\u064a',
    branch: '\u0627\u0644\u0641\u0631\u0639',
    audioDevice: '\u062c\u0647\u0627\u0632 \u0627\u0644\u0635\u0648\u062a',
    controlDevice: '\u062c\u0647\u0627\u0632 \u0627\u0644\u062a\u062d\u0643\u0645',
    windowsCount: 'عدد أماكن الخدمات',
    actions: '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    view: '\u0639\u0631\u0636',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    status: '\u0627\u0644\u062d\u0627\u0644\u0629',
    allStatuses: '\u0643\u0644 \u0627\u0644\u062d\u0627\u0644\u0627\u062a',
    active: '\u0646\u0634\u0637',
    inactive: '\u063a\u064a\u0631 \u0646\u0634\u0637',
    operationalStatus: '\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629',
    operationalUnavailable: '\u063a\u064a\u0631 \u0645\u062a\u0627\u062d \u0628\u0633\u0628\u0628 \u062d\u0627\u0644\u0629 \u0627\u0644\u0639\u0646\u0635\u0631 \u0627\u0644\u0623\u0628',
    deactivate: '\u0625\u064a\u0642\u0627\u0641',
    reactivate: '\u0625\u0639\u0627\u062f\u0629 \u062a\u0646\u0634\u064a\u0637',
    permanentDelete: '\u062d\u0630\u0641 \u0646\u0647\u0627\u0626\u064a',
    refresh: '\u062a\u062d\u062f\u064a\u062b',
    loading: '\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644...',
    emptyTitle: '\u0644\u0627 \u062a\u0648\u062c\u062f \u0645\u0646\u0627\u0637\u0642 \u0627\u0646\u062a\u0638\u0627\u0631',
    emptyDescription: '\u063a\u064a\u0631 \u0627\u0644\u0628\u062d\u062b \u0623\u0648 \u0627\u0644\u0641\u0631\u0639 \u0623\u0648 \u0623\u0636\u0641 \u0645\u0646\u0637\u0642\u0629 \u0627\u0646\u062a\u0638\u0627\u0631 \u062c\u062f\u064a\u062f\u0629.',
    totalItems: '\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0639\u0646\u0627\u0635\u0631',
    previous: '\u0627\u0644\u0633\u0627\u0628\u0642',
    next: '\u0627\u0644\u062a\u0627\u0644\u064a',
    createTitle: '\u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u0637\u0642\u0629 \u0627\u0646\u062a\u0638\u0627\u0631',
    editTitle: '\u062a\u0639\u062f\u064a\u0644 \u0645\u0646\u0637\u0642\u0629 \u0627\u0646\u062a\u0638\u0627\u0631',
    detailsTitle: '\u062a\u0641\u0627\u0635\u064a\u0644 \u0645\u0646\u0637\u0642\u0629 \u0627\u0646\u062a\u0638\u0627\u0631',
    save: '\u062d\u0641\u0638',
    cancel: '\u0625\u0644\u063a\u0627\u0621',
    close: '\u0625\u063a\u0644\u0627\u0642',
    selectBranch: '\u0627\u062e\u062a\u0631 \u0641\u0631\u0639',
    requiredField: '\u0647\u0630\u0627 \u0627\u0644\u062d\u0642\u0644 \u0645\u0637\u0644\u0648\u0628.',
    positiveNumber: '\u0627\u0644\u0642\u064a\u0645\u0629 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0635\u0641\u0631.',
    maxLength: '\u0627\u0644\u062d\u062f \u0627\u0644\u0623\u0642\u0635\u0649 100 \u062d\u0631\u0641.',
    deleteConfirm: '\u062a\u0623\u0643\u064a\u062f \u062d\u0630\u0641 \u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0627\u0646\u062a\u0638\u0627\u0631',
    fallbackSuccess: '\u062a\u0645 \u062a\u0646\u0641\u064a\u0630 \u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0628\u0646\u062c\u0627\u062d.',
    fallbackError: '\u062d\u062f\u062b \u062e\u0637\u0623 \u063a\u064a\u0631 \u0645\u062a\u0648\u0642\u0639.',
    notAvailable: '-'
  },
  en: {
    title: 'Waiting Areas',
    description: 'Manage branch waiting areas, audio devices, control devices, and related service locations.',
    addButton: 'Add Waiting Area',
    searchPlaceholder: 'Search by name, device, or number',
    branchFilter: 'Branch',
    allBranches: 'All branches',
    pageSize: 'Page size',
    number: 'Number',
    descriptiveName: 'Descriptive Name',
    branch: 'Branch',
    audioDevice: 'Audio Device',
    controlDevice: 'Control Device',
    windowsCount: 'Service Locations Count',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    status: 'Status',
    allStatuses: 'All statuses',
    active: 'Active',
    inactive: 'Inactive',
    operationalStatus: 'Operational Status',
    operationalUnavailable: 'Unavailable because parent is inactive',
    deactivate: 'Deactivate',
    reactivate: 'Reactivate',
    permanentDelete: 'Permanent Delete',
    refresh: 'Refresh',
    loading: 'Loading...',
    emptyTitle: 'No waiting areas found',
    emptyDescription: 'Change the search, choose another branch, or add a new waiting area.',
    totalItems: 'Total items',
    previous: 'Previous',
    next: 'Next',
    createTitle: 'Create Waiting Area',
    editTitle: 'Edit Waiting Area',
    detailsTitle: 'Waiting Area Details',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    selectBranch: 'Select branch',
    requiredField: 'This field is required.',
    positiveNumber: 'Value must be greater than zero.',
    maxLength: 'Maximum length is 100 characters.',
    deleteConfirm: 'Delete waiting area',
    fallbackSuccess: 'Operation completed successfully.',
    fallbackError: 'Unexpected error occurred.',
    notAvailable: '-'
  }
};

const EMPTY_PAGE: Pagination<WaitingAreaListItem> = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false
};

@Component({
  selector: 'app-waiting-areas',
  imports: [ReactiveFormsModule, MobileRecordCardComponent, PageHeroComponent, NiletronixLoadingStateComponent],
  templateUrl: './waiting-areas.component.html',
  styleUrl: './waiting-areas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WaitingAreasComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly branchManagementApiService = inject(BranchManagementApiService);
  private readonly waitingAreaApiService = inject(WaitingAreaApiService);
  private readonly branchContextStore = inject(AdminBranchContextStore);
  private readonly i18nStore = inject(AdminI18nStore);
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;
  private panelRequestId = 0;
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly translations = computed(() => WAITING_AREA_TRANSLATIONS[this.i18nStore.language()]);
  protected readonly branchOptions = signal<readonly BranchOption[]>([]);
  protected readonly waitingAreaPage = signal<Pagination<WaitingAreaListItem>>(EMPTY_PAGE);
  protected readonly search = signal('');
  protected readonly selectedBranchId = signal<number | null>(null);
  protected readonly isBranchContextLocked = computed(
    () =>
      this.authSessionService.currentSession()?.userType === 'TechnicalAdmin' &&
      this.branchContextStore.selectedBranchId() !== null,
  );
  protected readonly statusFilter = signal<boolean | null>(null);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);
  protected readonly panelLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<number | null>(null);
  protected readonly panelMode = signal<WaitingAreaPanelMode>('closed');
  protected readonly selectedDetails = signal<WaitingAreaDetails | null>(null);
  protected readonly selectedEditId = signal<number | null>(null);
  protected readonly message = signal<UiMessage | null>(null);

  protected readonly waitingAreaForm = this.formBuilder.group({
    branchId: [0, [Validators.required, Validators.min(1)]],
    number: [1, [Validators.required, Validators.min(1)]],
    descriptiveName: ['', [Validators.maxLength(100)]],
    audioDevice: ['', [Validators.maxLength(100)]],
    controlDevice: ['', [Validators.maxLength(100)]]
  });

  protected readonly branchIdControl = this.waitingAreaForm.controls.branchId;
  protected readonly numberControl = this.waitingAreaForm.controls.number;
  protected readonly descriptiveNameControl = this.waitingAreaForm.controls.descriptiveName;
  protected readonly audioDeviceControl = this.waitingAreaForm.controls.audioDevice;
  protected readonly controlDeviceControl = this.waitingAreaForm.controls.controlDevice;

  ngOnInit(): void {
    this.selectedBranchId.set(this.branchContextStore.selectedBranchId());
    this.loadBranches();
    this.loadWaitingAreas();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
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

  protected branchName(branch: Pick<WaitingAreaListItem, 'branchArabicName' | 'branchEnglishName'>): string {
    return this.resolveBranchName(branch.branchArabicName ?? null, branch.branchEnglishName ?? null);
  }

  protected optionName(branch: BranchOption): string {
    return this.resolveBranchName(branch.arabicName, branch.englishName);
  }

  protected updateSearch(event: Event): void {
    this.search.set(this.readInputValue(event));

    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
    }

    this.searchDebounceId = setTimeout(() => this.loadWaitingAreas(1), 350);
  }

  protected updateBranchFilter(event: Event): void {
    if (this.isBranchContextLocked()) {
      return;
    }

    const value = this.readInputValue(event);
    this.selectedBranchId.set(value ? Number(value) : null);
    this.loadWaitingAreas(1);
  }

  protected updateStatusFilter(event: Event): void {
    const value = this.readInputValue(event);
    this.statusFilter.set(value === '' ? null : value === 'true');
    this.loadWaitingAreas(1);
  }

  protected updatePageSize(event: Event): void {
    const value = Number(this.readInputValue(event));
    this.pageSize.set(Number.isFinite(value) && value > 0 ? Math.min(value, 100) : 10);
    this.loadWaitingAreas(1);
  }

  protected refresh(): void {
    this.loadWaitingAreas(this.waitingAreaPage().currentPage);
  }

  protected previousPage(): void {
    const page = this.waitingAreaPage();

    if (page.hasPreviousPage) {
      this.loadWaitingAreas(page.currentPage - 1);
    }
  }

  protected nextPage(): void {
    const page = this.waitingAreaPage();

    if (page.hasNextPage) {
      this.loadWaitingAreas(page.currentPage + 1);
    }
  }

  protected openCreate(): void {
    this.panelRequestId += 1;
    this.panelLoading.set(false);
    this.clearMessage();
    this.selectedDetails.set(null);
    this.selectedEditId.set(null);
    this.panelMode.set('create');
    this.branchIdControl.enable({ emitEvent: false });
    this.waitingAreaForm.reset({
      branchId: this.selectedBranchId() ?? 0,
      number: 1,
      descriptiveName: '',
      audioDevice: '',
      controlDevice: ''
    });

    if (this.isBranchContextLocked()) {
      this.branchIdControl.disable({ emitEvent: false });
    }
  }

  protected openView(waitingAreaId: number): void {
    this.openDetails(waitingAreaId, 'view');
  }

  protected openEdit(waitingAreaId: number): void {
    this.openDetails(waitingAreaId, 'edit');
  }

  protected closePanel(): void {
    this.panelRequestId += 1;
    this.panelLoading.set(false);
    this.panelMode.set('closed');
    this.selectedDetails.set(null);
    this.selectedEditId.set(null);
    this.waitingAreaForm.markAsPristine();
    this.branchIdControl.enable({ emitEvent: false });
  }

  protected save(): void {
    if (this.waitingAreaForm.invalid || !this.isFormNumberValid()) {
      this.waitingAreaForm.markAllAsTouched();
      return;
    }

    const mode = this.panelMode();

    if (mode === 'create') {
      this.createWaitingArea();
      return;
    }

    if (mode === 'edit') {
      this.updateWaitingArea();
    }
  }

  protected deactivateWaitingArea(item: WaitingAreaListItem): void {
    if (!window.confirm(`${this.translations().deactivate}: ${item.descriptiveName || item.number}?`)) {
      return;
    }

    this.runLifecycleAction(item, 'deactivate');
  }

  protected reactivateWaitingArea(item: WaitingAreaListItem): void {
    if (!window.confirm(`${this.translations().reactivate}: ${item.descriptiveName || item.number}?`)) {
      return;
    }

    this.runLifecycleAction(item, 'reactivate');
  }

  protected permanentlyDeleteWaitingArea(item: WaitingAreaListItem): void {
    if (!window.confirm(`${this.translations().permanentDelete}: ${item.descriptiveName || item.number}?`)) {
      return;
    }

    this.runLifecycleAction(item, 'permanent');
  }
  protected formTitle(): string {
    const translations = this.translations();

    if (this.panelMode() === 'create') {
      return translations.createTitle;
    }

    if (this.panelMode() === 'edit') {
      return translations.editTitle;
    }

    return translations.detailsTitle;
  }

  protected hasFieldError(controlName: 'branchId' | 'number' | 'descriptiveName' | 'audioDevice' | 'controlDevice'): boolean {
    const control = this.waitingAreaForm.controls[controlName];
    return control.touched && control.invalid;
  }

  protected isFormNumberValid(): boolean {
    const number = Number(this.waitingAreaForm.controls.number.value);
    return Number.isInteger(number) && number > 0;
  }

  protected textOrFallback(value: string | null | undefined): string {
    return value && value.trim().length > 0 ? value : this.translations().notAvailable;
  }

  private loadWaitingAreas(pageNumber = 1, force = false): void {
    if (this.loading() && !force) {
      return;
    }

    this.loading.set(true);

    this.waitingAreaApiService
      .getWaitingAreas({
        branchId: this.selectedBranchId(),
        search: this.search().trim(),
        pageNumber,
        pageSize: this.pageSize(),
        isActive: this.statusFilter()
      })
      .subscribe({
        next: (page) => {
          this.waitingAreaPage.set(page);
          this.clearMessage();
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.loading.set(false)
      });
  }

  private loadBranches(): void {
    this.branchManagementApiService
      .getBranches({
        searchText: '',
        orderSort: 'Newest',
        pageNumber: 1,
        pageSize: 100,
        isActive: true
      })
      .subscribe({
        next: (page) => {
          const options = page.data.map((branch) => this.mapBranchOption(branch));
          const contextBranch = this.branchContextStore.selectedBranch();

          if (contextBranch && !options.some((branch) => branch.id === contextBranch.branchId)) {
            options.unshift({
              id: contextBranch.branchId,
              arabicName: contextBranch.arabicName,
              englishName: contextBranch.englishName,
            });
          }

          this.branchOptions.set(options);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error, false)
      });
  }

  private openDetails(waitingAreaId: number, mode: Extract<WaitingAreaPanelMode, 'edit' | 'view'>): void {
    const requestId = ++this.panelRequestId;

    this.panelLoading.set(true);
    this.panelMode.set(mode);
    this.selectedDetails.set(null);
    this.selectedEditId.set(mode === 'edit' ? waitingAreaId : null);

    this.waitingAreaApiService.getWaitingAreaDetails(waitingAreaId).subscribe({
      next: (details) => {
        if (requestId !== this.panelRequestId || this.panelMode() !== mode) {
          return;
        }

        this.selectedDetails.set(details);
        if (mode === 'edit') {
          this.branchIdControl.disable({ emitEvent: false });
          this.waitingAreaForm.reset({
            branchId: details.branchId,
            number: details.number,
            descriptiveName: details.descriptiveName ?? '',
            audioDevice: details.audioDevice ?? '',
            controlDevice: details.controlDevice ?? ''
          });
        }
      },
      error: (error: HttpErrorResponse) => {
        if (requestId !== this.panelRequestId || this.panelMode() !== mode) {
          return;
        }

        this.handleApiError(error);
        this.closePanel();
      },
      complete: () => {
        if (requestId === this.panelRequestId && this.panelMode() === mode) {
          this.panelLoading.set(false);
        }
      }
    });
  }

  private createWaitingArea(): void {
    this.saving.set(true);

    this.waitingAreaApiService.createWaitingArea(this.createRequest()).subscribe({
      next: (response) => {
        this.showSuccess(response);
        this.closePanel();
        this.loadWaitingAreas(1, true);
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.saving.set(false)
    });
  }

  private updateWaitingArea(): void {
    const waitingAreaId = this.selectedEditId();

    if (!waitingAreaId) {
      return;
    }

    this.saving.set(true);

    this.waitingAreaApiService.updateWaitingArea(waitingAreaId, this.createUpdateRequest()).subscribe({
      next: (response) => {
        this.showSuccess(response);
        this.closePanel();
        this.loadWaitingAreas(this.waitingAreaPage().currentPage);
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.saving.set(false)
    });
  }

  private createUpdateRequest(): UpdateWaitingAreaRequest {
    const value = this.waitingAreaForm.getRawValue();
    const rowVersion = this.selectedDetails()?.rowVersion ?? '';

    return {
      number: Number(value.number),
      descriptiveName: this.toOptionalString(value.descriptiveName),
      audioDevice: this.toOptionalString(value.audioDevice),
      controlDevice: this.toOptionalString(value.controlDevice),
      rowVersion
    };
  }

  private runLifecycleAction(
    item: WaitingAreaListItem,
    action: 'deactivate' | 'reactivate' | 'permanent'
  ): void {
    this.deletingId.set(item.id);
    const request = action === 'deactivate'
      ? this.waitingAreaApiService.deactivateWaitingArea(item.id, item.rowVersion)
      : action === 'reactivate'
        ? this.waitingAreaApiService.reactivateWaitingArea(item.id, item.rowVersion)
        : this.waitingAreaApiService.permanentlyDeleteWaitingArea(item.id, item.rowVersion);

    request.subscribe({
      next: (response) => {
        this.showMessage('success', response.message || this.translations().fallbackSuccess);
        const page = this.waitingAreaPage();
        const nextPage = action === 'permanent' && page.data.length === 1 && page.currentPage > 1
          ? page.currentPage - 1
          : page.currentPage;
        this.loadWaitingAreas(nextPage, true);
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.deletingId.set(null)
    });
  }
  private createRequest(): CreateWaitingAreaRequest {
    const value = this.waitingAreaForm.getRawValue();

    return {
      branchId: Number(value.branchId),
      number: Number(value.number),
      descriptiveName: this.toOptionalString(value.descriptiveName),
      audioDevice: this.toOptionalString(value.audioDevice),
      controlDevice: this.toOptionalString(value.controlDevice)
    };
  }

  private mapBranchOption(branch: BranchListItem): BranchOption {
    return {
      id: branch.branchId,
      arabicName: branch.arabicName,
      englishName: branch.englishName
    };
  }

  private resolveBranchName(arabicName: string | null, englishName: string | null): string {
    const preferredName = this.i18nStore.language() === 'ar' ? arabicName : englishName;
    const fallbackName = this.i18nStore.language() === 'ar' ? englishName : arabicName;

    return this.textOrFallback(preferredName ?? fallbackName);
  }

  private toOptionalString(value: string): string | null {
    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue : null;
  }

  private showSuccess(response: WaitingAreaMutationResponse): void {
    this.showMessage('success', response.message || this.translations().fallbackSuccess);
  }

  private handleApiError(error: HttpErrorResponse, showMessage = true): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    if (showMessage) {
      this.showMessage('error', this.extractApiMessage(error));
    }
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
  private extractApiMessage(error: HttpErrorResponse): string {
    return formatApiError(error, this.translations().fallbackError);
  }

  protected statusLabel(item: WaitingAreaListItem): string {
    return item.isActive ? this.translations().active : this.translations().inactive;
  }

  protected showOperationalWarning(item: WaitingAreaListItem): boolean {
    return item.isActive && !item.effectiveIsActive;
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}

