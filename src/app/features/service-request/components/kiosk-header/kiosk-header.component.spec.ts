import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { SERVICE_REQUEST_LANGUAGES } from '../../models/language/language.model';
import { ServiceRequestStore } from '../../store/service-request.store';
import { KioskHeaderComponent } from './kiosk-header.component';

describe('KioskHeaderComponent', () => {
  let fixture: ComponentFixture<KioskHeaderComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [KioskHeaderComponent],
      providers: [
        {
          provide: AppLanguageStore,
          useValue: {
            language: signal('en'),
            direction: signal('ltr'),
          },
        },
        {
          provide: ServiceRequestStore,
          useValue: {
            logoUrl: signal(null),
            showServiceNavigationPath: signal(false),
            stepIndicators: signal([]),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(KioskHeaderComponent);
    fixture.componentRef.setInput('logoLabel', 'Q-System');
    fixture.componentRef.setInput('title', 'Ticket service');
    fixture.componentRef.setInput('subtitle', 'Choose your service');
    fixture.componentRef.setInput('languageLabel', 'Language');
    fixture.componentRef.setInput('languages', SERVICE_REQUEST_LANGUAGES);
    fixture.componentRef.setInput('selectedLanguage', 'en');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders kiosk identity and NileTronix logo', () => {
    expect(fixture.nativeElement.querySelector('.kiosk-header__mark')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.kiosk-header__nile-logo')).not.toBeNull();
  });

  it('renders navigation path steps with proper status classes when enabled', () => {
    fixture.componentRef.setInput('showNavigationPath', true);
    fixture.componentRef.setInput('stepItems', [
      { id: 'service-type', label: 'نوع الخدمة', status: 'completed' },
      { id: 'specialty', label: 'التخصص', status: 'active' },
      { id: 'ticket', label: 'التذكرة', status: 'pending' },
    ]);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('.service-request-navigation-path');
    expect(nav).not.toBeNull();

    const steps = fixture.nativeElement.querySelectorAll('.nav-path-step');
    expect(steps.length).toBe(3);

    expect(steps[0].classList.contains('nav-path-step--completed')).toBe(true);
    expect(steps[1].classList.contains('nav-path-step--active')).toBe(true);
    expect(steps[2].classList.contains('nav-path-step--pending')).toBe(true);
  });

  it('does not render navigation path when showNavigationPath is false', () => {
    fixture.componentRef.setInput('showNavigationPath', false);
    fixture.componentRef.setInput('stepItems', [
      { id: 'service-type', label: 'Service', status: 'active' },
    ]);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('.service-request-navigation-path');
    expect(nav).toBeNull();
  });
});
