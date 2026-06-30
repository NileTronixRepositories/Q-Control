export type AdminThemeId = 'niletronix-admin' | 'beach-sunset' | 'niletronix-brand';

export interface AdminThemeOption {
  readonly id: AdminThemeId;
  readonly label: string;
  readonly description: string;
  readonly swatches: readonly string[];
}

export const ADMIN_THEME_OPTIONS: readonly AdminThemeOption[] = [
  {
    id: 'niletronix-admin',
    label: 'Niletronix Admin',
    description: 'Light admin control panel theme',
    swatches: ['#fbfdff', '#e0f6f8', '#0b8aa8', '#fff0f3', '#f22745'],
  },
  {
    id: 'beach-sunset',
    label: 'Beach Sunset',
    description: 'Soft coastal blue theme',
    swatches: ['#bee9e8', '#62b6cb', '#1b4965', '#cae9ff', '#5fa8d3'],
  },
  {
    id: 'niletronix-brand',
    label: 'Niletronix Brand',
    description: 'Industrial blue and red brand theme',
    swatches: ['#0d78a6', '#4fa5c9', '#e31e24', '#f4f6f8', '#1a1d21'],
  },
];
