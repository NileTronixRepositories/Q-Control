import { ChangeDetectionStrategy, Component, OnDestroy, computed, inject } from '@angular/core';
import { Subscription } from 'rxjs';

import { ServiceRequestStep } from '../../enums/service-request-step.enum';
import { ServiceType } from '../../models/service-type.model';
import { Specialty } from '../../models/specialty.model';
import { ServiceRequestStore } from '../../store/service-request.store';
import { KioskFooterComponent } from '../../components/kiosk-footer/kiosk-footer.component';
import { KioskHeaderComponent } from '../../components/kiosk-header/kiosk-header.component';
import { ServiceCardComponent } from '../../components/service-card/service-card.component';
import { SpecialtyCardComponent } from '../../components/specialty-card/specialty-card.component';
import { TicketPreviewComponent } from '../../components/ticket-preview/ticket-preview.component';
import { SelectionCardViewModel } from '../../shared/selection-card-view.model';

@Component({
  selector: 'app-service-request-home',
  imports: [
    KioskHeaderComponent,
    ServiceCardComponent,
    SpecialtyCardComponent,
    TicketPreviewComponent,
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
    if (this.store.loadingTicket()) {
      return this.store.translations().loadingTitle;
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
        return translations.serviceTypeTitle;
    }
  });

  protected readonly pageDescription = computed(() => {
    if (this.store.loadingTicket()) {
      return this.store.translations().loadingDescription;
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
        return translations.serviceTypeDescription;
    }
  });

  protected readonly footerCaption = computed(() => {
    const translations = this.store.translations();

    if (this.store.loadingTicket()) {
      return translations.loadingTitle;
    }

    switch (this.store.currentStep()) {
      case ServiceRequestStep.Specialty:
        return translations.footerSpecialtyPrompt;
      case ServiceRequestStep.SubSpecialty:
        return translations.footerSubSpecialtyPrompt;
      case ServiceRequestStep.Ticket:
        return translations.footerTicketPrompt;
      case ServiceRequestStep.ServiceType:
        return translations.footerServicePrompt;
    }
  });

  protected readonly canGoBack = computed(
    () =>
      this.store.currentStep() !== ServiceRequestStep.ServiceType && !this.store.loadingTicket(),
  );

  protected readonly showRestart = computed(
    () =>
      this.store.selectedServiceType() !== null ||
      this.store.ticket() !== null ||
      this.store.loadingTicket(),
  );

  ngOnDestroy(): void {
    this.cancelTicketGeneration();
  }

  protected selectServiceType(serviceTypeId: string): void {
    const serviceType = this.store.serviceTypes().find((item) => item.id === serviceTypeId);

    if (serviceType) {
      this.cancelTicketGeneration();
      this.store.selectServiceType(serviceType);
    }
  }

  protected selectSpecialty(specialtyId: string): void {
    const specialty = this.store.availableSpecialties().find((item) => item.id === specialtyId);

    if (!specialty) {
      return;
    }

    this.store.selectSpecialty(specialty);

    if (specialty.subSpecialties.length === 0) {
      this.generateTicket();
    }
  }

  protected selectSubSpecialty(specialtyId: string): void {
    const specialty = this.store.availableSubSpecialties().find((item) => item.id === specialtyId);

    if (!specialty) {
      return;
    }

    this.store.selectSubSpecialty(specialty);
    this.generateTicket();
  }

  protected goBack(): void {
    this.cancelTicketGeneration();
    this.store.goBack();
  }

  protected restart(): void {
    this.cancelTicketGeneration();
    this.store.restart();
  }

  private generateTicket(): void {
    this.cancelTicketGeneration();

    const ticketRequest = this.store.generateTicket();

    if (ticketRequest) {
      this.ticketSubscription = ticketRequest.subscribe();
    }
  }

  private cancelTicketGeneration(): void {
    if (this.ticketSubscription) {
      this.ticketSubscription.unsubscribe();
      this.ticketSubscription = null;
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
    return `${minutes} ${this.store.translations().minutesLabel}`;
  }
}
