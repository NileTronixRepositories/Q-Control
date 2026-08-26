import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';

import { OrganizationLanguage } from '../../models/organization/organization.model';
import { OrganizationStore } from '../../store/organization.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';

@Component({
  selector: 'app-audio-announcement',
  templateUrl: './audio-announcement.component.html',
  styleUrl: './audio-announcement.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AudioAnnouncementComponent {
  private readonly organizationStore = inject(OrganizationStore);
  private readonly shellStore = inject(OrganizationShellStore);

  protected readonly configuration = this.organizationStore.audioAnnouncementConfiguration;
  protected readonly translations = this.shellStore.translations;
  protected readonly saved = computed(
    () => this.organizationStore.savedSection() === 'Audio Announcement'
  );

  protected readonly languages: readonly OrganizationLanguage[] = ['Arabic', 'English'];
  protected readonly tones: readonly string[] = ['Tone 1', 'Tone 2', 'Tone 3'];
  protected readonly customerTypes: readonly string[] = ['Ticket', 'Customer', 'Patient'];

  protected languageOptionLabel(language: OrganizationLanguage): string {
    const translations = this.translations();
    return language === 'Arabic' ? translations.arabicLanguageOption : translations.englishLanguageOption;
  }

  protected toneLabel(tone: string): string {
    const translations = this.translations();

    if (tone === 'Tone 1') return translations.toneOneLabel;
    if (tone === 'Tone 2') return translations.toneTwoLabel;
    return translations.toneThreeLabel;
  }

  protected customerTypeLabel(customerType: string): string {
    const translations = this.translations();

    if (customerType === 'Ticket') return translations.ticketCustomerTypeLabel;
    if (customerType === 'Customer') return translations.customerCustomerTypeLabel;
    return translations.patientCustomerTypeLabel;
  }

  protected updateVoiceLanguage(event: Event): void {
    this.organizationStore.updateAudioAnnouncementConfiguration({
      voiceLanguage: this.readSelectValue(event) as OrganizationLanguage
    });
  }

  protected updateStartingTone(event: Event): void {
    this.organizationStore.updateAudioAnnouncementConfiguration({
      startingTone: this.readSelectValue(event)
    });
  }

  protected updateCustomerType(event: Event): void {
    this.organizationStore.updateAudioAnnouncementConfiguration({
      customerType: this.readSelectValue(event)
    });
  }

  protected updateAppendNumberWord(event: Event): void {
    this.organizationStore.updateAudioAnnouncementConfiguration({
      appendNumberWord: (event.target as HTMLInputElement).checked
    });
  }

  protected previewTone(): void {
    this.organizationStore.markSectionSaved('Audio Preview Ready');
  }

  protected save(): void {
    this.organizationStore.markSectionSaved('Audio Announcement');
  }

  private readSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}

