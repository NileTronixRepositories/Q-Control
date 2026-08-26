export interface OrganizationNavigationItem {
  readonly label: string;
  readonly route?: string;
  readonly caption?: string;
  readonly icon?: string;
  children?: OrganizationNavigationItem[];
  expanded?: boolean;
}

export interface GlobalConfiguration {
  readonly organizationName: string;
  readonly logoUrl: string;
  readonly timezone: string;
  readonly defaultLanguage: OrganizationLanguage;
}

export interface TicketCallingConfiguration {
  readonly noShowSeconds: number;
  readonly ticketLookupCount: number;
  readonly queueName: string;
  readonly priorityCallingEnabled: boolean;
}

export interface AudioAnnouncementConfiguration {
  readonly voiceLanguage: OrganizationLanguage;
  readonly startingTone: string;
  readonly customerType: string;
  readonly appendNumberWord: boolean;
}

export interface TicketStatus {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly color: string;
  readonly active: boolean;
}

export type OrganizationLanguage = 'Arabic' | 'English';
