import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ServiceRequestStep } from '../../enums/service-request-step.enum';
import {
  SERVICE_REQUEST_LANGUAGES,
  SERVICE_REQUEST_TRANSLATIONS,
} from '../../models/language.model';
import { ServiceType } from '../../models/service-type.model';
import { Specialty } from '../../models/specialty.model';
import { QueueTicket } from '../../models/ticket.model';
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
            | 'ticket'
            | 'loadingTicket'
            | 'availableSpecialties'
            | 'availableSubSpecialties'
            | 'currentStep'
            | 'stepItems'
            | 'setLanguage'
            | 'selectServiceType'
            | 'selectSpecialty'
            | 'selectSubSpecialty'
            | 'generateTicket'
            | 'goBack'
            | 'restart'
            | 'resolveText'
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

    (fixture.nativeElement.querySelector('app-service-request-service-card button') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(selectServiceType).toHaveBeenCalledWith(serviceType);
    expect(fixture.nativeElement.querySelector('app-service-request-specialty-card')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Cardiology');
  });

  it('forwards language and restart actions to the store', () => {
    (fixture.nativeElement.querySelector('app-service-request-language-selector button') as HTMLButtonElement).click();
    expect(setLanguage).toHaveBeenCalledWith('ar');

    selectServiceType(serviceType);
    fixture.detectChanges();
    const restartButton = fixture.nativeElement.querySelector(
      '.service-request-actions__button--primary',
    ) as HTMLButtonElement;
    restartButton.click();

    expect(restart).toHaveBeenCalledOnce();
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
