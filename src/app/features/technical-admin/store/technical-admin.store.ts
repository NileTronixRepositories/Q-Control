import { computed, Injectable, signal } from '@angular/core';

import {
  ServiceRequestButtonGroup,
  ServiceRequestButtonSettings,
  ServiceRequestGeneralOption,
  ServiceRequestLayoutConfiguration,
  ServiceRequestThemeColor,
  TechnicalAdminThemeConfiguration
} from '../models/technical-admin.model';

@Injectable()
export class TechnicalAdminStore {
  private readonly themeConfigurationSignal = signal<TechnicalAdminThemeConfiguration>({
    mainColor: 'rgb(167,6,15)',
    secondaryColor: 'rgb(0,112,196)',
    backgroundColor: '#ffffff',
    advertisementImageNames: []
  });

  private readonly serviceRequestLayoutSignal = signal<ServiceRequestLayoutConfiguration>({
    general: {
      showLanguagePage: true,
      defaultLanguageArabic: false,
      alwaysRequireUserInput: false,
      showServiceNavigationPath: true,
      allowOperatorSelection: false,
      allowRequestMoreServices: false
    },
    theme: {
      backgroundColor: '#ffffff',
      headerColor: '#ffffff',
      footerColor: '#ffffff',
      mainTextColor: 'rgb(167,6,15)'
    },
    buttons: {
      languageButtons: {
        backgroundColor: 'rgb(0,112,196)',
        textColor: '#ffffff',
        widthPercent: 40,
        heightPercent: 22
      },
      serviceButtons: {
        backgroundColor: 'rgb(0,112,196)',
        textColor: '#ffffff',
        widthPercent: 40,
        heightPercent: 20,
        spacePercent: 2,
        fontSizePercent: 1.8
      },
      keypadButtons: {
        backgroundColor: 'rgb(0,112,196)',
        textColor: '#ffffff',
        widthPercent: 45,
        heightPercent: 10
      },
      footerButtons: {
        backgroundColor: 'rgb(0,112,196)',
        textColor: '#ffffff',
        widthPercent: 10,
        heightPercent: 12
      }
    }
  });

  private readonly savedSectionSignal = signal<string>('');

  readonly themeConfiguration = this.themeConfigurationSignal.asReadonly();
  readonly serviceRequestLayout = this.serviceRequestLayoutSignal.asReadonly();
  readonly savedSection = this.savedSectionSignal.asReadonly();
  readonly hasAdvertisementImages = computed(
    () => this.themeConfigurationSignal().advertisementImageNames.length > 0
  );

  updateThemeConfiguration(configuration: Partial<TechnicalAdminThemeConfiguration>): void {
    this.themeConfigurationSignal.update((current) => ({
      ...current,
      ...configuration
    }));
  }

  addAdvertisementImages(fileNames: readonly string[]): void {
    this.themeConfigurationSignal.update((current) => ({
      ...current,
      advertisementImageNames: [...current.advertisementImageNames, ...fileNames]
    }));
  }

  updateServiceRequestGeneralOption(
    option: ServiceRequestGeneralOption,
    enabled: boolean
  ): void {
    this.serviceRequestLayoutSignal.update((current) => ({
      ...current,
      general: {
        ...current.general,
        [option]: enabled
      }
    }));
  }

  updateServiceRequestThemeColor(color: ServiceRequestThemeColor, value: string): void {
    this.serviceRequestLayoutSignal.update((current) => ({
      ...current,
      theme: {
        ...current.theme,
        [color]: value
      }
    }));
  }

  updateButtonSettings(
    group: ServiceRequestButtonGroup,
    changes: Partial<ServiceRequestButtonSettings>
  ): void {
    this.serviceRequestLayoutSignal.update((current) => ({
      ...current,
      buttons: {
        ...current.buttons,
        [group]: {
          ...current.buttons[group],
          ...changes
        }
      }
    }));
  }

  markSectionSaved(sectionName: string): void {
    this.savedSectionSignal.set(sectionName);
  }
}
