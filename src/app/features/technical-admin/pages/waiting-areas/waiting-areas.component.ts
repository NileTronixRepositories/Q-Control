import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AppLanguage } from '../../../../shared/models/app-language.model';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem } from '../../models/branch-management.model';
import {
  ApiProblemDetails,
  CreateWaitingAreaRequest,
  Pagination,
  UpdateWaitingAreaRequest,
  WaitingAreaDetails,
  WaitingAreaListItem,
  WaitingAreaMutationResponse
} from '../../models/waiting-area.model';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { WaitingAreaApiService } from '../../services/waiting-area-api.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';

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
  readonly delete: string;
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
    windowsCount: '\u0639\u062f\u062f \u0627\u0644\u0634\u0628\u0627\u0628\u064a\u0643',
    actions: '\u0627\u0644\u0625\u062c\u0631\u0627\u0621\u0627\u062a',
    view: '\u0639\u0631\u0636',
    edit: '\u062a\u0639\u062f\u064a\u0644',
    delete: '\u062d\u0630\u0641',
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
    description: 'Manage branch waiting areas, audio devices, control devices, and related windows.',
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
    windowsCount: 'Windows Count',
    actions: 'Actions',
    view: 'View',
    edit: 'Edit',
    delete: 'Delete',
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
  imports: [ReactiveFormsModule],
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
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private searchDebounceId: ReturnType<typeof setTimeout> | null = null;

  protected readonly translations = computed(() => WAITING_AREA_TRANSLATIONS[this.i18nStore.language()]);
  protected readonly branchOptions = signal<readonly BranchOption[]>([]);
  protected readonly waitingAreaPage = signal<Pagination<WaitingAreaListItem>>(EMPTY_PAGE);
  protected readonly search = signal('');
  protected readonly selectedBranchId = signal<number | null>(null);
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
    this.loadBranches();
    this.loadWaitingAreas();
  }

  ngOnDestroy(): void {
    if (this.searchDebounceId) {
      clearTimeout(this.searchDebounceId);
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
    const value = this.readInputValue(event);
    this.selectedBranchId.set(value ? Number(value) : null);
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
    this.message.set(null);
    this.selectedDetails.set(null);
    this.selectedEditId.set(null);
    this.panelMode.set('create');
    this.waitingAreaForm.reset({
      branchId: this.selectedBranchId() ?? 0,
      number: 1,
      descriptiveName: '',
      audioDevice: '',
      controlDevice: ''
    });
  }

  protected openView(waitingAreaId: number): void {
    this.openDetails(waitingAreaId, 'view');
  }

  protected openEdit(waitingAreaId: number): void {
    this.openDetails(waitingAreaId, 'edit');
  }

  protected closePanel(): void {
    this.panelMode.set('closed');
    this.selectedDetails.set(null);
    this.selectedEditId.set(null);
    this.waitingAreaForm.markAsPristine();
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

  protected deleteWaitingArea(item: WaitingAreaListItem): void {
    const label = item.descriptiveName || String(item.number);
    const confirmed = window.confirm(this.translations().deleteConfirm + ': ' + label + '?');

    if (!confirmed) {
      return;
    }

    this.deletingId.set(item.id);
    this.waitingAreaApiService.deleteWaitingArea(item.id).subscribe({
      next: (response) => {
        this.showSuccess(response);
        const page = this.waitingAreaPage();
        const nextPage = page.data.length === 1 && page.currentPage > 1
          ? page.currentPage - 1
          : page.currentPage;
        this.loadWaitingAreas(nextPage);
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.deletingId.set(null)
    });
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
        pageSize: this.pageSize()
      })
      .subscribe({
        next: (page) => {
          this.waitingAreaPage.set(page);
          this.message.set(null);
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
        pageSize: 100
      })
      .subscribe({
        next: (page) => this.branchOptions.set(page.data.map((branch) => this.mapBranchOption(branch))),
        error: (error: HttpErrorResponse) => this.handleApiError(error, false)
      });
  }

  private openDetails(waitingAreaId: number, mode: Extract<WaitingAreaPanelMode, 'edit' | 'view'>): void {
    this.panelLoading.set(true);
    this.panelMode.set(mode);
    this.selectedDetails.set(null);
    this.selectedEditId.set(mode === 'edit' ? waitingAreaId : null);

    this.waitingAreaApiService.getWaitingAreaDetails(waitingAreaId).subscribe({
      next: (details) => {
        this.selectedDetails.set(details);
        if (mode === 'edit') {
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
        this.handleApiError(error);
        this.closePanel();
      },
      complete: () => this.panelLoading.set(false)
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

    this.waitingAreaApiService.updateWaitingArea(waitingAreaId, {
      id: waitingAreaId,
      ...this.createRequest()
    }).subscribe({
      next: (response) => {
        this.showSuccess(response);
        this.closePanel();
        this.loadWaitingAreas(this.waitingAreaPage().currentPage);
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.saving.set(false)
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
    this.message.set({
      tone: 'success',
      text: response.message || this.translations().fallbackSuccess
    });
  }

  private handleApiError(error: HttpErrorResponse, showMessage = true): void {
    if (error.status === 401) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    if (showMessage) {
      this.message.set({
        tone: 'error',
        text: this.extractApiMessage(error)
      });
    }
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

    return this.translations().fallbackError;
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }
}
