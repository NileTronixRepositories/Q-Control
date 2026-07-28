import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SegmentFormModalComponent } from './segment-form-modal.component';
import { SEGMENT_TRANSLATIONS_EN } from '../../i18n/segment.translations';

describe('SegmentFormModalComponent', () => {
  let component: SegmentFormModalComponent;
  let fixture: ComponentFixture<SegmentFormModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentFormModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentFormModalComponent);
    component = fixture.componentInstance;
    component.translations = SEGMENT_TRANSLATIONS_EN;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('validates empty arabic and english names before emitting', () => {
    component.open = true;
    component.onSubmit();
    expect(component.errorMessage()).toContain('required');
  });

  it('emits payload on valid form submission', () => {
    vi.spyOn(component.submitted, 'emit');
    component.open = true;
    component.arabicName.set('كشف');
    component.englishName.set('Examination');
    component.priority.set(5);

    component.onSubmit();
    expect(component.submitted.emit).toHaveBeenCalledWith({
      arabicName: 'كشف',
      englishName: 'Examination',
      priority: 5,
    });
  });
});
