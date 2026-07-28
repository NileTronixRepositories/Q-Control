import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { ServiceTreeNode } from '../../models/service-management.model';
import { ServiceDataInvalidationService } from '../../services/catalog/service-data-invalidation.service';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api.service';
import { CentralServiceTreeComponent } from './central-service-tree.component';

const rootNode: ServiceTreeNode = {
  id: 9,
  parentServiceId: null,
  scope: 'Global',
  ownerBranchId: null,
  ownerBranchArabicName: null,
  ownerBranchEnglishName: null,
  isOwnedByCurrentBranch: false,
  isAssignedToCurrentBranch: null,
  canEditDefinition: true,
  arabicName: 'الخدمات',
  englishName: 'Services',
  serviceCode: null,
  isServiceCodeRequired: false,
  isActive: true,
  effectiveIsActive: true,
  isTicketIssuable: false,
  hasChildren: true,
  canIssueTicket: false,
  isDeleted: false,
  orderNo: 1,
  children: [],
};

describe('CentralServiceTreeComponent', () => {
  let fixture: ComponentFixture<CentralServiceTreeComponent>;
  let api: { readonly getCentralServiceTree: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    api = { getCentralServiceTree: vi.fn(() => of([rootNode])) };
    await TestBed.configureTestingModule({
      imports: [CentralServiceTreeComponent],
      providers: [
        { provide: ServiceManagementApiService, useValue: api },
        {
          provide: TechnicalAdminI18nStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
          },
        },
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal({ userType: 'TechnicalAdmin' }).asReadonly() },
        },
        {
          provide: ServiceDataInvalidationService,
          useValue: { centralTreeRevision: signal(0).asReadonly() },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CentralServiceTreeComponent);
    fixture.detectChanges();
  });

  it('loads and renders the central hierarchy on initialization', () => {
    expect(api.getCentralServiceTree).toHaveBeenCalledWith({
      includeInactive: false,
      includeDeleted: false,
    });
    expect(fixture.nativeElement.textContent).toContain('Services');
  });

  it('reloads with deleted services when a technical admin enables that filter', () => {
    const tree = fixture.debugElement.query(By.directive(ServiceHierarchyTreeComponent))
      .componentInstance as ServiceHierarchyTreeComponent;
    tree.includeDeletedChange.emit(true);
    fixture.detectChanges();

    expect(api.getCentralServiceTree).toHaveBeenLastCalledWith({
      includeInactive: false,
      includeDeleted: true,
    });
  });
});
