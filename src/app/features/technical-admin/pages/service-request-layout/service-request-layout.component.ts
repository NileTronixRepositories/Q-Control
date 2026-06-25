import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import {
  ServiceRequestButtonGroup,
  ServiceRequestGeneralOption,
  ServiceRequestThemeColor
} from '../../models/technical-admin.model';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { TechnicalAdminStore } from '../../store/technical-admin.store';

interface GeneralOptionView {
  readonly key: ServiceRequestGeneralOption;
  readonly label: string;
}

interface ThemeColorView {
  readonly key: ServiceRequestThemeColor;
  readonly label: string;
}

interface ButtonGroupView {
  readonly key: ServiceRequestButtonGroup;
  readonly label: string;
  readonly includesSpace: boolean;
  readonly includesFontSize: boolean;
}

@Component({
  selector: 'app-service-request-layout',
  templateUrl: './service-request-layout.component.html',
  styleUrl: './service-request-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServiceRequestLayoutComponent {
  private readonly technicalAdminStore = inject(TechnicalAdminStore);

  protected readonly translations = inject(TechnicalAdminI18nStore).translations;
  protected readonly layout = this.technicalAdminStore.serviceRequestLayout;
  protected readonly saved = computed(
    () => this.technicalAdminStore.savedSection() === 'Service Request Layout'
  );

  protected readonly generalOptions = computed<readonly GeneralOptionView[]>(() => {
    const translations = this.translations();

    return [
      { key: 'showLanguagePage', label: translations.showLanguagePageLabel },
      { key: 'defaultLanguageArabic', label: translations.defaultLanguageArabicLabel },
      { key: 'alwaysRequireUserInput', label: translations.alwaysRequireUserInputLabel },
      { key: 'showServiceNavigationPath', label: translations.showServiceNavigationPathLabel },
      { key: 'allowOperatorSelection', label: translations.allowOperatorSelectionLabel },
      { key: 'allowRequestMoreServices', label: translations.allowRequestMoreServicesLabel }
    ];
  });

  protected readonly themeColors = computed<readonly ThemeColorView[]>(() => {
    const translations = this.translations();

    return [
      { key: 'backgroundColor', label: translations.backgroundColorLabel },
      { key: 'headerColor', label: translations.headerColorLabel },
      { key: 'footerColor', label: translations.footerColorLabel },
      { key: 'mainTextColor', label: translations.mainTextColorLabel }
    ];
  });

  protected readonly buttonGroups = computed<readonly ButtonGroupView[]>(() => {
    const translations = this.translations();

    return [
      {
        key: 'languageButtons',
        label: translations.languageButtonsLabel,
        includesSpace: false,
        includesFontSize: false
      },
      {
        key: 'serviceButtons',
        label: translations.serviceButtonsLabel,
        includesSpace: true,
        includesFontSize: true
      },
      {
        key: 'keypadButtons',
        label: translations.keypadButtonsLabel,
        includesSpace: false,
        includesFontSize: false
      },
      {
        key: 'footerButtons',
        label: translations.footerButtonsLabel,
        includesSpace: false,
        includesFontSize: false
      }
    ];
  });

  protected updateGeneralOption(option: ServiceRequestGeneralOption, event: Event): void {
    this.technicalAdminStore.updateServiceRequestGeneralOption(
      option,
      (event.target as HTMLInputElement).checked
    );
  }

  protected updateThemeColor(color: ServiceRequestThemeColor, event: Event): void {
    this.technicalAdminStore.updateServiceRequestThemeColor(color, this.readInputValue(event));
  }

  protected updateButtonBackground(group: ServiceRequestButtonGroup, event: Event): void {
    this.technicalAdminStore.updateButtonSettings(group, {
      backgroundColor: this.readInputValue(event)
    });
  }

  protected updateButtonTextColor(group: ServiceRequestButtonGroup, event: Event): void {
    this.technicalAdminStore.updateButtonSettings(group, {
      textColor: this.readInputValue(event)
    });
  }

  protected updateButtonWidth(group: ServiceRequestButtonGroup, event: Event): void {
    this.technicalAdminStore.updateButtonSettings(group, {
      widthPercent: this.readNumberValue(event)
    });
  }

  protected updateButtonHeight(group: ServiceRequestButtonGroup, event: Event): void {
    this.technicalAdminStore.updateButtonSettings(group, {
      heightPercent: this.readNumberValue(event)
    });
  }

  protected updateButtonSpace(group: ServiceRequestButtonGroup, event: Event): void {
    this.technicalAdminStore.updateButtonSettings(group, {
      spacePercent: this.readNumberValue(event)
    });
  }

  protected updateButtonFontSize(group: ServiceRequestButtonGroup, event: Event): void {
    this.technicalAdminStore.updateButtonSettings(group, {
      fontSizePercent: this.readNumberValue(event)
    });
  }

  protected save(): void {
    this.technicalAdminStore.markSectionSaved('Service Request Layout');
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private readNumberValue(event: Event): number {
    return Number((event.target as HTMLInputElement).value);
  }
}
