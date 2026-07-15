import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { ServiceTreeNode } from '../../models/service-management.model';
import { ServiceHierarchyTreeComponent } from '../service-hierarchy-tree/service-hierarchy-tree.component';
import { AssignBranchServicesDialogComponent } from './assign-branch-services-dialog.component';

const leaf: ServiceTreeNode = {
  id: 17,
  parentServiceId: null,
  scope: 'Global',
  ownerBranchId: null,
  ownerBranchArabicName: null,
  ownerBranchEnglishName: null,
  isOwnedByCurrentBranch: false,
  isAssignedToCurrentBranch: false,
  canEditDefinition: true,
  arabicName: 'خدمة',
  englishName: 'Service',
  isActive: true,
  effectiveIsActive: true,
  isTicketIssuable: true,
  hasChildren: false,
  canIssueTicket: true,
  isDeleted: false,
  orderNo: 1,
  children: [],
};

describe('AssignBranchServicesDialogComponent', () => {
  let fixture: ComponentFixture<AssignBranchServicesDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AssignBranchServicesDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(AssignBranchServicesDialogComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('nodes', [leaf]);
    fixture.componentRef.setInput('expandedNodeIds', new Set<number>());
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('assigning', false);
    fixture.componentRef.setInput('translations', BRANCH_SERVICES_TRANSLATIONS.en);
    fixture.componentRef.setInput('serviceTranslations', SERVICE_MANAGEMENT_TRANSLATIONS.en);
    fixture.componentRef.setInput('language', 'en');
    fixture.detectChanges();
  });

  it('enables assignment after selecting a leaf and emits its id', () => {
    const assigned = vi.fn<(ids: readonly number[]) => void>();
    fixture.componentInstance.assigned.subscribe(assigned);

    const tree = fixture.debugElement.query(By.directive(ServiceHierarchyTreeComponent))
      .componentInstance as ServiceHierarchyTreeComponent;
    tree.leafSelectionChange.emit({ node: leaf, selected: true });
    fixture.detectChanges();

    const assignButton = fixture.nativeElement.querySelector('.branch-services-primary-btn') as HTMLButtonElement;
    expect(assignButton.disabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('1');
    assignButton.click();

    expect(assigned).toHaveBeenCalledWith([17]);
  });

  it('clears the selection when the dialog closes', () => {
    const closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(closed);
    const tree = fixture.debugElement.query(By.directive(ServiceHierarchyTreeComponent))
      .componentInstance as ServiceHierarchyTreeComponent;
    tree.leafSelectionChange.emit({ node: leaf, selected: true });

    (fixture.nativeElement.querySelector('.branch-services-secondary-btn') as HTMLButtonElement).click();

    expect(closed).toHaveBeenCalledOnce();
    expect(fixture.componentInstance.selectedCount()).toBe(0);
  });
});
