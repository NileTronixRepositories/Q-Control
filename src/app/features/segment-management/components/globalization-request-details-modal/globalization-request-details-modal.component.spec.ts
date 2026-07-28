import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { GlobalizationRequestDetailsModalComponent } from './globalization-request-details-modal.component';
import { SEGMENT_TRANSLATIONS_EN } from '../../i18n/segment.translations';

describe('GlobalizationRequestDetailsModalComponent', () => {
  let component: GlobalizationRequestDetailsModalComponent;
  let fixture: ComponentFixture<GlobalizationRequestDetailsModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalizationRequestDetailsModalComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GlobalizationRequestDetailsModalComponent);
    component = fixture.componentInstance;
    component.translations = SEGMENT_TRANSLATIONS_EN;
    fixture.detectChanges();
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('emits approved event when confirmApprove is executed', () => {
    vi.spyOn(component.approved, 'emit');
    component.request = {
      id: 10,
      status: 'Pending',
      branchId: 7,
      branchArabicName: 'فرع القاهرة',
      branchEnglishName: 'Cairo Branch',
      segmentId: 5,
      segmentArabicName: 'كشف',
      segmentEnglishName: 'Exam',
      segmentScope: 'BranchScoped',
      segmentOwnerBranchId: 7,
      segmentPriority: 3,
      requestedByApplicationUserId: 'u1',
      requestedByName: 'User 1',
      requestedOnUtc: '2026-07-28T09:00:00Z',
      reviewedByApplicationUserId: null,
      reviewedByName: null,
      reviewedOnUtc: null,
      rejectionReason: null,
      rowVersion: 'RV123',
      message: null,
    };

    component.confirmApprove();
    expect(component.approved.emit).toHaveBeenCalledWith({ requestId: 10, rowVersion: 'RV123' });
  });
});
