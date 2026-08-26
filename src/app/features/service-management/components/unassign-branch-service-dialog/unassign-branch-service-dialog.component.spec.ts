import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { BranchServiceUnassignConfirmState } from '../../models/branch-services/branch-services.model';
import { UnassignBranchServiceDialogComponent } from './unassign-branch-service-dialog.component';

const state: BranchServiceUnassignConfirmState = {
  branchId: 3,
  leafServiceId: 8,
  serviceName: 'Customer Support',
};

describe('UnassignBranchServiceDialogComponent', () => {
  let fixture: ComponentFixture<UnassignBranchServiceDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [UnassignBranchServiceDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(UnassignBranchServiceDialogComponent);
    fixture.componentRef.setInput('state', state);
    fixture.componentRef.setInput('translations', BRANCH_SERVICES_TRANSLATIONS.en);
    fixture.componentRef.setInput('unassigning', false);
    fixture.detectChanges();
  });

  it('renders the selected service and emits confirmation', () => {
    const confirmed = vi.fn<() => void>();
    fixture.componentInstance.confirmed.subscribe(confirmed);

    expect(fixture.nativeElement.textContent).toContain('Customer Support');
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.unassignPreserveDefinition);
    const buttons = fixture.nativeElement.querySelectorAll('footer button') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();

    expect(confirmed).toHaveBeenCalledOnce();
  });

  it('prevents closing while unassignment is in progress', () => {
    const closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentRef.setInput('unassigning', true);
    fixture.detectChanges();

    fixture.componentInstance.requestClose();

    expect(closed).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.unassigning);
  });
});
