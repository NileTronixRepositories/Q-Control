import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem, PagedBranchResponse } from '../../models/branch-management.model';
import {
  DisplayListItemResponse,
  GetDisplaysParams,
  PaginationResponse,
} from '../../models/display-management.model';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { DisplayManagementApiService } from '../../services/display-management-api.service';
import { DisplayPermissionService } from '../../services/display-permission.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { DisplaysComponent } from './displays.component';

describe('DisplaysComponent', () => {
  let fixture: ComponentFixture<DisplaysComponent>;
  const language = signal<AppLanguage>('en');
  const canCreate = signal(true);
  const getBranches = vi.fn<BranchManagementApiService['getBranches']>(() =>
    of(createBranchPage()),
  );
  const getDisplays = vi.fn<DisplayManagementApiService['getDisplays']>(
    (query: GetDisplaysParams) => of(createDisplayPage(query.isActive !== false)),
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    language.set('en');
    canCreate.set(true);

    await TestBed.configureTestingModule({
      imports: [DisplaysComponent],
      providers: [
        TechnicalAdminI18nStore,
        {
          provide: AppLanguageStore,
          useValue: {
            language: language.asReadonly(),
            direction: computed<AppDirection>(() => (language() === 'ar' ? 'rtl' : 'ltr')),
            toggleLanguage: vi.fn(),
          } satisfies Pick<AppLanguageStore, 'language' | 'direction' | 'toggleLanguage'>,
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: vi.fn<Router['navigateByUrl']>().mockResolvedValue(true),
          } satisfies Pick<Router, 'navigateByUrl'>,
        },
        {
          provide: AuthSessionService,
          useValue: {
            shouldClearSessionForHttpStatus: () => false,
            clearSession: vi.fn(),
          } satisfies Pick<
            AuthSessionService,
            'shouldClearSessionForHttpStatus' | 'clearSession'
          >,
        },
        {
          provide: DisplayPermissionService,
          useValue: {
            canViewAll: signal(true).asReadonly(),
            canViewDetails: signal(true).asReadonly(),
            canCreate: canCreate.asReadonly(),
            canUpdate: signal(true).asReadonly(),
            canDeactivate: signal(true).asReadonly(),
            canReactivate: signal(true).asReadonly(),
            canDeletePermanent: signal(true).asReadonly(),
          } satisfies Pick<
            DisplayPermissionService,
            | 'canViewAll'
            | 'canViewDetails'
            | 'canCreate'
            | 'canUpdate'
            | 'canDeactivate'
            | 'canReactivate'
            | 'canDeletePermanent'
          >,
        },
        { provide: BranchManagementApiService, useValue: { getBranches } },
        { provide: DisplayManagementApiService, useValue: { getDisplays } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplaysComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads active displays and branch options and renders responsive records', () => {
    expect(getBranches).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 100, isActive: true }),
    );
    expect(getDisplays).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 10, isActive: true }),
    );
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="displays-active-desktop"] tbody tr')
        .length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="displays-active-mobile"] app-technical-admin-mobile-record-card',
      ).length,
    ).toBe(1);
  });

  it('loads deleted displays when the deleted tab opens', () => {
    const deletedTab = fixture.nativeElement.querySelector(
      '.tabs button:last-child',
    ) as HTMLButtonElement;

    deletedTab.click();
    fixture.detectChanges();

    expect(getDisplays).toHaveBeenCalledTimes(2);
    expect(getDisplays.mock.calls[1][0]).toEqual(
      expect.objectContaining({ pageNumber: 1, isActive: false }),
    );
  });

  it('shows the create action only while create permission is granted', () => {
    expect(
      fixture.nativeElement.querySelector('app-technical-admin-page-hero .primary-action'),
    ).not.toBeNull();

    canCreate.set(false);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('app-technical-admin-page-hero .primary-action'),
    ).toBeNull();
  });
});

function createDisplayPage(isActive: boolean): PaginationResponse<DisplayListItemResponse> {
  return {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    data: [
      {
        id: 40,
        branchId: 1,
        branchArabicName: 'الفرع الرئيسي',
        branchEnglishName: 'Main Branch',
        number: 'D-01',
        ipAddress: '10.0.0.40',
        serialNo: 'DISPLAY-40',
        type: 'Waiting Hall',
        isActive,
        effectiveIsActive: isActive,
        rowVersion: 'display-version-40',
      },
    ],
  };
}

function createBranchPage(): PagedBranchResponse<BranchListItem> {
  return {
    currentPage: 1,
    pageSize: 100,
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
        createdOnUtc: null,
        lastModifiedBy: null,
        modifiedOnUtc: null,
        isActive: true,
        effectiveIsActive: true,
        rowVersion: 'branch-version-1',
      },
    ],
  };
}
