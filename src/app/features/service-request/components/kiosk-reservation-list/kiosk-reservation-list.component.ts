import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { KioskReservationSearchItemResponse } from '../../models/kiosk-api/kiosk-api.model';
import { ServiceRequestTranslations } from '../../models/language/language.model';

@Component({
  selector: 'app-service-request-kiosk-reservation-list',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './kiosk-reservation-list.component.html',
  styleUrl: './kiosk-reservation-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KioskReservationListComponent {
  public readonly reservations = input.required<readonly KioskReservationSearchItemResponse[]>();
  public readonly translations = input.required<ServiceRequestTranslations>();
  public readonly isRtl = input<boolean>(false);
  public readonly isConverting = input<boolean>(false);

  public readonly selectedReservation = output<KioskReservationSearchItemResponse>();
  public readonly editSearch = output<void>();
  public readonly directTicket = output<void>();
  public readonly retry = output<void>();

  public readonly activeReservationId = signal<number | null>(null);

  public readonly selectedItem = computed(() => {
    const id = this.activeReservationId();
    if (!id) return this.reservations()[0] ?? null;
    return this.reservations().find((r) => r.reservationId === id) ?? this.reservations()[0] ?? null;
  });

  public selectCard(res: KioskReservationSearchItemResponse): void {
    this.activeReservationId.set(res.reservationId);
  }

  public confirmSelection(res?: KioskReservationSearchItemResponse): void {
    const target = res ?? this.selectedItem();
    if (target && !this.isConverting()) {
      this.selectedReservation.emit(target);
    }
  }

  public onEditSearch(): void {
    this.editSearch.emit();
  }

  public onDirectTicket(): void {
    this.directTicket.emit();
  }

  public onRetry(): void {
    this.retry.emit();
  }

  public formatStatusClass(status: string): string {
    const normalized = (status || '').toLowerCase();
    switch (normalized) {
      case 'active':
        return 'badge-success';
      case 'convertedtoticket':
      case 'completed':
        return 'badge-info';
      case 'noshow':
      case 'cancelled':
      case 'expired':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }
}
