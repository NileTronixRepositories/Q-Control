import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { ServiceRequestLanguage } from '../../models/language/language.model';

@Component({
  selector: 'app-service-request-language-selector',
  templateUrl: './language-selector.component.html',
  styleUrl: './language-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSelectorComponent {
  readonly label = input.required<string>();
  readonly languages = input.required<readonly ServiceRequestLanguage[]>();
  readonly selectedLanguage = input.required<AppLanguage>();
  readonly languageChange = output<AppLanguage>();

  protected selectLanguage(language: ServiceRequestLanguage): void {
    if (language.code !== this.selectedLanguage()) {
      this.languageChange.emit(language.code);
    }
  }
}
