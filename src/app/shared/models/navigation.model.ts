export interface AppNavigationItem {
  readonly label: string;
  readonly route?: string;
  readonly queryParams?: Readonly<Record<string, string | number | boolean | null>>;
  readonly caption?: string;
  readonly icon?: string;
  children?: AppNavigationItem[];
  expanded?: boolean;
}
