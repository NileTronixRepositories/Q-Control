import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NiletronixLoadingStateComponent } from './niletronix-loading-state.component';

describe('NiletronixLoadingStateComponent', () => {
  let fixture: ComponentFixture<NiletronixLoadingStateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NiletronixLoadingStateComponent] }).compileComponents();
    fixture = TestBed.createComponent(NiletronixLoadingStateComponent);
    fixture.detectChanges();
  });

  it('renders the default loading title', () => {
    expect(fixture.nativeElement.textContent).toContain('Loading...');
  });

  it('renders custom copy and icon', () => {
    fixture.componentRef.setInput('title', 'Loading services');
    fixture.componentRef.setInput('description', 'Preparing workspace');
    fixture.componentRef.setInput('icon', 'bi bi-stars');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Loading services');
    expect(fixture.nativeElement.textContent).toContain('Preparing workspace');
    expect(fixture.nativeElement.querySelector('.bi-stars')).toBeTruthy();
  });

  it('exposes an accessible status region', () => {
    const state = fixture.nativeElement.querySelector('.nt-loading-state') as HTMLElement;

    expect(state.getAttribute('role')).toBe('status');
    expect(state.getAttribute('aria-live')).toBe('polite');
    expect(state.getAttribute('aria-atomic')).toBe('true');
  });

  it('applies variant and size classes', () => {
    fixture.componentRef.setInput('variant', 'inline');
    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    const state = fixture.nativeElement.querySelector('.nt-loading-state') as HTMLElement;
    expect(state.classList.contains('nt-loading-state--inline')).toBe(true);
    expect(state.classList.contains('nt-loading-state--sm')).toBe(true);
  });
});