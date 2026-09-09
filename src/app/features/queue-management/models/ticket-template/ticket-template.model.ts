export type TicketPrintElementType =
  | 'BranchLogo'
  | 'BranchName'
  | 'LeafServiceName'
  | 'ServiceFullTree'
  | 'TicketNumber'
  | 'SegmentName'
  | 'EstimatedWaitingDuration'
  | 'CustomInputsOrField';

export type TicketFontWeight = 'Normal' | 'Bold';
export type TicketTextAlign = 'Left' | 'Center' | 'Right';
export type TicketPrintLanguage = 'Ar' | 'En';
export type TicketOverflowBehavior = 'TrimWithEllipsis';

export interface TicketPrintElement {
  readonly elementType: TicketPrintElementType;
  readonly isVisible: boolean;
  readonly xMm: number | null;
  readonly yMm: number | null;
  readonly widthMm: number | null;
  readonly heightMm: number | null;
  readonly fontSizePt: number | null;
  readonly fontWeight: TicketFontWeight | null;
  readonly textAlign: TicketTextAlign | null;
  readonly language: TicketPrintLanguage | null;
}

export interface TicketConfiguration {
  readonly id: number;
  readonly branchId: number;
  readonly ticketWidthMm: number;
  readonly ticketHeightMm: number;
  readonly elements: readonly TicketPrintElement[];
  readonly rowVersion: string;
}

export interface SaveTicketConfigurationRequest {
  readonly ticketWidthMm: number;
  readonly ticketHeightMm: number;
  readonly elements: readonly TicketPrintElement[];
}

export interface UpdateTicketConfigurationRequest extends SaveTicketConfigurationRequest {
  readonly rowVersion: string;
}

export interface TicketPrintRuntimeElement extends TicketPrintElement {
  readonly text: string | null;
  readonly imageUrl: string | null;
  readonly overflowBehavior: TicketOverflowBehavior | null;
}

export interface TicketPrintModel {
  readonly ticketWidthMm: number;
  readonly ticketHeightMm: number;
  readonly elements: readonly TicketPrintRuntimeElement[];
}

export interface TicketElementMeta {
  readonly type: TicketPrintElementType;
  readonly kind: 'image' | 'text';
  readonly labelAr: string;
  readonly labelEn: string;
  readonly icon: string;
  readonly previewAr: string;
  readonly previewEn: string;
}

export interface TicketConfigurationProblemDetails {
  readonly code?: string | null;
  readonly title?: string | null;
  readonly detail?: string | null;
  readonly message?: string | null;
  readonly errors?: readonly { readonly code?: string; readonly message?: string }[] | null;
}
