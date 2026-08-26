import { Injectable } from '@angular/core';
import { Observable, map, timer } from 'rxjs';

import { QueueTicket, ServiceRequestSelection } from '../../models/ticket/ticket.model';

const TICKET_GENERATION_DELAY_MS = 900;
const TICKET_SEQUENCE_MAX = 999;

@Injectable({
  providedIn: 'root',
})
export class TicketGeneratorService {
  private sequence = 120;

  generateTicket(selection: ServiceRequestSelection): Observable<QueueTicket> {
    return timer(TICKET_GENERATION_DELAY_MS).pipe(map(() => this.createTicket(selection)));
  }

  private createTicket(selection: ServiceRequestSelection): QueueTicket {
    const issuedAtIso = new Date().toISOString();
    const prefix = selection.subSpecialty?.ticketPrefix || selection.specialty?.ticketPrefix || selection.serviceType.ticketPrefix || 'Q';
    const ticketNumber = this.createTicketNumber(prefix);
    const estimatedWaitingMinutes = this.calculateEstimatedWaiting(selection);
    const counterHint = this.resolveCounterHint(selection);

    return {
      id: crypto.randomUUID(),
      ticketNumber,
      serviceTypeName: selection.serviceType.name,
      departmentName: selection.specialty?.name ?? null,
      subSpecialtyName: selection.subSpecialty?.name ?? null,
      issuedAtIso,
      estimatedWaitingMinutes,
      counterHint,
      qrPayload: JSON.stringify({
        ticketNumber,
        serviceType: selection.serviceType.code,
        specialty: selection.specialty?.code ?? null,
        subSpecialty: selection.subSpecialty?.code ?? null,
        issuedAt: issuedAtIso,
      }),
    };
  }

  private createTicketNumber(prefix: string): string {
    this.sequence = this.sequence >= TICKET_SEQUENCE_MAX ? 1 : this.sequence + 1;
    const separator = /\d$/.test(prefix) ? '-' : '';
    return `${prefix}${separator}${this.sequence.toString().padStart(3, '0')}`;
  }

  private calculateEstimatedWaiting(selection: ServiceRequestSelection): number {
    return (
      selection.serviceType.estimatedWaitingMinutes +
      (selection.specialty?.estimatedWaitingMinutes ?? 0) +
      (selection.subSpecialty?.estimatedWaitingMinutes ?? 0)
    );
  }

  private resolveCounterHint(selection: ServiceRequestSelection): QueueTicket['counterHint'] {
    if (selection.serviceType.id === 'emergency') {
      return {
        ar: 'مسار الطوارئ',
        en: 'Emergency lane',
      };
    }

    if (selection.serviceType.id === 'laboratory') {
      return {
        ar: 'منطقة المعمل',
        en: 'Laboratory area',
      };
    }

    if (selection.serviceType.id === 'radiology-service') {
      return {
        ar: 'منطقة الأشعة',
        en: 'Radiology area',
      };
    }

    return {
      ar: 'منطقة الاستقبال',
      en: 'Reception area',
    };
  }
}
