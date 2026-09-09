import {
  TicketElementMeta,
  TicketPrintElement,
  TicketPrintElementType,
} from '../../models/ticket-template/ticket-template.model';

export const TICKET_ELEMENT_TYPES: readonly TicketPrintElementType[] = [
  'BranchLogo',
  'BranchName',
  'LeafServiceName',
  'ServiceFullTree',
  'TicketNumber',
  'SegmentName',
  'EstimatedWaitingDuration',
  'CustomInputsOrField',
];

export const TICKET_ELEMENT_META: Record<TicketPrintElementType, TicketElementMeta> = {
  BranchLogo: {
    type: 'BranchLogo',
    kind: 'image',
    labelAr: 'شعار الفرع',
    labelEn: 'Branch logo',
    icon: 'bi-image',
    previewAr: '',
    previewEn: '',
  },
  BranchName: {
    type: 'BranchName',
    kind: 'text',
    labelAr: 'اسم الفرع',
    labelEn: 'Branch name',
    icon: 'bi-building',
    previewAr: 'فرع مدينة نصر',
    previewEn: 'Nasr City Branch',
  },
  LeafServiceName: {
    type: 'LeafServiceName',
    kind: 'text',
    labelAr: 'اسم الخدمة',
    labelEn: 'Leaf service name',
    icon: 'bi-briefcase',
    previewAr: 'فتح حساب',
    previewEn: 'Open an account',
  },
  ServiceFullTree: {
    type: 'ServiceFullTree',
    kind: 'text',
    labelAr: 'مسار الخدمة',
    labelEn: 'Service full tree',
    icon: 'bi-diagram-3',
    previewAr: 'الخدمات البنكية > الحسابات > فتح حساب',
    previewEn: 'Banking > Accounts > Open an account',
  },
  TicketNumber: {
    type: 'TicketNumber',
    kind: 'text',
    labelAr: 'رقم التذكرة',
    labelEn: 'Ticket number',
    icon: 'bi-123',
    previewAr: 'رقم التذكرة: A105',
    previewEn: 'Ticket Number: A105',
  },
  SegmentName: {
    type: 'SegmentName',
    kind: 'text',
    labelAr: 'اسم الشريحة',
    labelEn: 'Segment name',
    icon: 'bi-people',
    previewAr: 'كبار العملاء',
    previewEn: 'VIP Customers',
  },
  EstimatedWaitingDuration: {
    type: 'EstimatedWaitingDuration',
    kind: 'text',
    labelAr: 'مدة الانتظار المتوقعة',
    labelEn: 'Estimated waiting duration',
    icon: 'bi-clock',
    previewAr: 'مدة الانتظار المتوقعة: 50 دقيقة',
    previewEn: 'Estimated waiting time: 50 minutes',
  },
  CustomInputsOrField: {
    type: 'CustomInputsOrField',
    kind: 'text',
    labelAr: 'الحقول المخصصة',
    labelEn: 'Custom inputs / field',
    icon: 'bi-input-cursor-text',
    previewAr: 'رقم الهوية: 29801011234567\nرقم الهاتف: 01012345678',
    previewEn: 'ID: 29801011234567\nPhone: 01012345678',
  },
};

export const DEFAULT_TICKET_ELEMENT_LAYOUT: Record<
  TicketPrintElementType,
  Omit<TicketPrintElement, 'elementType'>
> = {
  BranchLogo: {
    isVisible: true,
    xMm: 23,
    yMm: 5,
    widthMm: 34,
    heightMm: 16,
    fontSizePt: null,
    fontWeight: null,
    textAlign: null,
    language: null,
  },
  BranchName: {
    isVisible: true,
    xMm: 5,
    yMm: 23,
    widthMm: 70,
    heightMm: 9,
    fontSizePt: 12,
    fontWeight: 'Bold',
    textAlign: 'Center',
    language: 'Ar',
  },
  LeafServiceName: {
    isVisible: true,
    xMm: 5,
    yMm: 34,
    widthMm: 70,
    heightMm: 10,
    fontSizePt: 13,
    fontWeight: 'Bold',
    textAlign: 'Center',
    language: 'Ar',
  },
  ServiceFullTree: {
    isVisible: true,
    xMm: 5,
    yMm: 46,
    widthMm: 70,
    heightMm: 8,
    fontSizePt: 9,
    fontWeight: 'Normal',
    textAlign: 'Center',
    language: 'Ar',
  },
  TicketNumber: {
    isVisible: true,
    xMm: 5,
    yMm: 56,
    widthMm: 70,
    heightMm: 18,
    fontSizePt: 22,
    fontWeight: 'Bold',
    textAlign: 'Center',
    language: 'Ar',
  },
  SegmentName: {
    isVisible: true,
    xMm: 5,
    yMm: 76,
    widthMm: 70,
    heightMm: 8,
    fontSizePt: 10,
    fontWeight: 'Normal',
    textAlign: 'Center',
    language: 'Ar',
  },
  EstimatedWaitingDuration: {
    isVisible: true,
    xMm: 5,
    yMm: 86,
    widthMm: 70,
    heightMm: 9,
    fontSizePt: 9,
    fontWeight: 'Normal',
    textAlign: 'Center',
    language: 'Ar',
  },
  CustomInputsOrField: {
    isVisible: false,
    xMm: 5,
    yMm: 97,
    widthMm: 70,
    heightMm: 19,
    fontSizePt: 8,
    fontWeight: 'Normal',
    textAlign: 'Center',
    language: 'Ar',
  },
};

export interface TicketSizePreset {
  readonly labelAr: string;
  readonly labelEn: string;
  readonly widthMm: number;
  readonly heightMm: number;
}

export const TICKET_SIZE_PRESETS: readonly TicketSizePreset[] = [
  { labelAr: '80 × 120 مم (قياسي)', labelEn: '80 × 120 mm (Standard)', widthMm: 80, heightMm: 120 },
  { labelAr: '80 × 100 مم (مدمج)', labelEn: '80 × 100 mm (Compact)', widthMm: 80, heightMm: 100 },
  { labelAr: '80 × 80 مم (مربع)', labelEn: '80 × 80 mm (Square)', widthMm: 80, heightMm: 80 },
  { labelAr: '58 × 100 مم (صغير)', labelEn: '58 × 100 mm (Small)', widthMm: 58, heightMm: 100 },
];

export function createEmptyTicketElements(): TicketPrintElement[] {
  return TICKET_ELEMENT_TYPES.map((elementType) => ({
    elementType,
    isVisible: false,
    xMm: null,
    yMm: null,
    widthMm: null,
    heightMm: null,
    fontSizePt: null,
    fontWeight: null,
    textAlign: null,
    language: null,
  }));
}

export function createDefaultTicketElements(): TicketPrintElement[] {
  return TICKET_ELEMENT_TYPES.map((elementType) => ({
    elementType,
    ...DEFAULT_TICKET_ELEMENT_LAYOUT[elementType],
  }));
}
