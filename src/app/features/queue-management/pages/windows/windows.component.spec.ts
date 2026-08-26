import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { Pagination, WaitingAreaListItem } from '../../models/waiting-area/waiting-area.model';
import {
  GetWindowsParams,
  PaginationResponse,
  WindowListItemResponse,
} from '../../models/window-management/window-management.model';
import { WaitingAreaApiService } from '../../services/waiting-area-api/waiting-area-api.service';
import { WindowManagementApiService } from '../../services/window-management-api/window-management-api.service';
import { WindowPermissionService } from '../../services/window-permission/window-permission.service';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { WindowsComponent } from './windows.component';

describe('WindowsComponent', () => {
  let fixture: ComponentFixture<WindowsComponent>;
  const language = signal<AppLanguage>('en');
  const canCreate = signal(true);
  const getWaitingAreas = vi.fn<WaitingAreaApiService['getWaitingAreas']>(() =>
    of(createWaitingAreaPage()),
  );
  const getWindows = vi.fn<WindowManagementApiService['getWindows']>(
    (query: GetWindowsParams) => of(createWindowPage(query.isActive !== false)),
  );

  beforeEach(async () => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    language.set('en');
    canCreate.set(true);

    await TestBed.configureTestingModule({
      imports: [WindowsComponent],
      providers: [
        AdminI18nStore,
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
          provide: WindowPermissionService,
          useValue: {
            canViewAll: signal(true).asReadonly(),
            canViewDetails: signal(true).asReadonly(),
            canCreate: canCreate.asReadonly(),
            canUpdate: signal(true).asReadonly(),
            canDeactivate: signal(true).asReadonly(),
            canReactivate: signal(true).asReadonly(),
            canDeletePermanent: signal(true).asReadonly(),
          } satisfies Pick<
            WindowPermissionService,
            | 'canViewAll'
            | 'canViewDetails'
            | 'canCreate'
            | 'canUpdate'
            | 'canDeactivate'
            | 'canReactivate'
            | 'canDeletePermanent'
          >,
        },
        { provide: WaitingAreaApiService, useValue: { getWaitingAreas } },
        { provide: WindowManagementApiService, useValue: { getWindows } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(WindowsComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads active windows and waiting-area options and renders responsive records', () => {
    expect(getWaitingAreas).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 100, isActive: true }),
    );
    expect(getWindows).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 10, isActive: true }),
    );
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="windows-active-desktop"] tbody tr')
        .length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="windows-active-mobile"] app-mobile-record-card',
      ).length,
    ).toBe(1);
  });

  it('loads deleted windows when the deleted tab opens', () => {
    const deletedTab = fixture.nativeElement.querySelector(
      '[data-testid="windows-deleted-tab"]',
    ) as HTMLButtonElement;

    deletedTab.click();
    fixture.detectChanges();

    expect(getWindows).toHaveBeenCalledTimes(2);
    expect(getWindows.mock.calls[1][0]).toEqual(
      expect.objectContaining({ pageNumber: 1, isActive: false }),
    );
  });

  it('shows the create action only while create permission is granted', () => {
    expect(
      fixture.nativeElement.querySelector('app-page-hero .primary-action'),
    ).not.toBeNull();

    canCreate.set(false);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('app-page-hero .primary-action'),
    ).toBeNull();
  });

  it('scopes windows and waiting-area options to the selected branch context', () => {
    TestBed.inject(AdminBranchContextStore).selectBranch({
      branchId: 7,
      arabicName: 'فرع القاهرة',
      englishName: 'Cairo Branch',
      isActive: true,
      effectiveIsActive: true,
    });
    getWaitingAreas.mockClear();
    getWindows.mockClear();
    fixture.destroy();
    fixture = TestBed.createComponent(WindowsComponent);
    fixture.detectChanges();

    expect(getWaitingAreas).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 7, isActive: true }),
    );
    expect(getWindows).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 7, isActive: true }),
    );
  });
});

function createWindowPage(isActive: boolean): PaginationResponse<WindowListItemResponse> {
  return {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    data: [
      {
        id: 20,
        branchId: 1,
        waitingAreaId: 10,
        waitingAreaNumber: 3,
        waitingAreaDescriptiveName: 'Main Hall',
        number: 'W-01',
        descriptiveName: 'Reception',
        ipAddress: '10.0.0.20',
        enableTicketBooking: true,
        enableDirectCall: false,
        isActive,
        effectiveIsActive: isActive,
        rowVersion: 'window-version-20',
      },
    ],
  };
}

function createWaitingAreaPage(): Pagination<WaitingAreaListItem> {
  return {
    currentPage: 1,
    pageSize: 100,
    totalPages: 1,
    totalItems: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    data: [
      {
        id: 10,
        branchId: 1,
        number: 3,
        descriptiveName: 'Main Hall',
        windowsCount: 1,
        isActive: true,
        effectiveIsActive: true,
        rowVersion: 'waiting-area-version-10',
      },
    ],
  };
}

