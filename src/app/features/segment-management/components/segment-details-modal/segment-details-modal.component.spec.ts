import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SegmentDetailsModalComponent } from './segment-details-modal.component';
import { SEGMENT_TRANSLATIONS_EN } from '../../i18n/segment.translations';

describe('SegmentDetailsModalComponent', () => {
  let component: SegmentDetailsModalComponent;
  let fixture: ComponentFixture<SegmentDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SegmentDetailsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SegmentDetailsModalComponent);
    component = fixture.componentInstance;
    component.translations = SEGMENT_TRANSLATIONS_EN;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('emits openRequest event when pending request button is clicked', () => {
    vi.spyOn(component.openRequest, 'emit');
    component.onOpenRequest(123);
    expect(component.openRequest.emit).toHaveBeenCalledWith(123);
  });
});
