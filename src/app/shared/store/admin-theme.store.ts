import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { ADMIN_THEME_OPTIONS, AdminThemeId, AdminThemeOption } from '../models/admin-theme.model';

@Injectable({
  providedIn: 'root',
})
export class AdminThemeStore {
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = 'q-system.adminTheme';
  private readonly themeSignal = signal<AdminThemeId>(this.readStoredTheme());

  readonly themes: readonly AdminThemeOption[] = ADMIN_THEME_OPTIONS;
  readonly selectedTheme = this.themeSignal.asReadonly();
  readonly selectedThemeOption = computed<AdminThemeOption>(() =>
    this.themes.find((theme) => theme.id === this.themeSignal()) ?? this.themes[0],
  );

  private readonly syncThemeAttribute = effect(() => {
    const theme = this.themeSignal();
    this.document.body.dataset['adminTheme'] = theme;
    this.document.documentElement.dataset['adminTheme'] = theme;
  });

  setTheme(themeId: AdminThemeId): void {
    if (this.themeSignal() === themeId) {
      return;
    }

    this.themeSignal.set(themeId);
    this.storeTheme(themeId);
  }

  private readStoredTheme(): AdminThemeId {
    try {
      const storedTheme = localStorage.getItem(this.storageKey);
      return this.isAdminThemeId(storedTheme) ? storedTheme : 'niletronix-admin';
    } catch {
      return 'niletronix-admin';
    }
  }

  private storeTheme(themeId: AdminThemeId): void {
    try {
      localStorage.setItem(this.storageKey, themeId);
    } catch {
      return;
    }
  }

  private isAdminThemeId(value: string | null): value is AdminThemeId {
    return this.themes.some((theme) => theme.id === value);
  }
}
