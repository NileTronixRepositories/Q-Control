import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import {
  GetTerminalsParams,
  PaginationResponse as TerminalPage,
  TerminalListItemResponse,
} from '../../models/terminal-management/terminal-management.model';
import {
  PaginationResponse as WindowPage,
  WindowListItemResponse,
} from '../../models/window-management/window-management.model';
import { TerminalManagementApiService } from '../../services/terminal-management-api/terminal-management-api.service';
import { TerminalPermissionService } from '../../services/terminal-permission/terminal-permission.service';
import { WindowManagementApiService } from '../../services/window-management-api/window-management-api.service';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { TerminalsComponent } from './terminals.component';

describe('TerminalsComponent', () => {
  let fixture: ComponentFixture<TerminalsComponent>;
  const language = signal<AppLanguage>('en');
  const canCreate = signal(true);
  const getWindows = vi.fn<WindowManagementApiService['getWindows']>(() =>
    of(createWindowPage()),
  );
  const getTerminals = vi.fn<TerminalManagementApiService['getTerminals']>(
    (query: GetTerminalsParams) => of(createTerminalPage(query.isActive !== false)),
  );

  beforeEach(async () => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    language.set('en');
    canCreate.set(true);

    await TestBed.configureTestingModule({
      imports: [TerminalsComponent],
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
          provide: TerminalPermissionService,
          useValue: {
            canViewAll: signal(true).asReadonly(),
            canViewDetails: signal(true).asReadonly(),
            canCreate: canCreate.asReadonly(),
            canUpdate: signal(true).asReadonly(),
            canDeactivate: signal(true).asReadonly(),
            canReactivate: signal(true).asReadonly(),
            canDeletePermanent: signal(true).asReadonly(),
          } satisfies Pick<
            TerminalPermissionService,
            | 'canViewAll'
            | 'canViewDetails'
            | 'canCreate'
            | 'canUpdate'
            | 'canDeactivate'
            | 'canReactivate'
            | 'canDeletePermanent'
          >,
        },
        { provide: WindowManagementApiService, useValue: { getWindows } },
        { provide: TerminalManagementApiService, useValue: { getTerminals } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TerminalsComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('loads active terminals and window options and renders responsive records', () => {
    expect(getWindows).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 100, isActive: true }),
    );
    expect(getTerminals).toHaveBeenCalledWith(
      expect.objectContaining({ pageNumber: 1, pageSize: 10, isActive: true }),
    );
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="terminals-active-desktop"] tbody tr')
        .length,
    ).toBe(1);
    expect(
      fixture.nativeElement.querySelectorAll(
        '[data-testid="terminals-active-mobile"] app-mobile-record-card',
      ).length,
    ).toBe(1);
  });

  it('loads deleted terminals when the deleted tab opens', () => {
    const deletedTab = fixture.nativeElement.querySelector(
      '.tabs button:last-child',
    ) as HTMLButtonElement;

    deletedTab.click();
    fixture.detectChanges();

    expect(getTerminals).toHaveBeenCalledTimes(2);
    expect(getTerminals.mock.calls[1][0]).toEqual(
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

  it('scopes terminals and window options to the selected branch context', () => {
    TestBed.inject(AdminBranchContextStore).selectBranch({
      branchId: 7,
      arabicName: 'فرع القاهرة',
      englishName: 'Cairo Branch',
      isActive: true,
      effectiveIsActive: true,
    });
    getWindows.mockClear();
    getTerminals.mockClear();
    fixture.destroy();
    fixture = TestBed.createComponent(TerminalsComponent);
    fixture.detectChanges();

    expect(getWindows).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 7, isActive: true }),
    );
    expect(getTerminals).toHaveBeenCalledWith(
      expect.objectContaining({ branchId: 7, isActive: true }),
    );
  });
});

function createTerminalPage(isActive: boolean): TerminalPage<TerminalListItemResponse> {
  return {
    currentPage: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    data: [
      {
        id: 30,
        windowId: 20,
        windowNumber: 'W-01',
        waitingAreaId: 10,
        waitingAreaNumber: 3,
        branchId: 1,
        branchArabicName: 'الفرع الرئيسي',
        branchEnglishName: 'Main Branch',
        number: 'T-01',
        ipAddress: '10.0.0.30',
        serialNo: 'SERIAL-30',
        type: 'Kiosk',
        isActive,
        effectiveIsActive: isActive,
        rowVersion: 'terminal-version-30',
      },
    ],
  };
}

function createWindowPage(): WindowPage<WindowListItemResponse> {
  return {
    currentPage: 1,
    pageSize: 100,
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
        isActive: true,
        effectiveIsActive: true,
        rowVersion: 'window-version-20',
      },
    ],
  };
}
