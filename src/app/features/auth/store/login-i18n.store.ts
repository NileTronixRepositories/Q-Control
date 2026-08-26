import { computed, inject, Injectable } from '@angular/core';

import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { LoginDirection, LoginLanguage } from '../models/login-translations/login-translations.model';
import { LoginTranslationService } from '../services/login-translation/login-translation.service';

@Injectable()
export class LoginI18nStore {
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly translationService = inject(LoginTranslationService);

  readonly language = this.appLanguageStore.language;
  readonly direction = computed<LoginDirection>(() => this.appLanguageStore.direction());
  readonly translations = computed(() =>
    this.translationService.getTranslations(this.appLanguageStore.language()),
  );

  setLanguage(language: LoginLanguage): void {
    this.appLanguageStore.setLanguage(language);
  }
}
