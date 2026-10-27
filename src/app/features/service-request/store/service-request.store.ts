import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  finalize,
  interval,
  map,
  Observable,
  Subscription,
  tap,
  throwError,
} from 'rxjs';

import { AppLanguage } from '../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../shared/store/app-language.store';
import { AuthSessionService } from '../../auth/services/auth-session/auth-session.service';
import { ServiceRequestStep } from '../enums/service-request-step.enum';
import {
  CreateKioskTicketRequest,
  KioskCustomInputValue,
  KioskReservationSearchItemResponse,
  KioskTicketResponse,
  SearchKioskReservationRequest,
} from '../models/kiosk-api/kiosk-api.model';
import {
  LocalizedText,
  SERVICE_REQUEST_LANGUAGES,
  SERVICE_REQUEST_TRANSLATIONS,
} from '../models/language/language.model';
import {
  KioskAdvertisementItem,
  TicketIssuanceBranding,
} from '../models/service-request-api/service-request-api.model';
import { ServiceType } from '../models/service-type/service-type.model';
import { Specialty } from '../models/specialty/specialty.model';
import { QueueTicket, ServiceRequestSelection } from '../models/ticket/ticket.model';
import { KioskApiService } from '../services/kiosk-api/kiosk-api.service';
import { ServiceRequestService } from '../services/service-request/service-request.service';
import { StepIndicatorItem } from '../shared/selection-card-view.model';

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

@Injectable()
export class ServiceRequestStore {
  private readonly destroyRef = inject(DestroyRef);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly serviceRequestService = inject(ServiceRequestService);
  private readonly kioskApiService = inject(KioskApiService);

  private readonly selectedServiceTypeSignal = signal<ServiceType | null>(null);
  private readonly selectedSpecialtySignal = signal<Specialty | null>(null);
  private readonly selectedSubSpecialtySignal = signal<Specialty | null>(null);
  private readonly kioskFlowChoiceSignal = signal<'reservation' | 'direct' | null>(null);
  private readonly reservationSearchResultsSignal = signal<
    readonly KioskReservationSearchItemResponse[]
  >([]);
  private readonly searchingReservationsSignal = signal(false);
  private readonly searchAttemptedSignal = signal(false);
  private readonly selectedReservationSignal = signal<KioskReservationSearchItemResponse | null>(
    null,
  );
  private readonly convertingReservationSignal = signal(false);
  private readonly ticketSignal = signal<QueueTicket | null>(null);
  private readonly loadingTicketSignal = signal(false);
  private readonly errorMessageSignal = signal<string | null>(null);

  private readonly serviceTypesSignal = signal<readonly ServiceType[]>([]);
  private readonly specialtiesMapSignal = signal<ReadonlyMap<string, readonly Specialty[]>>(
    new Map(),
  );
  private readonly logoUrlSignal = signal<string | null>(null);
  private readonly branchBrandingSignal = signal<TicketIssuanceBranding | null>(null);
  private readonly advertisementsSignal = signal<readonly KioskAdvertisementItem[]>([]);
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
  readonly kioskFlowChoice = this.kioskFlowChoiceSignal.asReadonly();
  readonly reservationSearchResults = this.reservationSearchResultsSignal.asReadonly();
  readonly searchingReservations = this.searchingReservationsSignal.asReadonly();
  readonly searchAttempted = this.searchAttemptedSignal.asReadonly();
  readonly selectedReservation = this.selectedReservationSignal.asReadonly();
  readonly convertingReservation = this.convertingReservationSignal.asReadonly();
  readonly ticket = this.ticketSignal.asReadonly();
  readonly loadingTicket = this.loadingTicketSignal.asReadonly();
  readonly errorMessage = this.errorMessageSignal.asReadonly();
  readonly logoUrl = this.logoUrlSignal.asReadonly();
  readonly branchBranding = this.branchBrandingSignal.asReadonly();
  readonly advertisements = this.advertisementsSignal.asReadonly();
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

  readonly availableSubSpecialties = computed(() => this.selectedSpecialty()?.subSpecialties ?? []);

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
      status: index < currentIndex ? 'completed' : index === currentIndex ? 'active' : 'pending',
    }));
  });

  private loadServicesSubscription: Subscription | null = null;
  private currentBranchId: number | null = null;

  constructor() {
    interval(REFRESH_INTERVAL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadServices(this.currentBranchId ?? undefined, true);
      });
  }

  loadServices(branchId?: number, silent = false): void {
    if (branchId !== undefined) {
      this.currentBranchId = branchId;
    }
    const targetBranchId =
      this.currentBranchId ?? this.authSessionService.activeSession()?.activeBranchId ?? 1;

    // Cancel any previous in-flight branch loading request to prevent race conditions
    if (this.loadServicesSubscription) {
      this.loadServicesSubscription.unsubscribe();
      this.loadServicesSubscription = null;
    }

    if (!silent) {
      this.loadingServicesSignal.set(true);
      this.errorLoadingServicesSignal.set(false);
    }

    this.loadServicesSubscription = this.serviceRequestService
      .loadBranchServices(targetBranchId)
      .pipe(
        finalize(() => {
          if (!silent) {
            this.loadingServicesSignal.set(false);
          }
          this.loadServicesSubscription = null;
        }),
      )
      .subscribe({
        next: (data) => {
          this.serviceTypesSignal.set(data.serviceTypes);
          this.specialtiesMapSignal.set(data.specialtiesMap);
          this.logoUrlSignal.set(data.logoUrl);
          this.branchBrandingSignal.set(data.branchBranding);
          this.advertisementsSignal.set(data.advertisements ?? []);

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
    this.errorMessageSignal.set(null);
  }

  selectSpecialty(specialty: Specialty): void {
    this.selectedSpecialtySignal.set(specialty);
    this.selectedSubSpecialtySignal.set(null);
    this.ticketSignal.set(null);
    this.errorMessageSignal.set(null);
  }

  selectSubSpecialty(specialty: Specialty): void {
    this.selectedSubSpecialtySignal.set(specialty);
    this.ticketSignal.set(null);
    this.errorMessageSignal.set(null);
  }

  setFlowChoice(choice: 'reservation' | 'direct' | null): void {
    this.kioskFlowChoiceSignal.set(choice);
    this.reservationSearchResultsSignal.set([]);
    this.searchAttemptedSignal.set(false);
    this.selectedReservationSignal.set(null);
    this.errorMessageSignal.set(null);
  }

  clearReservationSearch(): void {
    this.reservationSearchResultsSignal.set([]);
    this.searchAttemptedSignal.set(false);
    this.selectedReservationSignal.set(null);
    this.errorMessageSignal.set(null);
  }

  searchReservations(
    customInputData?: Record<string, string | number>,
    fieldData?: string,
  ): Observable<readonly KioskReservationSearchItemResponse[]> | null {
    const selection = this.createSelection();
    if (!selection) {
      return null;
    }

    const targetNode = selection.subSpecialty ?? selection.specialty ?? selection.serviceType;
    const targetBranchId =
      this.currentBranchId ?? this.authSessionService.activeSession()?.activeBranchId ?? 1;
    const serviceId = Number(targetNode.id);

    const customInputs: KioskCustomInputValue[] = [];
    if (customInputData) {
      for (const [key, val] of Object.entries(customInputData)) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const matchingInput = targetNode.customInputs?.find(
            (ci) => ci.name === key || String(ci.customInputId) === key || String(ci.order) === key,
          );
          const inputId =
            (matchingInput?.customInputId ?? matchingInput?.order ?? Number(key)) || 1;
          customInputs.push({
            serviceCustomInputId: inputId,
            value: String(val).trim(),
          });
        }
      }
    }

    const hasCustomInputs = (targetNode.customInputs?.length ?? 0) > 0;
    const request: SearchKioskReservationRequest = {
      serviceId,
      field: !hasCustomInputs && fieldData ? fieldData.trim() : null,
      customInputs: hasCustomInputs ? customInputs : [],
    };

    this.searchingReservationsSignal.set(true);
    this.errorMessageSignal.set(null);

    return this.kioskApiService.searchReservations(targetBranchId, request).pipe(
      tap((results) => {
        this.reservationSearchResultsSignal.set(results ?? []);
        this.searchAttemptedSignal.set(true);
        this.errorMessageSignal.set(null);
      }),
      catchError((err: unknown) => {
        console.error('Failed to search reservations from API:', err);
        this.reservationSearchResultsSignal.set([]);
        this.searchAttemptedSignal.set(true);
        this.errorMessageSignal.set(this.formatErrorMessage(err));
        return throwError(() => err);
      }),
      finalize(() => this.searchingReservationsSignal.set(false)),
    );
  }

  convertReservationToTicket(
    reservation: KioskReservationSearchItemResponse,
  ): Observable<QueueTicket> | null {
    const selection = this.createSelection();
    if (!selection) {
      return null;
    }

    const targetBranchId = this.authSessionService.activeSession()?.activeBranchId ?? 1;

    this.convertingReservationSignal.set(true);
    this.loadingTicketSignal.set(true);
    this.ticketSignal.set(null);
    this.errorMessageSignal.set(null);
    this.selectedReservationSignal.set(reservation);

    return this.kioskApiService
      .convertReservationToTicket(targetBranchId, reservation.reservationId)
      .pipe(
        map((response) => this.mapKioskTicketToQueueTicket(response, selection)),
        tap((ticket) => {
          this.ticketSignal.set(ticket);
          this.errorMessageSignal.set(null);
        }),
        catchError((err: unknown) => {
          console.error('Failed to convert reservation to ticket:', err);
          this.ticketSignal.set(null);
          this.errorMessageSignal.set(this.formatErrorMessage(err));
          return throwError(() => err);
        }),
        finalize(() => {
          this.convertingReservationSignal.set(false);
          this.loadingTicketSignal.set(false);
        }),
      );
  }

  generateTicket(
    customInputData?: Record<string, string | number>,
    fieldData?: string,
  ): Observable<QueueTicket> | null {
    const selection = this.createSelection();

    if (!selection) {
      return null;
    }

    const targetNode = selection.subSpecialty ?? selection.specialty ?? selection.serviceType;
    const targetBranchId =
      this.currentBranchId ?? this.authSessionService.activeSession()?.activeBranchId ?? 1;
    const serviceId = Number(targetNode.id);

    const customInputs: KioskCustomInputValue[] = [];
    if (customInputData) {
      for (const [key, val] of Object.entries(customInputData)) {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          const matchingInput = targetNode.customInputs?.find(
            (ci) => ci.name === key || String(ci.customInputId) === key || String(ci.order) === key,
          );
          const inputId =
            (matchingInput?.customInputId ?? matchingInput?.order ?? Number(key)) || 1;
          customInputs.push({
            serviceCustomInputId: inputId,
            value: String(val).trim(),
          });
        }
      }
    }

    const hasCustomInputs = (targetNode.customInputs?.length ?? 0) > 0;
    const request: CreateKioskTicketRequest = {
      serviceId,
      segmentId: 1,
      field: !hasCustomInputs && fieldData ? fieldData.trim() : null,
      customInputs: hasCustomInputs && customInputs.length > 0 ? customInputs : [],
    };

    this.loadingTicketSignal.set(true);
    this.ticketSignal.set(null);
    this.errorMessageSignal.set(null);

    return this.kioskApiService.createTicket(targetBranchId, request).pipe(
      map((response) => this.mapKioskTicketToQueueTicket(response, selection)),
      tap((ticket) => {
        this.ticketSignal.set(ticket);
        this.errorMessageSignal.set(null);
      }),
      catchError((err: unknown) => {
        console.error('Failed to issue kiosk ticket from API:', err);
        this.ticketSignal.set(null);
        this.errorMessageSignal.set(this.formatErrorMessage(err));
        return throwError(() => err);
      }),
      finalize(() => this.loadingTicketSignal.set(false)),
    );
  }

  goBack(): void {
    const currentStep = this.currentStep();

    if (currentStep === ServiceRequestStep.Ticket) {
      this.ticketSignal.set(null);
      this.errorMessageSignal.set(null);
      return;
    }

    if (this.reservationSearchResultsSignal().length > 0 || this.searchAttemptedSignal()) {
      this.clearReservationSearch();
      return;
    }

    if (this.kioskFlowChoiceSignal() !== null) {
      this.kioskFlowChoiceSignal.set(null);
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
    this.kioskFlowChoiceSignal.set(null);
    this.reservationSearchResultsSignal.set([]);
    this.searchingReservationsSignal.set(false);
    this.searchAttemptedSignal.set(false);
    this.selectedReservationSignal.set(null);
    this.convertingReservationSignal.set(false);
    this.ticketSignal.set(null);
    this.errorMessageSignal.set(null);
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

  private mapKioskTicketToQueueTicket(
    response: KioskTicketResponse,
    selection: ServiceRequestSelection,
  ): QueueTicket {
    const issuedAtIso = response.currentQueueEnteredOnUtc || new Date().toISOString();
    const estimatedWaitingMinutes =
      response.estimatedWaitMinutes ?? this.calculateEstimatedWaiting(selection);
    const counterHint = this.resolveCounterHint(selection);

    return {
      id: String(response.id),
      ticketNumber: response.ticketNumber,
      serviceTypeName: {
        ar: response.serviceNameAr || selection.serviceType.name.ar,
        en: response.serviceNameEn || selection.serviceType.name.en,
      },
      departmentName: selection.specialty?.name ?? null,
      subSpecialtyName: selection.subSpecialty?.name ?? null,
      issuedAtIso,
      estimatedWaitingMinutes,
      counterHint,
      print: response.print ?? null,
      qrPayload: JSON.stringify({
        id: response.id,
        ticketNumber: response.ticketNumber,
        branchId: response.branchId,
        serviceId: response.serviceId,
        issuedAt: issuedAtIso,
      }),
    };
  }

  private calculateEstimatedWaiting(selection: ServiceRequestSelection): number {
    return (
      selection.serviceType.estimatedWaitingMinutes +
      (selection.specialty?.estimatedWaitingMinutes ?? 0) +
      (selection.subSpecialty?.estimatedWaitingMinutes ?? 0)
    );
  }

  private resolveCounterHint(selection: ServiceRequestSelection): QueueTicket['counterHint'] {
    if (selection.serviceType.id === 'emergency') {
      return {
        ar: 'مسار الطوارئ',
        en: 'Emergency lane',
      };
    }

    if (selection.serviceType.id === 'laboratory') {
      return {
        ar: 'منطقة المعمل',
        en: 'Laboratory area',
      };
    }

    if (selection.serviceType.id === 'radiology-service') {
      return {
        ar: 'منطقة الأشعة',
        en: 'Radiology area',
      };
    }

    return {
      ar: 'منطقة الاستقبال',
      en: 'Reception area',
    };
  }

  private formatErrorMessage(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'error' in error) {
      const errObj = (error as { error: any }).error;
      if (typeof errObj === 'string') return errObj;
      if (errObj && typeof errObj === 'object') {
        if (errObj.detail) return errObj.detail;
        if (errObj.title) return errObj.title;
        if (Array.isArray(errObj.errors) && errObj.errors.length > 0) {
          return errObj.errors[0]?.message || errObj.errors[0]?.code || 'Error issuing ticket';
        }
      }
    }
    return this.language() === 'ar'
      ? 'تعذر إصدار التذكرة، يرجى المحاولة مرة أخرى.'
      : 'Unable to issue ticket. Please try again.';
  }
}
