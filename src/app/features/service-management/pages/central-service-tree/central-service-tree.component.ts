import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';

import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { SERVICE_GLOBALIZATION_TRANSLATIONS } from '../../i18n/service-globalization.translations';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import {
  ServiceDetails,
  ServiceTreeNode,
} from '../../models/service-management/service-management.model';
import { ServiceDataInvalidationService } from '../../services/catalog/service-data-invalidation/service-data-invalidation.service';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api/service-management-api.service';

interface TreeMetrics {
  readonly total: number;
  readonly rootCategories: number;
  readonly bookableLeaves: number;
  readonly active: number;
}

function countTreeMetrics(nodes: readonly ServiceTreeNode[]): TreeMetrics {
  let total = 0;
  let bookableLeaves = 0;
  let active = 0;

  function traverse(list: readonly ServiceTreeNode[]): void {
    for (const node of list) {
      total++;
      if (node.isActive && node.effectiveIsActive && !node.isDeleted) {
        active++;
      }
      if (node.canIssueTicket || !node.children || node.children.length === 0) {
        bookableLeaves++;
      }
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);

  return {
    total,
    rootCategories: nodes.length,
    bookableLeaves,
    active,
  };
}

function filterTree(nodes: readonly ServiceTreeNode[], search: string): readonly ServiceTreeNode[] {
  const query = search.trim().toLowerCase();
  if (!query) return nodes;

  function filterNode(node: ServiceTreeNode): ServiceTreeNode | null {
    const matchesSelf =
      node.arabicName.toLowerCase().includes(query) ||
      node.englishName.toLowerCase().includes(query) ||
      (node.serviceCode && node.serviceCode.toLowerCase().includes(query));

    const matchingChildren: ServiceTreeNode[] = [];
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const filteredChild = filterNode(child);
        if (filteredChild) {
          matchingChildren.push(filteredChild);
        }
      }
    }

    if (matchesSelf || matchingChildren.length > 0) {
      return {
        ...node,
        children: matchingChildren,
      };
    }

    return null;
  }

  const result: ServiceTreeNode[] = [];
  for (const node of nodes) {
    const filtered = filterNode(node);
    if (filtered) {
      result.push(filtered);
    }
  }
  return result;
}

function collectMatchingAndParentIds(
  nodes: readonly ServiceTreeNode[],
  search: string,
): Set<number> {
  const query = search.trim().toLowerCase();
  const ids = new Set<number>();
  if (!query) return ids;

  function searchInNode(node: ServiceTreeNode): boolean {
    const matchesSelf =
      node.arabicName.toLowerCase().includes(query) ||
      node.englishName.toLowerCase().includes(query) ||
      (node.serviceCode && node.serviceCode.toLowerCase().includes(query));

    let childMatched = false;
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (searchInNode(child)) {
          childMatched = true;
        }
      }
    }

    if (matchesSelf || childMatched) {
      ids.add(node.id);
      return true;
    }
    return false;
  }

  for (const node of nodes) {
    searchInNode(node);
  }
  return ids;
}

@Component({
  selector: 'app-central-service-tree',
  standalone: true,
  imports: [ServiceHierarchyTreeComponent, PageHeroComponent],
  templateUrl: './central-service-tree.component.html',
  styleUrl: './central-service-tree.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CentralServiceTreeComponent implements OnInit {
  private readonly apiService = inject(ServiceManagementApiService);
  private readonly i18nStore = inject(AdminI18nStore);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly invalidationService = inject(ServiceDataInvalidationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly translations = computed(
    () => SERVICE_GLOBALIZATION_TRANSLATIONS[this.language()],
  );
  protected readonly serviceTranslations = computed(
    () => SERVICE_MANAGEMENT_TRANSLATIONS[this.language()],
  );
  protected readonly nodes = signal<readonly ServiceTreeNode[]>([]);
  protected readonly expandedIds = signal<ReadonlySet<number>>(new Set());
  protected readonly includeInactive = signal(false);
  protected readonly includeDeleted = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly isTechnicalAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin',
  );

  // Search & filter enhancements
  protected readonly searchText = signal('');
  protected readonly filteredNodes = computed(() => filterTree(this.nodes(), this.searchText()));
  protected readonly metrics = computed(() => countTreeMetrics(this.nodes()));

  // Selected Service in tree vs Active Preview
  protected readonly selectedServiceId = signal<number | null>(null);
  protected readonly selectedNode = signal<ServiceTreeNode | null>(null);
  protected readonly selectedServiceDetails = signal<ServiceDetails | null>(null);
  protected readonly detailsLoading = signal(false);

  protected readonly treeActionsTranslations = computed(() => ({
    expandAll: this.language() === 'ar' ? 'توسيع الكل' : 'Expand All',
    collapseAll: this.language() === 'ar' ? 'طي الكل' : 'Collapse All',
    refresh: this.language() === 'ar' ? 'تحديث الشجرة' : 'Refresh Tree',
    serviceDetails: this.language() === 'ar' ? 'تفاصيل الخدمة' : 'Service Details',
    totalServices: this.language() === 'ar' ? 'إجمالي الخدمات' : 'Total Services',
    rootCategories: this.language() === 'ar' ? 'التصنيفات الرئيسية' : 'Root Categories',
    bookableServices: this.language() === 'ar' ? 'خدمات حجز التذاكر' : 'Bookable Services',
    activeServices: this.language() === 'ar' ? 'الخدمات النشطة' : 'Active Services',
    serviceCode: this.language() === 'ar' ? 'كود الخدمة' : 'Service Code',
    scope: this.language() === 'ar' ? 'نطاق الخدمة' : 'Service Scope',
    globalScope: this.language() === 'ar' ? 'عام (مركزي)' : 'Global',
    branchScoped: this.language() === 'ar' ? 'خاص بالفرع' : 'Branch-scoped',
    ownerBranch: this.language() === 'ar' ? 'الفرع المالك' : 'Owner Branch',
    status: this.language() === 'ar' ? 'الحالة التشغيلية' : 'Operational Status',
    active: this.language() === 'ar' ? 'نشط' : 'Active',
    inactive: this.language() === 'ar' ? 'غير نشط' : 'Inactive',
    deleted: this.language() === 'ar' ? 'محذوف' : 'Deleted',
    ticketIssuing: this.language() === 'ar' ? 'إصدار التذاكر' : 'Ticket Issuing',
    allowed: this.language() === 'ar' ? 'متاح ومفعل' : 'Enabled',
    notAllowed: this.language() === 'ar' ? 'غير متاح' : 'Disabled',
    orderNo: this.language() === 'ar' ? 'الترتيب' : 'Order No',
    hasChildren: this.language() === 'ar' ? 'نوع العقدة' : 'Node Type',
    categoryNode:
      this.language() === 'ar' ? 'تصنيف (يحتوي خدمات فرعية)' : 'Category (Has children)',
    leafNode: this.language() === 'ar' ? 'خدمة نهائية (طرفية)' : 'Leaf Service',
    close: this.language() === 'ar' ? 'إغلاق المعاينة' : 'Close Details',
    parentService: this.language() === 'ar' ? 'الخدمة الأم / التصنيف' : 'Parent Category',
    customerMessage: this.language() === 'ar' ? 'رسالة توجيه العميل' : 'Customer Guidance Message',
    ticketPrefix: this.language() === 'ar' ? 'بادئة ونطاق التذاكر' : 'Ticket Prefix & Range',
    waitingDuration: this.language() === 'ar' ? 'مدة الانتظار المقدرة' : 'Estimated Waiting',
    ticketCopies: this.language() === 'ar' ? 'نسخ التذكرة' : 'Ticket Copies',
    priority: this.language() === 'ar' ? 'الأولوية' : 'Priority',
    reservation: this.language() === 'ar' ? 'حجز مسبق' : 'Reservation',
    clientInput: this.language() === 'ar' ? 'مدخلات من العميل' : 'Client Input',
    required: this.language() === 'ar' ? 'مطلوب' : 'Required',
    notRequired: this.language() === 'ar' ? 'غير مطلوب' : 'Not Required',
    serviceId: this.language() === 'ar' ? 'معرف الخدمة' : 'Service ID',
    minutes: this.language() === 'ar' ? 'دقيقة' : 'min',
    copy: this.language() === 'ar' ? 'نسخة' : 'copy',
    copies: this.language() === 'ar' ? 'نسخ' : 'copies',
  }));

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
            ? this.error.set(formatApiError(error, this.translations().fallbackError))
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
    if (next.has(node.id)) next.delete(node.id);
    else next.add(node.id);
    this.expandedIds.set(next);
  }

  protected onSearchChange(text: string): void {
    this.searchText.set(text);
    if (text.trim()) {
      const matchingIds = collectMatchingAndParentIds(this.nodes(), text);
      this.expandedIds.set(new Set([...this.expandedIds(), ...matchingIds]));
    }
  }

  protected expandAll(): void {
    const allIds = new Set<number>();
    const collect = (list: readonly ServiceTreeNode[]): void => {
      for (const node of list) {
        if (node.children && node.children.length > 0) {
          allIds.add(node.id);
          collect(node.children);
        }
      }
    };
    collect(this.nodes());
    this.expandedIds.set(allIds);
  }

  protected collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  protected onNodeSelected(node: ServiceTreeNode): void {
    this.selectedServiceId.set(node.id);
  }

  protected openPreview(node: ServiceTreeNode): void {
    this.selectedServiceId.set(node.id);
    this.selectedNode.set(node);
    this.selectedServiceDetails.set(null);
    this.detailsLoading.set(true);

    this.apiService
      .getServiceDetails(node.id)
      .pipe(
        finalize(() => this.detailsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (details) => this.selectedServiceDetails.set(details),
        error: () => this.selectedServiceDetails.set(null),
      });
  }

  protected closeDetails(): void {
    this.selectedNode.set(null);
    this.selectedServiceDetails.set(null);
  }

  @HostListener('document:keydown.escape')
  protected onEscapePressed(): void {
    if (this.selectedNode()) {
      this.closeDetails();
    }
  }
}
