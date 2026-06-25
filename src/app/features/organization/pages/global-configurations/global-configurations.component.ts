import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { OrganizationLanguage } from '../../models/organization.model';
import { OrganizationStore } from '../../store/organization.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';

@Component({
  selector: 'app-global-configurations',
  templateUrl: './global-configurations.component.html',
  styleUrl: './global-configurations.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GlobalConfigurationsComponent {
  private readonly organizationStore = inject(OrganizationStore);
  private readonly shellStore = inject(OrganizationShellStore);

  protected readonly configuration = this.organizationStore.globalConfiguration;
  protected readonly translations = this.shellStore.translations;
  protected readonly saved = computed(
    () => this.organizationStore.savedSection() === 'Global Configurations'
  );

  protected readonly languages: readonly OrganizationLanguage[] = ['Arabic', 'English'];
  protected readonly timezones: readonly string[] = [
    'Africa/Cairo',
    'Asia/Riyadh',
    'Asia/Dubai',
    'Europe/London'
  ];

  // Logo upload state
  protected readonly logoInputMode = signal<'url' | 'upload'>('url');
  protected readonly uploadedFileName = signal<string | null>(null);
  protected readonly isDragging = signal(false);

  protected setLogoInputMode(mode: 'url' | 'upload'): void {
    this.logoInputMode.set(mode);
    this.uploadedFileName.set(null);
  }

  protected onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) this.handleFile(file);
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  protected onDragLeave(): void {
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.handleFile(file);
  }

  private handleFile(file: File): void {
    if (!file.type.startsWith('image/')) return;
    this.uploadedFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.organizationStore.updateGlobalConfiguration({ logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  }

  protected updateOrganizationName(event: Event): void {
    this.organizationStore.updateGlobalConfiguration({
      organizationName: this.readInputValue(event)
    });
  }

  protected updateLogoUrl(event: Event): void {
    this.organizationStore.updateGlobalConfiguration({
      logoUrl: this.readInputValue(event)
    });
  }

  protected updateTimezone(event: Event): void {
    this.organizationStore.updateGlobalConfiguration({
      timezone: this.readSelectValue(event)
    });
  }

  protected updateDefaultLanguage(event: Event): void {
    this.organizationStore.updateGlobalConfiguration({
      defaultLanguage: this.readSelectValue(event) as OrganizationLanguage
    });
  }

  protected languageOptionLabel(language: OrganizationLanguage): string {
    const translations = this.translations();
    return language === 'Arabic' ? translations.arabicLanguageOption : translations.englishLanguageOption;
  }

  protected save(): void {
    this.organizationStore.markSectionSaved('Global Configurations');
  }

  private readInputValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private readSelectValue(event: Event): string {
    return (event.target as HTMLSelectElement).value;
  }
}

