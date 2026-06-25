import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { TechnicalAdminStore } from '../../store/technical-admin.store';

@Component({
  selector: 'app-general-theme',
  templateUrl: './general-theme.component.html',
  styleUrl: './general-theme.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralThemeComponent {
  private readonly technicalAdminStore = inject(TechnicalAdminStore);
  protected readonly translations = inject(TechnicalAdminI18nStore).translations;

  protected readonly configuration = this.technicalAdminStore.themeConfiguration;
  protected readonly saved = computed(
    () => this.technicalAdminStore.savedSection() === 'General Theme'
  );
  protected readonly advertisementLabel = computed(() => {
    const images = this.configuration().advertisementImageNames;
    return images.length > 0 ? images.join(', ') : this.translations().setAdvertiseImagesLabel;
  });

  protected updateMainColor(event: Event): void {
    this.technicalAdminStore.updateThemeConfiguration({
      mainColor: this.readInputValue(event)
    });
  }

  protected updateSecondaryColor(event: Event): void {
    this.technicalAdminStore.updateThemeConfiguration({
      secondaryColor: this.readInputValue(event)
    });
  }

  protected updateBackgroundColor(event: Event): void {
    this.technicalAdminStore.updateThemeConfiguration({
      backgroundColor: this.readInputValue(event)
    });
  }

  protected addAdvertisementImages(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    const fileNames = files.map((file) => file.name);

    if (fileNames.length === 0) {
      return;
    }

    this.technicalAdminStore.addAdvertisementImages(fileNames);
  }

  protected save(): void {
    this.technicalAdminStore.markSectionSaved('General Theme');
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}

