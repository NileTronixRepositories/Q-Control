import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { ServiceHierarchyTreeComponent } from '../../components/service-hierarchy-tree/service-hierarchy-tree.component';
import { ServiceTreeNode } from '../../models/service-management/service-management.model';
import { ServiceDataInvalidationService } from '../../services/catalog/service-data-invalidation/service-data-invalidation.service';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api/service-management-api.service';
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
  let api: {
    readonly getCentralServiceTree: ReturnType<typeof vi.fn>;
    readonly getServiceDetails: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      getCentralServiceTree: vi.fn(() => of([rootNode])),
      getServiceDetails: vi.fn(() =>
        of({
          id: 9,
          serviceCode: 'SRV-1',
          arabicName: 'الخدمات',
          englishName: 'Services',
        }),
      ),
    };
    await TestBed.configureTestingModule({
      imports: [CentralServiceTreeComponent],
      providers: [
        { provide: ServiceManagementApiService, useValue: api },
        {
          provide: AdminI18nStore,
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

  it('does not open preview when selecting a node in the tree', () => {
    const tree = fixture.debugElement.query(By.directive(ServiceHierarchyTreeComponent))
      .componentInstance as ServiceHierarchyTreeComponent;
    tree.selectNode.emit(rootNode);
    fixture.detectChanges();

    expect(fixture.componentInstance['selectedServiceId']()).toBe(9);
    expect(fixture.componentInstance['selectedNode']()).toBeNull();
    expect(api.getServiceDetails).not.toHaveBeenCalled();
  });

  it('opens preview and loads details when clicking viewNode (preview button)', () => {
    const tree = fixture.debugElement.query(By.directive(ServiceHierarchyTreeComponent))
      .componentInstance as ServiceHierarchyTreeComponent;
    tree.viewNode.emit(rootNode);
    fixture.detectChanges();

    expect(fixture.componentInstance['selectedServiceId']()).toBe(9);
    expect(fixture.componentInstance['selectedNode']()).toEqual(rootNode);
    expect(api.getServiceDetails).toHaveBeenCalledWith(9);
  });
});
