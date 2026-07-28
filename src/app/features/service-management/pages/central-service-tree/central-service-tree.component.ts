import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { SERVICE_GLOBALIZATION_TRANSLATIONS } from '../../i18n/service-globalization.translations';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { ServiceTreeNode } from '../../models/service-management.model';
import { ServiceDataInvalidationService } from '../../services/catalog/service-data-invalidation.service';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api.service';

@Component({
  selector: 'app-central-service-tree',
  standalone: true,
  imports: [ServiceHierarchyTreeComponent, TechnicalAdminPageHeroComponent],
  templateUrl: './central-service-tree.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CentralServiceTreeComponent implements OnInit {
  private readonly apiService = inject(ServiceManagementApiService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly invalidationService = inject(ServiceDataInvalidationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly translations = computed(() => SERVICE_GLOBALIZATION_TRANSLATIONS[this.language()]);
  protected readonly serviceTranslations = computed(() => SERVICE_MANAGEMENT_TRANSLATIONS[this.language()]);
  protected readonly nodes = signal<readonly ServiceTreeNode[]>([]);
  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly includeInactive = signal(false);
  protected readonly includeDeleted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isTechnicalAdmin = computed(() => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin');
  private initialized = false;
  private requestId = 0;

  constructor() {
    effect(() => {
      this.invalidationService.centralTreeRevision();
      if (this.initialized) untracked(() => this.loadTree(true));
    });
  }

  ngOnInit(): void {
    this.initialized = true;
    this.loadTree();
  }

  protected loadTree(force = false): void {
    if (this.loading() && !force) return;
    const requestId = ++this.requestId;
    this.loading.set(true);
    this.error.set(null);
    this.apiService
      .getCentralServiceTree({
        includeInactive: this.includeInactive(),
        includeDeleted: this.includeDeleted(),
      })
      .pipe(
        finalize(() => {
          if (requestId === this.requestId) this.loading.set(false);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          if (requestId === this.requestId) this.nodes.set(response);
        },
        error: (error: HttpErrorResponse) =>
          requestId === this.requestId
            ? this.error.set(formatTechnicalAdminApiError(error, this.translations().fallbackError))
            : undefined,
      });
  }

  protected updateFilter(kind: 'inactive' | 'deleted', value: boolean): void {
    if (kind === 'inactive') this.includeInactive.set(value);
    else this.includeDeleted.set(value);
    this.loadTree(true);
  }

  protected toggleNode(node: ServiceTreeNode): void {
    const next = new Set(this.expandedIds());
    if (next.has(node.id)) next.delete(node.id); else next.add(node.id);
    this.expandedIds.set(next);
  }
}
