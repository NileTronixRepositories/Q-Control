import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KioskFooterComponent } from './kiosk-footer.component';

describe('KioskFooterComponent', () => {
  let fixture: ComponentFixture<KioskFooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KioskFooterComponent] }).compileComponents();
    fixture = TestBed.createComponent(KioskFooterComponent);
    fixture.componentRef.setInput('caption', 'Choose a service');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders the supplied caption', () => {
    expect(fixture.nativeElement.textContent).toContain('Choose a service');
  });
});
