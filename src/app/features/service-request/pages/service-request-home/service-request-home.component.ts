import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  signal,
  effect,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { ServiceRequestStep } from '../../enums/service-request-step.enum';
import { ServiceType } from '../../models/service-type/service-type.model';
import { Specialty } from '../../models/specialty/specialty.model';
import { ServiceCustomInput } from '../../../service-management/models/service-management/service-management.model';
import { KioskReservationSearchItemResponse } from '../../models/kiosk-api/kiosk-api.model';
import { ServiceRequestStore } from '../../store/service-request.store';
import { KioskFooterComponent } from '../../components/kiosk-footer/kiosk-footer.component';
import { KioskHeaderComponent } from '../../components/kiosk-header/kiosk-header.component';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';
import { SpecialtyCardComponent } from '../../components/specialty-card/specialty-card.component';
import { TicketPreviewComponent } from '../../components/ticket-preview/ticket-preview.component';
import { KeypadInputComponent } from '../../components/keypad-input/keypad-input.component';
import { CustomerInputFormComponent } from '../../components/customer-input-form/customer-input-form.component';
import { KioskFlowChoiceComponent } from '../../components/kiosk-flow-choice/kiosk-flow-choice.component';
import { KioskReservationListComponent } from '../../components/kiosk-reservation-list/kiosk-reservation-list.component';
import { SelectionCardViewModel } from '../../shared/selection-card-view.model';
import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { TicketPrintRendererComponent } from '@shared/components/ticket-print-renderer/ticket-print-renderer.component';

@Component({
  selector: 'app-service-request-home',
  standalone: true,
  imports: [
    KioskHeaderComponent,
    ServiceCardComponent,
    SpecialtyCardComponent,
    TicketPreviewComponent,
    KeypadInputComponent,
    CustomerInputFormComponent,
    KioskFlowChoiceComponent,
    KioskReservationListComponent,
    KioskFooterComponent,
    TicketPrintRendererComponent,
  ],
  templateUrl: './service-request-home.component.html',
  styleUrl: './service-request-home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceRequestHomeComponent implements OnDestroy {
  protected readonly store = inject(ServiceRequestStore);
  protected readonly step = ServiceRequestStep;
  protected readonly qControlLogoUrl = '/images/service-request/logo-qcontrol.png';

  private ticketSubscription: Subscription | null = null;
  private searchSubscription: Subscription | null = null;
  private convertSubscription: Subscription | null = null;
  private autoRestartTimeoutId: ReturnType<typeof setTimeout> | null = null;

  // Step state tracking
  protected readonly isLanguageStepActive = signal<boolean>(false);
  protected readonly isFlowChoiceStepActive = signal<boolean>(false);
  protected readonly isReservationResultsStepActive = signal<boolean>(false);
  protected readonly isReservationKeypadSearchActive = signal<boolean>(false);
  protected readonly isUserInputStepActive = signal<boolean>(false);
  protected readonly isCustomerInputStepActive = signal<boolean>(false);
  protected readonly customerInputMode = signal<'create' | 'search'>('create');

  protected readonly activeCustomInputs = signal<readonly ServiceCustomInput[]>([]);
  protected readonly activeServiceTitle = signal<string>('');
  protected readonly activeTargetNode = signal<ServiceType | Specialty | null>(null);
  protected readonly hasForwardSelection = signal<boolean>(false);
  protected readonly currentAdIndex = signal<number>(0);

  private cachedSearchParams: {
    customInputs?: Record<string, string | number>;
    field?: string;
  } | null = null;
  private initializedLanguageStep = false;
  private adRotationIntervalId: ReturnType<typeof setInterval> | null = null;

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

    effect(() => {
      const ads = this.store.advertisements();
      if (this.adRotationIntervalId !== null) {
        clearInterval(this.adRotationIntervalId);
        this.adRotationIntervalId = null;
      }
      if (ads.length > 1) {
        this.adRotationIntervalId = setInterval(() => {
          this.currentAdIndex.update((prev) => (prev + 1) % ads.length);
        }, 5000);
      } else {
        this.currentAdIndex.set(0);
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

    if (this.isFlowChoiceStepActive()) {
      return this.store.translations().chooseFlowTitle;
    }

    if (this.isReservationResultsStepActive()) {
      return this.store.translations().reservationsListTitle;
    }

    if (
      this.isReservationKeypadSearchActive() ||
      (this.isCustomerInputStepActive() && this.customerInputMode() === 'search')
    ) {
      return this.store.translations().reservationSearchTitle;
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

    if (this.isFlowChoiceStepActive()) {
      return this.store.translations().chooseFlowDescription;
    }

    if (this.isReservationResultsStepActive()) {
      return this.store.translations().reservationsListDescription;
    }

    if (
      this.isReservationKeypadSearchActive() ||
      (this.isCustomerInputStepActive() && this.customerInputMode() === 'search')
    ) {
      return this.store.translations().reservationSearchDescription;
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

    if (this.isFlowChoiceStepActive()) {
      return translations.chooseFlowTitle;
    }

    if (this.isReservationResultsStepActive()) {
      return translations.reservationsListDescription;
    }

    if (
      this.isReservationKeypadSearchActive() ||
      (this.isCustomerInputStepActive() && this.customerInputMode() === 'search')
    ) {
      return translations.reservationSearchDescription;
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
    if (this.store.loadingTicket() || this.store.searchingReservations()) {
      return false;
    }

    if (this.isLanguageStepActive()) {
      return false;
    }

    if (
      this.isFlowChoiceStepActive() ||
      this.isCustomerInputStepActive() ||
      this.isUserInputStepActive() ||
      this.isReservationKeypadSearchActive() ||
      this.isReservationResultsStepActive()
    ) {
      return true;
    }

    if (this.store.currentStep() === ServiceRequestStep.ServiceType) {
      return this.store.behavior()?.showLanguagePage === true;
    }

    return true;
  });

  protected readonly canGoForward = computed(() => {
    if (this.store.loadingTicket() || this.store.searchingReservations()) {
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

    if (this.isFlowChoiceStepActive()) {
      return this.store.translations().chooseFlowStepBadge;
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

  ngOnDestroy(): void {
    this.cancelAllOperations();
  }

  protected selectLanguageStep(lang: AppLanguage): void {
    this.store.setLanguage(lang);
    this.isLanguageStepActive.set(false);
  }

  protected selectServiceType(serviceTypeId: string): void {
    const serviceType = this.store.serviceTypes().find((item) => item.id === serviceTypeId);

    if (serviceType) {
      this.cancelAllOperations();
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

  private handleTicketIssuanceTrigger(targetNode: ServiceType | Specialty): void {
    this.activeTargetNode.set(targetNode);
    this.activeCustomInputs.set(targetNode.customInputs ?? []);
    this.activeServiceTitle.set(this.store.resolveText(targetNode.name));
    if (targetNode.hasReservation === false) {
      this.onFlowChoiceSelected('direct');
      return;
    }
    this.isFlowChoiceStepActive.set(true);
  }

  protected onFlowChoiceSelected(choice: 'reservation' | 'direct'): void {
    this.store.setFlowChoice(choice);
    this.isFlowChoiceStepActive.set(false);

    const targetNode = this.activeTargetNode();
    if (!targetNode) return;

    if (choice === 'direct') {
      if (
        targetNode.isClientInputRequired &&
        targetNode.customInputs &&
        targetNode.customInputs.length > 0
      ) {
        this.customerInputMode.set('create');
        this.isCustomerInputStepActive.set(true);
        return;
      }

      if (this.store.behavior()?.alwaysRequireUserInput === true) {
        this.isUserInputStepActive.set(true);
      } else {
        this.generateTicket();
      }
    } else if (choice === 'reservation') {
      if (targetNode.customInputs && targetNode.customInputs.length > 0) {
        this.customerInputMode.set('search');
        this.isCustomerInputStepActive.set(true);
      } else {
        this.isReservationKeypadSearchActive.set(true);
      }
    }
  }

  protected onUserInputConfirmed(userInput: string): void {
    this.isUserInputStepActive.set(false);
    this.generateTicket(undefined, userInput);
  }

  protected onCustomerInputConfirmed(userInput: Record<string, string | number>): void {
    if (this.customerInputMode() === 'search') {
      this.cachedSearchParams = { customInputs: userInput };
      this.executeReservationSearch(userInput, undefined);
    } else {
      this.isCustomerInputStepActive.set(false);
      this.generateTicket(userInput, undefined);
    }
  }

  protected onReservationKeypadConfirmed(keypadInput: string): void {
    this.cachedSearchParams = { field: keypadInput };
    this.executeReservationSearch(undefined, keypadInput);
  }

  private executeReservationSearch(
    customInputs?: Record<string, string | number>,
    field?: string,
  ): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }

    const searchReq = this.store.searchReservations(customInputs, field);
    if (searchReq) {
      this.searchSubscription = searchReq.subscribe({
        next: () => {
          this.isCustomerInputStepActive.set(false);
          this.isReservationKeypadSearchActive.set(false);
          this.isReservationResultsStepActive.set(true);
        },
        error: () => {
          this.isCustomerInputStepActive.set(false);
          this.isReservationKeypadSearchActive.set(false);
          this.isReservationResultsStepActive.set(true);
        },
      });
    }
  }

  protected onReservationSelected(reservation: KioskReservationSearchItemResponse): void {
    if (this.convertSubscription) {
      this.convertSubscription.unsubscribe();
    }

    const convertReq = this.store.convertReservationToTicket(reservation);
    if (convertReq) {
      this.convertSubscription = convertReq.subscribe({
        next: (ticket) => {
          if (ticket) {
            this.isReservationResultsStepActive.set(false);
            this.autoRestartTimeoutId = setTimeout(() => {
              this.restart();
            }, 5000);
          }
        },
      });
    }
  }

  protected onEditReservationSearch(): void {
    this.isReservationResultsStepActive.set(false);
    if (this.activeCustomInputs().length > 0) {
      this.customerInputMode.set('search');
      this.isCustomerInputStepActive.set(true);
    } else {
      this.isReservationKeypadSearchActive.set(true);
    }
  }

  protected onDirectTicketFallback(): void {
    this.isReservationResultsStepActive.set(false);
    this.onFlowChoiceSelected('direct');
  }

  protected onRetryReservationSearch(): void {
    this.executeReservationSearch(
      this.cachedSearchParams?.customInputs,
      this.cachedSearchParams?.field,
    );
  }

  protected goBack(): void {
    this.cancelAllOperations();

    if (this.isReservationResultsStepActive()) {
      this.onEditReservationSearch();
      return;
    }

    if (this.isReservationKeypadSearchActive()) {
      this.isReservationKeypadSearchActive.set(false);
      this.isFlowChoiceStepActive.set(true);
      return;
    }

    if (this.isCustomerInputStepActive()) {
      this.isCustomerInputStepActive.set(false);
      this.isFlowChoiceStepActive.set(true);
      return;
    }

    if (this.isUserInputStepActive()) {
      this.isUserInputStepActive.set(false);
      this.isFlowChoiceStepActive.set(true);
      return;
    }

    if (this.isFlowChoiceStepActive()) {
      this.isFlowChoiceStepActive.set(false);
      this.store.setFlowChoice(null);
      this.hasForwardSelection.set(true);
      this.store.goBack();
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
    this.cancelAllOperations();
    this.isLanguageStepActive.set(false);
    this.isFlowChoiceStepActive.set(false);
    this.isReservationResultsStepActive.set(false);
    this.isReservationKeypadSearchActive.set(false);
    this.isUserInputStepActive.set(false);
    this.isCustomerInputStepActive.set(false);
    this.customerInputMode.set('create');
    this.activeCustomInputs.set([]);
    this.activeServiceTitle.set('');
    this.activeTargetNode.set(null);
    this.cachedSearchParams = null;
    this.hasForwardSelection.set(false);
    this.store.restart();
  }

  protected retryLoading(): void {
    this.store.loadServices();
  }

  protected printTicket(): void {
    window.print();
  }

  private generateTicket(
    customInputData?: Record<string, string | number>,
    fieldData?: string,
  ): void {
    this.cancelAllOperations();

    const ticketRequest = this.store.generateTicket(customInputData, fieldData);

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

  private cancelAllOperations(): void {
    if (this.ticketSubscription) {
      this.ticketSubscription.unsubscribe();
      this.ticketSubscription = null;
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
      this.searchSubscription = null;
    }
    if (this.convertSubscription) {
      this.convertSubscription.unsubscribe();
      this.convertSubscription = null;
    }
    if (this.autoRestartTimeoutId !== null) {
      clearTimeout(this.autoRestartTimeoutId);
      this.autoRestartTimeoutId = null;
    }
    if (this.adRotationIntervalId !== null) {
      clearInterval(this.adRotationIntervalId);
      this.adRotationIntervalId = null;
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
      imageUrl: serviceType.imageUrl,
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
      imageUrl: specialty.imageUrl,
    };
  }

  private createWaitingMeta(minutes: number): string {
    if (!minutes || minutes <= 0) {
      return '';
    }
    return `${minutes} ${this.store.translations().minutesLabel}`;
  }
}
