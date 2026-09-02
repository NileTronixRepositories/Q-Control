import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { AppLanguageStore } from '@core';
import { HistoryEvent } from '../../models/ticket-reservation/ticket-reservation.model';

@Component({
  selector: 'app-history-timeline',
  imports: [CommonModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="timeline-container"
      [attr.dir]="isRtl() ? 'rtl' : 'ltr'"
      aria-label="History Events"
    >
      <div class="d-flex align-items-center justify-content-between mb-3">
        <h3 class="timeline-title mb-0">
          <i class="bi bi-clock-history me-1 ms-1"></i>
          {{ isRtl() ? 'سجل الحركات والأحداث' : 'Activity & History' }}
        </h3>
        <span class="badge bg-secondary-subtle text-secondary border px-2 py-1">
          {{ events().length }} {{ isRtl() ? 'أحداث' : 'events' }}
        </span>
      </div>

      @if (events().length === 0) {
        <div class="timeline-empty py-4 text-center text-muted">
          <i class="bi bi-calendar2-x fs-4 d-block mb-1"></i>
          <span>{{ isRtl() ? 'لا يوجد أحداث مسجلة حتى الآن' : 'No activity recorded yet.' }}</span>
        </div>
      } @else {
        <ol class="timeline-list">
          @for (event of sortedEvents(); track event.id || $index) {
            <li class="timeline-item" [attr.data-event-type]="event.eventType">
              <div class="timeline-marker" [ngClass]="getMarkerClass(event.eventType)">
                <i class="bi" [ngClass]="getEventIcon(event.eventType)"></i>
              </div>
              <div class="timeline-content">
                <header
                  class="timeline-header d-flex flex-wrap align-items-center justify-content-between gap-1 mb-1"
                >
                  <span class="timeline-event-name fw-semibold">
                    {{ getEventLabel(event.eventType) }}
                  </span>
                  <time
                    class="timeline-time text-muted small"
                    [attr.datetime]="event.occurredOnUtc"
                  >
                    {{ event.occurredOnUtc | date: 'medium' }}
                  </time>
                </header>

                @if (event.fromStatus || event.toStatus) {
                  <div class="timeline-transition small mb-1">
                    <span class="text-muted">{{ isRtl() ? 'الحالة:' : 'Status:' }}</span>
                    @if (event.fromStatus) {
                      <span class="badge bg-light text-dark border ms-1 me-1">{{
                        event.fromStatus
                      }}</span>
                    }
                    @if (event.fromStatus && event.toStatus) {
                      <i class="bi" [ngClass]="isRtl() ? 'bi-arrow-left' : 'bi-arrow-right'"></i>
                    }
                    @if (event.toStatus) {
                      <span
                        class="badge bg-primary-subtle text-primary border border-primary-subtle ms-1 me-1"
                        >{{ event.toStatus }}</span
                      >
                    }
                  </div>
                }

                @if (event.reason) {
                  <div class="timeline-reason alert alert-warning py-1 px-2 my-1 small mb-1">
                    <strong>{{ isRtl() ? 'السبب:' : 'Reason:' }}</strong> {{ event.reason }}
                  </div>
                }

                <div class="timeline-meta text-muted small d-flex flex-wrap gap-2">
                  @if (event.windowId) {
                    <span
                      ><i class="bi bi-window-sidebar me-1"></i
                      >{{ isRtl() ? 'شباك' : 'Window' }} #{{ event.windowId }}</span
                    >
                  }
                  @if (event.serviceId) {
                    <span
                      ><i class="bi bi-gear me-1"></i>{{ isRtl() ? 'خدمة' : 'Service' }} #{{
                        event.serviceId
                      }}</span
                    >
                  }
                  @if (event.fromServiceId && event.toServiceId) {
                    <span
                      ><i class="bi bi-arrow-left-right me-1"></i
                      >{{ isRtl() ? 'تحويل' : 'Transfer' }} #{{ event.fromServiceId }} &rarr; #{{
                        event.toServiceId
                      }}</span
                    >
                  }
                  @if (event.performerApplicationUserId) {
                    <span class="ms-auto"
                      ><i class="bi bi-person me-1"></i>{{ event.performerApplicationUserId }}</span
                    >
                  }
                </div>
              </div>
            </li>
          }
        </ol>
      }
    </section>
  `,
  styles: `
    .timeline-container {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--bs-border-color, #e4e9ef);
    }
    .timeline-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--bs-body-color, #212529);
    }
    .timeline-list {
      list-style: none;
      padding: 0;
      margin: 0;
      position: relative;
    }
    .timeline-list::before {
      content: '';
      position: absolute;
      top: 8px;
      bottom: 8px;
      inset-inline-start: 13px;
      width: 2px;
      background: var(--bs-border-color, #e9ecef);
    }
    .timeline-item {
      position: relative;
      padding-inline-start: 36px;
      margin-bottom: 1.25rem;
    }
    .timeline-item:last-child {
      margin-bottom: 0;
    }
    .timeline-marker {
      position: absolute;
      top: 0;
      inset-inline-start: 2px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      border: 2px solid #fff;
      box-shadow: 0 0 0 1px var(--bs-border-color, #dee2e6);
      background-color: #fff;
    }
    .marker-primary {
      background-color: var(--bs-primary, #0d6efd);
      color: #fff;
    }
    .marker-success {
      background-color: var(--bs-success, #198754);
      color: #fff;
    }
    .marker-warning {
      background-color: var(--bs-warning, #ffc107);
      color: #000;
    }
    .marker-danger {
      background-color: var(--bs-danger, #dc3545);
      color: #fff;
    }
    .marker-info {
      background-color: var(--bs-info, #0dcaf0);
      color: #000;
    }
    .marker-secondary {
      background-color: var(--bs-secondary, #6c757d);
      color: #fff;
    }
    .timeline-content {
      background: var(--bs-tertiary-bg, #f8f9fa);
      border-radius: 6px;
      padding: 0.6rem 0.8rem;
      border: 1px solid var(--bs-border-color-translucent, rgba(0, 0, 0, 0.06));
    }
    .timeline-event-name {
      font-size: 0.85rem;
    }
    .timeline-time {
      font-size: 0.75rem;
    }
    .timeline-reason {
      border-radius: 4px;
      line-height: 1.3;
    }
  `,
})
export class HistoryTimelineComponent {
  private readonly appLanguageStore = inject(AppLanguageStore);

  events = input<readonly HistoryEvent[]>([]);

  protected readonly isRtl = computed(() => this.appLanguageStore.language() === 'ar');

  protected readonly sortedEvents = computed(() => {
    return [...this.events()].sort(
      (a, b) => new Date(b.occurredOnUtc).getTime() - new Date(a.occurredOnUtc).getTime(),
    );
  });

  protected getMarkerClass(eventType: string): string {
    const type = (eventType || '').toLowerCase();
    if (type.includes('created') || type.includes('waiting') || type.includes('active'))
      return 'marker-info';
    if (type.includes('called')) return 'marker-warning';
    if (type.includes('start') || type.includes('inprog')) return 'marker-primary';
    if (type.includes('complet') || type.includes('convert')) return 'marker-success';
    if (type.includes('cancel') || type.includes('noshow')) return 'marker-danger';
    if (type.includes('transfer')) return 'marker-primary';
    return 'marker-secondary';
  }

  protected getEventIcon(eventType: string): string {
    const type = (eventType || '').toLowerCase();
    if (type.includes('created')) return 'bi-plus-circle';
    if (type.includes('called')) return 'bi-megaphone';
    if (type.includes('start')) return 'bi-play-fill';
    if (type.includes('complet')) return 'bi-check2-circle';
    if (type.includes('cancel')) return 'bi-x-circle';
    if (type.includes('noshow')) return 'bi-person-x';
    if (type.includes('return') || type.includes('waiting')) return 'bi-arrow-counterclockwise';
    if (type.includes('transfer')) return 'bi-arrow-left-right';
    if (type.includes('convert')) return 'bi-ticket-perforated';
    return 'bi-dot';
  }

  protected getEventLabel(eventType: string): string {
    if (!this.isRtl()) return eventType;
    const map: Record<string, string> = {
      Created: 'إنشاء',
      Waiting: 'دخول قائمة الانتظار',
      Called: 'مناداة التذكرة',
      ServiceStarted: 'بدء تقديم الخدمة',
      ServiceCompleted: 'اكتمال تقديم الخدمة',
      ManualTransfer: 'تحويل يدوي',
      ReturnedToWaiting: 'إعادة للانتظار بعد عدم الحضور',
      Cancelled: 'إلغاء',
      NoShow: 'عدم الحضور',
      Expired: 'انتهاء الصلاحية',
      ConvertedToTicket: 'تحويل الحجز إلى تذكرة',
    };
    return map[eventType] || eventType;
  }
}
