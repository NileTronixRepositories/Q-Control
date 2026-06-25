import { computed, Injectable, signal } from '@angular/core';

import { AppDirection, AppLanguage } from '../models/app-language.model';

@Injectable({
  providedIn: 'root',
})
export class AppLanguageStore {
  private readonly storageKey = 'q-system.language';
  private readonly languageSignal = signal<AppLanguage>(this.readStoredLanguage());

  readonly language = this.languageSignal.asReadonly();
  readonly direction = computed<AppDirection>(() =>
    this.languageSignal() === 'ar' ? 'rtl' : 'ltr',
  );

  setLanguage(language: AppLanguage): void {
    this.languageSignal.set(language);
    this.storeLanguage(language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.languageSignal() === 'ar' ? 'en' : 'ar');
  }

  private readStoredLanguage(): AppLanguage {
    try {
      const storedLanguage = localStorage.getItem(this.storageKey);
      return storedLanguage === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  }

  private storeLanguage(language: AppLanguage): void {
    try {
      localStorage.setItem(this.storageKey, language);
    } catch {
      return;
    }
  }
}
