import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionCardViewModel } from '../../shared/selection-card-view.model';
import { ServiceRequestStore } from '../../store/service-request.store';
import { SpecialtyCardComponent } from './specialty-card.component';

describe('SpecialtyCardComponent', () => {
  let fixture: ComponentFixture<SpecialtyCardComponent>;
  const card: SelectionCardViewModel = {
    id: 'cardiology',
    title: 'Cardiology',
    description: 'Heart services',
    icon: 'bi-heart',
    tone: 'red',
    meta: '15 minutes',
  };

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SpecialtyCardComponent],
      providers: [
        {
          provide: ServiceRequestStore,
          useValue: {
            serviceButtonStyle: signal({}),
            serviceButton: signal(null),
            theme: signal(null),
            language: signal('en'),
            direction: signal('ltr'),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(SpecialtyCardComponent);
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders specialty data and emits its id when selected', () => {
    const emitted = vi.fn();
    fixture.componentInstance.selected.subscribe(emitted);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.className).toContain('tone-red');
    expect(button.textContent).toContain('Cardiology');
    button.click();
    expect(emitted).toHaveBeenCalledWith('cardiology');
  });
});
