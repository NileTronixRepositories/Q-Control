import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { BranchAdminsApiService } from '../../../branch-admins/services/branch-admins-api.service';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem, PagedBranchResponse } from '../../models/branch-management.model';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { BranchPermissionService } from '../../services/branch-permission.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { LegacyPageComponent } from './legacy-page.component';

describe('LegacyPageComponent branch management', () => {
  let fixture: ComponentFixture<LegacyPageComponent>;
  const language = signal<AppLanguage>('en');
  const canCreateBranchAdmin = signal(false);
  const getBranches = vi.fn<BranchManagementApiService['getBranches']>(() =>
    of(createBranchPage()),
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    language.set('en');
    canCreateBranchAdmin.set(false);

    await TestBed.configureTestingModule({
      imports: [LegacyPageComponent],
      providers: [
        TechnicalAdminI18nStore,
        {
          provide: AppLanguageStore,
          useValue: createLanguageStore(language),
        },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { pageKey: 'branch-editor' } } },
        },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn<Router['navigate']>().mockResolvedValue(true),
            navigateByUrl: vi.fn<Router['navigateByUrl']>().mockResolvedValue(true),
          } satisfies Pick<Router, 'navigate' | 'navigateByUrl'>,
        },
        {
          provide: AuthSessionService,
          useValue: createAuthSessionMock(),
        },
        {
          provide: BranchPermissionService,
          useValue: { canCreateBranchAdmin: canCreateBranchAdmin.asReadonly() } satisfies Pick<
            BranchPermissionService,
            'canCreateBranchAdmin'
          >,
        },
        { provide: BranchManagementApiService, useValue: { getBranches } },
        {
          provide: BranchAdminsApiService,
          useValue: {
            createBranchAdmin: vi.fn<BranchAdminsApiService['createBranchAdmin']>(),
          } satisfies Pick<BranchAdminsApiService, 'createBranchAdmin'>,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LegacyPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads and renders branches in desktop and mobile presentations', () => {
    expect(getBranches).toHaveBeenCalledWith({
      searchText: '',
      orderSort: 'Newest',
      pageNumber: 1,
      pageSize: 10,
      isActive: null,
    });
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="branches-desktop"] tbody tr').length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="branches-mobile"] app-technical-admin-mobile-record-card',
      ).length,
    ).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Main Branch');
  });

  it('reloads the list with the selected status filter', () => {
    const statusFilter = fixture.nativeElement.querySelector(
      'select[aria-label="Status"]',
    ) as HTMLSelectElement;

    statusFilter.value = 'true';
    statusFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(getBranches).toHaveBeenCalledTimes(2);
    expect(getBranches.mock.calls[1][0]).toEqual(
      expect.objectContaining({ isActive: true, pageNumber: 1 }),
    );
  });

  it('shows branch-admin creation only when its permission is granted', () => {
    expect(
      fixture.nativeElement.querySelector('[aria-label="Add Branch Administrator"]'),
    ).toBeNull();

    canCreateBranchAdmin.set(true);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[aria-label="Add Branch Administrator"]'),
    ).not.toBeNull();
  });
});

function createBranchPage(): PagedBranchResponse<BranchListItem> {
  return {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    data: [
      {
        branchId: 1,
        arabicName: 'الفرع الرئيسي',
        englishName: 'Main Branch',
        ipAddress: '10.0.0.1',
        governorate: 'Cairo',
        city: 'Cairo',
        createdBy: null,
        createdOnUtc: '2026-07-14T08:00:00Z',
        lastModifiedBy: null,
        modifiedOnUtc: null,
        isActive: true,
        effectiveIsActive: true,
        rowVersion: 'branch-version-1',
      },
    ],
  };
}

function createLanguageStore(
  language: ReturnType<typeof signal<AppLanguage>>,
): Pick<AppLanguageStore, 'language' | 'direction' | 'toggleLanguage'> {
  return {
    language: language.asReadonly(),
    direction: computed<AppDirection>(() => (language() === 'ar' ? 'rtl' : 'ltr')),
    toggleLanguage: vi.fn(),
  };
}

function createAuthSessionMock(): Pick<
  AuthSessionService,
  'shouldClearSessionForHttpStatus' | 'clearSession'
> {
  return {
    shouldClearSessionForHttpStatus: () => false,
    clearSession: vi.fn(),
  };
}
