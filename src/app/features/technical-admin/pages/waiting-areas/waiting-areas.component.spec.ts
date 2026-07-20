import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { BranchListItem, PagedBranchResponse } from '../../models/branch-management.model';
import { Pagination, WaitingAreaListItem } from '../../models/waiting-area.model';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { WaitingAreaApiService } from '../../services/waiting-area-api.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { WaitingAreasComponent } from './waiting-areas.component';

describe('WaitingAreasComponent', () => {
  let fixture: ComponentFixture<WaitingAreasComponent>;
  const language = signal<AppLanguage>('en');
  const getBranches = vi.fn<BranchManagementApiService['getBranches']>(() =>
    of(createBranchPage()),
  );
  const getWaitingAreas = vi.fn<WaitingAreaApiService['getWaitingAreas']>(() =>
    of(createWaitingAreaPage()),
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    language.set('en');

    await TestBed.configureTestingModule({
      imports: [WaitingAreasComponent],
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
        { provide: BranchManagementApiService, useValue: { getBranches } },
        { provide: WaitingAreaApiService, useValue: { getWaitingAreas } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WaitingAreasComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads branches and waiting areas and renders both responsive views', () => {
    expect(getBranches).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 100, isActive: true }),
    );
    expect(getWaitingAreas).toHaveBeenCalledWith({
      branchId: null,
      search: '',
      pageNumber: 1,
      pageSize: 10,
      isActive: null,
    });
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="waiting-areas-desktop"] tbody tr')
        .length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="waiting-areas-mobile"] app-technical-admin-mobile-record-card',
      ).length,
    ).toBe(1);
  });

  it('reloads waiting areas for the selected branch', () => {
    const branchFilter = fixture.nativeElement.querySelectorAll(
      '.waiting-areas-page .list-panel > .row:first-child select',
    )[0] as HTMLSelectElement;

    branchFilter.value = '1';
    branchFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(getWaitingAreas).toHaveBeenCalledTimes(2);
    expect(getWaitingAreas.mock.calls[1][0]).toEqual(
      expect.objectContaining({ branchId: 1, pageNumber: 1 }),
    );
  });
});

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
        arabicName: 'Ø§Ù„ÙØ±Ø¹ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ',
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

function createWaitingAreaPage(): Pagination<WaitingAreaListItem> {
  return {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    data: [
      {
        id: 10,
        branchId: 1,
        branchArabicName: 'Ø§Ù„ÙØ±Ø¹ Ø§Ù„Ø±Ø¦ÙŠØ³ÙŠ',
        branchEnglishName: 'Main Branch',
        number: 3,
        descriptiveName: 'Main Hall',
        audioDevice: 'Speaker 1',
        controlDevice: 'Controller 1',
        windowsCount: 4,
        isActive: true,
        effectiveIsActive: true,
        rowVersion: 'waiting-area-version-10',
      },
    ],
  };
}


