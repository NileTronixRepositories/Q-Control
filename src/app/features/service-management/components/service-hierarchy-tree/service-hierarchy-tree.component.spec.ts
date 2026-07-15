import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { ServiceTreeNode } from '../../models/service-management.model';
import { ServiceHierarchyTreeComponent } from './service-hierarchy-tree.component';

describe('ServiceHierarchyTreeComponent', () => {
  let fixture: ComponentFixture<ServiceHierarchyTreeComponent>;
  let component: ServiceHierarchyTreeComponent;
  let parent: ServiceTreeNode;
  let leaf: ServiceTreeNode;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceHierarchyTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceHierarchyTreeComponent);
    component = fixture.componentInstance;
    leaf = createNode(2);
    parent = createNode(1, [leaf]);

    fixture.componentRef.setInput('nodes', [parent]);
    fixture.componentRef.setInput('expandedNodeIds', new Set([parent.id]));
    fixture.componentRef.setInput('selectedServiceId', null);
    fixture.componentRef.setInput('translations', SERVICE_MANAGEMENT_TRANSLATIONS.en);
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('direction', 'ltr');
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('includeInactive', false);
    fixture.componentRef.setInput('includeDeleted', false);
    fixture.componentRef.setInput('canCreate', false);
    fixture.componentRef.setInput('canViewDetails', false);
    fixture.componentRef.setInput('canUpdate', false);
    fixture.componentRef.setInput('canDelete', false);
    fixture.componentRef.setInput('canRestore', false);
    fixture.componentRef.setInput('canUnassign', true);
    fixture.componentRef.setInput('unassignLabel', 'Unassign');
    fixture.detectChanges();
  });

  it('shows the action only for a real leaf and emits that leaf', () => {
    const emitted: ServiceTreeNode[] = [];
    component.unassignNode.subscribe((node) => emitted.push(node));
    const buttons = fixture.nativeElement.querySelectorAll(
      'button[aria-label="Unassign"]',
    ) as NodeListOf<HTMLButtonElement>;

    expect(buttons.length).toBe(1);
    buttons[0].click();
    expect(emitted).toEqual([leaf]);
  });

  it('hides the action when unassignment is not permitted', () => {
    fixture.componentRef.setInput('canUnassign', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('button[aria-label="Unassign"]')).toBeNull();
  });

  it('separates Global unassignment from owned BranchScoped lifecycle actions', () => {
    const ownedChild = createNode(11, [], {
      scope: 'BranchScoped',
      ownerBranchId: 5,
      isOwnedByCurrentBranch: true,
    });
    const ownedParent = createNode(10, [ownedChild], {
      scope: 'BranchScoped',
      ownerBranchId: 5,
      isOwnedByCurrentBranch: true,
    });
    const deletedOwned = createNode(20, [], {
      scope: 'BranchScoped',
      ownerBranchId: 5,
      isOwnedByCurrentBranch: true,
      isDeleted: true,
      isActive: false,
      effectiveIsActive: false,
    });
    const foreignBranchService = createNode(30, [], {
      scope: 'BranchScoped',
      ownerBranchId: 9,
      isOwnedByCurrentBranch: false,
    });
    const globalLeaf = createNode(40);
    const isOwnedBranchService = (node: ServiceTreeNode): boolean =>
      node.scope === 'BranchScoped' && node.isOwnedByCurrentBranch;

    fixture.componentRef.setInput('nodes', [
      ownedParent,
      deletedOwned,
      foreignBranchService,
      globalLeaf,
    ]);
    fixture.componentRef.setInput('expandedNodeIds', new Set([ownedParent.id]));
    fixture.componentRef.setInput('canDelete', true);
    fixture.componentRef.setInput('canRestore', true);
    fixture.componentRef.setInput('canDeleteNode', isOwnedBranchService);
    fixture.componentRef.setInput('canRestoreNode', isOwnedBranchService);
    fixture.componentRef.setInput(
      'canUnassignNode',
      (node: ServiceTreeNode) => node.scope === 'Global',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('button[aria-label="Delete"]').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('button[aria-label="Restore"]').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('button[aria-label="Unassign"]').length).toBe(1);
  });

  it('disables lifecycle actions while a request is in progress', () => {
    fixture.componentRef.setInput('canDelete', true);
    fixture.componentRef.setInput('actionsDisabled', true);
    fixture.detectChanges();

    const deleteButton = fixture.nativeElement.querySelector(
      'button[aria-label="Delete"]',
    ) as HTMLButtonElement;
    expect(deleteButton.disabled).toBe(true);
  });

  it('renders an accessible tree skeleton during the initial load', () => {
    fixture.componentRef.setInput('nodes', []);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.svc-tree-panel') as HTMLElement;
    const loadingState = fixture.nativeElement.querySelector(
      '[data-testid="svc-tree-initial-loading"]',
    ) as HTMLElement;
    const skeletonRows = fixture.nativeElement.querySelectorAll(
      '[data-testid="svc-tree-skeleton-row"]',
    );

    expect(panel.getAttribute('aria-busy')).toBe('true');
    expect(loadingState.getAttribute('role')).toBe('status');
    expect(loadingState.getAttribute('aria-live')).toBe('polite');
    expect(loadingState.textContent).toContain(SERVICE_MANAGEMENT_TRANSLATIONS.en.loading);
    expect(skeletonRows.length).toBe(5);
    expect(fixture.nativeElement.querySelector('.svc-tree-empty')).toBeNull();
  });

  it('keeps the current tree visible behind the compact refresh indicator', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="svc-tree-refresh-loading"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="svc-tree-initial-loading"]'),
    ).toBeNull();
    expect(fixture.nativeElement.querySelector('.svc-tree-list')).not.toBeNull();
  });

  it('removes all loading indicators when loading completes', () => {
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.svc-tree-panel') as HTMLElement;

    expect(panel.getAttribute('aria-busy')).toBe('false');
    expect(
      fixture.nativeElement.querySelector('[data-testid="svc-tree-initial-loading"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="svc-tree-refresh-loading"]'),
    ).toBeNull();
  });

  it('uses logical indentation so skeleton levels follow both LTR and RTL direction', () => {
    fixture.componentRef.setInput('nodes', []);
    fixture.componentRef.setInput('loading', true);
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll(
      '[data-testid="svc-tree-skeleton-row"]',
    ) as NodeListOf<HTMLElement>;

    expect(rows[1].style.marginInlineStart).toBe('22px');
    expect(rows[2].style.marginInlineStart).toBe('44px');
  });

  it('emits the optional workflow action only for eligible nodes', () => {
    const emitted: ServiceTreeNode[] = [];
    component.manageWorkflows.subscribe((node) => emitted.push(node));
    fixture.componentRef.setInput('canManageWorkflows', true);
    fixture.componentRef.setInput(
      'canManageWorkflowNode',
      (node: ServiceTreeNode) => node.id === leaf.id,
    );
    fixture.componentRef.setInput('manageWorkflowsLabel', 'Manage workflows');
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button[aria-label="Manage workflows"]',
    ) as HTMLButtonElement;

    expect(button).not.toBeNull();
    button.click();
    expect(emitted).toEqual([leaf]);
  });
});

function createNode(
  id: number,
  children: readonly ServiceTreeNode[] = [],
  overrides: Partial<ServiceTreeNode> = {},
): ServiceTreeNode {
  return {
    id,
    parentServiceId: id === 1 ? null : 1,
    scope: 'Global',
    ownerBranchId: null,
    ownerBranchArabicName: null,
    ownerBranchEnglishName: null,
    isOwnedByCurrentBranch: false,
    isAssignedToCurrentBranch: true,
    canEditDefinition: false,
    arabicName: `خدمة ${id}`,
    englishName: `Service ${id}`,
    isActive: true,
    effectiveIsActive: true,
    isTicketIssuable: children.length === 0,
    hasChildren: children.length > 0,
    canIssueTicket: children.length === 0,
    isDeleted: false,
    orderNo: id,
    children,
    ...overrides,
  };
}
