import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeafServiceSegmentsDrawerComponent } from './leaf-service-segments-drawer.component';
import { SEGMENT_TRANSLATIONS_EN } from '../../i18n/segment.translations';

describe('LeafServiceSegmentsDrawerComponent', () => {
  let component: LeafServiceSegmentsDrawerComponent;
  let fixture: ComponentFixture<LeafServiceSegmentsDrawerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeafServiceSegmentsDrawerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LeafServiceSegmentsDrawerComponent);
    component = fixture.componentInstance;
    component.translations = SEGMENT_TRANSLATIONS_EN;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('formats service range correctly', () => {
    component.responseData = {
      branchId: 7,
      leafServiceId: 20,
      rangePrefix: 'R',
      rangeStartNumber: 1,
      rangeEndNumber: 100,
      capacity: 100,
      allocatedNonDefaultQuota: 70,
      remainingQuota: 30,
      segments: [],
      message: null,
    };
    expect(component.formattedRange).toBe('R-001 → R-100');
  });

  it('renders cannot issue ticket state when canIssueTicket is false', () => {
    component.open = true;
    component.canIssueTicket = false;
    component.responseData = null;
    component.loading = false;
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.drawer-empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState.textContent).toContain('This Service Cannot Issue Tickets');
  });
});
