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
    fixture.componentRef.setInput('canPermanentDelete', false);
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
    fixture.componentRef.setInput('canPermanentDelete', true);
    fixture.componentRef.setInput('canDeleteNode', isOwnedBranchService);
    fixture.componentRef.setInput('canRestoreNode', isOwnedBranchService);
    fixture.componentRef.setInput('canPermanentDeleteNode', isOwnedBranchService);
    fixture.componentRef.setInput(
      'canUnassignNode',
      (node: ServiceTreeNode) => node.scope === 'Global',
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('button[aria-label="Delete"]').length).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('button[aria-label="Restore"]').length).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll('button[aria-label="Permanently Delete"]').length,
    ).toBe(1);
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

    const loadingState = fixture.nativeElement.querySelector(
      '[data-testid="svc-tree-refresh-loading"]',
    ) as HTMLElement;

    expect(loadingState).not.toBeNull();
    expect(loadingState.getAttribute('role')).toBe('status');
    expect(loadingState.getAttribute('aria-live')).toBe('polite');
    expect(loadingState.textContent).toContain(SERVICE_MANAGEMENT_TRANSLATIONS.en.loading);
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

    const panel = fixture.nativeElement.querySelector('.svc-tree') as HTMLElement;

    expect(panel).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="svc-tree-refresh-loading"]'),
    ).toBeNull();
  });

  it('applies the current language and direction to the component root', () => {
    const panel = fixture.nativeElement.querySelector('.svc-tree') as HTMLElement;

    expect(panel.getAttribute('dir')).toBe('ltr');
    expect(panel.getAttribute('lang')).toBe('en');

    fixture.componentRef.setInput('direction', 'rtl');
    fixture.componentRef.setInput('language', 'ar');
    fixture.detectChanges();

    expect(panel.getAttribute('dir')).toBe('rtl');
    expect(panel.getAttribute('lang')).toBe('ar');
  });

  it('mirrors the collapsed branch icon between LTR and RTL', () => {
    fixture.componentRef.setInput('expandedNodeIds', new Set<number>());
    fixture.detectChanges();

    let icon = fixture.nativeElement.querySelector('.svc-tree-toggle--enabled i') as HTMLElement;

    expect(icon.classList).toContain('bi-chevron-right');

    fixture.componentRef.setInput('direction', 'rtl');
    fixture.detectChanges();

    icon = fixture.nativeElement.querySelector('.svc-tree-toggle--enabled i') as HTMLElement;

    expect(icon.classList).toContain('bi-chevron-left');
    expect(icon.classList).not.toContain('bi-chevron-right');
  });

  it('uses logical indentation so skeleton levels follow both LTR and RTL direction', () => {
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector('.svc-tree') as HTMLElement;
    expect(panel.getAttribute('dir')).toBe('rtl');
  });

  it('renders service code only when the node has a value', () => {
    fixture.componentRef.setInput('nodes', [
      createNode(50, [], { serviceCode: ' LAB-001 ', isServiceCodeRequired: true }),
      createNode(51),
    ]);
    fixture.componentRef.setInput('expandedNodeIds', new Set<number>());
    fixture.detectChanges();

    const codeChips = fixture.nativeElement.querySelectorAll(
      '.svc-tree-code',
    ) as NodeListOf<HTMLElement>;

    expect(codeChips.length).toBe(1);
    expect(codeChips[0].textContent?.trim()).toBe('LAB-001');
    expect(fixture.nativeElement.textContent).toContain('Service 51');
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

  it('emits trimmed-length search changes and exposes the search controls', () => {
    const emitted: string[] = [];
    component.searchTextChange.subscribe((value) => emitted.push(value));
    fixture.componentRef.setInput('showSearch', true);
    fixture.componentRef.setInput('searchLabel', 'Find services');
    fixture.componentRef.setInput('searchPlaceholder', 'Search services');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('.svc-tree-search-input') as HTMLInputElement;

    expect(input.id).toMatch(/^svc-tree-search-/);
    expect(fixture.nativeElement.querySelectorAll('.svc-tree-search-clear').length).toBe(0);

    input.value = 'x'.repeat(205);
    input.dispatchEvent(new Event('input'));

    expect(emitted).toEqual(['x'.repeat(200)]);
  });

  it('renders accessible switches and emits their updated filter values', () => {
    const inactiveValues: boolean[] = [];
    const deletedValues: boolean[] = [];
    component.includeInactiveChange.subscribe((value) => inactiveValues.push(value));
    component.includeDeletedChange.subscribe((value) => deletedValues.push(value));

    fixture.componentRef.setInput('showSearch', true);
    fixture.componentRef.setInput('includeInactive', true);
    fixture.componentRef.setInput('includeDeleted', false);
    fixture.detectChanges();

    const switches = fixture.nativeElement.querySelectorAll(
      '.svc-tree-filter-input',
    ) as NodeListOf<HTMLInputElement>;
    const filterLabels = fixture.nativeElement.querySelectorAll(
      '.svc-tree-filter',
    ) as NodeListOf<HTMLElement>;

    expect(switches.length).toBe(2);
    expect(switches[0].checked).toBe(true);
    expect(switches[1].checked).toBe(false);
    expect(filterLabels[0].classList).toContain('svc-tree-filter--active');
    expect(filterLabels[1].classList).not.toContain('svc-tree-filter--active');

    switches[0].checked = false;
    switches[0].dispatchEvent(new Event('change'));
    switches[1].checked = true;
    switches[1].dispatchEvent(new Event('change'));

    expect(inactiveValues).toEqual([false]);
    expect(deletedValues).toEqual([true]);
  });

  it('highlights each result card only while a non-empty search has loaded results', () => {
    const resultCards = (): NodeListOf<HTMLElement> =>
      fixture.nativeElement.querySelectorAll('.svc-tree-node');

    fixture.componentRef.setInput('showSearch', true);
    fixture.componentRef.setInput('searchText', ' service ');
    fixture.detectChanges();

    expect(resultCards().length).toBe(2);
    expect(
      Array.from(resultCards()).every((card) => card.classList.contains('svc-tree-node--filtered')),
    ).toBe(true);

    fixture.componentRef.setInput('searchText', '   ');
    fixture.detectChanges();

    expect(
      Array.from(resultCards()).every(
        (card) => !card.classList.contains('svc-tree-node--filtered'),
      ),
    ).toBe(true);

    fixture.componentRef.setInput('searchText', 'service');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(
      Array.from(resultCards()).every(
        (card) => !card.classList.contains('svc-tree-node--filtered'),
      ),
    ).toBe(true);
  });
  it('clears search text and shows the search-aware empty state', () => {
    const emitted: string[] = [];
    component.searchTextChange.subscribe((value) => emitted.push(value));
    fixture.componentRef.setInput('showSearch', true);
    fixture.componentRef.setInput('nodes', []);
    fixture.componentRef.setInput('searchText', ' certificate ');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      SERVICE_MANAGEMENT_TRANSLATIONS.en.noSearchResults,
    );
    expect(fixture.nativeElement.querySelector('.svc-tree-list')).toBeNull();
    expect(fixture.nativeElement.querySelector('.svc-tree-body--filtered')).toBeNull();

    expect(fixture.nativeElement.querySelectorAll('.svc-tree-search-clear').length).toBe(1);
    const clearButton = fixture.nativeElement.querySelector(
      '.svc-tree-search-clear',
    ) as HTMLButtonElement;
    clearButton.click();

    expect(emitted).toEqual(['']);
  });

  it('toggles the node and emits selectNode when clicking anywhere on a node that has children', () => {
    const selectedNodes: ServiceTreeNode[] = [];
    const toggledNodes: ServiceTreeNode[] = [];
    component.selectNode.subscribe((node) => selectedNodes.push(node));
    component.toggleNode.subscribe((node) => toggledNodes.push(node));

    const parentNodeElement = fixture.nativeElement.querySelector(
      '.svc-tree-node[data-level="1"]',
    ) as HTMLElement;

    expect(parentNodeElement).not.toBeNull();
    parentNodeElement.click();

    expect(selectedNodes).toEqual([parent]);
    expect(toggledNodes).toEqual([parent]);
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
    arabicName: `Ø®Ø¯Ù…Ø© ${id}`,
    englishName: `Service ${id}`,
    serviceCode: null,
    isServiceCodeRequired: false,
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
