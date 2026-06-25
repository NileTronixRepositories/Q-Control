export interface AppNavigationItem {
  readonly label: string;
  readonly route?: string;
  readonly caption?: string;
  readonly icon?: string;
  children?: AppNavigationItem[];
  expanded?: boolean;
}
