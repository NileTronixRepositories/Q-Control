import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { SERVICE_REQUEST_TRANSLATIONS } from '../../models/language/language.model';
import { QueueTicket } from '../../models/ticket/ticket.model';
import { TicketPreviewComponent } from './ticket-preview.component';

describe('TicketPreviewComponent', () => {
  let fixture: ComponentFixture<TicketPreviewComponent>;
  const ticket: QueueTicket = {
    id: 'ticket-1',
    ticketNumber: 'A-101',
    serviceTypeName: { ar: 'عادية', en: 'Regular' },
    departmentName: { ar: 'القلب', en: 'Cardiology' },
    subSpecialtyName: null,
    issuedAtIso: '2026-07-14T08:00:00Z',
    estimatedWaitingMinutes: 10,
    counterHint: { ar: 'الشباك 1', en: 'Counter 1' },
    qrPayload: 'ticket:A-101',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TicketPreviewComponent] }).compileComponents();
    fixture = TestBed.createComponent(TicketPreviewComponent);
    fixture.componentRef.setInput('ticket', ticket);
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('translations', SERVICE_REQUEST_TRANSLATIONS.en);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders localized ticket details and omits a missing sub-specialty', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('A-101');
    expect(text).toContain('Regular');
    expect(text).toContain('Cardiology');
    expect(text).toContain('Counter 1');
    expect(text).not.toContain('null');
  });

  it('renders correctly when departmentName is null for directly issuable root services', () => {
    fixture.componentRef.setInput('ticket', { ...ticket, departmentName: null });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('A-101');
    expect(text).toContain('Regular');
    expect(text).not.toContain('Cardiology');
    expect(text).not.toContain('null');
  });

  it('renders hospital/clinic header and NileTronix branding link', () => {
    const header = fixture.nativeElement.querySelector('.ticket-preview__hospital-header');
    expect(header).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Farid Habib Hospital');

    const links = fixture.nativeElement.querySelectorAll('a[href="https://www.niletronix.com/"]');
    expect(links.length).toBeGreaterThanOrEqual(1);
  });

  it('renders hospital logo image when provided and hides it if load fails', () => {
    fixture.componentRef.setInput('branchLogoUrl', 'https://example.com/logo.png');
    fixture.detectChanges();

    const logoImg = fixture.nativeElement.querySelector(
      '.ticket-preview__hospital-logo',
    ) as HTMLImageElement;
    expect(logoImg).not.toBeNull();
    expect(logoImg.src).toContain('https://example.com/logo.png');

    // Trigger error event
    logoImg.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const logoImgAfterError = fixture.nativeElement.querySelector('.ticket-preview__hospital-logo');
    expect(logoImgAfterError).toBeNull();
  });
});
