import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { SERVICE_REQUEST_LANGUAGES } from '../../models/language.model';
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
});
