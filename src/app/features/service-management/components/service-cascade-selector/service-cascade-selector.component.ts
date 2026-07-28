import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { SERVICE_WORKFLOW_TRANSLATIONS } from '../../i18n/service-workflow.translations';
import { ServiceSelectionOption } from '../../models/service-management.model';
import { WorkflowCandidateService } from '../../models/service-workflow.model';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/catalog/service-management-permission.service';

export interface WorkflowSelectionLevel {
  readonly parentServiceId: number | null;
  readonly items: readonly ServiceSelectionOption[];
  readonly selectedServiceId: number | null;
  readonly loading: boolean;
  readonly error: string | null;
}

@Component({
  selector: 'app-service-cascade-selector',
  standalone: true,
  templateUrl: './service-cascade-selector.component.html',
  styleUrls: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCascadeSelectorComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly serviceManagementApiService = inject(ServiceManagementApiService);
  private readonly permissionService = inject(ServiceManagementPermissionService);

  @Input() selectionMode: 'add' | 'replace' = 'add';
  @Input() stepUid: string | null = null;

  @Output() readonly serviceSelected = new EventEmitter<{
    service: WorkflowCandidateService;
    mode: 'add' | 'replace';
    stepUid: string | null;
  }>();

  @Output() readonly selectionCanceled = new EventEmitter<void>();

  readonly translations = computed(() => SERVICE_WORKFLOW_TRANSLATIONS[this.i18nStore.language()]);
  readonly language = this.i18nStore.language;
  readonly direction = this.i18nStore.direction;
  readonly canUseServiceSelection = this.permissionService.canViewAll;

  readonly selectionLevels = signal<readonly WorkflowSelectionLevel[]>([]);
  readonly selectedSelectionPath = signal<readonly ServiceSelectionOption[]>([]);
  readonly selectionError = signal<string | null>(null);

  ngOnInit(): void {
    this.initializeServiceSelection();
  }

  public reset(): void {
    this.initializeServiceSelection();
  }

  public clear(): void {
    this.selectionLevels.set([]);
    this.selectedSelectionPath.set([]);
    this.selectionError.set(null);
  }

  selectionModeLabel(): string {
    return this.selectionMode === 'replace'
      ? this.translations().replaceStepMode
      : this.translations().addStepMode;
  }

  cancelSelection(): void {
    this.selectionCanceled.emit();
  }

  selectSelectionOption(levelIndex: number, event: Event): void {
    const serviceId = this.toOptionalNumber(this.readInputValue(event));
    const level = this.selectionLevels()[levelIndex];

    if (!level) {
      return;
    }

    if (!serviceId) {
      this.selectedSelectionPath.set(this.selectedSelectionPath().slice(0, levelIndex));
      this.selectionLevels.update((levels) => [
        ...levels.slice(0, levelIndex),
        { ...level, selectedServiceId: null, error: null },
      ]);
      this.selectionError.set(null);
      return;
    }

    const selectedOption = level.items.find((item) => item.serviceId === serviceId);

    if (!selectedOption) {
      this.selectionError.set(this.translations().selectedServiceNotFound);
      return;
    }

    const nextPath = [...this.selectedSelectionPath().slice(0, levelIndex), selectedOption];
    this.selectedSelectionPath.set(nextPath);
    this.selectionLevels.update((levels) => [
      ...levels.slice(0, levelIndex),
      { ...level, selectedServiceId: selectedOption.serviceId, error: null },
    ]);
    this.selectionError.set(null);

    if (!this.isSelectionOptionSelectable(selectedOption)) {
      this.selectionError.set(this.translations().invalidStep);
      return;
    }

    if (selectedOption.canIssueTicket) {
      this.commitSelectionOptionAsStep(selectedOption, nextPath);
      return;
    }

    if (selectedOption.hasChildren) {
      this.loadSelectionLevel(selectedOption.serviceId, levelIndex + 1);
      return;
    }

    this.selectionError.set(this.translations().serviceCannotIssueTicket);
  }

  isSelectionOptionSelectable(option: ServiceSelectionOption): boolean {
    return option.effectiveIsActive !== false;
  }

  selectionOptionName(option: ServiceSelectionOption): string {
    return this.language() === 'ar'
      ? this.formatText(option.arabicName)
      : this.formatText(option.englishName);
  }

  readInputValue(event: Event): string {
    return (event.target as HTMLInputElement | HTMLSelectElement).value;
  }

  private initializeServiceSelection(): void {
    this.selectedSelectionPath.set([]);
    this.selectionError.set(null);

    if (!this.canUseServiceSelection()) {
      this.selectionLevels.set([]);
      this.selectionError.set(this.translations().selectionAccessDenied);
      return;
    }

    this.loadSelectionLevel(null, 0);
  }

  private loadSelectionLevel(parentServiceId: number | null, levelIndex: number): void {
    if (!this.canUseServiceSelection()) {
      this.selectionError.set(this.translations().selectionAccessDenied);
      return;
    }

    const loadingLevel: WorkflowSelectionLevel = {
      parentServiceId,
      items: [],
      selectedServiceId: null,
      loading: true,
      error: null,
    };

    this.selectionError.set(null);
    this.selectionLevels.update((levels) => [...levels.slice(0, levelIndex), loadingLevel]);

    this.serviceManagementApiService
      .getServiceSelectionOptions(parentServiceId ?? undefined)
      .pipe(finalize(() => this.setSelectionLevelLoading(levelIndex, false)))
      .subscribe({
        next: (response) => {
          const items = response.items ?? [];
          const error = items.length === 0 ? this.translations().noSelectionOptions : null;

          this.selectionLevels.update((levels) => [
            ...levels.slice(0, levelIndex),
            {
              parentServiceId: response.parentServiceId ?? parentServiceId,
              items,
              selectedServiceId: null,
              loading: false,
              error,
            },
          ]);
          this.selectionError.set(error);
        },
        error: (error: HttpErrorResponse) => this.handleSelectionApiError(error, levelIndex),
      });
  }

  private setSelectionLevelLoading(levelIndex: number, loading: boolean): void {
    this.selectionLevels.update((levels) => {
      const level = levels[levelIndex];

      if (!level) {
        return levels;
      }

      return levels.map((item, index) => (index === levelIndex ? { ...item, loading } : item));
    });
  }

  private handleSelectionApiError(error: HttpErrorResponse, levelIndex: number): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    const message = this.selectionErrorMessage(error);
    this.selectionError.set(message);
    this.selectionLevels.update((levels) => {
      const level = levels[levelIndex];

      if (!level) {
        return levels;
      }

      return levels.map((item, index) =>
        index === levelIndex ? { ...item, loading: false, error: message } : item,
      );
    });
  }

  private selectionErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 403) {
      return this.translations().selectionAccessDenied;
    }

    if (error.status === 404) {
      return this.translations().selectedServiceNotFound;
    }

    return formatTechnicalAdminApiError(error, this.translations().fallbackError);
  }

  private commitSelectionOptionAsStep(
    option: ServiceSelectionOption,
    path: readonly ServiceSelectionOption[],
  ): void {
    const service = this.candidateFromSelectionOption(option, path);
    this.serviceSelected.emit({
      service,
      mode: this.selectionMode,
      stepUid: this.stepUid,
    });
  }

  private candidateFromSelectionOption(
    option: ServiceSelectionOption,
    path: readonly ServiceSelectionOption[],
  ): WorkflowCandidateService {
    const parent = [...path]
      .slice(0, -1)
      .reverse()
      .find((item) => item.serviceId === option.parentServiceId);

    return {
      serviceId: option.serviceId,
      arabicName: option.arabicName,
      englishName: option.englishName,
      serviceCode: null,
      parentServiceId: option.parentServiceId,
      parentArabicName: parent?.arabicName ?? null,
      parentEnglishName: parent?.englishName ?? null,
      isActive: option.isActive,
      isDeleted: false,
      effectiveIsActive: option.effectiveIsActive,
      isTicketIssuable: option.canIssueTicket,
    };
  }

  private toOptionalNumber(value: string): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private formatText(value: string | null | undefined): string {
    return value && value.trim().length > 0 ? value : this.translations().notAvailable;
  }
}

