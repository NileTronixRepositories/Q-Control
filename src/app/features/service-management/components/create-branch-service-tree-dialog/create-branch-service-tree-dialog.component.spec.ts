import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { CreateBranchServiceTreeRequest } from '../../models/branch-services/branch-services.model';
import { CreateBranchServiceTreeDialogComponent } from './create-branch-service-tree-dialog.component';

describe('CreateBranchServiceTreeDialogComponent', () => {
  let fixture: ComponentFixture<CreateBranchServiceTreeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CreateBranchServiceTreeDialogComponent] }).compileComponents();
    fixture = TestBed.createComponent(CreateBranchServiceTreeDialogComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('saving', false);
    fixture.componentRef.setInput('translations', BRANCH_SERVICES_TRANSLATIONS.en);
    fixture.detectChanges();
  });

  it('reports validation errors instead of emitting an invalid tree', () => {
    const created = vi.fn<(request: CreateBranchServiceTreeRequest) => void>();
    fixture.componentInstance.created.subscribe(created);

    submit();
    fixture.detectChanges();

    expect(created).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.requiredField);
  });

  it('trims valid names and emits default empty service-code fields', () => {
    const created = vi.fn<(request: CreateBranchServiceTreeRequest) => void>();
    fixture.componentInstance.created.subscribe(created);
    fixture.componentInstance.root.controls.arabicName.setValue('  ا��&دف��عات  ');
    fixture.componentInstance.root.controls.englishName.setValue('  Payments  ');

    submit();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        root: expect.objectContaining({
          arabicName: 'ا��&دف��عات',
          englishName: 'Payments',
          serviceCode: null,
          isServiceCodeRequired: false,
          children: [],
        }),
      }),
    );
  });

  it('emits a trimmed service code when the node requires one', () => {
    const created = vi.fn<(request: CreateBranchServiceTreeRequest) => void>();
    fixture.componentInstance.created.subscribe(created);
    fixture.componentInstance.root.controls.arabicName.setValue('ا��&ختبر');
    fixture.componentInstance.root.controls.englishName.setValue('Laboratory');
    fixture.componentInstance.root.controls.isServiceCodeRequired.setValue(true);
    fixture.componentInstance.root.controls.serviceCode.setValue(' LAB-001 ');

    submit();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        root: expect.objectContaining({ serviceCode: 'LAB-001', isServiceCodeRequired: true }),
      }),
    );
  });

  it('blocks whitespace-only service codes when the node requires one', () => {
    const created = vi.fn<(request: CreateBranchServiceTreeRequest) => void>();
    fixture.componentInstance.created.subscribe(created);
    fixture.componentInstance.root.controls.arabicName.setValue('ا��&ختبر');
    fixture.componentInstance.root.controls.englishName.setValue('Laboratory');
    fixture.componentInstance.root.controls.isServiceCodeRequired.setValue(true);
    fixture.componentInstance.root.controls.serviceCode.setValue('   ');

    submit();
    fixture.detectChanges();

    expect(created).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.serviceCodeRequiredError);
  });

  it('marks duplicate service codes inside the tree before emitting', () => {
    const created = vi.fn<(request: CreateBranchServiceTreeRequest) => void>();
    fixture.componentInstance.created.subscribe(created);
    const component = fixture.componentInstance as unknown as {
      addChild: (group: typeof fixture.componentInstance.root) => void;
    };
    const root = fixture.componentInstance.root;

    root.controls.arabicName.setValue('ا�أص�');
    root.controls.englishName.setValue('Root');
    root.controls.isServiceCodeRequired.setValue(true);
    root.controls.serviceCode.setValue('DUP-001');
    component.addChild(root);

    const child = root.controls.children.at(0);
    child.controls.arabicName.setValue('ا�فرع');
    child.controls.englishName.setValue('Child');
    child.controls.isServiceCodeRequired.setValue(true);
    child.controls.serviceCode.setValue(' DUP-001 ');

    (fixture.componentInstance as unknown as { submit: () => void }).submit();
    fixture.detectChanges();

    expect(created).not.toHaveBeenCalled();
    expect(root.controls.serviceCode.hasError('duplicateServiceCode')).toBe(true);
    expect(child.controls.serviceCode.hasError('duplicateServiceCode')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.duplicateServiceCodeInTree);
  });
  it('keeps global-parent leaf creation childless', () => {
    const created = vi.fn<(request: CreateBranchServiceTreeRequest) => void>();
    fixture.componentInstance.created.subscribe(created);
    fixture.componentRef.setInput('mode', 'subtree');
    fixture.componentRef.setInput('leafOnly', true);
    fixture.componentRef.setInput('parentLabel', 'Global parent');
    fixture.detectChanges();

    const component = fixture.componentInstance as unknown as {
      addChild: (group: typeof fixture.componentInstance.root) => void;
    };
    const root = fixture.componentInstance.root;
    root.controls.arabicName.setValue('خد�&ة فرع�� ة');
    root.controls.englishName.setValue('Leaf service');

    component.addChild(root);
    fixture.detectChanges();

    expect(root.controls.children.length).toBe(0);
    expect(fixture.nativeElement.querySelector('.branch-tree-node-actions .branch-tree-secondary-btn')).toBeNull();

    submit();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        root: expect.objectContaining({ children: [] }),
      }),
    );
  });

  function submit(): void {
    (fixture.nativeElement.querySelector('.q-btn--primary') as HTMLButtonElement).click();
  }
});