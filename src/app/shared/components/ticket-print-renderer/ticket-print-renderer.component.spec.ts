import { TestBed } from '@angular/core/testing';

import { TicketPrintRendererComponent } from './ticket-print-renderer.component';

describe('TicketPrintRendererComponent', () => {
  it('renders only visible runtime content in physical units', () => {
    const fixture = TestBed.createComponent(TicketPrintRendererComponent);
    fixture.componentRef.setInput('model', {
      ticketWidthMm: 80,
      ticketHeightMm: 120,
      elements: [
        {
          elementType: 'TicketNumber',
          isVisible: true,
          xMm: 5,
          yMm: 42,
          widthMm: 70,
          heightMm: 15,
          fontSizePt: 22,
          fontWeight: 'Bold',
          textAlign: 'Center',
          language: 'Ar',
          text: 'رقم التذكرة: A105',
          imageUrl: null,
          overflowBehavior: 'TrimWithEllipsis',
        },
        {
          elementType: 'SegmentName',
          isVisible: false,
          xMm: 5,
          yMm: 60,
          widthMm: 70,
          heightMm: 8,
          fontSizePt: 10,
          fontWeight: 'Normal',
          textAlign: 'Center',
          language: 'Ar',
          text: 'لا يجب عرضه',
          imageUrl: null,
          overflowBehavior: 'TrimWithEllipsis',
        },
      ],
    });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector<HTMLElement>('.ticket-print-surface')?.style.width).toBe('80mm');
    expect(host.querySelector<HTMLElement>('.print-element')?.style.left).toBe('5mm');
    expect(host.textContent).toContain('رقم التذكرة: A105');
    expect(host.textContent).not.toContain('لا يجب عرضه');
  });
});
