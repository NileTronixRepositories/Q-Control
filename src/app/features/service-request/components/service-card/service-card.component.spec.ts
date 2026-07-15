import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionCardViewModel } from '../../shared/selection-card-view.model';
import { ServiceCardComponent } from './service-card.component';

describe('ServiceCardComponent', () => {
  let fixture: ComponentFixture<ServiceCardComponent>;
  const card: SelectionCardViewModel = {
    id: 'regular',
    title: 'Regular service',
    description: 'Standard queue service',
    icon: 'bi-person',
    tone: 'blue',
    meta: '10 minutes',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ServiceCardComponent] }).compileComponents();
    fixture = TestBed.createComponent(ServiceCardComponent);
    fixture.componentRef.setInput('card', card);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('renders card data and emits its id when selected', () => {
    const emitted = vi.fn();
    fixture.componentInstance.selected.subscribe(emitted);
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(button.className).toContain('tone-blue');
    expect(button.textContent).toContain('Regular service');
    button.click();
    expect(emitted).toHaveBeenCalledWith('regular');
  });
});
