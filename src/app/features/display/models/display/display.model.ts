export type WindowStatus = 'serving' | 'calling' | 'available' | 'paused' | 'closed';

export interface DisplayQueueItem {
  readonly windowId: number;
  readonly windowNumber: string;
  readonly windowName: string;
  readonly windowNameAr: string;
  readonly category: string;
  readonly categoryAr: string;
  readonly serviceName: string;
  readonly serviceNameAr: string;
  readonly serviceLogoUrl?: string | null;
  readonly serviceIcon?: string;
  readonly doctorName?: string;
  readonly doctorNameAr?: string;
  readonly currentTicket: string;
  readonly status: WindowStatus;
  readonly isFlashing?: boolean;
  readonly lastCalledAt?: Date;
  readonly waitingCount?: number;
  readonly nextTicket?: string;
}

export type DisplayMediaType = 'image' | 'video';

export interface DisplayMediaItem {
  readonly id: string;
  readonly type: DisplayMediaType;
  readonly url: string;
  readonly title?: string;
  readonly titleAr?: string;
  readonly durationSeconds?: number;
}

export interface DisplayTickerNews {
  readonly id: string;
  readonly textEn: string;
  readonly textAr: string;
  readonly priority?: 'normal' | 'urgent';
}

export interface DisplayBranchBranding {
  readonly branchId: number;
  readonly branchNameEn: string;
  readonly branchNameAr: string;
  readonly logoUrl: string;
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
  readonly headerColor: string;
  readonly footerColor: string;
  readonly textColor: string;
  readonly tickerSpeedSeconds: number;
}
