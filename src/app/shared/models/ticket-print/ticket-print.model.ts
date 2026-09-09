export interface PhysicalTicketPrintElement {
  readonly elementType: string;
  readonly isVisible: boolean;
  readonly xMm: number | null;
  readonly yMm: number | null;
  readonly widthMm: number | null;
  readonly heightMm: number | null;
  readonly fontSizePt: number | null;
  readonly fontWeight: 'Normal' | 'Bold' | null;
  readonly textAlign: 'Left' | 'Center' | 'Right' | null;
  readonly language: 'Ar' | 'En' | null;
  readonly text: string | null;
  readonly imageUrl: string | null;
  readonly overflowBehavior: 'TrimWithEllipsis' | null;
}

export interface PhysicalTicketPrintModel {
  readonly ticketWidthMm: number;
  readonly ticketHeightMm: number;
  readonly elements: readonly PhysicalTicketPrintElement[];
}
