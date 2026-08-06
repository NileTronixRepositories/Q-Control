import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, interval, Observable, tap } from 'rxjs';

import { AppLanguage } from '../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session.service';
import { ServiceRequestStep } from '../enums/service-request-step.enum';
import {
  LocalizedText,
  SERVICE_REQUEST_LANGUAGES,
  SERVICE_REQUEST_TRANSLATIONS,
} from '../models/language.model';
import { TicketIssuanceBranding, TicketIssuanceTheme } from '../models/service-request-api.model';
import { ServiceType } from '../models/service-type.model';
import { Specialty } from '../models/specialty.model';
import { QueueTicket, ServiceRequestSelection } from '../models/ticket.model';
import { ServiceRequestService } from '../services/service-request.service';
import { TicketGeneratorService } from '../services/ticket-generator.service';
import { StepIndicatorItem } from '../shared/selection-card-view.model';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

@Injectable()
export class ServiceRequestStore {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly ticketGeneratorService = inject(TicketGeneratorService);

  private readonly selectedServiceTypeSignal = signal<ServiceType | null>(null);
  private readonly selectedSpecialtySignal = signal<Specialty | null>(null);
  private readonly selectedSubSpecialtySignal = signal<Specialty | null>(null);
  private readonly ticketSignal = signal<QueueTicket | null>(null);
  private readonly loadingTicketSignal = signal(false);

  private readonly serviceTypesSignal = signal<readonly ServiceType[]>([]);
  private readonly specialtiesMapSignal = signal<ReadonlyMap<string, readonly Specialty[]>>(new Map());
  private readonly logoUrlSignal = signal<string | null>(null);
  private readonly branchBrandingSignal = signal<TicketIssuanceBranding | null>(null);
  private readonly loadingServicesSignal = signal(false);
  private readonly errorLoadingServicesSignal = signal(false);

  readonly language = this.appLanguageStore.language;
  readonly direction = this.appLanguageStore.direction;
  readonly languages = SERVICE_REQUEST_LANGUAGES;
  readonly translations = computed(() => SERVICE_REQUEST_TRANSLATIONS[this.language()]);
  readonly serviceTypes = this.serviceTypesSignal.asReadonly();
  readonly selectedServiceType = this.selectedServiceTypeSignal.asReadonly();
  readonly selectedSpecialty = this.selectedSpecialtySignal.asReadonly();
  readonly selectedSubSpecialty = this.selectedSubSpecialtySignal.asReadonly();
  readonly ticket = this.ticketSignal.asReadonly();
  readonly loadingTicket = this.loadingTicketSignal.asReadonly();
  readonly logoUrl = this.logoUrlSignal.asReadonly();
  readonly branchBranding = this.branchBrandingSignal.asReadonly();
  readonly theme = computed(() => this.branchBrandingSignal()?.theme ?? null);
  readonly behavior = computed(() => this.branchBrandingSignal()?.behavior ?? null);
  readonly languageButton = computed(() => this.branchBrandingSignal()?.languageButton ?? null);
  readonly serviceButton = computed(() => this.branchBrandingSignal()?.serviceButton ?? null);
  readonly keypadButton = computed(() => this.branchBrandingSignal()?.keypadButton ?? null);
  readonly footerButton = computed(() => this.branchBrandingSignal()?.footerButton ?? null);
  readonly loadingServices = this.loadingServicesSignal.asReadonly();
  readonly errorLoadingServices = this.errorLoadingServicesSignal.asReadonly();

  readonly availableSpecialties = computed(() => {
    const serviceType = this.selectedServiceType();
    if (!serviceType) {
      return [];
    }
    return this.specialtiesMapSignal().get(serviceType.id) ?? [];
  });

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

    if (this.selectedServiceType() && this.availableSpecialties().length > 0) {
      return ServiceRequestStep.Specialty;
    }

    return ServiceRequestStep.ServiceType;
  });

  readonly stepItems = computed<readonly StepIndicatorItem[]>(() => {
    const translations = this.translations();
    const currentStep = this.currentStep();
    const hideSpecialtyStep =
      this.selectedServiceType() !== null && this.availableSpecialties().length === 0;
    const hasSubSpecialties =
      this.selectedSpecialty() !== null && this.availableSubSpecialties().length > 0;
    const steps = [
      {
        id: ServiceRequestStep.ServiceType,
        label: translations.stepServiceType,
      },
      ...(hideSpecialtyStep
        ? []
        : [
            {
              id: ServiceRequestStep.Specialty,
              label: translations.stepDepartment,
            },
          ]),
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

  constructor() {
    this.loadServices();

    interval(REFRESH_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadServices(undefined, true);
      });
  }

  loadServices(branchId?: number, silent = false): void {
    const targetBranchId = branchId ?? this.authSessionService.activeSession()?.activeBranchId ?? 1;
    if (!silent) {
      this.loadingServicesSignal.set(true);
      this.errorLoadingServicesSignal.set(false);
    }

    this.serviceRequestService
      .loadBranchServices(targetBranchId)
      .pipe(
        finalize(() => {
          if (!silent) {
            this.loadingServicesSignal.set(false);
          }
        }),
      )
      .subscribe({
        next: (data) => {
          this.serviceTypesSignal.set(data.serviceTypes);
          this.specialtiesMapSignal.set(data.specialtiesMap);
          this.logoUrlSignal.set(data.logoUrl);
          this.branchBrandingSignal.set(data.branchBranding);

          if (data.branchBranding?.behavior) {
            const isArabic = data.branchBranding.behavior.defaultLanguageIsArabic;
            this.appLanguageStore.setLanguage(isArabic ? 'ar' : 'en');
          }

          if (silent && this.errorLoadingServicesSignal()) {
            this.errorLoadingServicesSignal.set(false);
          }
        },
        error: (err) => {
          console.error('Failed to fetch branch services from API:', err);
          if (!silent) {
            this.errorLoadingServicesSignal.set(true);
          }
        },
      });
  }

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
    if (this.serviceTypes().length === 0) {
      this.loadServices();
    }
  }

  resolveText(text: LocalizedText): string {
    return text[this.language()];
  }

  private createSelection(): ServiceRequestSelection | null {
    const serviceType = this.selectedServiceType();
    const specialties = this.availableSpecialties();
    const specialty = this.selectedSpecialty();
    const subSpecialties = this.availableSubSpecialties();
    const subSpecialty = this.selectedSubSpecialty();

    if (!serviceType) {
      return null;
    }

    if (specialties.length > 0 && !specialty) {
      return null;
    }

    if (subSpecialties.length > 0 && !subSpecialty) {
      return null;
    }

    const targetNode = subSpecialty ?? specialty ?? serviceType;
    if (!targetNode || targetNode.isTicketIssuable !== true) {
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
