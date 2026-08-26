import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { ServiceRequestLanguage } from '../../models/language/language.model';
import { TicketIssuanceButton } from '../../models/service-request-api/service-request-api.model';
import { StepIndicatorItem } from '../../shared/selection-card-view.model';

@Component({
  selector: 'app-service-request-kiosk-header',
  imports: [],
  templateUrl: './kiosk-header.component.html',
  styleUrl: './kiosk-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KioskHeaderComponent {
  readonly logoUrl = input<string | null>(null);
  readonly logoLabel = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly languageLabel = input.required<string>();
  readonly languages = input.required<readonly ServiceRequestLanguage[]>();
  readonly selectedLanguage = input.required<AppLanguage>();
  readonly languageButtonConfig = input<TicketIssuanceButton | null>(null);
  readonly showLanguagePage = input<boolean>(true);
  readonly stepItems = input<readonly StepIndicatorItem[]>([]);
  readonly isRtl = input<boolean>(false);
  readonly showNavigationPath = input<boolean>(true);
  readonly languageChange = output<AppLanguage>();

  protected toggleLanguage(): void {
    const nextLang: AppLanguage = this.selectedLanguage() === 'ar' ? 'en' : 'ar';
    this.languageChange.emit(nextLang);
  }

  protected changeLanguage(language: AppLanguage): void {
    this.languageChange.emit(language);
  }
}
