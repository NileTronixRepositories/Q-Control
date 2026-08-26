import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import {
  BranchAdvertisementResponse,
  BranchBrandingResponse,
} from '@features/branch-management/models/branch-branding/branch-branding.model';
import { BranchListItem, PagedBranchResponse } from '@features/branch-management/models/branch-management/branch-management.model';
import { BranchBrandingApiService } from '@features/branch-management/services/branch-branding-api/branch-branding-api.service';
import { BranchManagementApiService } from '@features/branch-management/services/branch-management-api/branch-management-api.service';
import { BranchPermissionService } from '@features/branch-management/services/branch-permission/branch-permission.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { BranchBrandingComponent } from './branch-branding.component';

describe('BranchBrandingComponent', () => {
  let fixture: ComponentFixture<BranchBrandingComponent>;
  const language = signal<AppLanguage>('en');
  const canUpdate = signal(true);
  const branding = createBranding();
  const getBranches = vi.fn<BranchManagementApiService['getBranches']>(() =>
    of(createBranchPage()),
  );
  const getBranchBranding = vi.fn<BranchBrandingApiService['getBranchBranding']>(() =>
    of(branding),
  );
  const getBranchAdvertisements = vi.fn<BranchBrandingApiService['getBranchAdvertisements']>(() =>
    of(createAdvertisements()),
  );
  const updateBranchTheme = vi.fn<BranchBrandingApiService['updateBranchTheme']>(
    (_branchId, request) =>
      of({
        ...branding,
        ...request,
        message: 'Visual identity and layout settings saved successfully.',
      }),
  );

  beforeEach(async () => {
    TestBed.resetTestingModule();
    vi.clearAllMocks();
    language.set('en');
    canUpdate.set(true);

    await TestBed.configureTestingModule({
      imports: [BranchBrandingComponent],
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
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({ branchId: '1' }) },
          },
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
          useValue: {
            currentSession: signal({ userType: 'TechnicalAdmin', token: 'token' } as any),
            shouldClearSessionForHttpStatus: () => false,
            clearSession: vi.fn(),
          } satisfies Pick<
            AuthSessionService,
            'currentSession' | 'shouldClearSessionForHttpStatus' | 'clearSession'
          >,
        },
        {
          provide: BranchPermissionService,
          useValue: { canUpdate: canUpdate.asReadonly() } satisfies Pick<
            BranchPermissionService,
            'canUpdate'
          >,
        },
        { provide: BranchManagementApiService, useValue: { getBranches } },
        {
          provide: BranchBrandingApiService,
          useValue: {
            getBranchBranding,
            getBranchAdvertisements,
            updateBranchTheme,
            resolveMediaUrl: vi.fn<BranchBrandingApiService['resolveMediaUrl']>(() => null),
          } satisfies Pick<
            BranchBrandingApiService,
            | 'getBranchBranding'
            | 'getBranchAdvertisements'
            | 'updateBranchTheme'
            | 'resolveMediaUrl'
          >,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchBrandingComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('selects the query-string branch and loads its branding and advertisements', () => {
    expect(getBranches).toHaveBeenCalledOnce();
    expect(getBranchBranding).toHaveBeenCalledWith(1);
    expect(getBranchAdvertisements).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.textContent).toContain('Main Branch');
    expect(fixture.nativeElement.textContent).toContain('2');
  });

  it('renders the enterprise branding workspace with accessible media controls', () => {
    const element = fixture.nativeElement as HTMLElement;
    const branchSelect = element.querySelector<HTMLSelectElement>('#branchBrandingBranch');
    const advertisementCards = element.querySelectorAll('.ad-card');
    const iconButtons = element.querySelectorAll<HTMLButtonElement>('.action-icon-btn');

    expect(branchSelect?.value).toBe('1');
    expect(element.querySelector('.branding-live-preview')).not.toBeNull();
    expect(element.querySelector('.bi-buildings')).not.toBeNull();
    expect(advertisementCards).toHaveLength(2);
    expect(Array.from(iconButtons).every((button) => !!button.getAttribute('aria-label'))).toBe(
      true,
    );
    expect(Array.from(iconButtons).every((button) => !!button.getAttribute('title'))).toBe(true);
  });

  it('submits a valid changed theme with the current row version', () => {
    const textInputs = fixture.nativeElement.querySelectorAll(
      '.branding-theme-form .color-picker-control input[type="text"]',
    );
    const mainColorInput = textInputs[0] as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('.branding-theme-form') as HTMLFormElement;

    mainColorInput.value = '#112233';
    mainColorInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();

    expect(updateBranchTheme).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        mainColor: '#112233',
        secondaryColor: '#0070C4',
        backgroundColor: '#FFFFFF',
        rowVersion: 'branding-version-1',
      }),
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Visual identity and layout settings saved successfully.',
    );
  });

  it('keeps theme controls read-only without update permission', () => {
    canUpdate.set(false);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('.branding-theme-form button[type="submit"]'),
    ).toBeNull();
    const textInputs = fixture.nativeElement.querySelectorAll(
      '.branding-theme-form .color-picker-control input[type="text"]',
    );
    expect((textInputs[1] as HTMLInputElement).readOnly).toBe(true);
  });
});

function createBranding(): BranchBrandingResponse {
  return {
    branchId: 1,
    logoUrl: null,
    mainColor: '#A7060F',
    secondaryColor: '#0070C4',
    backgroundColor: '#FFFFFF',
    headerColor: '#FFFFFF',
    footerColor: '#FFFFFF',
    mainTextColor: '#A7060F',

    showLanguagePage: true,
    defaultLanguageIsArabic: true,
    alwaysRequireUserInput: false,
    showServiceNavigationPath: true,
    allowOperatorSelection: false,
    allowRequestMoreServices: true,

    languageButtonBackgroundColor: '#0070C4',
    languageButtonTextColor: '#FFFFFF',
    languageButtonWidth: 40,
    languageButtonHeight: 22,
    languageButtonText: 'اختيار اللغة',

    serviceButtonBackgroundColor: '#0070C4',
    serviceButtonTextColor: '#FFFFFF',
    serviceButtonWidth: 40,
    serviceButtonHeight: 20,
    serviceButtonSpace: 2,
    serviceButtonFontSize: 1.8,
    serviceButtonText: 'اختيار الخدمة',

    keypadButtonBackgroundColor: '#0070C4',
    keypadButtonTextColor: '#FFFFFF',
    keypadButtonWidth: 45,
    keypadButtonHeight: 10,
    keypadButtonText: 'تأكيد',

    footerButtonBackgroundColor: '#0070C4',
    footerButtonTextColor: '#FFFFFF',
    footerButtonWidth: 10,
    footerButtonHeight: 12,
    footerButtonText: 'رجوع',

    isConfigured: true,
    rowVersion: 'branding-version-1',
    message: null,
  };
}

function createAdvertisements(): readonly BranchAdvertisementResponse[] {
  return [
    {
      id: 2,
      branchId: 1,
      imageUrl: '/ads/two.jpg',
      displayOrder: 2,
      isActive: true,
      rowVersion: 'ad-version-2',
    },
    {
      id: 1,
      branchId: 1,
      imageUrl: '/ads/one.jpg',
      displayOrder: 1,
      isActive: true,
      rowVersion: 'ad-version-1',
    },
  ];
}

function createBranchPage(): PagedBranchResponse<BranchListItem> {
  return {
    currentPage: 1,
    pageSize: 100,
    totalPages: 1,
    totalItems: 2,
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
      {
        branchId: 2,
        arabicName: 'فرع الإسكندرية',
        englishName: 'Alexandria Branch',
        ipAddress: '10.0.0.2',
        governorate: 'Alexandria',
        city: 'Alexandria',
        createdBy: null,
        createdOnUtc: null,
        lastModifiedBy: null,
        modifiedOnUtc: null,
        isActive: true,
        effectiveIsActive: true,
        rowVersion: 'branch-version-2',
      },
    ],
  };
}
