export interface AppBreadcrumbItem {
  readonly label: string;
  readonly route?: string;
  readonly queryParams?: Readonly<Record<string, string | number | boolean | null>>;
  readonly icon?: string;
}
