import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AppLanguage } from '../../../../shared/models/app-language.model';
import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { TechnicalAdminPageHeroComponent } from '../../../../shared/components/technical-admin-page-hero/technical-admin-page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import {
  BranchAdvertisementResponse,
  BranchAdvertisementStateResponse,
  BranchBrandingResponse,
  UpdateBranchThemeRequest,
} from '../../models/branch-branding.model';
import { BranchListItem } from '../../models/branch-management.model';
import { BranchBrandingApiService } from '../../services/branch-branding-api.service';
import { BranchManagementApiService } from '../../services/branch-management-api.service';
import { BranchPermissionService } from '../../services/branch-permission.service';
import { TechnicalAdminI18nStore } from '../../store/technical-admin-i18n.store';
import { formatTechnicalAdminApiError } from '../../utils/api-error-message.util';

type ThemeColorControl = 'mainColor' | 'secondaryColor' | 'backgroundColor';
type UiMessageTone = 'success' | 'error' | 'info';
type DropPlacement = 'before' | 'after';

interface BranchBrandingPageTranslations {
  readonly pageEyebrow: string;
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly branchLabel: string;
  readonly selectBranchPlaceholder: string;
  readonly refreshLabel: string;
  readonly brandingSection: string;
  readonly advertisementsSection: string;
  readonly logoLabel: string;
  readonly logoEmpty: string;
  readonly logoHint: string;
  readonly chooseLogo: string;
  readonly uploadLogo: string;
  readonly selectedFile: string;
  readonly themeColors: string;
  readonly mainColor: string;
  readonly secondaryColor: string;
  readonly backgroundColor: string;
  readonly headerColor: string;
  readonly footerColor: string;
  readonly mainTextColor: string;
  readonly generalColorsSection: string;
  readonly behaviorSection: string;
  readonly showLanguagePageLabel: string;
  readonly defaultLanguageIsArabicLabel: string;
  readonly alwaysRequireUserInputLabel: string;
  readonly showServiceNavigationPathLabel: string;
  readonly allowOperatorSelectionLabel: string;
  readonly allowRequestMoreServicesLabel: string;
  readonly languageButtonSection: string;
  readonly serviceButtonSection: string;
  readonly keypadButtonSection: string;
  readonly footerButtonSection: string;
  readonly buttonBackgroundColorLabel: string;
  readonly buttonTextColorLabel: string;
  readonly buttonWidthLabel: string;
  readonly buttonHeightLabel: string;
  readonly buttonTextLabel: string;
  readonly serviceButtonSpaceLabel: string;
  readonly serviceButtonFontSizeLabel: string;
  readonly saveTheme: string;
  readonly noBranding: string;
  readonly colorRequired: string;
  readonly colorInvalid: string;
  readonly dimensionInvalid: string;
  readonly textTooLong: string;
  readonly readOnlyNotice: string;
  readonly advertisementsCounter: string;
  readonly remainingSlots: string;
  readonly uploadAdvertisements: string;
  readonly chooseAdvertisements: string;
  readonly cancelAdvertisements: string;
  readonly selectedImages: string;
  readonly maximumReached: string;
  readonly noAdvertisements: string;
  readonly active: string;
  readonly inactive: string;
  readonly activate: string;
  readonly deactivate: string;
  readonly delete: string;
  readonly moveUp: string;
  readonly moveDown: string;
  readonly saveOrder: string;
  readonly orderLabel: string;
  readonly confirmDelete: string;
  readonly loading: string;
  readonly conflict: string;
  readonly invalidImage: string;
  readonly tooManyImages: string;
  readonly genericError: string;
  readonly themeSaved: string;
  readonly advertisementsUploaded: string;
  readonly orderSaved: string;
  readonly close: string;
}

interface BranchOption {
  readonly id: number;
  readonly label: string;
}

interface UiMessage {
  readonly tone: UiMessageTone;
  readonly text: string;
}

interface SelectedImagePreview {
  readonly name: string;
  readonly url: string;
}

const MAX_ADVERTISEMENTS = 20;
const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ALLOWED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp'] as const;

const PAGE_TRANSLATIONS: Record<AppLanguage, BranchBrandingPageTranslations> = {
  ar: {
    pageEyebrow: 'إدارة الفروع',
    pageTitle: 'الهوية البصرية والإعلانات',
    pageDescription:
      'تحكم في شعار الفرع وإعدادات التصميم والسلوك وشاشة طلب الخدمة لكل فرع من لوحة المسؤول التقني.',
    branchLabel: 'الفرع',
    selectBranchPlaceholder: 'اختر فرعا',
    refreshLabel: 'تحديث',
    brandingSection: 'إعدادات الفرع والشاشة',
    advertisementsSection: 'إعلانات الفرع',
    logoLabel: 'شعار الفرع',
    logoEmpty: 'لا يوجد شعار مرفوع لهذا الفرع.',
    logoHint: 'PNG أو JPG أو JPEG أو WEBP فقط. SVG غير مدعوم.',
    chooseLogo: 'اختيار شعار',
    uploadLogo: 'رفع الشعار',
    selectedFile: 'الملف المحدد',
    themeColors: 'ألوان الهوية البصرية',
    mainColor: 'اللون الرئيسي',
    secondaryColor: 'اللون الثانوي',
    backgroundColor: 'لون الخلفية',
    headerColor: 'لون الهيدر',
    footerColor: 'لون الفوتر',
    mainTextColor: 'لون النص الرئيسي',
    generalColorsSection: 'الألوان العامة',
    behaviorSection: 'سلوك شاشة طلب الخدمة',
    showLanguagePageLabel: 'إظهار صفحة اختيار اللغة',
    defaultLanguageIsArabicLabel: 'اللغة الافتراضية هي العربية',
    alwaysRequireUserInputLabel: 'تطلب إدخال بيانات من المستخدم دائماً',
    showServiceNavigationPathLabel: 'إظهار مسار التنقل بين الخدمات',
    allowOperatorSelectionLabel: 'السماح باختيار الموظف / تقديم الخدمة',
    allowRequestMoreServicesLabel: 'السماح بطلب المزيد من الخدمات',
    languageButtonSection: 'إعدادات زر اللغة',
    serviceButtonSection: 'إعدادات زر الخدمة',
    keypadButtonSection: 'إعدادات لوحة الأرقام',
    footerButtonSection: 'إعدادات زر الفوتر',
    buttonBackgroundColorLabel: 'لون خلفية الزر',
    buttonTextColorLabel: 'لون نص الزر',
    buttonWidthLabel: 'عرض الزر (%)',
    buttonHeightLabel: 'ارتفاع الزر (%)',
    buttonTextLabel: 'نص الزر',
    serviceButtonSpaceLabel: 'المسافة بين أزرار الخدمات (%)',
    serviceButtonFontSizeLabel: 'حجم خط أزرار الخدمات (rem)',
    saveTheme: 'حفظ الإعدادات',
    noBranding: 'لم يتم إعداد الهوية البصرية لهذا الفرع بعد.',
    colorRequired: 'هذا اللون مطلوب.',
    colorInvalid: 'استخدم صيغة #RRGGBB فقط.',
    dimensionInvalid: 'يجب أن تكون القيمة بين 0 و 100.',
    textTooLong: 'لا يمكن أن يتجاوز النص 200 حرف.',
    readOnlyNotice: 'يمكنك عرض البيانات فقط لأن صلاحية Branches.Update غير متاحة.',
    advertisementsCounter: 'الإعلانات',
    remainingSlots: 'المتاح',
    uploadAdvertisements: 'رفع الإعلانات',
    chooseAdvertisements: 'اختيار صور الإعلانات',
    cancelAdvertisements: 'إلغاء التحديد',
    selectedImages: 'الصور المحددة',
    maximumReached: 'تم الوصول للحد الأقصى 20 إعلان.',
    noAdvertisements: 'لم تتم إضافة إعلانات لهذا الفرع بعد.',
    active: 'نشط',
    inactive: 'غير نشط',
    activate: 'تنشيط',
    deactivate: 'إيقاف',
    delete: 'حذف نهائي',
    moveUp: 'تحريك لأعلى',
    moveDown: 'تحريك لأسفل',
    saveOrder: 'حفظ الترتيب',
    orderLabel: 'الترتيب',
    confirmDelete: 'هل أنت متأكد من حذف هذا الإعلان نهائيا؟ لا يمكن التراجع عن هذا الإجراء.',
    loading: 'جاري التحميل...',
    conflict:
      'تم تعديل البيانات بواسطة مستخدم آخر. تم إعادة جلب البيانات برجاء المراجعة والحفظ مجدداً.',
    invalidImage: 'نوع الصورة غير مدعوم. استخدم PNG أو JPG أو JPEG أو WEBP فقط.',
    tooManyImages: 'عدد الصور المحددة يتجاوز الحد المتاح لهذا الفرع.',
    genericError: 'حدث خطأ غير متوقع.',
    themeSaved: 'تم حفظ إعدادات الهوية البصرية والتصميم بنجاح.',
    advertisementsUploaded: 'تم رفع الإعلانات بنجاح.',
    orderSaved: 'تم حفظ ترتيب الإعلانات بنجاح.',
    close: 'إغلاق',
  },
  en: {
    pageEyebrow: 'Branch Management',
    pageTitle: 'Branding & Ticket Issuance Layout',
    pageDescription:
      'Control branch logo, full design layout, button dimensions, screen behavior, and advertisements.',
    branchLabel: 'Branch',
    selectBranchPlaceholder: 'Select a branch',
    refreshLabel: 'Refresh',
    brandingSection: 'Branch Branding & Layout',
    advertisementsSection: 'Branch Advertisements',
    logoLabel: 'Branch logo',
    logoEmpty: 'No logo has been uploaded for this branch.',
    logoHint: 'PNG, JPG, JPEG, or WEBP only. SVG is not supported.',
    chooseLogo: 'Choose logo',
    uploadLogo: 'Upload logo',
    selectedFile: 'Selected file',
    themeColors: 'Visual identity colors',
    mainColor: 'Main color',
    secondaryColor: 'Secondary color',
    backgroundColor: 'Background color',
    headerColor: 'Header color',
    footerColor: 'Footer color',
    mainTextColor: 'Main text color',
    generalColorsSection: 'General Colors',
    behaviorSection: 'Screen Behavior',
    showLanguagePageLabel: 'Show language selection page',
    defaultLanguageIsArabicLabel: 'Default language is Arabic',
    alwaysRequireUserInputLabel: 'Always require user input',
    showServiceNavigationPathLabel: 'Show service navigation path',
    allowOperatorSelectionLabel: 'Allow operator selection',
    allowRequestMoreServicesLabel: 'Allow requesting more services',
    languageButtonSection: 'Language Button Settings',
    serviceButtonSection: 'Service Button Settings',
    keypadButtonSection: 'Keypad Button Settings',
    footerButtonSection: 'Footer Button Settings',
    buttonBackgroundColorLabel: 'Button background color',
    buttonTextColorLabel: 'Button text color',
    buttonWidthLabel: 'Button width (%)',
    buttonHeightLabel: 'Button height (%)',
    buttonTextLabel: 'Button text',
    serviceButtonSpaceLabel: 'Service button space (%)',
    serviceButtonFontSizeLabel: 'Service button font size (rem)',
    saveTheme: 'Save Branding & Layout',
    noBranding: 'No branding has been configured for this branch.',
    colorRequired: 'This color is required.',
    colorInvalid: 'Use #RRGGBB format only.',
    dimensionInvalid: 'Must be a value between 0 and 100.',
    textTooLong: 'Text cannot exceed 200 characters.',
    readOnlyNotice: 'You can view this data only because Branches.Update is not available.',
    advertisementsCounter: 'Advertisements',
    remainingSlots: 'Remaining',
    uploadAdvertisements: 'Upload advertisements',
    chooseAdvertisements: 'Choose advertisement images',
    cancelAdvertisements: 'Cancel selection',
    selectedImages: 'Selected images',
    maximumReached: 'The maximum of 20 advertisements has been reached.',
    noAdvertisements: 'No advertisements have been added for this branch.',
    active: 'Active',
    inactive: 'Inactive',
    activate: 'Activate',
    deactivate: 'Deactivate',
    delete: 'Delete permanently',
    moveUp: 'Move up',
    moveDown: 'Move down',
    saveOrder: 'Save order',
    orderLabel: 'Order',
    confirmDelete:
      'Are you sure you want to permanently delete this advertisement? This action cannot be undone.',
    loading: 'Loading...',
    conflict:
      'The data was modified by another user. Latest server data has been loaded for your review.',
    invalidImage: 'Unsupported image type. Use PNG, JPG, JPEG, or WEBP only.',
    tooManyImages: 'Selected images exceed the available slots for this branch.',
    genericError: 'Unexpected error occurred.',
    themeSaved: 'Visual identity and layout settings saved successfully.',
    advertisementsUploaded: 'Advertisements uploaded successfully.',
    orderSaved: 'Advertisement order saved successfully.',
    close: 'Close',
  },
};

@Component({
  selector: 'app-branch-branding',
  imports: [ReactiveFormsModule, TechnicalAdminPageHeroComponent, NiletronixLoadingStateComponent],
  templateUrl: './branch-branding.component.html',
  styleUrls: [
    './branch-branding.component.css',
    './branch-branding-identity.component.css',
    './branch-branding-advertisements.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchBrandingComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(TechnicalAdminI18nStore);
  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  private readonly branchManagementApiService = inject(BranchManagementApiService);
  private readonly branchBrandingApiService = inject(BranchBrandingApiService);
  private readonly branchPermissionService = inject(BranchPermissionService);
  private readonly logoInput = viewChild<ElementRef<HTMLInputElement>>('logoInput');
  private readonly advertisementsInput =
    viewChild<ElementRef<HTMLInputElement>>('advertisementsInput');
  private readonly themeRevision = signal(0);
  private messageTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly copy = computed(() => PAGE_TRANSLATIONS[this.i18nStore.language()]);
  protected readonly canUpdate = this.branchPermissionService.canUpdate;
  protected readonly branches = signal<readonly BranchOption[]>([]);
  protected readonly selectedBranchId = signal<number | null>(null);
  protected readonly branding = signal<BranchBrandingResponse | null>(null);
  protected readonly advertisements = signal<readonly BranchAdvertisementResponse[]>([]);
  protected readonly confirmedAdvertisements = signal<readonly BranchAdvertisementResponse[]>([]);
  protected readonly selectedLogoFile = signal<File | null>(null);
  protected readonly selectedLogoPreviewUrl = signal<string | null>(null);
  protected readonly logoPreviewFailed = signal(false);
  protected readonly selectedAdvertisementFiles = signal<readonly File[]>([]);
  protected readonly selectedAdvertisementPreviews = signal<readonly SelectedImagePreview[]>([]);
  protected readonly failedAdvertisementImageIds = signal<ReadonlySet<number>>(new Set<number>());
  protected readonly logoValidationMessage = signal('');
  protected readonly advertisementValidationMessage = signal('');
  protected readonly message = signal<UiMessage | null>(null);
  protected readonly branchesLoading = signal(false);
  protected readonly brandingLoading = signal(false);
  protected readonly advertisementsLoading = signal(false);
  protected readonly themeSaving = signal(false);
  protected readonly logoUploading = signal(false);
  protected readonly advertisementsUploading = signal(false);
  protected readonly orderSaving = signal(false);
  protected readonly mutatingAdvertisementId = signal<number | null>(null);
  protected readonly deletingAdvertisementId = signal<number | null>(null);
  protected readonly draggingAdvertisementId = signal<number | null>(null);
  protected readonly dragOverAdvertisementId = signal<number | null>(null);
  protected readonly dragOverPlacement = signal<DropPlacement>('before');

  protected readonly themeForm = this.formBuilder.group({
    // SECTION A — General Colors
    mainColor: ['', [Validators.required, Validators.pattern(HEX_COLOR_PATTERN)]],
    secondaryColor: ['', [Validators.required, Validators.pattern(HEX_COLOR_PATTERN)]],
    backgroundColor: ['', [Validators.required, Validators.pattern(HEX_COLOR_PATTERN)]],
    headerColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    footerColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    mainTextColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],

    // SECTION B — Screen Behavior
    showLanguagePage: [false],
    defaultLanguageIsArabic: [false],
    alwaysRequireUserInput: [false],
    showServiceNavigationPath: [false],
    allowOperatorSelection: [false],
    allowRequestMoreServices: [false],

    // SECTION C — Language Button
    languageButtonBackgroundColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    languageButtonTextColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    languageButtonWidth: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    languageButtonHeight: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    languageButtonText: ['', [Validators.maxLength(200)]],

    // SECTION D — Service Button
    serviceButtonBackgroundColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    serviceButtonTextColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    serviceButtonWidth: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    serviceButtonHeight: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    serviceButtonSpace: [null as number | null, [Validators.min(0), Validators.max(100)]],
    serviceButtonFontSize: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    serviceButtonText: ['', [Validators.maxLength(200)]],

    // SECTION E — Keypad Button
    keypadButtonBackgroundColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    keypadButtonTextColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    keypadButtonWidth: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    keypadButtonHeight: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    keypadButtonText: ['', [Validators.maxLength(200)]],

    // SECTION F — Footer Button
    footerButtonBackgroundColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    footerButtonTextColor: ['', [Validators.pattern(HEX_COLOR_PATTERN)]],
    footerButtonWidth: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    footerButtonHeight: [null as number | null, [Validators.min(0.01), Validators.max(100)]],
    footerButtonText: ['', [Validators.maxLength(200)]],
  });

  protected readonly selectedBranchLabel = computed(() => {
    const selectedId = this.selectedBranchId();
    return this.branches().find((branch) => branch.id === selectedId)?.label ?? '';
  });

  protected readonly logoPreviewUrl = computed(() => {
    if (this.logoPreviewFailed()) {
      return null;
    }

    const selectedPreviewUrl = this.selectedLogoPreviewUrl();

    if (selectedPreviewUrl) {
      return selectedPreviewUrl;
    }

    const branding = this.branding();
    return this.branchBrandingApiService.resolveMediaUrl(
      branding?.logoUrl ?? null,
      branding?.rowVersion ?? null,
    );
  });

  protected readonly hasUnconfiguredBranding = computed(() => {
    const branding = this.branding();
    return !!branding && !branding.isConfigured;
  });

  protected readonly advertisementCount = computed(() => this.advertisements().length);
  protected readonly remainingAdvertisementSlots = computed(() =>
    Math.max(MAX_ADVERTISEMENTS - this.advertisementCount(), 0),
  );
  protected readonly advertisementLimitReached = computed(
    () => this.advertisementCount() >= MAX_ADVERTISEMENTS,
  );

  protected readonly orderDirty = computed(() => {
    const current = this.advertisements();
    const confirmed = this.confirmedAdvertisements();

    if (current.length !== confirmed.length) {
      return true;
    }

    return current.some((item, index) => {
      const confirmedItem = confirmed[index];
      return (
        !confirmedItem ||
        item.id !== confirmedItem.id ||
        item.displayOrder !== confirmedItem.displayOrder
      );
    });
  });

  protected readonly themeDirty = computed(() => {
    this.themeRevision();
    return this.themeForm.dirty;
  });

  protected readonly canSaveTheme = computed(() => {
    this.themeRevision();
    return (
      this.canUpdate() &&
      !!this.selectedBranchId() &&
      !this.themeSaving() &&
      !this.brandingLoading() &&
      this.themeForm.valid &&
      this.themeDirty()
    );
  });

  private formChangesSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.formChangesSubscription = this.themeForm.valueChanges.subscribe(() => {
      this.themeRevision.update((value) => value + 1);
    });
    this.loadBranches();
  }

  ngOnDestroy(): void {
    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
      this.formChangesSubscription = null;
    }

    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
    }

    this.revokeLogoPreviewUrl();
    this.revokeAdvertisementPreviewUrls();
  }

  protected selectBranch(event: Event): void {
    const branchId = Number((event.target as HTMLSelectElement).value);

    if (!Number.isInteger(branchId) || branchId <= 0) {
      this.selectedBranchId.set(null);
      return;
    }

    this.selectedBranchId.set(branchId);
    this.syncSelectedBranchQuery(branchId);
    this.clearSelections();
    this.loadSelectedBranchData();
  }

  protected refreshSelectedBranch(): void {
    this.loadSelectedBranchData();
  }

  protected updateThemeText(controlName: keyof typeof this.themeForm.controls, event: Event): void {
    const value = (event.target as HTMLInputElement).value.toUpperCase();
    this.updateThemeControl(controlName, value);
  }

  protected updateThemePicker(
    controlName: keyof typeof this.themeForm.controls,
    event: Event,
  ): void {
    const value = (event.target as HTMLInputElement).value.toUpperCase();
    this.updateThemeControl(controlName, value);
  }

  protected themeControlValue(controlName: keyof typeof this.themeForm.controls): string {
    return String(this.themeForm.controls[controlName].value ?? '');
  }

  protected themePickerValue(
    controlName: keyof typeof this.themeForm.controls,
    fallback = '#000000',
  ): string {
    const value = this.themeControlValue(controlName);
    return HEX_COLOR_PATTERN.test(value) ? value.toUpperCase() : fallback;
  }

  protected isThemeControlInvalid(controlName: keyof typeof this.themeForm.controls): boolean {
    const control = this.themeForm.controls[controlName];
    return control.touched && control.invalid;
  }

  protected themeControlError(controlName: keyof typeof this.themeForm.controls): string {
    const control = this.themeForm.controls[controlName];

    if (!this.isThemeControlInvalid(controlName)) {
      return '';
    }

    if (control.hasError('required')) {
      return this.copy().colorRequired;
    }
    if (control.hasError('pattern')) {
      return this.copy().colorInvalid;
    }
    if (control.hasError('min') || control.hasError('max')) {
      return this.copy().dimensionInvalid;
    }
    if (control.hasError('maxlength')) {
      return this.copy().textTooLong;
    }

    return '';
  }

  protected saveTheme(): void {
    if (!this.canSaveTheme()) {
      this.themeForm.markAllAsTouched();
      this.themeRevision.update((value) => value + 1);
      return;
    }

    const branchId = this.selectedBranchId();

    if (!branchId) {
      return;
    }

    const branding = this.branding();
    const isConfigured = branding?.isConfigured ?? false;

    const request: UpdateBranchThemeRequest = {
      mainColor: this.themeControlValue('mainColor').toUpperCase(),
      secondaryColor: this.themeControlValue('secondaryColor').toUpperCase(),
      backgroundColor: this.themeControlValue('backgroundColor').toUpperCase(),
      headerColor: this.normalizeOptionalColor('headerColor'),
      footerColor: this.normalizeOptionalColor('footerColor'),
      mainTextColor: this.normalizeOptionalColor('mainTextColor'),

      showLanguagePage: Boolean(this.themeForm.controls.showLanguagePage.value),
      defaultLanguageIsArabic: Boolean(this.themeForm.controls.defaultLanguageIsArabic.value),
      alwaysRequireUserInput: Boolean(this.themeForm.controls.alwaysRequireUserInput.value),
      showServiceNavigationPath: Boolean(this.themeForm.controls.showServiceNavigationPath.value),
      allowOperatorSelection: Boolean(this.themeForm.controls.allowOperatorSelection.value),
      allowRequestMoreServices: Boolean(this.themeForm.controls.allowRequestMoreServices.value),

      languageButtonBackgroundColor: this.normalizeOptionalColor('languageButtonBackgroundColor'),
      languageButtonTextColor: this.normalizeOptionalColor('languageButtonTextColor'),
      languageButtonWidth: this.normalizeOptionalNumber('languageButtonWidth'),
      languageButtonHeight: this.normalizeOptionalNumber('languageButtonHeight'),
      languageButtonText: this.normalizeOptionalText('languageButtonText'),

      serviceButtonBackgroundColor: this.normalizeOptionalColor('serviceButtonBackgroundColor'),
      serviceButtonTextColor: this.normalizeOptionalColor('serviceButtonTextColor'),
      serviceButtonWidth: this.normalizeOptionalNumber('serviceButtonWidth'),
      serviceButtonHeight: this.normalizeOptionalNumber('serviceButtonHeight'),
      serviceButtonSpace: this.normalizeOptionalNumber('serviceButtonSpace'),
      serviceButtonFontSize: this.normalizeOptionalNumber('serviceButtonFontSize'),
      serviceButtonText: this.normalizeOptionalText('serviceButtonText'),

      keypadButtonBackgroundColor: this.normalizeOptionalColor('keypadButtonBackgroundColor'),
      keypadButtonTextColor: this.normalizeOptionalColor('keypadButtonTextColor'),
      keypadButtonWidth: this.normalizeOptionalNumber('keypadButtonWidth'),
      keypadButtonHeight: this.normalizeOptionalNumber('keypadButtonHeight'),
      keypadButtonText: this.normalizeOptionalText('keypadButtonText'),

      footerButtonBackgroundColor: this.normalizeOptionalColor('footerButtonBackgroundColor'),
      footerButtonTextColor: this.normalizeOptionalColor('footerButtonTextColor'),
      footerButtonWidth: this.normalizeOptionalNumber('footerButtonWidth'),
      footerButtonHeight: this.normalizeOptionalNumber('footerButtonHeight'),
      footerButtonText: this.normalizeOptionalText('footerButtonText'),

      rowVersion: isConfigured ? (branding?.rowVersion ?? null) : null,
    };

    this.themeSaving.set(true);
    this.branchBrandingApiService.updateBranchTheme(branchId, request).subscribe({
      next: (updatedBranding) => {
        this.applyBranding(updatedBranding);
        this.showMessage('success', updatedBranding.message ?? this.copy().themeSaved);
      },
      error: (error: HttpErrorResponse) => this.handleApiError(error, () => this.loadBranding()),
      complete: () => this.themeSaving.set(false),
    });
  }

  private normalizeOptionalColor(controlName: keyof typeof this.themeForm.controls): string | null {
    const val = String(this.themeForm.controls[controlName].value ?? '').trim();
    return HEX_COLOR_PATTERN.test(val) ? val.toUpperCase() : null;
  }

  private normalizeOptionalNumber(
    controlName: keyof typeof this.themeForm.controls,
  ): number | null {
    const val = this.themeForm.controls[controlName].value;
    if (val === null || val === undefined || val === '') {
      return null;
    }
    const num = Number(val);
    return Number.isFinite(num) ? num : null;
  }

  private normalizeOptionalText(controlName: keyof typeof this.themeForm.controls): string | null {
    const val = String(this.themeForm.controls[controlName].value ?? '').trim();
    return val.length > 0 ? val : null;
  }

  protected selectLogoFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.logoValidationMessage.set('');

    if (!file) {
      this.selectedLogoFile.set(null);
      this.revokeLogoPreviewUrl();
      return;
    }

    const validationMessage = this.validateImageFile(file);

    if (validationMessage) {
      this.logoValidationMessage.set(validationMessage);
      this.selectedLogoFile.set(null);
      this.revokeLogoPreviewUrl();
      input.value = '';
      return;
    }

    this.selectedLogoFile.set(file);
    this.replaceLogoPreviewUrl(URL.createObjectURL(file));
  }

  protected uploadLogo(): void {
    const branchId = this.selectedBranchId();
    const file = this.selectedLogoFile();

    if (!branchId || !file || !this.canUpdate()) {
      return;
    }

    this.logoUploading.set(true);
    this.branchBrandingApiService
      .uploadBranchLogo(branchId, file, this.branding()?.rowVersion ?? null)
      .subscribe({
        next: (branding) => {
          this.applyBranding(branding);
          this.clearLogoSelection();
          this.showMessage('success', branding.message ?? this.copy().themeSaved);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error, () => this.loadBranding()),
        complete: () => this.logoUploading.set(false),
      });
  }

  protected selectAdvertisementFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.advertisementValidationMessage.set('');

    if (files.length === 0) {
      this.selectedAdvertisementFiles.set([]);
      this.revokeAdvertisementPreviewUrls();
      return;
    }

    const firstInvalidFile = files.find((file) => this.validateImageFile(file));

    if (firstInvalidFile) {
      this.advertisementValidationMessage.set(this.copy().invalidImage);
      this.clearAdvertisementSelection();
      return;
    }

    if (files.length > this.remainingAdvertisementSlots()) {
      this.advertisementValidationMessage.set(this.copy().tooManyImages);
      this.clearAdvertisementSelection();
      return;
    }

    this.selectedAdvertisementFiles.set(files);
    this.replaceAdvertisementPreviews(files);
  }

  protected uploadAdvertisements(): void {
    const branchId = this.selectedBranchId();
    const files = this.selectedAdvertisementFiles();

    if (
      !branchId ||
      files.length === 0 ||
      !this.canUpdate() ||
      files.length > this.remainingAdvertisementSlots()
    ) {
      return;
    }

    this.advertisementsUploading.set(true);
    this.branchBrandingApiService.addBranchAdvertisements(branchId, files).subscribe({
      next: () => {
        this.clearAdvertisementSelection();
        this.showMessage('success', this.copy().advertisementsUploaded);
        this.loadAdvertisements();
      },
      error: (error: HttpErrorResponse) =>
        this.handleApiError(error, () => this.loadAdvertisements()),
      complete: () => this.advertisementsUploading.set(false),
    });
  }

  protected cancelAdvertisementSelection(): void {
    this.clearAdvertisementSelection();
  }

  protected advertisementPreviewUrl(advertisement: BranchAdvertisementResponse): string | null {
    return this.branchBrandingApiService.resolveMediaUrl(
      advertisement.imageUrl,
      advertisement.rowVersion,
    );
  }

  protected markLogoPreviewFailed(): void {
    this.logoPreviewFailed.set(true);
  }

  protected isAdvertisementImageFailed(advertisementId: number): boolean {
    return this.failedAdvertisementImageIds().has(advertisementId);
  }

  protected markAdvertisementImageFailed(advertisementId: number): void {
    this.failedAdvertisementImageIds.update((current) => new Set([...current, advertisementId]));
  }

  protected onAdvertisementDragStart(event: DragEvent, advertisementId: number): void {
    if (!this.canUpdate() || this.orderSaving()) {
      event.preventDefault();
      return;
    }

    this.draggingAdvertisementId.set(advertisementId);
    this.dragOverAdvertisementId.set(null);

    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(advertisementId));
    }
  }

  protected onAdvertisementDragOver(event: DragEvent, targetIndex: number): void {
    if (!this.canUpdate() || this.orderSaving()) {
      return;
    }

    const draggedId = Number(event.dataTransfer?.getData('text/plain'));

    if (!Number.isInteger(draggedId)) {
      return;
    }

    event.preventDefault();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    const current = this.advertisements();
    const draggedIndex = current.findIndex((advertisement) => advertisement.id === draggedId);
    const targetAdvertisement = current[targetIndex];

    if (draggedIndex < 0 || !targetAdvertisement || draggedIndex === targetIndex) {
      this.dragOverAdvertisementId.set(null);
      return;
    }

    this.draggingAdvertisementId.set(draggedId);
    this.dragOverAdvertisementId.set(targetAdvertisement.id);
    this.dragOverPlacement.set(this.resolveDropPlacement(event));
  }

  protected onAdvertisementDrop(event: DragEvent, targetIndex: number): void {
    event.preventDefault();

    if (!this.canUpdate() || this.orderSaving()) {
      return;
    }

    const draggedId = Number(event.dataTransfer?.getData('text/plain'));

    if (!Number.isInteger(draggedId)) {
      return;
    }

    const current = [...this.advertisements()];
    const draggedIndex = current.findIndex((advertisement) => advertisement.id === draggedId);

    if (draggedIndex < 0) {
      return;
    }

    const targetElement = event.currentTarget as HTMLElement | null;
    let insertIndex = targetIndex;

    if (targetElement && this.resolveDropPlacement(event) === 'after') {
      insertIndex = targetIndex + 1;
    }

    if (insertIndex > current.length) {
      insertIndex = current.length;
    }

    if (draggedIndex < insertIndex) {
      insertIndex -= 1;
    }

    if (insertIndex === draggedIndex) {
      this.clearAdvertisementDragState();
      return;
    }

    const [draggedItem] = current.splice(draggedIndex, 1);
    current.splice(insertIndex, 0, draggedItem);
    this.advertisements.set(this.withContiguousOrders(current));
    this.clearAdvertisementDragState();
  }

  protected onAdvertisementDragLeave(advertisementId: number): void {
    if (this.dragOverAdvertisementId() === advertisementId) {
      this.dragOverAdvertisementId.set(null);
    }
  }

  protected onAdvertisementDragEnd(): void {
    this.clearAdvertisementDragState();
  }

  protected moveAdvertisementToOrder(event: Event, advertisementId: number): void {
    const targetOrder = Number((event.target as HTMLInputElement).value);

    if (!this.canUpdate() || this.orderSaving() || !Number.isInteger(targetOrder)) {
      return;
    }

    this.reorderAdvertisementByIndex(advertisementId, targetOrder);
  }

  protected moveAdvertisement(index: number, direction: -1 | 1): void {
    if (!this.canUpdate() || this.orderSaving()) {
      return;
    }

    const targetIndex = index + direction;
    const current = [...this.advertisements()];

    if (targetIndex < 0 || targetIndex >= current.length) {
      return;
    }

    const movedItem = current[index];
    current[index] = current[targetIndex];
    current[targetIndex] = movedItem;
    this.advertisements.set(this.withContiguousOrders(current));
  }

  private resolveDropPlacement(event: DragEvent): DropPlacement {
    const targetElement = event.currentTarget as HTMLElement | null;

    if (!targetElement) {
      return 'before';
    }

    const rect = targetElement.getBoundingClientRect();
    return event.clientX > rect.left + rect.width / 2 ? 'after' : 'before';
  }

  private clearAdvertisementDragState(): void {
    this.draggingAdvertisementId.set(null);
    this.dragOverAdvertisementId.set(null);
    this.dragOverPlacement.set('before');
  }
  private reorderAdvertisementByIndex(advertisementId: number, targetOrder: number): void {
    const current = [...this.advertisements()];
    const currentIndex = current.findIndex((advertisement) => advertisement.id === advertisementId);

    if (currentIndex < 0) {
      return;
    }

    const targetIndex = Math.max(0, Math.min(current.length - 1, targetOrder - 1));

    if (targetIndex === currentIndex) {
      return;
    }

    const [draggedItem] = current.splice(currentIndex, 1);
    current.splice(targetIndex, 0, draggedItem);
    this.advertisements.set(this.withContiguousOrders(current));
  }

  protected saveAdvertisementOrder(): void {
    const branchId = this.selectedBranchId();

    if (!branchId || !this.canUpdate() || !this.orderDirty()) {
      return;
    }

    const orderedAdvertisements = this.withContiguousOrders(this.advertisements());
    this.orderSaving.set(true);
    this.branchBrandingApiService
      .reorderBranchAdvertisements(branchId, {
        items: orderedAdvertisements.map((advertisement) => ({
          advertisementId: advertisement.id,
          displayOrder: advertisement.displayOrder,
          rowVersion: advertisement.rowVersion,
        })),
      })
      .subscribe({
        next: (advertisements) => {
          this.applyAdvertisements(advertisements);
          this.showMessage('success', this.copy().orderSaved);
        },
        error: (error: HttpErrorResponse) => {
          this.advertisements.set(this.confirmedAdvertisements());
          this.handleApiError(error, () => this.loadAdvertisements());
        },
        complete: () => this.orderSaving.set(false),
      });
  }

  protected toggleAdvertisementState(advertisement: BranchAdvertisementResponse): void {
    const branchId = this.selectedBranchId();

    if (!branchId || !this.canUpdate()) {
      return;
    }

    this.mutatingAdvertisementId.set(advertisement.id);
    const request = advertisement.isActive
      ? this.branchBrandingApiService.deactivateBranchAdvertisement(
          branchId,
          advertisement.id,
          advertisement.rowVersion,
        )
      : this.branchBrandingApiService.reactivateBranchAdvertisement(
          branchId,
          advertisement.id,
          advertisement.rowVersion,
        );

    request.subscribe({
      next: (response) => {
        this.updateAdvertisementState(response);
        this.showMessage('success', response.message);
      },
      error: (error: HttpErrorResponse) =>
        this.handleApiError(error, () => this.loadAdvertisements()),
      complete: () => this.mutatingAdvertisementId.set(null),
    });
  }

  protected deleteAdvertisement(advertisement: BranchAdvertisementResponse): void {
    const branchId = this.selectedBranchId();

    if (!branchId || !this.canUpdate() || !window.confirm(this.copy().confirmDelete)) {
      return;
    }

    this.deletingAdvertisementId.set(advertisement.id);
    this.branchBrandingApiService
      .deleteBranchAdvertisement(branchId, advertisement.id, advertisement.rowVersion)
      .subscribe({
        next: (response) => {
          this.removeAdvertisement(response.advertisementId);
          this.showMessage('success', response.message);
        },
        error: (error: HttpErrorResponse) =>
          this.handleApiError(error, () => this.loadAdvertisements()),
        complete: () => this.deletingAdvertisementId.set(null),
      });
  }

  protected clearMessage(): void {
    this.message.set(null);

    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = null;
    }
  }

  private loadBranches(): void {
    this.branchesLoading.set(true);
    this.branchManagementApiService
      .getBranches({
        searchText: '',
        orderSort: 'Newest',
        pageNumber: 1,
        pageSize: 100,
        isActive: null,
      })
      .subscribe({
        next: (response) => {
          const branchOptions = response.data.map((branch) => this.mapBranchOption(branch));
          this.branches.set(branchOptions);
          this.selectInitialBranch(branchOptions);
        },
        error: (error: HttpErrorResponse) => this.handleApiError(error),
        complete: () => this.branchesLoading.set(false),
      });
  }

  private selectInitialBranch(branches: readonly BranchOption[]): void {
    const queryBranchId = Number(this.route.snapshot.queryParamMap.get('branchId'));
    const nextBranchId = branches.some((branch) => branch.id === queryBranchId)
      ? queryBranchId
      : (branches[0]?.id ?? null);

    this.selectedBranchId.set(nextBranchId);

    if (nextBranchId) {
      this.syncSelectedBranchQuery(nextBranchId);
      this.loadSelectedBranchData();
    }
  }

  private loadSelectedBranchData(): void {
    if (!this.selectedBranchId()) {
      return;
    }

    this.loadBranding();
    this.loadAdvertisements();
  }

  private loadBranding(): void {
    const branchId = this.selectedBranchId();

    if (!branchId) {
      return;
    }

    this.brandingLoading.set(true);
    this.branchBrandingApiService.getBranchBranding(branchId).subscribe({
      next: (branding) => this.applyBranding(branding),
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.brandingLoading.set(false),
    });
  }

  private loadAdvertisements(): void {
    const branchId = this.selectedBranchId();

    if (!branchId) {
      return;
    }

    this.advertisementsLoading.set(true);
    this.branchBrandingApiService.getBranchAdvertisements(branchId).subscribe({
      next: (advertisements) => this.applyAdvertisements(advertisements),
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.advertisementsLoading.set(false),
    });
  }

  private applyBranding(branding: BranchBrandingResponse): void {
    this.logoPreviewFailed.set(false);
    this.branding.set(branding);
    this.themeForm.reset({
      mainColor: branding.mainColor ?? '',
      secondaryColor: branding.secondaryColor ?? '',
      backgroundColor: branding.backgroundColor ?? '',
      headerColor: branding.headerColor ?? '',
      footerColor: branding.footerColor ?? '',
      mainTextColor: branding.mainTextColor ?? '',

      showLanguagePage: branding.showLanguagePage ?? false,
      defaultLanguageIsArabic: branding.defaultLanguageIsArabic ?? false,
      alwaysRequireUserInput: branding.alwaysRequireUserInput ?? false,
      showServiceNavigationPath: branding.showServiceNavigationPath ?? false,
      allowOperatorSelection: branding.allowOperatorSelection ?? false,
      allowRequestMoreServices: branding.allowRequestMoreServices ?? false,

      languageButtonBackgroundColor: branding.languageButtonBackgroundColor ?? '',
      languageButtonTextColor: branding.languageButtonTextColor ?? '',
      languageButtonWidth: branding.languageButtonWidth ?? null,
      languageButtonHeight: branding.languageButtonHeight ?? null,
      languageButtonText: branding.languageButtonText ?? '',

      serviceButtonBackgroundColor: branding.serviceButtonBackgroundColor ?? '',
      serviceButtonTextColor: branding.serviceButtonTextColor ?? '',
      serviceButtonWidth: branding.serviceButtonWidth ?? null,
      serviceButtonHeight: branding.serviceButtonHeight ?? null,
      serviceButtonSpace: branding.serviceButtonSpace ?? null,
      serviceButtonFontSize: branding.serviceButtonFontSize ?? null,
      serviceButtonText: branding.serviceButtonText ?? '',

      keypadButtonBackgroundColor: branding.keypadButtonBackgroundColor ?? '',
      keypadButtonTextColor: branding.keypadButtonTextColor ?? '',
      keypadButtonWidth: branding.keypadButtonWidth ?? null,
      keypadButtonHeight: branding.keypadButtonHeight ?? null,
      keypadButtonText: branding.keypadButtonText ?? '',

      footerButtonBackgroundColor: branding.footerButtonBackgroundColor ?? '',
      footerButtonTextColor: branding.footerButtonTextColor ?? '',
      footerButtonWidth: branding.footerButtonWidth ?? null,
      footerButtonHeight: branding.footerButtonHeight ?? null,
      footerButtonText: branding.footerButtonText ?? '',
    });
    this.themeForm.markAsPristine();
    this.themeRevision.update((value) => value + 1);
  }

  private applyAdvertisements(advertisements: readonly BranchAdvertisementResponse[]): void {
    const orderedAdvertisements = [...advertisements].sort(
      (first, second) => first.displayOrder - second.displayOrder,
    );
    this.advertisements.set(orderedAdvertisements);
    this.confirmedAdvertisements.set(orderedAdvertisements);
    this.failedAdvertisementImageIds.set(new Set<number>());
  }

  private updateAdvertisementState(response: BranchAdvertisementStateResponse): void {
    const update = (items: readonly BranchAdvertisementResponse[]) =>
      items.map((item) =>
        item.id === response.advertisementId
          ? {
              ...item,
              isActive: response.isActive,
              displayOrder: response.displayOrder,
              rowVersion: response.rowVersion,
            }
          : item,
      );

    this.advertisements.set(update(this.advertisements()));
    this.confirmedAdvertisements.set(update(this.confirmedAdvertisements()));
  }

  private removeAdvertisement(advertisementId: number): void {
    const remove = (items: readonly BranchAdvertisementResponse[]) =>
      this.withContiguousOrders(items.filter((item) => item.id !== advertisementId));

    this.advertisements.set(remove(this.advertisements()));
    this.confirmedAdvertisements.set(remove(this.confirmedAdvertisements()));
  }

  private updateThemeControl(
    controlName: keyof typeof this.themeForm.controls,
    value: unknown,
  ): void {
    const control = this.themeForm.controls[controlName];
    control.setValue(value as never);
    control.markAsDirty();
    control.markAsTouched();
    this.themeRevision.update((current) => current + 1);
  }

  private withContiguousOrders(
    advertisements: readonly BranchAdvertisementResponse[],
  ): readonly BranchAdvertisementResponse[] {
    return advertisements.map((advertisement, index) => ({
      ...advertisement,
      displayOrder: index + 1,
    }));
  }

  private mapBranchOption(branch: BranchListItem): BranchOption {
    const preferredName =
      this.i18nStore.language() === 'ar' ? branch.arabicName : branch.englishName;
    const fallbackName =
      this.i18nStore.language() === 'ar' ? branch.englishName : branch.arabicName;
    const label = preferredName?.trim() || fallbackName?.trim() || `BR-${branch.branchId}`;

    return {
      id: branch.branchId,
      label,
    };
  }

  private validateImageFile(file: File): string {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    const hasAllowedType = ALLOWED_IMAGE_TYPES.has(file.type);
    const hasAllowedExtension = ALLOWED_IMAGE_EXTENSIONS.some((item) => item === extension);

    return hasAllowedType && hasAllowedExtension ? '' : this.copy().invalidImage;
  }

  private clearSelections(): void {
    this.clearLogoSelection();
    this.clearAdvertisementSelection();
  }

  private clearLogoSelection(): void {
    this.selectedLogoFile.set(null);
    this.revokeLogoPreviewUrl();
    this.logoValidationMessage.set('');
    const input = this.logoInput()?.nativeElement;

    if (input) {
      input.value = '';
    }
  }

  private clearAdvertisementSelection(): void {
    this.selectedAdvertisementFiles.set([]);
    this.revokeAdvertisementPreviewUrls();
    this.advertisementValidationMessage.set('');
    const input = this.advertisementsInput()?.nativeElement;

    if (input) {
      input.value = '';
    }
  }

  private replaceLogoPreviewUrl(nextUrl: string): void {
    this.revokeLogoPreviewUrl();
    this.logoPreviewFailed.set(false);
    this.selectedLogoPreviewUrl.set(nextUrl);
  }

  private revokeLogoPreviewUrl(): void {
    const currentUrl = this.selectedLogoPreviewUrl();

    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
      this.selectedLogoPreviewUrl.set(null);
    }

    this.logoPreviewFailed.set(false);
  }

  private replaceAdvertisementPreviews(files: readonly File[]): void {
    this.revokeAdvertisementPreviewUrls();
    this.selectedAdvertisementPreviews.set(
      files.map((file) => ({
        name: file.name,
        url: URL.createObjectURL(file),
      })),
    );
  }

  private revokeAdvertisementPreviewUrls(): void {
    for (const preview of this.selectedAdvertisementPreviews()) {
      URL.revokeObjectURL(preview.url);
    }

    this.selectedAdvertisementPreviews.set([]);
  }

  private handleApiError(error: HttpErrorResponse, onConflict?: () => void): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    if (error.status === 409 && onConflict) {
      this.showMessage('error', this.copy().conflict);
      onConflict();
      return;
    }

    this.showMessage('error', formatTechnicalAdminApiError(error, this.copy().genericError));
  }

  private showMessage(tone: UiMessageTone, text: string): void {
    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
    }

    this.message.set({ tone, text });
    this.messageTimeoutId = setTimeout(
      () => {
        this.message.set(null);
        this.messageTimeoutId = null;
      },
      tone === 'error' ? 7000 : 4500,
    );
  }

  private syncSelectedBranchQuery(branchId: number): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { branchId },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}
