import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { of } from 'rxjs';

import { ServiceRequestStep } from '../../enums/service-request-step.enum';
import {
  SERVICE_REQUEST_LANGUAGES,
  SERVICE_REQUEST_TRANSLATIONS,
} from '../../models/language/language.model';
import { ServiceType } from '../../models/service-type/service-type.model';
import { Specialty } from '../../models/specialty/specialty.model';
import { QueueTicket } from '../../models/ticket/ticket.model';
import { ServiceRequestStore } from '../../store/service-request.store';
import { ServiceRequestHomeComponent } from './service-request-home.component';

describe('ServiceRequestHomeComponent', () => {
  let fixture: ComponentFixture<ServiceRequestHomeComponent>;
  const serviceType: ServiceType = {
    id: 'regular',
    code: 'REG',
    ticketPrefix: 'A',
    name: { ar: 'عادية', en: 'Regular service' },
    description: { ar: 'خدمة عادية', en: 'Standard queue service' },
    icon: 'bi-person',
    tone: 'blue',
    estimatedWaitingMinutes: 10,
    specialtyIds: ['cardiology'],
  };
  const specialty: Specialty = {
    id: 'cardiology',
    code: 'CARD',
    name: { ar: 'القلب', en: 'Cardiology' },
    description: { ar: 'خدمات القلب', en: 'Heart services' },
    icon: 'bi-heart',
    tone: 'red',
    estimatedWaitingMinutes: 15,
    subSpecialties: [
      {
        id: 'adult-cardio',
        code: 'ADULT',
        name: { ar: 'قلب بالغين', en: 'Adult cardiology' },
        description: { ar: 'بالغين', en: 'Adult services' },
        icon: 'bi-heart-pulse',
        tone: 'red',
        estimatedWaitingMinutes: 20,
        subSpecialties: [],
      },
    ],
  };
  const currentStep = signal<ServiceRequestStep>(ServiceRequestStep.ServiceType);
  const selectedServiceType = signal<ServiceType | null>(null);
  const ticket = signal<QueueTicket | null>(null);
  const loadingTicket = signal(false);
  const selectServiceType = vi.fn<ServiceRequestStore['selectServiceType']>((selected) => {
    selectedServiceType.set(selected);
    currentStep.set(ServiceRequestStep.Specialty);
  });
  const restart = vi.fn<ServiceRequestStore['restart']>(() => {
    selectedServiceType.set(null);
    currentStep.set(ServiceRequestStep.ServiceType);
  });
  const setLanguage = vi.fn<ServiceRequestStore['setLanguage']>();

  beforeEach(async () => {
    vi.clearAllMocks();
    currentStep.set(ServiceRequestStep.ServiceType);
    selectedServiceType.set(null);
    ticket.set(null);
    loadingTicket.set(false);

    await TestBed.configureTestingModule({
      imports: [ServiceRequestHomeComponent],
      providers: [
        {
          provide: ServiceRequestStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
            languages: SERVICE_REQUEST_LANGUAGES,
            translations: signal(SERVICE_REQUEST_TRANSLATIONS.en).asReadonly(),
            serviceTypes: signal<readonly ServiceType[]>([serviceType]).asReadonly(),
            selectedServiceType: selectedServiceType.asReadonly(),
            selectedSpecialty: signal<Specialty | null>(null).asReadonly(),
            selectedSubSpecialty: signal<Specialty | null>(null).asReadonly(),
            ticket: ticket.asReadonly(),
            loadingTicket: loadingTicket.asReadonly(),
            errorMessage: signal<string | null>(null).asReadonly(),
            loadingServices: signal(false).asReadonly(),
            errorLoadingServices: signal(false).asReadonly(),
            logoUrl: signal<string | null>(null).asReadonly(),
            branchBranding: signal<any>(null).asReadonly(),
            theme: signal<any>(null).asReadonly(),
            behavior: signal<any>(null).asReadonly(),
            languageButton: signal<any>(null).asReadonly(),
            serviceButton: signal<any>(null).asReadonly(),
            keypadButton: signal<any>(null).asReadonly(),
            footerButton: signal<any>(null).asReadonly(),
            kioskFlowChoice: signal<'reservation' | 'direct' | null>(null).asReadonly(),
            reservationSearchResults: signal<readonly any[]>([]).asReadonly(),
            searchingReservations: signal(false).asReadonly(),
            searchAttempted: signal(false).asReadonly(),
            selectedReservation: signal<any>(null).asReadonly(),
            convertingReservation: signal(false).asReadonly(),
            setFlowChoice: vi.fn<ServiceRequestStore['setFlowChoice']>(),
            clearReservationSearch: vi.fn<ServiceRequestStore['clearReservationSearch']>(),
            searchReservations: vi.fn<ServiceRequestStore['searchReservations']>(),
            convertReservationToTicket: vi.fn<ServiceRequestStore['convertReservationToTicket']>(),
            availableSpecialties: signal<readonly Specialty[]>([specialty]).asReadonly(),
            availableSubSpecialties: signal<readonly Specialty[]>(
              specialty.subSpecialties,
            ).asReadonly(),
            currentStep: currentStep.asReadonly(),
            stepItems: computed(() => [
              {
                id: ServiceRequestStep.ServiceType,
                label: 'Service type',
                status:
                  currentStep() === ServiceRequestStep.ServiceType
                    ? ('active' as const)
                    : ('completed' as const),
              },
              {
                id: ServiceRequestStep.Specialty,
                label: 'Department',
                status:
                  currentStep() === ServiceRequestStep.Specialty
                    ? ('active' as const)
                    : ('pending' as const),
              },
            ]),
            setLanguage,
            selectServiceType,
            selectSpecialty: vi.fn<ServiceRequestStore['selectSpecialty']>(),
            selectSubSpecialty: vi.fn<ServiceRequestStore['selectSubSpecialty']>(),
            generateTicket: vi.fn<ServiceRequestStore['generateTicket']>(() => of(createTicket())),
            goBack: vi.fn<ServiceRequestStore['goBack']>(),
            restart,
            resolveText: vi.fn<ServiceRequestStore['resolveText']>((text) => text.en),
            loadServices: vi.fn<ServiceRequestStore['loadServices']>(),
          } satisfies Pick<
            ServiceRequestStore,
            | 'language'
            | 'direction'
            | 'languages'
            | 'translations'
            | 'serviceTypes'
            | 'selectedServiceType'
            | 'selectedSpecialty'
            | 'selectedSubSpecialty'
            | 'kioskFlowChoice'
            | 'reservationSearchResults'
            | 'searchingReservations'
            | 'searchAttempted'
            | 'selectedReservation'
            | 'convertingReservation'
            | 'ticket'
            | 'loadingTicket'
            | 'errorMessage'
            | 'loadingServices'
            | 'errorLoadingServices'
            | 'logoUrl'
            | 'branchBranding'
            | 'theme'
            | 'behavior'
            | 'languageButton'
            | 'serviceButton'
            | 'keypadButton'
            | 'footerButton'
            | 'availableSpecialties'
            | 'availableSubSpecialties'
            | 'currentStep'
            | 'stepItems'
            | 'setLanguage'
            | 'selectServiceType'
            | 'selectSpecialty'
            | 'selectSubSpecialty'
            | 'setFlowChoice'
            | 'clearReservationSearch'
            | 'searchReservations'
            | 'convertReservationToTicket'
            | 'generateTicket'
            | 'goBack'
            | 'restart'
            | 'resolveText'
            | 'loadServices'
          >,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceRequestHomeComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders service cards and moves to specialties after a selection', () => {
    expect(fixture.nativeElement.textContent).toContain('Regular service');

    (
      fixture.nativeElement.querySelector(
        'app-service-request-service-card button',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(selectServiceType).toHaveBeenCalledWith(serviceType);
    expect(
      fixture.nativeElement.querySelector('app-service-request-specialty-card'),
    ).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Cardiology');
  });

  it('forwards restart actions to the store', () => {
    const component = fixture.componentInstance;
    component['restart']();

    expect(restart).toHaveBeenCalledOnce();
  });

  it('activates customer input step when leaf service has isClientInputRequired = true and hasReservation = false', () => {
    const leafServiceWithInputs: ServiceType = {
      ...serviceType,
      id: 'leaf-custom',
      isTicketIssuable: true,
      isClientInputRequired: true,
      hasReservation: false,
      specialtyIds: [],
      customInputs: [
        {
          name: 'nationalId',
          labelAr: 'الرقم القومي',
          labelEn: 'National ID',
          type: 'String',
          isRequired: true,
          order: 1,
        },
      ],
    };

    const component = fixture.componentInstance;
    (component as any).store.serviceTypes = signal([leafServiceWithInputs]).asReadonly();
    (component as any).store.availableSpecialties = signal([]).asReadonly();

    (component as any).selectServiceType('leaf-custom');
    fixture.detectChanges();

    expect(component['isCustomerInputStepActive']()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('app-service-request-customer-input-form'),
    ).not.toBeNull();
  });

  it('shows flow choice step when leaf service has reservation capability', () => {
    const leafServiceWithReservation: ServiceType = {
      ...serviceType,
      id: 'leaf-res',
      isTicketIssuable: true,
      hasReservation: true,
      specialtyIds: [],
      customInputs: [],
    };

    const component = fixture.componentInstance;
    (component as any).store.serviceTypes = signal([leafServiceWithReservation]).asReadonly();
    (component as any).store.availableSpecialties = signal([]).asReadonly();

    (component as any).selectServiceType('leaf-res');
    fixture.detectChanges();

    expect(component['isFlowChoiceStepActive']()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('app-service-request-kiosk-flow-choice'),
    ).not.toBeNull();
  });
});

function createTicket(): QueueTicket {
  return {
    id: 'ticket-1',
    ticketNumber: 'A-101',
    serviceTypeName: { ar: 'عادية', en: 'Regular' },
    departmentName: { ar: 'القلب', en: 'Cardiology' },
    subSpecialtyName: null,
    issuedAtIso: '2026-07-14T08:00:00Z',
    estimatedWaitingMinutes: 10,
    counterHint: { ar: 'الشباك 1', en: 'Counter 1' },
    qrPayload: 'ticket:A-101',
  };
}
