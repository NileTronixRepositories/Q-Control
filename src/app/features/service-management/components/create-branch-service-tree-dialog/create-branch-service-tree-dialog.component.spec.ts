import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { BRANCH_SERVICES_TRANSLATIONS } from '../../i18n/branch-services.translations';
import { CreateBranchServiceTreeRequest } from '../../models/branch-services.model';
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

    (fixture.nativeElement.querySelector('.branch-tree-primary-btn') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(created).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(BRANCH_SERVICES_TRANSLATIONS.en.requiredField);
  });

  it('trims valid names and emits a new root tree', () => {
    const created = vi.fn<(request: CreateBranchServiceTreeRequest) => void>();
    fixture.componentInstance.created.subscribe(created);
    fixture.componentInstance.root.controls.arabicName.setValue('  المدفوعات  ');
    fixture.componentInstance.root.controls.englishName.setValue('  Payments  ');

    (fixture.nativeElement.querySelector('.branch-tree-primary-btn') as HTMLButtonElement).click();

    expect(created).toHaveBeenCalledWith(
      expect.objectContaining({
        root: expect.objectContaining({ arabicName: 'المدفوعات', englishName: 'Payments', children: [] }),
      }),
    );
  });
});
