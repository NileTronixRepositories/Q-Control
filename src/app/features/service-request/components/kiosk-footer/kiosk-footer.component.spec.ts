import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceRequestStore } from '../../store/service-request.store';
import { KioskFooterComponent } from './kiosk-footer.component';

describe('KioskFooterComponent', () => {
  let fixture: ComponentFixture<KioskFooterComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [KioskFooterComponent],
      providers: [
        {
          provide: ServiceRequestStore,
          useValue: {
            footerButton: signal(null),
            theme: signal(null),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(KioskFooterComponent);
    fixture.componentRef.setInput('caption', 'Choose a service');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders the supplied caption', () => {
    expect(fixture.nativeElement.textContent).toContain('Choose a service');
  });
});
