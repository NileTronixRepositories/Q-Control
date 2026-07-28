import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AssignAvailableSegmentsModalComponent } from './assign-available-segments-modal.component';
import { SEGMENT_TRANSLATIONS_EN } from '../../i18n/segment.translations';

describe('AssignAvailableSegmentsModalComponent', () => {
  let component: AssignAvailableSegmentsModalComponent;
  let fixture: ComponentFixture<AssignAvailableSegmentsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignAvailableSegmentsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AssignAvailableSegmentsModalComponent);
    component = fixture.componentInstance;
    component.translations = SEGMENT_TRANSLATIONS_EN;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('detects quota exceeding remaining capacity', () => {
    component.remainingQuota = 30;
    component.availableItems = [
      { segmentId: 1, arabicName: 'كشف', englishName: 'Exam', scope: 'Global', ownerBranchId: null, priority: 3 },
    ];
    component.ngOnChanges();

    component.toggleSelect(0);
    component.onQuotaChange(0, 50);

    expect(component.validateQuotas()).toBe(false);
    expect(component.validationError()).toBeTruthy();
  });
});
