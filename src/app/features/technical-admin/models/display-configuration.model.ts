// ─── Display Configuration ───────────────────────────────────────────────

export interface DisplayConfigurationResponse {
  readonly id: number;
  readonly branchId: number;

  readonly displayBackgroundColor: string;

  readonly mainTitleAr: string;
  readonly mainTitleEn: string;

  readonly headerBackgroundColor: string;
  readonly mainTitleTextColor: string;
  readonly mainTitleFontSize: number;

  readonly tableHeaderBackgroundColor: string;
  readonly tableHeaderTextColor: string;

  readonly tableRowBackgroundColor: string;
  readonly tableRowTextColor: string;

  readonly ticketNumberBackgroundColor: string;
  readonly ticketNumberTextColor: string;

  readonly ticketColumnTitleAr: string;
  readonly ticketColumnTitleEn: string;

  readonly serviceColumnTitleAr: string;
  readonly serviceColumnTitleEn: string;

  readonly windowColumnTitleAr: string;
  readonly windowColumnTitleEn: string;

  readonly tickerBackgroundColor: string;
  readonly tickerTextColor: string;
  readonly tickerFontSize: number;

  readonly showClock: boolean;

  readonly clockBackgroundColor: string;
  readonly clockTextColor: string;

  readonly rowVersion: string;
}

export interface CreateDisplayConfigurationRequest {
  readonly displayBackgroundColor: string;

  readonly mainTitleAr: string;
  readonly mainTitleEn: string;

  readonly headerBackgroundColor: string;
  readonly mainTitleTextColor: string;
  readonly mainTitleFontSize: number;

  readonly tableHeaderBackgroundColor: string;
  readonly tableHeaderTextColor: string;

  readonly tableRowBackgroundColor: string;
  readonly tableRowTextColor: string;

  readonly ticketNumberBackgroundColor: string;
  readonly ticketNumberTextColor: string;

  readonly ticketColumnTitleAr: string;
  readonly ticketColumnTitleEn: string;

  readonly serviceColumnTitleAr: string;
  readonly serviceColumnTitleEn: string;

  readonly windowColumnTitleAr: string;
  readonly windowColumnTitleEn: string;

  readonly tickerBackgroundColor: string;
  readonly tickerTextColor: string;
  readonly tickerFontSize: number;

  readonly showClock: boolean;

  readonly clockBackgroundColor: string;
  readonly clockTextColor: string;
}

export interface UpdateDisplayConfigurationRequest extends CreateDisplayConfigurationRequest {
  readonly rowVersion: string;
}

// ─── Display Messages ────────────────────────────────────────────────────

export interface DisplayMessageResponse {
  readonly id: number;
  readonly branchId: number;
  readonly textAr: string;
  readonly textEn: string;
  readonly displayOrder: number;
  readonly isActive: boolean;
  readonly rowVersion: string;
}

export interface CreateDisplayMessageRequest {
  readonly textAr: string;
  readonly textEn: string;
  readonly displayOrder: number;
}

export interface UpdateDisplayMessageRequest {
  readonly textAr: string;
  readonly textEn: string;
  readonly displayOrder: number;
  readonly rowVersion: string;
}

export interface ReorderDisplayMessagesRequest {
  readonly items: readonly ReorderDisplayMessageItem[];
}

export interface ReorderDisplayMessageItem {
  readonly messageId: number;
  readonly displayOrder: number;
  readonly rowVersion: string;
}

export interface DisplayMessageStateResponse {
  readonly messageId: number;
  readonly branchId: number;
  readonly isActive: boolean;
  readonly rowVersion: string;
  readonly message?: string;
}

// ─── Public Display Runtime ──────────────────────────────────────────────

export interface DisplayRuntimeConfigurationResponse {
  readonly branchId: number;

  readonly branding: DisplayRuntimeBranding | null;

  readonly displayConfiguration: DisplayRuntimeConfiguration | null;

  readonly messages: readonly DisplayRuntimeMessage[];
}

export interface DisplayRuntimeBranding {
  readonly logoUrl: string | null;
}

export interface DisplayRuntimeConfiguration {
  readonly displayBackgroundColor: string;

  readonly mainTitleAr: string;
  readonly mainTitleEn: string;

  readonly headerBackgroundColor: string;
  readonly mainTitleTextColor: string;
  readonly mainTitleFontSize: number;

  readonly tableHeaderBackgroundColor: string;
  readonly tableHeaderTextColor: string;

  readonly tableRowBackgroundColor: string;
  readonly tableRowTextColor: string;

  readonly ticketNumberBackgroundColor: string;
  readonly ticketNumberTextColor: string;

  readonly ticketColumnTitleAr: string;
  readonly ticketColumnTitleEn: string;

  readonly serviceColumnTitleAr: string;
  readonly serviceColumnTitleEn: string;

  readonly windowColumnTitleAr: string;
  readonly windowColumnTitleEn: string;

  readonly tickerBackgroundColor: string;
  readonly tickerTextColor: string;
  readonly tickerFontSize: number;

  readonly showClock: boolean;

  readonly clockBackgroundColor: string;
  readonly clockTextColor: string;
}

export interface DisplayRuntimeMessage {
  readonly id: number;
  readonly textAr: string;
  readonly textEn: string;
  readonly displayOrder: number;
}

export interface DisplayRuntimePlaylistResponse {
  readonly branchId: number;
  readonly videos: readonly DisplayRuntimeVideo[];
}

export interface DisplayRuntimeVideo {
  readonly videoId: number;
  readonly displayOrder: number;
  readonly streamUrl: string;
}
