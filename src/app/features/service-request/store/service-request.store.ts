import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, Observable, tap } from 'rxjs';

import { AppLanguage } from '../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { ServiceRequestStep } from '../enums/service-request-step.enum';
import {
  LocalizedText,
  SERVICE_REQUEST_LANGUAGES,
  SERVICE_REQUEST_TRANSLATIONS,
} from '../models/language.model';
import { ServiceType } from '../models/service-type.model';
import { Specialty } from '../models/specialty.model';
import { QueueTicket, ServiceRequestSelection } from '../models/ticket.model';
import { ServiceRequestService } from '../services/service-request.service';
import { TicketGeneratorService } from '../services/ticket-generator.service';
import { StepIndicatorItem } from '../shared/selection-card-view.model';

@Injectable()
export class ServiceRequestStore {
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly ticketGeneratorService = inject(TicketGeneratorService);

  private readonly selectedServiceTypeSignal = signal<ServiceType | null>(null);
  private readonly selectedSpecialtySignal = signal<Specialty | null>(null);
  private readonly selectedSubSpecialtySignal = signal<Specialty | null>(null);
  private readonly ticketSignal = signal<QueueTicket | null>(null);
  private readonly loadingTicketSignal = signal(false);

  readonly language = this.appLanguageStore.language;
  readonly direction = this.appLanguageStore.direction;
  readonly languages = SERVICE_REQUEST_LANGUAGES;
  readonly translations = computed(() => SERVICE_REQUEST_TRANSLATIONS[this.language()]);
  readonly serviceTypes = signal(this.serviceRequestService.getServiceTypes()).asReadonly();
  readonly selectedServiceType = this.selectedServiceTypeSignal.asReadonly();
  readonly selectedSpecialty = this.selectedSpecialtySignal.asReadonly();
  readonly selectedSubSpecialty = this.selectedSubSpecialtySignal.asReadonly();
  readonly ticket = this.ticketSignal.asReadonly();
  readonly loadingTicket = this.loadingTicketSignal.asReadonly();

  readonly availableSpecialties = computed(() =>
    this.serviceRequestService.getSpecialtiesForService(this.selectedServiceType()),
  );

  readonly availableSubSpecialties = computed(
    () => this.selectedSpecialty()?.subSpecialties ?? [],
  );

  readonly currentStep = computed<ServiceRequestStep>(() => {
    if (this.ticket()) {
      return ServiceRequestStep.Ticket;
    }

    if (this.selectedSpecialty() && this.availableSubSpecialties().length > 0) {
      return ServiceRequestStep.SubSpecialty;
    }

    if (this.selectedServiceType()) {
      return ServiceRequestStep.Specialty;
    }

    return ServiceRequestStep.ServiceType;
  });

  readonly stepItems = computed<readonly StepIndicatorItem[]>(() => {
    const translations = this.translations();
    const currentStep = this.currentStep();
    const hasSubSpecialties =
      this.selectedSpecialty() !== null && this.availableSubSpecialties().length > 0;
    const steps = [
      {
        id: ServiceRequestStep.ServiceType,
        label: translations.stepServiceType,
      },
      {
        id: ServiceRequestStep.Specialty,
        label: translations.stepDepartment,
      },
      ...(hasSubSpecialties
        ? [
            {
              id: ServiceRequestStep.SubSpecialty,
              label: translations.stepSubSpecialty,
            },
          ]
        : []),
      {
        id: ServiceRequestStep.Ticket,
        label: translations.stepTicket,
      },
    ];
    const currentIndex = steps.findIndex((step) => step.id === currentStep);

    return steps.map((step, index) => ({
      ...step,
      status:
        index < currentIndex
          ? 'completed'
          : index === currentIndex
            ? 'active'
            : 'pending',
    }));
  });

  setLanguage(language: AppLanguage): void {
    this.appLanguageStore.setLanguage(language);
  }

  selectServiceType(serviceType: ServiceType): void {
    this.selectedServiceTypeSignal.set(serviceType);
    this.selectedSpecialtySignal.set(null);
    this.selectedSubSpecialtySignal.set(null);
    this.ticketSignal.set(null);
  }

  selectSpecialty(specialty: Specialty): void {
    this.selectedSpecialtySignal.set(specialty);
    this.selectedSubSpecialtySignal.set(null);
    this.ticketSignal.set(null);
  }

  selectSubSpecialty(specialty: Specialty): void {
    this.selectedSubSpecialtySignal.set(specialty);
    this.ticketSignal.set(null);
  }

  generateTicket(): Observable<QueueTicket> | null {
    const selection = this.createSelection();

    if (!selection) {
      return null;
    }

    this.loadingTicketSignal.set(true);
    this.ticketSignal.set(null);

    return this.ticketGeneratorService.generateTicket(selection).pipe(
      tap((ticket) => this.ticketSignal.set(ticket)),
      finalize(() => this.loadingTicketSignal.set(false)),
    );
  }

  goBack(): void {
    const currentStep = this.currentStep();

    if (currentStep === ServiceRequestStep.Ticket) {
      this.ticketSignal.set(null);
      return;
    }

    if (currentStep === ServiceRequestStep.SubSpecialty) {
      this.selectedSpecialtySignal.set(null);
      this.selectedSubSpecialtySignal.set(null);
      return;
    }

    if (currentStep === ServiceRequestStep.Specialty) {
      this.selectedServiceTypeSignal.set(null);
      return;
    }
  }

  restart(): void {
    this.selectedServiceTypeSignal.set(null);
    this.selectedSpecialtySignal.set(null);
    this.selectedSubSpecialtySignal.set(null);
    this.ticketSignal.set(null);
    this.loadingTicketSignal.set(false);
  }

  resolveText(text: LocalizedText): string {
    return text[this.language()];
  }

  private createSelection(): ServiceRequestSelection | null {
    const serviceType = this.selectedServiceType();
    const specialty = this.selectedSpecialty();
    const subSpecialties = this.availableSubSpecialties();
    const subSpecialty = this.selectedSubSpecialty();

    if (!serviceType || !specialty) {
      return null;
    }

    if (subSpecialties.length > 0 && !subSpecialty) {
      return null;
    }

    return {
      language: this.language(),
      serviceType,
      specialty,
      subSpecialty,
    };
  }
}
