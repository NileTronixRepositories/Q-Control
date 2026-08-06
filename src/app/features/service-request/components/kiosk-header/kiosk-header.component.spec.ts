import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SERVICE_REQUEST_LANGUAGES } from '../../models/language.model';
import { KioskHeaderComponent } from './kiosk-header.component';

describe('KioskHeaderComponent', () => {
  let fixture: ComponentFixture<KioskHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KioskHeaderComponent] }).compileComponents();
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
    expect(fixture.nativeElement.textContent).toContain('Ticket service');
    expect(fixture.nativeElement.textContent).toContain('Choose your service');
    expect(fixture.nativeElement.querySelector('.kiosk-header__nile-logo')).not.toBeNull();
  });
});
