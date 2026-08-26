import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { BranchServiceLifecycleConfirmState } from '../../models/branch-services/branch-services.model';
import { BranchServiceLifecycleDialogComponent } from './branch-service-lifecycle-dialog.component';

const deleteState: BranchServiceLifecycleConfirmState = {
  action: 'delete',
  branchId: 4,
  serviceId: 12,
  rowVersion: 'v1',
  serviceName: 'Payments',
  hasChildren: true,
};

describe('BranchServiceLifecycleDialogComponent', () => {
  let fixture: ComponentFixture<BranchServiceLifecycleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BranchServiceLifecycleDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(BranchServiceLifecycleDialogComponent);
    fixture.componentRef.setInput('state', deleteState);
    fixture.componentRef.setInput('translations', BRANCH_SERVICES_TRANSLATIONS.en);
    fixture.componentRef.setInput('serviceTranslations', SERVICE_MANAGEMENT_TRANSLATIONS.en);
    fixture.componentRef.setInput('mutating', false);
    fixture.detectChanges();
  });

  it('shows delete context and emits confirmation', () => {
    const confirmed = vi.fn<() => void>();
    fixture.componentInstance.confirmed.subscribe(confirmed);

    expect(fixture.nativeElement.textContent).toContain('Payments');
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.lifecycleDeleteParentWarning);
    const buttons = fixture.nativeElement.querySelectorAll('footer button') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();

    expect(confirmed).toHaveBeenCalledOnce();
  });

  it('blocks close and confirm events while mutation is running', () => {
    const closed = vi.fn<() => void>();
    const confirmed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.componentRef.setInput('mutating', true);
    fixture.detectChanges();

    fixture.componentInstance.requestClose();
    fixture.componentInstance.requestConfirm();

    expect(closed).not.toHaveBeenCalled();
    expect(confirmed).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.lifecycleDeleting);
  });
});
