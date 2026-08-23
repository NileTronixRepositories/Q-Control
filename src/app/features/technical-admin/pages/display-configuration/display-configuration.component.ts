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

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { resolveJwtPermissions } from '../../../auth/utils/auth-permissions.util';
import { BranchListItem } from '../../models/branch-management.model';
import {
  DisplayConfigurationResponse,
  DisplayMessageResponse,
} from '../../models/display-configuration.model';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { DisplayConfigurationApiService } from '../../services/display-configuration-api.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../utils/api-error-message.util';

type UiMessageTone = 'success' | 'error' | 'info';

interface UiMessage {
  readonly tone: UiMessageTone;
  readonly text: string;
}

interface BranchOption {
  readonly id: number;
  readonly label: string;
}

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const hexColorValidator = Validators.pattern(HEX_COLOR_PATTERN);

@Component({
  selector: 'app-display-configuration',
  standalone: true,
  imports: [ReactiveFormsModule, TechnicalAdminPageHeroComponent, NiletronixLoadingStateComponent],
  templateUrl: './display-configuration.component.html',
  styleUrls: ['./display-configuration.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayConfigurationComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly branchManagementApiService = inject(BranchManagementApiService);
  private readonly displayConfigApiService = inject(DisplayConfigurationApiService);
  readonly i18nStore = inject(TechnicalAdminI18nStore);

  readonly language = this.i18nStore.language;
  readonly direction = this.i18nStore.direction;
  readonly copy = this.i18nStore.translations;

  // ─── State ─────────────────────────────────────────────────────────────

  readonly branches = signal<readonly BranchOption[]>([]);
  readonly selectedBranchId = signal<number | null>(null);
  readonly configuration = signal<DisplayConfigurationResponse | null>(null);
  readonly messages = signal<readonly DisplayMessageResponse[]>([]);
  readonly branchesLoading = signal<boolean>(true);
  readonly configLoading = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly messagesLoading = signal<boolean>(false);
  readonly messageSaving = signal<boolean>(false);
  readonly message = signal<UiMessage | null>(null);
  private messageTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly isConfigured = computed(() => this.configuration() !== null);
  readonly rowVersion = computed(() => this.configuration()?.rowVersion ?? null);

  readonly canUpdate = computed(() => {
    const session = this.authSessionService.currentSession();
    if (!session || session.userType === 'TechnicalAdmin') {
      return true;
    }
    const permissions = resolveJwtPermissions(session.token);
    return permissions.has('Branches.Update');
  });

  readonly canView = computed(() => {
    const session = this.authSessionService.currentSession();
    if (!session || session.userType === 'TechnicalAdmin') {
      return true;
    }
    const permissions = resolveJwtPermissions(session.token);
    return permissions.has('Branches.ViewDetails') || permissions.has('Branches.Update');
  });

  // ─── Message Editor State ──────────────────────────────────────────────

  readonly editingMessageId = signal<number | null>(null);
  readonly showAddMessageForm = signal<boolean>(false);
  readonly dragSourceIndex = signal<number | null>(null);

  // ─── Config Form ───────────────────────────────────────────────────────

  readonly configForm = this.formBuilder.group({
    displayBackgroundColor: ['#FFFFFF', [Validators.required, hexColorValidator]],

    mainTitleAr: ['', [Validators.required, Validators.maxLength(200)]],
    mainTitleEn: ['', [Validators.required, Validators.maxLength(200)]],
    headerBackgroundColor: ['#FFFFFF', [Validators.required, hexColorValidator]],
    mainTitleTextColor: ['#158EA3', [Validators.required, hexColorValidator]],
    mainTitleFontSize: [28, [Validators.required, Validators.min(1), Validators.max(100)]],

    tableHeaderBackgroundColor: ['#158EA3', [Validators.required, hexColorValidator]],
    tableHeaderTextColor: ['#FFFFFF', [Validators.required, hexColorValidator]],
    tableRowBackgroundColor: ['#FFFFFF', [Validators.required, hexColorValidator]],
    tableRowTextColor: ['#333333', [Validators.required, hexColorValidator]],
    ticketNumberBackgroundColor: ['#158EA3', [Validators.required, hexColorValidator]],
    ticketNumberTextColor: ['#FFFFFF', [Validators.required, hexColorValidator]],

    ticketColumnTitleAr: ['رقم التذكرة', [Validators.required, Validators.maxLength(200)]],
    ticketColumnTitleEn: ['Ticket Number', [Validators.required, Validators.maxLength(200)]],
    serviceColumnTitleAr: ['الطبيب - الخدمة', [Validators.required, Validators.maxLength(200)]],
    serviceColumnTitleEn: ['Doctor / Service', [Validators.required, Validators.maxLength(200)]],
    windowColumnTitleAr: ['العيادة / الشباك', [Validators.required, Validators.maxLength(200)]],
    windowColumnTitleEn: ['Clinic / Window', [Validators.required, Validators.maxLength(200)]],

    tickerBackgroundColor: ['#FFFFFF', [Validators.required, hexColorValidator]],
    tickerTextColor: ['#158EA3', [Validators.required, hexColorValidator]],
    tickerFontSize: [18, [Validators.required, Validators.min(1), Validators.max(100)]],

    showClock: [true],
    clockBackgroundColor: ['#158EA3', [Validators.required, hexColorValidator]],
    clockTextColor: ['#FFFFFF', [Validators.required, hexColorValidator]],
  });

  // ─── Message Form ──────────────────────────────────────────────────────

  readonly messageForm = this.formBuilder.group({
    textAr: ['', [Validators.required, Validators.maxLength(500)]],
    textEn: ['', [Validators.required, Validators.maxLength(500)]],
    displayOrder: [1, [Validators.required, Validators.min(1)]],
  });

  // ─── Lifecycle ─────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadBranches();
  }

  ngOnDestroy(): void {
    this.clearTimeout();
  }

  // ─── Branch Selection ──────────────────────────────────────────────────

  selectBranch(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const nextBranchId = target.value ? Number(target.value) : null;
    this.selectedBranchId.set(nextBranchId);

    if (nextBranchId) {
      this.syncSelectedBranchQuery(nextBranchId);
      this.loadConfiguration(nextBranchId);
      this.loadMessages(nextBranchId);
    } else {
      this.configuration.set(null);
      this.messages.set([]);
    }
  }

  refresh(): void {
    const branchId = this.selectedBranchId();
    if (branchId) {
      this.loadConfiguration(branchId);
      this.loadMessages(branchId);
    } else {
      this.loadBranches();
    }
  }

  // ─── Config Save ───────────────────────────────────────────────────────

  saveConfig(): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !this.canUpdate() || this.saving() || this.configForm.invalid) {
      this.configForm.markAllAsTouched();
      return;
    }

    const formValue = this.configForm.getRawValue();

    this.saving.set(true);
    this.clearMessage();

    const request$ = this.isConfigured()
      ? this.displayConfigApiService.updateDisplayConfiguration(branchId, {
          ...formValue,
          rowVersion: this.rowVersion()!,
        })
      : this.displayConfigApiService.createDisplayConfiguration(branchId, formValue);

    request$.subscribe({
      next: (response) => {
        this.saving.set(false);
        this.configuration.set(response);
        this.showMessage('success', this.copy().savedSuccessfullyLabel);
      },
      error: (error: HttpErrorResponse) => {
        this.saving.set(false);
        this.handleApiError(error, branchId);
      },
    });
  }

  // ─── Messages CRUD ─────────────────────────────────────────────────────

  openAddMessageForm(): void {
    const currentMessages = this.messages();
    const nextOrder = currentMessages.length > 0
      ? Math.max(...currentMessages.map((m) => m.displayOrder)) + 1
      : 1;

    this.messageForm.reset({ textAr: '', textEn: '', displayOrder: nextOrder });
    this.showAddMessageForm.set(true);
    this.editingMessageId.set(null);
  }

  cancelMessageForm(): void {
    this.showAddMessageForm.set(false);
    this.editingMessageId.set(null);
  }

  submitNewMessage(): void {
    const branchId = this.selectedBranchId();
    if (!branchId || this.messageSaving() || this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    this.messageSaving.set(true);
    this.clearMessage();

    const request = this.messageForm.getRawValue();

    this.displayConfigApiService.createDisplayMessage(branchId, request).subscribe({
      next: (created) => {
        this.messageSaving.set(false);
        this.messages.update((list) => [...list, created].sort((a, b) => a.displayOrder - b.displayOrder));
        this.showAddMessageForm.set(false);
        this.showMessage('success', this.copy().savedSuccessfullyLabel);
      },
      error: (error: HttpErrorResponse) => {
        this.messageSaving.set(false);
        this.handleApiError(error, branchId);
      },
    });
  }

  startEditMessage(msg: DisplayMessageResponse): void {
    this.editingMessageId.set(msg.id);
    this.showAddMessageForm.set(false);
    this.messageForm.patchValue({
      textAr: msg.textAr,
      textEn: msg.textEn,
      displayOrder: msg.displayOrder,
    });
  }

  submitEditMessage(): void {
    const branchId = this.selectedBranchId();
    const messageId = this.editingMessageId();
    if (!branchId || !messageId || this.messageSaving() || this.messageForm.invalid) {
      this.messageForm.markAllAsTouched();
      return;
    }

    const currentMsg = this.messages().find((m) => m.id === messageId);
    if (!currentMsg) return;

    this.messageSaving.set(true);
    this.clearMessage();

    const request = {
      ...this.messageForm.getRawValue(),
      rowVersion: currentMsg.rowVersion,
    };

    this.displayConfigApiService.updateDisplayMessage(branchId, messageId, request).subscribe({
      next: (updated) => {
        this.messageSaving.set(false);
        this.messages.update((list) =>
          list.map((m) => (m.id === updated.id ? updated : m)).sort((a, b) => a.displayOrder - b.displayOrder),
        );
        this.editingMessageId.set(null);
        this.showMessage('success', this.copy().savedSuccessfullyLabel);
      },
      error: (error: HttpErrorResponse) => {
        this.messageSaving.set(false);
        this.handleApiError(error, branchId);
      },
    });
  }

  deactivateMessage(msg: DisplayMessageResponse): void {
    const branchId = this.selectedBranchId();
    if (!branchId || this.messageSaving()) return;

    this.messageSaving.set(true);
    this.clearMessage();

    this.displayConfigApiService.deactivateDisplayMessage(branchId, msg.id, msg.rowVersion).subscribe({
      next: (response) => {
        this.messageSaving.set(false);
        this.messages.update((list) =>
          list.map((m) =>
            m.id === response.messageId
              ? { ...m, isActive: response.isActive, rowVersion: response.rowVersion }
              : m,
          ),
        );
        this.showMessage('success', this.copy().savedSuccessfullyLabel);
      },
      error: (error: HttpErrorResponse) => {
        this.messageSaving.set(false);
        this.handleApiError(error, branchId);
      },
    });
  }

  reactivateMessage(msg: DisplayMessageResponse): void {
    const branchId = this.selectedBranchId();
    if (!branchId || this.messageSaving()) return;

    this.messageSaving.set(true);
    this.clearMessage();

    this.displayConfigApiService.reactivateDisplayMessage(branchId, msg.id, msg.rowVersion).subscribe({
      next: (response) => {
        this.messageSaving.set(false);
        this.messages.update((list) =>
          list.map((m) =>
            m.id === response.messageId
              ? { ...m, isActive: response.isActive, rowVersion: response.rowVersion }
              : m,
          ),
        );
        this.showMessage('success', this.copy().savedSuccessfullyLabel);
      },
      error: (error: HttpErrorResponse) => {
        this.messageSaving.set(false);
        this.handleApiError(error, branchId);
      },
    });
  }

  // ─── Drag & Drop Reorder ───────────────────────────────────────────────

  onDragStart(index: number): void {
    this.dragSourceIndex.set(index);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(targetIndex: number): void {
    const sourceIndex = this.dragSourceIndex();
    if (sourceIndex === null || sourceIndex === targetIndex) {
      this.dragSourceIndex.set(null);
      return;
    }

    const branchId = this.selectedBranchId();
    if (!branchId) return;

    const currentList = [...this.messages()];
    const [moved] = currentList.splice(sourceIndex, 1);
    currentList.splice(targetIndex, 0, moved);

    const reorderItems = currentList.map((msg, idx) => ({
      messageId: msg.id,
      displayOrder: idx + 1,
      rowVersion: msg.rowVersion,
    }));

    this.dragSourceIndex.set(null);
    this.messageSaving.set(true);
    this.clearMessage();

    this.displayConfigApiService
      .reorderDisplayMessages(branchId, { items: reorderItems })
      .subscribe({
        next: (updatedList) => {
          this.messageSaving.set(false);
          this.messages.set([...updatedList].sort((a, b) => a.displayOrder - b.displayOrder));
          this.showMessage('success', this.copy().savedSuccessfullyLabel);
        },
        error: (error: HttpErrorResponse) => {
          this.messageSaving.set(false);
          this.loadMessages(branchId);
          this.handleApiError(error, branchId);
        },
      });
  }

  // ─── Color Sync ────────────────────────────────────────────────────────

  onColorPickerChange(controlName: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value?.toUpperCase();
    (this.configForm.get(controlName) as any)?.setValue(value);
  }

  onColorTextInput(controlName: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    let value = target.value?.trim();
    if (value && !value.startsWith('#')) {
      value = `#${value}`;
    }
    (this.configForm.get(controlName) as any)?.setValue(value?.toUpperCase() ?? '');
  }

  // ─── Message Helpers ───────────────────────────────────────────────────

  clearMessage(): void {
    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = null;
    }
    this.message.set(null);
  }

  // ─── Private ───────────────────────────────────────────────────────────

  private loadBranches(): void {
    this.branchesLoading.set(true);
    this.branchManagementApiService
      .getBranches({
        searchText: '',
        orderSort: 'Newest',
        pageNumber: 1,
        pageSize: 100,
        isActive: null,
      })
      .subscribe({
        next: (response) => {
          const branchOptions = response.data.map((branch) => this.mapBranchOption(branch));
          this.branches.set(branchOptions);
          this.selectInitialBranch(branchOptions);
        },
        error: (error: HttpErrorResponse) => {
          this.branchesLoading.set(false);
          this.handleApiError(error, null);
        },
        complete: () => this.branchesLoading.set(false),
      });
  }

  private selectInitialBranch(branches: readonly BranchOption[]): void {
    const queryBranchId = Number(this.route.snapshot.queryParamMap.get('branchId'));
    const nextBranchId = branches.some((b) => b.id === queryBranchId)
      ? queryBranchId
      : (branches[0]?.id ?? null);

    this.selectedBranchId.set(nextBranchId);

    if (nextBranchId) {
      this.syncSelectedBranchQuery(nextBranchId);
      this.loadConfiguration(nextBranchId);
      this.loadMessages(nextBranchId);
    }
  }

  private loadConfiguration(branchId: number, clearMsg = true): void {
    this.configLoading.set(true);
    if (clearMsg) this.clearMessage();

    this.displayConfigApiService.getDisplayConfiguration(branchId).subscribe({
      next: (response) => {
        this.configLoading.set(false);
        this.applyConfiguration(response);
      },
      error: (error: HttpErrorResponse) => {
        this.configLoading.set(false);
        if (error.status === 404) {
          this.configuration.set(null);
          this.configForm.reset();
          return;
        }
        this.handleApiError(error, branchId);
      },
    });
  }

  private loadMessages(branchId: number): void {
    this.messagesLoading.set(true);

    this.displayConfigApiService.getDisplayMessages(branchId).subscribe({
      next: (response) => {
        this.messagesLoading.set(false);
        this.messages.set([...response].sort((a, b) => a.displayOrder - b.displayOrder));
      },
      error: (error: HttpErrorResponse) => {
        this.messagesLoading.set(false);
        if (error.status !== 404) {
          this.handleApiError(error, branchId);
        }
      },
    });
  }

  private applyConfiguration(response: DisplayConfigurationResponse): void {
    this.configuration.set(response);
    this.configForm.patchValue({
      displayBackgroundColor: response.displayBackgroundColor,

      mainTitleAr: response.mainTitleAr,
      mainTitleEn: response.mainTitleEn,
      headerBackgroundColor: response.headerBackgroundColor,
      mainTitleTextColor: response.mainTitleTextColor,
      mainTitleFontSize: response.mainTitleFontSize,

      tableHeaderBackgroundColor: response.tableHeaderBackgroundColor,
      tableHeaderTextColor: response.tableHeaderTextColor,
      tableRowBackgroundColor: response.tableRowBackgroundColor,
      tableRowTextColor: response.tableRowTextColor,
      ticketNumberBackgroundColor: response.ticketNumberBackgroundColor,
      ticketNumberTextColor: response.ticketNumberTextColor,

      ticketColumnTitleAr: response.ticketColumnTitleAr,
      ticketColumnTitleEn: response.ticketColumnTitleEn,
      serviceColumnTitleAr: response.serviceColumnTitleAr,
      serviceColumnTitleEn: response.serviceColumnTitleEn,
      windowColumnTitleAr: response.windowColumnTitleAr,
      windowColumnTitleEn: response.windowColumnTitleEn,

      tickerBackgroundColor: response.tickerBackgroundColor,
      tickerTextColor: response.tickerTextColor,
      tickerFontSize: response.tickerFontSize,

      showClock: response.showClock,
      clockBackgroundColor: response.clockBackgroundColor,
      clockTextColor: response.clockTextColor,
    });
  }

  private handleApiError(error: HttpErrorResponse, currentBranchId: number | null): void {
    if (error.status === 401) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/auth/login');
      return;
    }

    if (error.status === 403) {
      this.showMessage(
        'error',
        formatTechnicalAdminApiError(
          error,
          this.language() === 'ar'
            ? 'تم رفض الوصول. ليس لديك الصلاحية لتنفيذ هذه العملية.'
            : 'Access denied. You do not have authorization for this operation.',
        ),
      );
      return;
    }

    if (error.status === 409 && currentBranchId !== null) {
      this.showMessage('error', this.copy().concurrencyConflictMessage);
      this.loadConfiguration(currentBranchId, false);
      this.loadMessages(currentBranchId);
      return;
    }

    this.showMessage(
      'error',
      formatTechnicalAdminApiError(
        error,
        this.language() === 'ar'
          ? 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.'
          : 'An unexpected error occurred while communicating with the server.',
      ),
    );
  }

  private showMessage(tone: UiMessageTone, text: string): void {
    this.clearTimeout();
    this.message.set({ tone, text });
    this.messageTimeoutId = setTimeout(
      () => {
        this.message.set(null);
        this.messageTimeoutId = null;
      },
      tone === 'error' ? 7000 : 4500,
    );
  }

  private clearTimeout(): void {
    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = null;
    }
  }

  private mapBranchOption(branch: BranchListItem): BranchOption {
    const preferredName = this.language() === 'ar' ? branch.arabicName : branch.englishName;
    const fallbackName = this.language() === 'ar' ? branch.englishName : branch.arabicName;
    const label = preferredName?.trim() || fallbackName?.trim() || `BR-${branch.branchId}`;
    return { id: branch.branchId, label };
  }

  private syncSelectedBranchQuery(branchId: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { branchId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
