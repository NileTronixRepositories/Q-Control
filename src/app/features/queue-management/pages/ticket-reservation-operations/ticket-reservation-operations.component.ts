import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AppLanguageStore, AuthSessionService, resolveJwtPermissions } from '@core';
import { AdminBranchContextStore } from '../../../../layout/admin-shell/store/admin-branch-context.store';
import { formatApiError } from '../../../../shared/utils/api-error-message.util';
import { HistoryTimelineComponent } from '../../components/history-timeline/history-timeline.component';
import {
  CancelRequest,
  CreateReservationRequest,
  CreateTicketRequest,
  HistoryEvent,
  ManualTransferRequest,
  Page,
  ReservationDetails,
  ReservationListItem,
  ReservationQuery,
  ReservationStatus,
  TicketDetails,
  TicketListItem,
  TicketQuery,
  TicketStatus,
} from '../../models/ticket-reservation/ticket-reservation.model';
import { TicketReservationApiService } from '../../services/ticket-reservation-api/ticket-reservation-api.service';
import { BranchServicesApiService } from '../../../service-management/services/branch/branch-services-api/branch-services-api.service';
import { ServiceManagementApiService } from '../../../service-management/services/catalog/service-management-api/service-management-api.service';
import { ServiceCustomInput } from '../../../service-management/models/service-management/service-management.model';
import { ServiceScheduleApiService } from '../../../service-management/services/schedule/service-schedule-api/service-schedule-api.service';
import { ServiceSchedule } from '../../../service-management/models/service-schedule/service-schedule.model';
import { SegmentApiService } from '../../../segment-management/services/segment-api/segment-api.service';

import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { TicketPrintRendererComponent } from '@shared/components/ticket-print-renderer/ticket-print-renderer.component';

export type OperationsTab = 'tickets' | 'reservations' | 'archive';
export type ArchiveSubTab = 'archived-tickets' | 'archived-reservations';

export interface ServiceLookupItem {
  readonly id: number;
  readonly nameAr: string;
  readonly nameEn: string;
  readonly fullPathAr?: string;
  readonly fullPathEn?: string;
  readonly code?: string;
  readonly isTicketIssuable?: boolean;
  readonly canIssueTicket?: boolean;
  readonly hasChildren?: boolean;
  readonly customInputs?: readonly ServiceCustomInput[];
}

export interface SegmentLookupItem {
  readonly id: number;
  readonly nameAr: string;
  readonly nameEn: string;
}

export interface DynamicCustomInputItem {
  readonly serviceCustomInputId: number;
  readonly labelAr: string;
  readonly labelEn: string;
  readonly type: string;
  readonly isRequired?: boolean;
  value: string;
}

@Component({
  selector: 'app-ticket-reservation-operations',
  imports: [
    CommonModule,
    FormsModule,
    PageHeroComponent,
    NiletronixLoadingStateComponent,
    HistoryTimelineComponent,
    TicketPrintRendererComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ticket-reservation-operations.component.html',
  styleUrl: './ticket-reservation-operations.component.css',
})
export class TicketReservationOperationsComponent {
  private readonly api = inject(TicketReservationApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchServicesApi = inject(BranchServicesApiService);
  private readonly serviceManagementApi = inject(ServiceManagementApiService);
  private readonly serviceScheduleApi = inject(ServiceScheduleApiService);
  private readonly segmentApi = inject(SegmentApiService);
  protected readonly branchStore = inject(AdminBranchContextStore);

  // Localization
  protected readonly isRtl = computed(() => this.appLanguageStore.language() === 'ar');
  protected readonly currentLang = computed(() => this.appLanguageStore.language());

  // Main UI Navigation
  protected readonly activeTab = signal<OperationsTab>('tickets');
  protected readonly archiveSubTab = signal<ArchiveSubTab>('archived-tickets');

  // Loading & Alerts
  protected readonly loading = signal(false);
  protected readonly actionLoading = signal(false);
  protected readonly alertMessage = signal<{
    tone: 'success' | 'danger' | 'warning' | 'info';
    text: string;
  } | null>(null);

  // Data Collections
  protected readonly ticketPage = signal<Page<TicketListItem>>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    data: [],
  });

  protected readonly reservationPage = signal<Page<ReservationListItem>>({
    currentPage: 1,
    pageSize: 20,
    totalItems: 0,
    data: [],
  });

  // Lookups
  protected readonly servicesLookup = signal<readonly ServiceLookupItem[]>([]);
  protected readonly issuableServices = computed(() =>
    this.servicesLookup().filter((s) => s.isTicketIssuable && !s.hasChildren),
  );
  protected readonly segmentsLookup = signal<readonly SegmentLookupItem[]>([]);
  protected readonly serviceSegmentsLookup = signal<readonly SegmentLookupItem[]>([]);
  protected readonly serviceSchedule = signal<ServiceSchedule | null>(null);
  protected readonly serviceScheduleLoading = signal(false);

  // Filters State
  protected readonly pageNumber = signal(1);
  protected readonly searchTicketNumber = signal('');
  protected readonly filterStatus = signal<string>('');
  protected readonly filterServiceId = signal<number | null>(null);
  protected readonly filterSegmentId = signal<number | null>(null);
  protected readonly filterBusinessDate = signal('');

  // Selected Entity & Details Drawer
  protected readonly selectedTicket = signal<TicketDetails | null>(null);
  protected readonly selectedReservation = signal<ReservationDetails | null>(null);
  protected readonly historyEvents = signal<readonly HistoryEvent[]>([]);
  protected readonly drawerOpen = computed(
    () => this.selectedTicket() !== null || this.selectedReservation() !== null,
  );

  // Status Catalogs
  protected readonly ticketStatuses: readonly TicketStatus[] = [
    'Waiting',
    'Called',
    'InProgress',
    'NoShow',
    'Completed',
    'Cancelled',
  ];

  protected readonly reservationStatuses: readonly ReservationStatus[] = [
    'Active',
    'NoShow',
    'Cancelled',
    'Expired',
    'ConvertedToTicket',
  ];

  // Modals Visibility & State
  protected readonly showCreateTicketModal = signal(false);
  protected readonly showCreateReservationModal = signal(false);
  protected readonly showCancelModal = signal(false);
  protected readonly cancelTargetType = signal<'ticket' | 'reservation'>('ticket');
  protected readonly cancelReason = signal('');

  protected readonly showTransferModal = signal(false);
  protected readonly transferTargetServiceId = signal<number | null>(null);
  protected readonly transferReason = signal('');

  protected readonly showConfirmModal = signal(false);
  protected readonly confirmAction = signal<
    'returnToWaiting' | 'startService' | 'completeService' | 'convertToTicket' | null
  >(null);

  // Create Form State
  protected readonly createServiceId = signal<number | null>(null);
  protected readonly createSegmentId = signal<number | null>(null);
  protected readonly createReservationDate = signal<string>('');
  protected readonly createCustomInputs = signal<DynamicCustomInputItem[]>([]);
  protected readonly createdTicketSuccess = signal<TicketDetails | null>(null);
  protected readonly createdReservationSuccess = signal<ReservationDetails | null>(null);

  // Permissions Computed
  private readonly permissions = computed(() =>
    resolveJwtPermissions(this.auth.currentSession()?.token),
  );

  protected readonly canCreateTicket = computed(() => this.permissions().has('Tickets.Create'));
  protected readonly canViewTickets = computed(() => this.permissions().has('Tickets.View'));
  protected readonly canViewTicketHistory = computed(() =>
    this.permissions().has('Tickets.ViewHistory'),
  );
  protected readonly canCancelTicket = computed(() => this.permissions().has('Tickets.Cancel'));
  protected readonly canReturnNoShow = computed(() =>
    this.permissions().has('Tickets.ReturnNoShowToWaiting'),
  );
  protected readonly canStartService = computed(() =>
    this.permissions().has('Tickets.StartService'),
  );
  protected readonly canCompleteService = computed(() =>
    this.permissions().has('Tickets.CompleteService'),
  );
  protected readonly canManualTransfer = computed(() =>
    this.permissions().has('Tickets.ManualTransfer'),
  );
  protected readonly canViewTicketArchive = computed(() =>
    this.permissions().has('Tickets.ViewArchive'),
  );

  protected readonly canCreateReservation = computed(() =>
    this.permissions().has('Reservations.Create'),
  );
  protected readonly canViewReservations = computed(() =>
    this.permissions().has('Reservations.View'),
  );
  protected readonly canViewReservationHistory = computed(() =>
    this.permissions().has('Reservations.ViewHistory'),
  );
  protected readonly canCancelReservation = computed(() =>
    this.permissions().has('Reservations.Cancel'),
  );
  protected readonly canConvertReservation = computed(() =>
    this.permissions().has('Reservations.ConvertToTicket'),
  );
  protected readonly canViewReservationArchive = computed(() =>
    this.permissions().has('Reservations.ViewArchive'),
  );

  constructor() {
    effect(() => {
      const branchId = this.branchStore.selectedBranchId();
      if (branchId) {
        this.loadLookups(branchId);
        this.loadData();
      }
    });
  }

  // --- Tab Management ---
  protected switchTab(tab: OperationsTab): void {
    this.activeTab.set(tab);
    this.closeDrawer();
    this.pageNumber.set(1);
    this.loadData();
  }

  protected switchArchiveSubTab(subTab: ArchiveSubTab): void {
    this.archiveSubTab.set(subTab);
    this.closeDrawer();
    this.pageNumber.set(1);
    this.loadData();
  }

  // --- Data Loading ---
  protected loadData(): void {
    const branchId = this.branchStore.selectedBranchId();
    if (!branchId) return;

    this.loading.set(true);
    const tab = this.activeTab();

    if (tab === 'tickets') {
      this.api
        .getTickets(
          branchId,
          {
            pageNumber: this.pageNumber(),
            pageSize: 20,
            ticketNumber: this.searchTicketNumber().trim() || undefined,
            status: (this.filterStatus() as TicketStatus) || undefined,
            businessDate: this.filterBusinessDate().trim() || undefined,
            serviceId: this.filterServiceId(),
            segmentId: this.filterSegmentId(),
          },
          false,
        )
        .subscribe({
          next: (res) => this.ticketPage.set(res),
          error: (err: HttpErrorResponse) => this.handleApiError(err, 'Failed to load tickets'),
          complete: () => this.loading.set(false),
        });
    } else if (tab === 'reservations') {
      this.api
        .getReservations(
          branchId,
          {
            pageNumber: this.pageNumber(),
            pageSize: 20,
            status: (this.filterStatus() as ReservationStatus) || undefined,
            businessDate: this.filterBusinessDate().trim() || undefined,
            serviceId: this.filterServiceId(),
            segmentId: this.filterSegmentId(),
          },
          false,
        )
        .subscribe({
          next: (res) => this.reservationPage.set(res),
          error: (err: HttpErrorResponse) =>
            this.handleApiError(err, 'Failed to load reservations'),
          complete: () => this.loading.set(false),
        });
    } else if (tab === 'archive') {
      const isArchivedTickets = this.archiveSubTab() === 'archived-tickets';
      if (isArchivedTickets) {
        this.api
          .getTickets(
            branchId,
            {
              pageNumber: this.pageNumber(),
              pageSize: 20,
              ticketNumber: this.searchTicketNumber().trim() || undefined,
              status: (this.filterStatus() as TicketStatus) || undefined,
              businessDate: this.filterBusinessDate().trim() || undefined,
              serviceId: this.filterServiceId(),
              segmentId: this.filterSegmentId(),
            },
            true,
          )
          .subscribe({
            next: (res) => this.ticketPage.set(res),
            error: (err: HttpErrorResponse) =>
              this.handleApiError(err, 'Failed to load archived tickets'),
            complete: () => this.loading.set(false),
          });
      } else {
        this.api
          .getReservations(
            branchId,
            {
              pageNumber: this.pageNumber(),
              pageSize: 20,
              status: (this.filterStatus() as ReservationStatus) || undefined,
              businessDate: this.filterBusinessDate().trim() || undefined,
              serviceId: this.filterServiceId(),
              segmentId: this.filterSegmentId(),
            },
            true,
          )
          .subscribe({
            next: (res) => this.reservationPage.set(res),
            error: (err: HttpErrorResponse) =>
              this.handleApiError(err, 'Failed to load archived reservations'),
            complete: () => this.loading.set(false),
          });
      }
    }
  }

  // --- Lookups ---
  private loadLookups(branchId: number): void {
    this.branchServicesApi
      .getBranchServicesTree(branchId, { includeInactive: true, includeDeleted: false })
      .subscribe({
        next: (nodes) => {
          const list: ServiceLookupItem[] = [];
          const flatten = (
            items: readonly any[],
            parentPathAr: readonly string[] = [],
            parentPathEn: readonly string[] = [],
          ) => {
            for (const item of items) {
              const nameAr = item.nameAr || item.arabicName || `خدمة ${item.id || item.serviceId}`;
              const nameEn =
                item.nameEn || item.englishName || `Service ${item.id || item.serviceId}`;
              const currentPathAr = [...parentPathAr, nameAr];
              const currentPathEn = [...parentPathEn, nameEn];
              const hasChildren =
                (Array.isArray(item.children) && item.children.length > 0) ||
                item.hasChildren === true;
              const isTicketIssuable =
                item.isTicketIssuable === true || item.canIssueTicket === true;

              list.push({
                id: item.id || item.serviceId,
                nameAr,
                nameEn,
                fullPathAr: currentPathAr.join(' › '),
                fullPathEn: currentPathEn.join(' › '),
                code: item.code || item.rangePrefix,
                isTicketIssuable,
                canIssueTicket: item.canIssueTicket,
                hasChildren,
                customInputs: item.customInputs || [],
              });
              if (item.children?.length) {
                flatten(item.children, currentPathAr, currentPathEn);
              }
            }
          };
          flatten(nodes || []);
          this.servicesLookup.set(list);
        },
        error: () => this.servicesLookup.set([]),
      });

    this.segmentApi.getSegments({ pageSize: 100 }).subscribe({
      next: (res) => {
        const segs: SegmentLookupItem[] = (res.data || []).map((s: any) => ({
          id: s.id,
          nameAr: s.nameAr || s.name || `شريحة ${s.id}`,
          nameEn: s.nameEn || s.name || `Segment ${s.id}`,
        }));
        this.segmentsLookup.set(segs);
      },
      error: () => this.segmentsLookup.set([]),
    });
  }

  // --- Lookup Helpers ---
  protected getServiceName(serviceId: number | null | undefined): string {
    if (!serviceId) return '—';
    const found = this.servicesLookup().find((s) => s.id === serviceId);
    if (!found) return `${this.isRtl() ? 'خدمة' : 'Service'} #${serviceId}`;
    return this.isRtl() ? found.nameAr : found.nameEn;
  }

  protected getSegmentName(segmentId: number | null | undefined): string {
    if (!segmentId) return '—';
    const found = this.segmentsLookup().find((s) => s.id === segmentId);
    if (!found) return `${this.isRtl() ? 'شريحة' : 'Segment'} #${segmentId}`;
    return this.isRtl() ? found.nameAr : found.nameEn;
  }

  // --- Drawer Management ---
  protected openTicket(ticket: TicketListItem): void {
    const branchId = this.branchStore.selectedBranchId();
    if (!branchId) return;

    const isArchive = this.activeTab() === 'archive';
    this.actionLoading.set(true);

    this.api.getTicket(branchId, ticket.id, isArchive).subscribe({
      next: (details) => {
        this.selectedTicket.set(details);
        this.selectedReservation.set(null);
        this.actionLoading.set(false);
        this.loadTicketHistory(details.id);
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleApiError(err, 'Failed to fetch ticket details');
      },
    });
  }

  protected openReservation(reservation: ReservationListItem): void {
    const branchId = this.branchStore.selectedBranchId();
    if (!branchId) return;

    const isArchive = this.activeTab() === 'archive';
    this.actionLoading.set(true);

    this.api.getReservation(branchId, reservation.id, isArchive).subscribe({
      next: (details) => {
        this.selectedReservation.set(details);
        this.selectedTicket.set(null);
        this.actionLoading.set(false);
        this.loadReservationHistory(details.id);
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleApiError(err, 'Failed to fetch reservation details');
      },
    });
  }

  protected closeDrawer(): void {
    this.selectedTicket.set(null);
    this.selectedReservation.set(null);
    this.historyEvents.set([]);
  }

  private loadTicketHistory(ticketId: number): void {
    const branchId = this.branchStore.selectedBranchId();
    if (!branchId || !this.canViewTicketHistory()) {
      this.historyEvents.set([]);
      return;
    }
    this.api.getTicketHistory(branchId, ticketId).subscribe({
      next: (events) => this.historyEvents.set(events || []),
      error: () => this.historyEvents.set([]),
    });
  }

  private loadReservationHistory(reservationId: number): void {
    const branchId = this.branchStore.selectedBranchId();
    if (!branchId || !this.canViewReservationHistory()) {
      this.historyEvents.set([]);
      return;
    }
    this.api.getReservationHistory(branchId, reservationId).subscribe({
      next: (events) => this.historyEvents.set(events || []),
      error: () => this.historyEvents.set([]),
    });
  }

  // --- Filtering & Pagination ---
  protected onFilterChange(): void {
    this.pageNumber.set(1);
    this.loadData();
  }

  protected resetFilters(): void {
    this.searchTicketNumber.set('');
    this.filterStatus.set('');
    this.filterServiceId.set(null);
    this.filterSegmentId.set(null);
    this.filterBusinessDate.set('');
    this.pageNumber.set(1);
    this.loadData();
  }

  protected previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update((p) => p - 1);
      this.loadData();
    }
  }

  protected nextPage(): void {
    this.pageNumber.update((p) => p + 1);
    this.loadData();
  }

  // --- Modal Launchers ---
  protected openCreateTicketModal(): void {
    this.createServiceId.set(null);
    this.createSegmentId.set(null);
    this.createCustomInputs.set([]);
    this.serviceSegmentsLookup.set([]);
    this.serviceSchedule.set(null);
    this.createdTicketSuccess.set(null);
    this.showCreateTicketModal.set(true);
  }

  protected openCreateReservationModal(): void {
    this.createServiceId.set(null);
    this.createSegmentId.set(null);
    this.createReservationDate.set('');
    this.createCustomInputs.set([]);
    this.serviceSegmentsLookup.set([]);
    this.serviceSchedule.set(null);
    this.createdReservationSuccess.set(null);
    this.showCreateReservationModal.set(true);
  }

  protected openCancelModal(type: 'ticket' | 'reservation'): void {
    this.cancelTargetType.set(type);
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  protected openTransferModal(): void {
    this.transferTargetServiceId.set(null);
    this.transferReason.set('');
    this.showTransferModal.set(true);
  }

  protected openConfirmModal(
    action: 'returnToWaiting' | 'startService' | 'completeService' | 'convertToTicket',
  ): void {
    this.confirmAction.set(action);
    this.showConfirmModal.set(true);
  }

  protected closeAllModals(): void {
    this.showCreateTicketModal.set(false);
    this.showCreateReservationModal.set(false);
    this.showCancelModal.set(false);
    this.showTransferModal.set(false);
    this.showConfirmModal.set(false);
    this.confirmAction.set(null);
  }

  protected onServiceSelected(serviceId: number | null): void {
    this.createServiceId.set(serviceId);
    this.createSegmentId.set(null);
    this.createCustomInputs.set([]);
    this.serviceSegmentsLookup.set([]);
    this.serviceSchedule.set(null);

    if (!serviceId) {
      return;
    }

    // 1. Fetch Service Details (Custom Inputs & Restrictions)
    this.serviceManagementApi.getServiceDetails(serviceId).subscribe({
      next: (details) => {
        const inputs = details.customInputs || [];
        const mapped: DynamicCustomInputItem[] = inputs.map((ci: any) => ({
          serviceCustomInputId: ci.serviceCustomInputId ?? ci.customInputId ?? ci.id ?? 0,
          labelAr: ci.labelAr || ci.name || 'حقل مخصص',
          labelEn: ci.labelEn || ci.name || 'Custom Field',
          type: ci.type || 'String',
          isRequired: ci.isRequired ?? false,
          value: '',
        }));
        this.createCustomInputs.set(mapped);
      },
      error: () => {
        this.createCustomInputs.set([]);
      },
    });

    const branchId = this.branchStore.selectedBranchId();
    if (branchId) {
      // 2. Fetch Assigned Segments for this Leaf Service in the Branch
      this.segmentApi.getAssignedSegments(branchId, serviceId).subscribe({
        next: (res) => {
          const segs: SegmentLookupItem[] = (res.segments || []).map((s) => ({
            id: s.segmentId,
            nameAr: s.arabicName || `شريحة ${s.segmentId}`,
            nameEn: s.englishName || `Segment ${s.segmentId}`,
          }));
          this.serviceSegmentsLookup.set(segs.length > 0 ? segs : this.segmentsLookup());
          if (segs.length === 1) {
            this.createSegmentId.set(segs[0].id);
          }
        },
        error: () => {
          this.serviceSegmentsLookup.set(this.segmentsLookup());
        },
      });

      // 3. Fetch Service Schedule
      this.serviceScheduleLoading.set(true);
      this.serviceScheduleApi.getSchedule(branchId, serviceId).subscribe({
        next: (schedule) => {
          this.serviceSchedule.set(schedule);
          this.serviceScheduleLoading.set(false);
        },
        error: () => {
          this.serviceSchedule.set(null);
          this.serviceScheduleLoading.set(false);
        },
      });
    }
  }

  protected getDayLabel(day: string): string {
    const dayMap: Record<string, { ar: string; en: string }> = {
      Sunday: { ar: 'الأحد', en: 'Sun' },
      Monday: { ar: 'الإثنين', en: 'Mon' },
      Tuesday: { ar: 'الثلاثاء', en: 'Tue' },
      Wednesday: { ar: 'الأربعاء', en: 'Wed' },
      Thursday: { ar: 'الخميس', en: 'Thu' },
      Friday: { ar: 'الجمعة', en: 'Fri' },
      Saturday: { ar: 'السبت', en: 'Sat' },
    };
    const found = dayMap[day];
    if (!found) return day;
    return this.isRtl() ? found.ar : found.en;
  }

  // --- Create Submissions ---
  protected submitCreateTicket(): void {
    const branchId = this.branchStore.selectedBranchId();
    const serviceId = this.createServiceId();
    const segmentId = this.createSegmentId();

    if (!branchId || !serviceId || !segmentId) {
      this.setAlert(
        'warning',
        this.isRtl() ? 'يرجى اختيار الخدمة والشريحة' : 'Please select a service and a segment.',
      );
      return;
    }

    const payload: CreateTicketRequest = {
      serviceId,
      segmentId,
      field: null,
      customInputs: this.createCustomInputs().map((ci) => ({
        serviceCustomInputId: ci.serviceCustomInputId,
        value: ci.value || '',
      })),
    };

    this.actionLoading.set(true);
    this.api.createTicket(branchId, payload).subscribe({
      next: (ticket) => {
        this.actionLoading.set(false);
        this.createdTicketSuccess.set(ticket);
        this.setAlert(
          'success',
          this.isRtl()
            ? `تم إصدار التذكرة رقم ${ticket.ticketNumber} بنجاح.`
            : `Ticket ${ticket.ticketNumber} issued successfully.`,
        );
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleApiError(err, 'Failed to create ticket');
      },
    });
  }

  protected submitCreateReservation(): void {
    const branchId = this.branchStore.selectedBranchId();
    const serviceId = this.createServiceId();
    const segmentId = this.createSegmentId();
    const localDateStr = this.createReservationDate();

    if (!branchId || !serviceId || !segmentId || !localDateStr) {
      this.setAlert(
        'warning',
        this.isRtl()
          ? 'يرجى اختيار الخدمة والشريحة وتحديد موعد الحجز'
          : 'Please select service, segment, and scheduled date/time.',
      );
      return;
    }

    const scheduledDate = new Date(localDateStr);
    if (isNaN(scheduledDate.getTime())) {
      this.setAlert('warning', this.isRtl() ? 'تاريخ الحجز غير صحيح' : 'Invalid scheduled date.');
      return;
    }

    const payload: CreateReservationRequest = {
      serviceId,
      segmentId,
      scheduledOnUtc: scheduledDate.toISOString(),
      field: null,
      customInputs: this.createCustomInputs().map((ci) => ({
        serviceCustomInputId: ci.serviceCustomInputId,
        value: ci.value || '',
      })),
    };

    this.actionLoading.set(true);
    this.api.createReservation(branchId, payload).subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.createdReservationSuccess.set(res);
        this.setAlert(
          'success',
          this.isRtl()
            ? `تم إنشاء الحجز #${res.id} بنجاح.`
            : `Reservation #${res.id} created successfully.`,
        );
        this.loadData();
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleApiError(err, 'Failed to create reservation');
      },
    });
  }

  // --- Action Submissions ---
  protected submitCancel(): void {
    const branchId = this.branchStore.selectedBranchId();
    const reason = this.cancelReason().trim();

    if (!branchId || !reason) {
      this.setAlert(
        'warning',
        this.isRtl() ? 'يرجى كتابة سبب الإلغاء' : 'Cancellation reason is required.',
      );
      return;
    }

    this.actionLoading.set(true);
    const type = this.cancelTargetType();

    if (type === 'ticket') {
      const ticket = this.selectedTicket();
      if (!ticket) return;

      this.api.cancelTicket(branchId, ticket.id, { reason }).subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.showCancelModal.set(false);
          this.selectedTicket.set(updated);
          this.setAlert(
            'success',
            this.isRtl()
              ? `تم إلغاء التذكرة ${updated.ticketNumber} بنجاح.`
              : `Ticket ${updated.ticketNumber} cancelled successfully.`,
          );
          this.loadData();
          this.loadTicketHistory(updated.id);
        },
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.handleApiError(err, 'Failed to cancel ticket');
        },
      });
    } else {
      const res = this.selectedReservation();
      if (!res) return;

      this.api.cancelReservation(branchId, res.id, { reason }).subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.showCancelModal.set(false);
          this.selectedReservation.set(updated);
          this.setAlert(
            'success',
            this.isRtl()
              ? `تم إلغاء الحجز #${updated.id} بنجاح.`
              : `Reservation #${updated.id} cancelled successfully.`,
          );
          this.loadData();
          this.loadReservationHistory(updated.id);
        },
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.handleApiError(err, 'Failed to cancel reservation');
        },
      });
    }
  }

  protected submitTransfer(): void {
    const branchId = this.branchStore.selectedBranchId();
    const ticket = this.selectedTicket();
    const targetServiceId = this.transferTargetServiceId();
    const reason = this.transferReason().trim();

    if (!branchId || !ticket || !targetServiceId || !reason) {
      this.setAlert(
        'warning',
        this.isRtl()
          ? 'يرجى اختيار الخدمة وكتابة سبب التحويل'
          : 'Target service and reason are required.',
      );
      return;
    }

    const payload: ManualTransferRequest = { targetServiceId, reason };
    this.actionLoading.set(true);

    this.api.manualTransfer(branchId, ticket.id, payload).subscribe({
      next: (updated) => {
        this.actionLoading.set(false);
        this.showTransferModal.set(false);
        this.selectedTicket.set(updated);
        this.setAlert(
          'success',
          this.isRtl()
            ? `تم تحويل التذكرة ${updated.ticketNumber} بنجاح.`
            : `Ticket ${updated.ticketNumber} transferred successfully.`,
        );
        this.loadData();
        this.loadTicketHistory(updated.id);
      },
      error: (err: HttpErrorResponse) => {
        this.actionLoading.set(false);
        this.handleApiError(err, 'Failed to transfer ticket');
      },
    });
  }

  protected executeConfirmedAction(): void {
    const action = this.confirmAction();
    const branchId = this.branchStore.selectedBranchId();
    if (!branchId || !action) return;

    this.actionLoading.set(true);

    if (action === 'returnToWaiting') {
      const ticket = this.selectedTicket();
      if (!ticket) return;
      this.api.returnToWaiting(branchId, ticket.id).subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.showConfirmModal.set(false);
          this.selectedTicket.set(updated);
          this.setAlert(
            'success',
            this.isRtl()
              ? `تم إعادة التذكرة ${updated.ticketNumber} إلى قائمة الانتظار.`
              : `Ticket ${updated.ticketNumber} returned to waiting queue.`,
          );
          this.loadData();
          this.loadTicketHistory(updated.id);
        },
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.handleApiError(err, 'Failed to return ticket to waiting');
        },
      });
    } else if (action === 'startService') {
      const ticket = this.selectedTicket();
      if (!ticket) return;
      this.api.startService(branchId, ticket.id).subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.showConfirmModal.set(false);
          this.selectedTicket.set(updated);
          this.setAlert(
            'success',
            this.isRtl()
              ? `تم بدء تقديم الخدمة للتذكرة ${updated.ticketNumber}.`
              : `Service started for ticket ${updated.ticketNumber}.`,
          );
          this.loadData();
          this.loadTicketHistory(updated.id);
        },
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.handleApiError(err, 'Failed to start service');
        },
      });
    } else if (action === 'completeService') {
      const ticket = this.selectedTicket();
      if (!ticket) return;
      this.api.completeService(branchId, ticket.id).subscribe({
        next: (updated) => {
          this.actionLoading.set(false);
          this.showConfirmModal.set(false);
          this.selectedTicket.set(updated);
          const msg =
            updated.status === 'Waiting'
              ? this.isRtl()
                ? `تم إكمال الخطوة وانتقلت التذكرة ${updated.ticketNumber} إلى الخدمة التالية في الـWorkflow.`
                : `Step completed. Ticket ${updated.ticketNumber} moved to next workflow step.`
              : this.isRtl()
                ? `تم إكمال خدمة التذكرة ${updated.ticketNumber} بالكامل بنجاح.`
                : `Service completed successfully for ticket ${updated.ticketNumber}.`;
          this.setAlert('success', msg);
          this.loadData();
          this.loadTicketHistory(updated.id);
        },
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.handleApiError(err, 'Failed to complete service');
        },
      });
    } else if (action === 'convertToTicket') {
      const res = this.selectedReservation();
      if (!res) return;
      this.api.convertReservation(branchId, res.id).subscribe({
        next: (ticket) => {
          this.actionLoading.set(false);
          this.showConfirmModal.set(false);
          this.selectedReservation.set(null);
          this.selectedTicket.set(ticket);
          this.createdTicketSuccess.set(ticket);
          this.setAlert(
            'success',
            this.isRtl()
              ? `تم تحويل الحجز بنجاح وإصدار التذكرة رقم ${ticket.ticketNumber}.`
              : `Reservation converted successfully. Issued Ticket: ${ticket.ticketNumber}.`,
          );
          this.loadData();
          this.loadTicketHistory(ticket.id);
        },
        error: (err: HttpErrorResponse) => {
          this.actionLoading.set(false);
          this.handleApiError(err, 'Failed to convert reservation');
        },
      });
    }
  }

  // --- Status & Time Formatting Helpers ---
  protected printIssuedTicket(): void {
    window.print();
  }

  protected formatDate(utcString: string | null | undefined): string {
    if (!utcString) return '—';
    try {
      const date = new Date(utcString);
      return new Intl.DateTimeFormat(this.currentLang(), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return utcString;
    }
  }

  protected getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'Waiting':
        return 'bg-info-subtle text-info border border-info-subtle';
      case 'Called':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'InProgress':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'NoShow':
        return 'bg-warning-subtle text-warning-emphasis border border-warning-subtle';
      case 'Completed':
      case 'ConvertedToTicket':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'Cancelled':
      case 'Expired':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      case 'Active':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border';
    }
  }

  protected getStatusLabel(status: string): string {
    if (!this.isRtl()) return status;
    const map: Record<string, string> = {
      Waiting: 'قيد الانتظار',
      Called: 'تمت المناداة',
      InProgress: 'جاري تقديم الخدمة',
      NoShow: 'لم يحضر',
      Completed: 'مكتملة',
      Cancelled: 'ملغاة',
      Active: 'نشط',
      Expired: 'منتهي الصلاحية',
      ConvertedToTicket: 'تم التحويل لتذكرة',
    };
    return map[status] || status;
  }

  // --- Alert & Error Handling ---
  private setAlert(tone: 'success' | 'danger' | 'warning' | 'info', text: string): void {
    this.alertMessage.set({ tone, text });
    setTimeout(() => {
      if (this.alertMessage()?.text === text) {
        this.alertMessage.set(null);
      }
    }, 6000);
  }

  private handleApiError(error: HttpErrorResponse, fallback: string): void {
    if (error.status === 409) {
      // Concurrency conflict -> reload current item
      const ticket = this.selectedTicket();
      const res = this.selectedReservation();
      const branchId = this.branchStore.selectedBranchId();
      if (branchId && ticket) {
        this.api.getTicket(branchId, ticket.id, this.activeTab() === 'archive').subscribe({
          next: (fresh) => this.selectedTicket.set(fresh),
        });
      } else if (branchId && res) {
        this.api.getReservation(branchId, res.id, this.activeTab() === 'archive').subscribe({
          next: (fresh) => this.selectedReservation.set(fresh),
        });
      }
      this.setAlert(
        'warning',
        this.isRtl()
          ? 'تم تعديل السجل من قبل مستخدم آخر. تم تحديث البيانات المعروضة.'
          : 'Data was modified by another session. Updated with latest state.',
      );
      return;
    }
    const msg = formatApiError(error, fallback);
    this.setAlert('danger', msg);
  }
}
