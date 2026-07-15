import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { BranchServicesApiService } from '../../services/branch-services-api.service';
import { ServiceManagementApiService } from '../../services/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/service-management-permission.service';
import { ServiceWorkflowApiService } from '../../services/service-workflow-api.service';
import { ServicesComponent } from './services.component';

const emptyPage = {
  currentPage: 1,
  pageSize: 10,
  totalPages: 0,
  totalItems: 0,
  data: [],
  hasPreviousPage: false,
  hasNextPage: false,
};

describe('ServicesComponent', () => {
  let fixture: ComponentFixture<ServicesComponent>;
  let api: {
    readonly getServiceTree: ReturnType<typeof vi.fn>;
    readonly getAvailableParents: ReturnType<typeof vi.fn>;
    readonly getServices: ReturnType<typeof vi.fn>;
    readonly resolveMediaUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      getServiceTree: vi.fn(() => of([])),
      getAvailableParents: vi.fn(() => of([])),
      getServices: vi.fn(() => of(emptyPage)),
      resolveMediaUrl: vi.fn((value: string | null) => value),
    };

    await TestBed.configureTestingModule({
      imports: [ServicesComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            currentSession: computed(() => ({
              userType: 'TechnicalAdmin' as const,
              activeBranchId: null,
            })),
            shouldClearSessionForHttpStatus: () => false,
            clearSession: vi.fn(),
          },
        },
        {
          provide: TechnicalAdminI18nStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
          },
        },
        { provide: ServiceManagementApiService, useValue: api },
        { provide: BranchServicesApiService, useValue: {} },
        { provide: ServiceWorkflowApiService, useValue: {} },
        {
          provide: ServiceManagementPermissionService,
          useValue: {
            canViewAll: signal(true).asReadonly(),
            canViewDetails: signal(true).asReadonly(),
            canCreate: signal(true).asReadonly(),
            canUpdate: signal(true).asReadonly(),
            canDelete: signal(true).asReadonly(),
            canRestore: signal(true).asReadonly(),
            canAssignBranchServices: signal(false).asReadonly(),
            canViewStartOptions: signal(false).asReadonly(),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ServicesComponent);
    fixture.detectChanges();
  });

  it('loads the hierarchy and parent lookup on initialization', () => {
    expect(api.getServiceTree).toHaveBeenCalledWith(
      expect.objectContaining({ includeInactive: false, includeDeleted: false }),
    );
    expect(api.getAvailableParents).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.svc-primary-btn')).not.toBeNull();
  });

  it('loads the list and applies the selected scope filter', () => {
    fixture.componentInstance.switchTab('list');
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { value: 'BranchScoped' } });
    fixture.componentInstance.updateScopeFilter(event);

    expect(api.getServices).toHaveBeenCalledTimes(2);
    expect(api.getServices).toHaveBeenLastCalledWith(
      expect.objectContaining({ scope: 'BranchScoped', pageNumber: 1 }),
    );
  });
});
