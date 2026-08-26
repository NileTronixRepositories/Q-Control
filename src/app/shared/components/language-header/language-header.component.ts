import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppLanguage } from '../../models/app-language/app-language.model';

@Component({
  selector: 'app-language-header',
  templateUrl: './language-header.component.html',
  styleUrl: './language-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageHeaderComponent {
  readonly language = input.required<AppLanguage>();
  readonly brandName = input.required<string>();
  readonly brandSubtitle = input.required<string>();
  readonly languageLabel = input.required<string>();
  readonly arabicLabel = input.required<string>();
  readonly englishLabel = input.required<string>();
  readonly logoSrc = input<string>('/images/Tab-logo.png');

  readonly languageChange = output<AppLanguage>();

  protected selectLanguage(language: AppLanguage): void {
    this.languageChange.emit(language);
  }
}
