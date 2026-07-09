import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppLanguage } from '../../../../shared/models/app-language.model';
import { ServiceRequestLanguage } from '../../models/language.model';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';

@Component({
  selector: 'app-service-request-kiosk-header',
  imports: [LanguageSelectorComponent],
  templateUrl: './kiosk-header.component.html',
  styleUrl: './kiosk-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KioskHeaderComponent {
  readonly logoLabel = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly languageLabel = input.required<string>();
  readonly languages = input.required<readonly ServiceRequestLanguage[]>();
  readonly selectedLanguage = input.required<AppLanguage>();
  readonly languageChange = output<AppLanguage>();

  protected changeLanguage(language: AppLanguage): void {
    this.languageChange.emit(language);
  }
}
