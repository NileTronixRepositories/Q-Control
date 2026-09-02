import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { SERVICE_REQUEST_TRANSLATIONS } from '../../models/language/language.model';
import { KioskReservationSearchItemResponse } from '../../models/kiosk-api/kiosk-api.model';
import { KioskReservationListComponent } from './kiosk-reservation-list.component';

describe('KioskReservationListComponent', () => {
  let fixture: ComponentFixture<KioskReservationListComponent>;
  let component: KioskReservationListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KioskReservationListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(KioskReservationListComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('reservations', []);
    fixture.componentRef.setInput('isRtl', true);
    fixture.componentRef.setInput('translations', SERVICE_REQUEST_TRANSLATIONS.ar);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders large touchscreen hero buttons when no reservations exist', () => {
    const emptyTerminal = fixture.nativeElement.querySelector(
      '.kiosk-reservations__empty-terminal',
    );
    expect(emptyTerminal).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('لم يتم العثور على أي حجز مطابق');

    const heroButtons = fixture.nativeElement.querySelectorAll('.kiosk-btn-hero');
    expect(heroButtons.length).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('تعديل بيانات البحث');
    expect(fixture.nativeElement.textContent).toContain('إصدار تذكرة جديدة');
  });

  it('emits editSearch event when clicking primary hero button', () => {
    const emitSpy = vi.spyOn(component.editSearch, 'emit');
    const editBtn = fixture.nativeElement.querySelector(
      '.kiosk-btn-hero--primary',
    ) as HTMLButtonElement;
    editBtn.click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('emits directTicket event when clicking secondary hero fallback button', () => {
    const emitSpy = vi.spyOn(component.directTicket, 'emit');
    const directBtn = fixture.nativeElement.querySelector(
      '.kiosk-btn-hero--secondary',
    ) as HTMLButtonElement;
    directBtn.click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('renders reservation cards and emits selectedReservation on convert click', () => {
    const mockReservation: KioskReservationSearchItemResponse = {
      reservationId: 105,
      serviceId: 10,
      segmentId: 1,
      serviceArabicName: 'عيادة الباطنة العامة',
      scheduledOnUtc: '2026-09-01T10:30:00Z',
      status: 'Active',
    };

    fixture.componentRef.setInput('reservations', [mockReservation]);
    fixture.detectChanges();

    const resCard = fixture.nativeElement.querySelector('.kiosk-res-card');
    expect(resCard).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('105');
    expect(fixture.nativeElement.textContent).toContain('عيادة الباطنة العامة');

    const selectSpy = vi.spyOn(component.selectedReservation, 'emit');
    const convertBtn = fixture.nativeElement.querySelector(
      '.kiosk-res-card__action-btn',
    ) as HTMLButtonElement;
    convertBtn.click();

    expect(selectSpy).toHaveBeenCalledWith(mockReservation);
  });
});
