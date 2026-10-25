import { computed, Injectable, signal } from '@angular/core';

import { AppDirection, AppLanguage } from './app-language.model';

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

  constructor() {
    this.applyDocumentDirection(this.languageSignal());
  }

  setLanguage(language: AppLanguage): void {
    this.languageSignal.set(language);
    this.storeLanguage(language);
    this.applyDocumentDirection(language);
  }

  toggleLanguage(): void {
    this.setLanguage(this.languageSignal() === 'ar' ? 'en' : 'ar');
  }

  private applyDocumentDirection(language: AppLanguage): void {
    if (typeof document !== 'undefined') {
      const direction: AppDirection = language === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
      document.documentElement.dir = direction;
      document.body.dir = direction;
      if (direction === 'rtl') {
        document.body.classList.add('rtl');
        document.body.classList.remove('ltr');
      } else {
        document.body.classList.add('ltr');
        document.body.classList.remove('rtl');
      }
    }
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
