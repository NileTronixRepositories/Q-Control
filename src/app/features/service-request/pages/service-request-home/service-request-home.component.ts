import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject, signal, effect } from '@angular/core';
import { Subscription } from 'rxjs';

import { ServiceRequestStep } from '../../enums/service-request-step.enum';
import { ServiceType } from '../../models/service-type/service-type.model';
import { Specialty } from '../../models/specialty/specialty.model';
import { ServiceCustomInput } from '../../../service-management/models/service-management/service-management.model';
import { ServiceRequestStore } from '../../store/service-request.store';
import { KioskFooterComponent } from '../../components/kiosk-footer/kiosk-footer.component';
import { KioskHeaderComponent } from '../../components/kiosk-header/kiosk-header.component';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';
import { SpecialtyCardComponent } from '../../components/specialty-card/specialty-card.component';
import { TicketPreviewComponent } from '../../components/ticket-preview/ticket-preview.component';
import { KeypadInputComponent } from '../../components/keypad-input/keypad-input.component';
import { CustomerInputFormComponent } from '../../components/customer-input-form/customer-input-form.component';
import { SelectionCardViewModel } from '../../shared/selection-card-view.model';
import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';

@Component({
  selector: 'app-service-request-home',
  imports: [
    KioskHeaderComponent,
    ServiceCardComponent,
    SpecialtyCardComponent,
    TicketPreviewComponent,
    KeypadInputComponent,
    CustomerInputFormComponent,
    KioskFooterComponent,
  ],
  templateUrl: './service-request-home.component.html',
  styleUrl: './service-request-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceRequestHomeComponent implements OnDestroy {
  protected readonly store = inject(ServiceRequestStore);
  protected readonly step = ServiceRequestStep;

  private ticketSubscription: Subscription | null = null;
  private autoRestartTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Step 0 Language selection state & Keypad user input state & forward history tracking
  protected readonly isLanguageStepActive = signal<boolean>(false);
  protected readonly isUserInputStepActive = signal<boolean>(false);
  protected readonly isCustomerInputStepActive = signal<boolean>(false);
  protected readonly activeCustomInputs = signal<readonly ServiceCustomInput[]>([]);
  protected readonly activeServiceTitle = signal<string>('');
  protected readonly hasForwardSelection = signal<boolean>(false);
  private initializedLanguageStep = false;

  constructor() {
    effect(() => {
      const behavior = this.store.behavior();
      if (behavior && !this.initializedLanguageStep) {
        this.initializedLanguageStep = true;
        if (behavior.showLanguagePage) {
          this.isLanguageStepActive.set(true);
        }
      }
    });
  }

  protected readonly isRtl = computed(() => this.store.direction() === 'rtl');

  protected readonly prevButtonIcon = computed(() =>
    this.isRtl() ? 'bi-chevron-right' : 'bi-chevron-left',
  );

  protected readonly nextButtonIcon = computed(() =>
    this.isRtl() ? 'bi-chevron-left' : 'bi-chevron-right',
  );

  protected readonly serviceCards = computed<readonly SelectionCardViewModel[]>(() =>
    this.store.serviceTypes().map((serviceType) => this.mapServiceTypeCard(serviceType)),
  );

  protected readonly specialtyCards = computed<readonly SelectionCardViewModel[]>(() =>
    this.store.availableSpecialties().map((specialty) => this.mapSpecialtyCard(specialty)),
  );

  protected readonly subSpecialtyCards = computed<readonly SelectionCardViewModel[]>(() =>
    this.store.availableSubSpecialties().map((specialty) => this.mapSpecialtyCard(specialty)),
  );

  protected readonly pageTitle = computed(() => {
    if (this.store.errorLoadingServices()) {
      return this.store.translations().errorLoadingTitle;
    }

    if (this.store.loadingServices()) {
      return this.store.translations().loadingServicesTitle;
    }

    if (this.store.loadingTicket()) {
      return this.store.translations().loadingTitle;
    }

    if (this.isLanguageStepActive()) {
      return this.store.translations().languageStepTitle;
    }

    if (this.isCustomerInputStepActive()) {
      return this.store.translations().customerInputTitle;
    }

    if (this.isUserInputStepActive()) {
      return this.store.translations().userInputTitle;
    }

    const translations = this.store.translations();

    switch (this.store.currentStep()) {
      case ServiceRequestStep.Specialty:
        return translations.specialtyTitle;
      case ServiceRequestStep.SubSpecialty:
        return translations.subSpecialtyTitle;
      case ServiceRequestStep.Ticket:
        return translations.ticketTitle;
      case ServiceRequestStep.ServiceType:
      default:
        return translations.serviceTypeTitle;
    }
  });

  protected readonly pageDescription = computed(() => {
    if (this.store.errorLoadingServices()) {
      return this.store.translations().errorLoadingDescription;
    }

    if (this.store.loadingServices()) {
      return this.store.translations().loadingServicesDescription;
    }

    if (this.store.loadingTicket()) {
      return this.store.translations().loadingDescription;
    }

    if (this.isLanguageStepActive()) {
      return this.store.translations().languageStepDescription;
    }

    if (this.isCustomerInputStepActive()) {
      return this.store.translations().customerInputDescription;
    }

    if (this.isUserInputStepActive()) {
      return this.store.translations().userInputDescription;
    }

    const translations = this.store.translations();

    switch (this.store.currentStep()) {
      case ServiceRequestStep.Specialty:
        return translations.specialtyDescription;
      case ServiceRequestStep.SubSpecialty:
        return translations.subSpecialtyDescription;
      case ServiceRequestStep.Ticket:
        return translations.ticketDescription;
      case ServiceRequestStep.ServiceType:
      default:
        return translations.serviceTypeDescription;
    }
  });

  protected readonly footerCaption = computed(() => {
    const translations = this.store.translations();

    if (this.store.errorLoadingServices()) {
      return translations.errorLoadingTitle;
    }

    if (this.store.loadingServices()) {
      return translations.loadingServicesTitle;
    }

    if (this.store.loadingTicket()) {
      return translations.loadingTitle;
    }

    if (this.isLanguageStepActive()) {
      return translations.languageLabel;
    }

    if (this.isCustomerInputStepActive()) {
      return translations.footerCustomerInputPrompt;
    }

    if (this.isUserInputStepActive()) {
      return this.store.translations().userInputRequired;
    }

    switch (this.store.currentStep()) {
      case ServiceRequestStep.Specialty:
        return translations.footerSpecialtyPrompt;
      case ServiceRequestStep.SubSpecialty:
        return translations.footerSubSpecialtyPrompt;
      case ServiceRequestStep.Ticket:
        return translations.footerTicketPrompt;
      case ServiceRequestStep.ServiceType:
      default:
        return translations.footerServicePrompt;
    }
  });

  protected readonly canGoBack = computed(() => {
    if (this.store.loadingTicket()) {
      return false;
    }

    if (this.isLanguageStepActive()) {
      return false;
    }

    if (this.isCustomerInputStepActive() || this.isUserInputStepActive()) {
      return true;
    }

    if (this.store.currentStep() === ServiceRequestStep.ServiceType) {
      return this.store.behavior()?.showLanguagePage === true;
    }

    return true;
  });

  protected readonly canGoForward = computed(() => {
    if (this.store.loadingTicket()) {
      return false;
    }

    if (this.isLanguageStepActive()) {
      return true;
    }

    return this.hasForwardSelection();
  });

  protected readonly currentStepBadgeText = computed(() => {
    if (this.isLanguageStepActive()) {
      return this.store.translations().languageStepBadge;
    }

    if (this.isCustomerInputStepActive()) {
      return this.store.translations().customerInputStepBadge;
    }

    if (this.isUserInputStepActive()) {
      return this.store.translations().userInputStepBadge;
    }

    switch (this.store.currentStep()) {
      case ServiceRequestStep.ServiceType:
        return this.store.translations().serviceTypeStepBadge;
      case ServiceRequestStep.Specialty:
        return this.store.translations().departmentStepBadge;
      case ServiceRequestStep.SubSpecialty:
        return this.store.translations().subSpecialtyStepBadge;
      case ServiceRequestStep.Ticket:
        return this.store.translations().ticketIssuedStepBadge;
      default:
        return this.store.translations().serviceTypeStepBadge;
    }
  });

  protected readonly currentStepCounterText = computed(() => {
    const showLang = this.store.behavior()?.showLanguagePage === true;
    const total = showLang ? 4 : 3;

    if (this.isLanguageStepActive()) {
      return `1 / ${total}`;
    }

    if (this.isUserInputStepActive()) {
      return `* / ${total}`;
    }

    switch (this.store.currentStep()) {
      case ServiceRequestStep.ServiceType:
        return showLang ? `2 / ${total}` : `1 / ${total}`;
      case ServiceRequestStep.Specialty:
        return showLang ? `3 / ${total}` : `2 / ${total}`;
      case ServiceRequestStep.SubSpecialty:
        return showLang ? `4 / ${total}` : `3 / ${total}`;
      case ServiceRequestStep.Ticket:
        return '✓';
      default:
        return showLang ? `2 / ${total}` : `1 / ${total}`;
    }
  });

  ngOnDestroy(): void {
    this.cancelTicketGeneration();
  }

  protected selectLanguageStep(lang: AppLanguage): void {
    this.store.setLanguage(lang);
    this.isLanguageStepActive.set(false);
  }

  protected selectServiceType(serviceTypeId: string): void {
    const serviceType = this.store.serviceTypes().find((item) => item.id === serviceTypeId);

    if (serviceType) {
      this.cancelTicketGeneration();
      this.hasForwardSelection.set(false);
      this.store.selectServiceType(serviceType);

      if (this.store.availableSpecialties().length === 0 && serviceType.isTicketIssuable === true) {
        this.handleTicketIssuanceTrigger(serviceType);
      }
    }
  }

  protected selectSpecialty(specialtyId: string): void {
    const specialty = this.store.availableSpecialties().find((item) => item.id === specialtyId);

    if (!specialty) {
      return;
    }

    this.hasForwardSelection.set(false);
    this.store.selectSpecialty(specialty);

    if (specialty.subSpecialties.length === 0 && specialty.isTicketIssuable === true) {
      this.handleTicketIssuanceTrigger(specialty);
    }
  }

  protected selectSubSpecialty(specialtyId: string): void {
    const specialty = this.store.availableSubSpecialties().find((item) => item.id === specialtyId);

    if (!specialty) {
      return;
    }

    this.hasForwardSelection.set(false);
    this.store.selectSubSpecialty(specialty);
    if (specialty.isTicketIssuable === true) {
      this.handleTicketIssuanceTrigger(specialty);
    }
  }

  protected onUserInputConfirmed(_userInput: string): void {
    this.isUserInputStepActive.set(false);
    this.generateTicket();
  }

  protected onCustomerInputConfirmed(_userInput: Record<string, string | number>): void {
    this.isCustomerInputStepActive.set(false);
    this.generateTicket();
  }

  private handleTicketIssuanceTrigger(targetNode: ServiceType | Specialty): void {
    if (targetNode.isClientInputRequired && targetNode.customInputs && targetNode.customInputs.length > 0) {
      this.activeCustomInputs.set(targetNode.customInputs);
      this.activeServiceTitle.set(this.store.resolveText(targetNode.name));
      this.isCustomerInputStepActive.set(true);
      return;
    }

    if (this.store.behavior()?.alwaysRequireUserInput === true) {
      this.isUserInputStepActive.set(true);
    } else {
      this.generateTicket();
    }
  }

  protected goBack(): void {
    this.cancelTicketGeneration();

    if (this.isCustomerInputStepActive()) {
      this.isCustomerInputStepActive.set(false);
      return;
    }

    if (this.isUserInputStepActive()) {
      this.isUserInputStepActive.set(false);
      return;
    }

    if (this.store.currentStep() === ServiceRequestStep.ServiceType) {
      if (this.store.behavior()?.showLanguagePage) {
        this.isLanguageStepActive.set(true);
        this.hasForwardSelection.set(true);
      }
      return;
    }

    this.hasForwardSelection.set(true);
    this.store.goBack();
  }

  protected goNext(): void {
    if (this.isLanguageStepActive()) {
      this.isLanguageStepActive.set(false);
      return;
    }

    if (this.hasForwardSelection()) {
      this.hasForwardSelection.set(false);
    }
  }

  protected restart(): void {
    this.cancelTicketGeneration();
    this.isLanguageStepActive.set(false);
    this.isUserInputStepActive.set(false);
    this.isCustomerInputStepActive.set(false);
    this.activeCustomInputs.set([]);
    this.activeServiceTitle.set('');
    this.hasForwardSelection.set(false);
    this.store.restart();
  }

  protected retryLoading(): void {
    this.store.loadServices();
  }

  private generateTicket(): void {
    this.cancelTicketGeneration();

    const ticketRequest = this.store.generateTicket();

    if (ticketRequest) {
      this.ticketSubscription = ticketRequest.subscribe({
        next: (ticket) => {
          if (ticket) {
            this.autoRestartTimeoutId = setTimeout(() => {
              this.restart();
            }, 5000);
          }
        },
      });
    }
  }

  private cancelTicketGeneration(): void {
    if (this.ticketSubscription) {
      this.ticketSubscription.unsubscribe();
      this.ticketSubscription = null;
    }
    if (this.autoRestartTimeoutId !== null) {
      clearTimeout(this.autoRestartTimeoutId);
      this.autoRestartTimeoutId = null;
    }
  }

  private mapServiceTypeCard(serviceType: ServiceType): SelectionCardViewModel {
    return {
      id: serviceType.id,
      title: this.store.resolveText(serviceType.name),
      description: this.store.resolveText(serviceType.description),
      icon: serviceType.icon,
      tone: serviceType.tone,
      meta: this.createWaitingMeta(serviceType.estimatedWaitingMinutes),
    };
  }

  private mapSpecialtyCard(specialty: Specialty): SelectionCardViewModel {
    return {
      id: specialty.id,
      title: this.store.resolveText(specialty.name),
      description: this.store.resolveText(specialty.description),
      icon: specialty.icon,
      tone: specialty.tone,
      meta: this.createWaitingMeta(specialty.estimatedWaitingMinutes),
    };
  }

  private createWaitingMeta(minutes: number): string {
    if (!minutes || minutes <= 0) {
      return '';
    }
    return `${minutes} ${this.store.translations().minutesLabel}`;
  }
}
