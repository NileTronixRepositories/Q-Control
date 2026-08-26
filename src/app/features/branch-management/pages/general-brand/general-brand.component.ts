import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import {
  CreateGeneralBrandRequest,
  GeneralBrandResponse,
  UpdateGeneralBrandRequest,
} from '@features/branch-management/models/general-brand/general-brand.model';
import { GeneralBrandApiService } from '@features/branch-management/services/general-brand-api/general-brand-api.service';
import { GeneralBrandPermissionService } from '@features/branch-management/services/general-brand-permission/general-brand-permission.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';

type UiMessageTone = 'success' | 'error' | 'info';

interface UiMessage {
  readonly tone: UiMessageTone;
  readonly text: string;
}

interface GeneralBrandPageTranslations {
  readonly pageEyebrow: string;
  readonly pageTitle: string;
  readonly pageDescription: string;
  readonly refreshLabel: string;
  readonly generalBrandSection: string;
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
  readonly saveBrand: string;
  readonly createBrand: string;
  readonly notConfiguredNotice: string;
  readonly colorRequired: string;
  readonly colorInvalid: string;
  readonly dimensionInvalid: string;
  readonly textTooLong: string;
  readonly readOnlyNotice: string;
  readonly loading: string;
  readonly conflict: string;
  readonly genericError: string;
  readonly brandSaved: string;
  readonly close: string;
}

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

const PAGE_TRANSLATIONS: Record<AppLanguage, GeneralBrandPageTranslations> = {
  ar: {
    pageEyebrow: 'إدارة النظام العامة',
    pageTitle: 'الهوية البصرية العامة (GeneralBrand)',
    pageDescription:
      'تحكم في الإعداد العام الشامل للتصميم والسلوك لشاشة إصدار التذاكر على مستوى النظام كـ Fallback عند عدم وجود إعدادات خاصة بالفرع.',
    refreshLabel: 'تحديث',
    generalBrandSection: 'الإعدادات العامة للهوية والشاشة',
    themeColors: 'ألوان الهوية البصرية العامة',
    mainColor: 'اللون الرئيسي',
    secondaryColor: 'اللون الثانوي',
    backgroundColor: 'لون الخلفية',
    headerColor: 'لون الهيدر',
    footerColor: 'لون الفوتر',
    mainTextColor: 'لون النص الرئيسي',
    generalColorsSection: 'الألوان العامة',
    behaviorSection: 'سلوك شاشة طلب الخدمة العام',
    showLanguagePageLabel: 'إظهار صفحة اختيار اللغة',
    defaultLanguageIsArabicLabel: 'اللغة الافتراضية هي العربية',
    alwaysRequireUserInputLabel: 'تطلب إدخال بيانات من المستخدم دائماً',
    showServiceNavigationPathLabel: 'إظهار مسار التنقل بين الخدمات',
    allowOperatorSelectionLabel: 'السماح باختيار الموظف / تقديم الخدمة',
    allowRequestMoreServicesLabel: 'السماح بطلب المزيد من الخدمات',
    languageButtonSection: 'إعدادات زر اللغة',
    serviceButtonSection: 'إعدادات زر الخدمة',
    keypadButtonSection: 'إعدادات لوحة الأرقام',
    footerButtonSection: 'إعدادات زر الفوتر ',
    buttonBackgroundColorLabel: 'لون خلفية الزر',
    buttonTextColorLabel: 'لون نص الزر',
    buttonWidthLabel: 'عرض الزر (%)',
    buttonHeightLabel: 'ارتفاع الزر (%)',
    buttonTextLabel: 'نص الزر',
    serviceButtonSpaceLabel: 'المسافة بين أزرار الخدمات (%)',
    serviceButtonFontSizeLabel: 'حجم خط أزرار الخدمات (rem)',
    saveBrand: 'حفظ التحديثات',
    createBrand: 'إنشاء الهوية العامة',
    notConfiguredNotice: 'لم يتم إعداد الهوية البصرية العامة بعد. يمكنك إنشاؤها الآن.',
    colorRequired: 'هذا اللون مطلوب.',
    colorInvalid: 'استخدم صيغة #RRGGBB فقط.',
    dimensionInvalid: 'يجب أن تكون القيمة بين 0 و 100.',
    textTooLong: 'لا يمكن أن يتجاوز النص 200 حرف.',
    readOnlyNotice: 'يمكنك عرض البيانات فقط لأن صلاحية التحديث غير متاحة.',
    loading: 'جاري التحميل...',
    conflict:
      'تم تعديل البيانات بواسطة مستخدم آخر. تم إعادة جلب البيانات برجاء المراجعة والحفظ مجدداً.',
    genericError: 'حدث خطأ غير متوقع.',
    brandSaved: 'تم حفظ إعدادات الهوية البصرية العامة بنجاح.',
    close: 'إغلاق',
  },
  en: {
    pageEyebrow: 'System Administration',
    pageTitle: 'General Brand Configuration',
    pageDescription:
      'Manage the single global branding and behavior configuration fallback for ticket issuance across the system.',
    refreshLabel: 'Refresh',
    generalBrandSection: 'General Brand & Layout',
    themeColors: 'General Identity Colors',
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
    saveBrand: 'Save General Brand',
    createBrand: 'Create General Brand',
    notConfiguredNotice: 'General Brand has not been configured yet. You can create it now.',
    colorRequired: 'This color is required.',
    colorInvalid: 'Use #RRGGBB format only.',
    dimensionInvalid: 'Must be a value between 0 and 100.',
    textTooLong: 'Text cannot exceed 200 characters.',
    readOnlyNotice: 'You can view this data only because update permission is not available.',
    loading: 'Loading...',
    conflict:
      'The data was modified by another user. Latest server data has been loaded for your review.',
    genericError: 'Unexpected error occurred.',
    brandSaved: 'General Brand settings saved successfully.',
    close: 'Close',
  },
};

@Component({
  selector: 'app-general-brand',
  imports: [ReactiveFormsModule, PageHeroComponent, NiletronixLoadingStateComponent],
  templateUrl: './general-brand.component.html',
  styleUrls: [
    './general-brand.component.css',
    '../branch-branding/branch-branding.component.css',
    '../branch-branding/branch-branding-identity.component.css',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralBrandComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly i18nStore = inject(AdminI18nStore);
  private readonly generalBrandApiService = inject(GeneralBrandApiService);
  private readonly permissionService = inject(GeneralBrandPermissionService);
  private messageTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly themeRevision = signal(0);

  protected readonly language = this.i18nStore.language;
  protected readonly direction = this.i18nStore.direction;
  protected readonly copy = computed(() => PAGE_TRANSLATIONS[this.i18nStore.language()]);

  protected readonly canCreate = this.permissionService.canCreate;
  protected readonly canUpdate = this.permissionService.canUpdate;
  protected readonly canModify = computed(() =>
    this.isConfigured() ? this.canUpdate() : this.canCreate(),
  );

  protected readonly generalBrand = signal<GeneralBrandResponse | null>(null);
  protected readonly isConfigured = computed(() => this.generalBrand()?.isConfigured ?? false);
  protected readonly rowVersion = computed(() => this.generalBrand()?.rowVersion ?? null);

  protected readonly message = signal<UiMessage | null>(null);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);

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

  protected readonly themeDirty = computed(() => {
    this.themeRevision();
    return this.themeForm.dirty;
  });

  protected readonly canSave = computed(() => {
    this.themeRevision();
    return (
      this.canModify() &&
      !this.saving() &&
      !this.loading() &&
      this.themeForm.valid &&
      (this.themeDirty() || !this.isConfigured())
    );
  });

  private formChangesSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.formChangesSubscription = this.themeForm.valueChanges.subscribe(() => {
      this.themeRevision.update((v) => v + 1);
    });
    this.loadData();
  }

  ngOnDestroy(): void {
    if (this.formChangesSubscription) {
      this.formChangesSubscription.unsubscribe();
      this.formChangesSubscription = null;
    }

    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
    }
  }

  protected refresh(): void {
    this.loadData();
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

  protected save(): void {
    if (!this.canSave()) {
      this.themeForm.markAllAsTouched();
      this.themeRevision.update((v) => v + 1);
      return;
    }

    const isConfigured = this.isConfigured();

    if (!isConfigured) {
      this.executeCreate();
    } else {
      this.executeUpdate();
    }
  }

  private executeCreate(): void {
    const request: CreateGeneralBrandRequest = this.buildRequestPayload();

    this.saving.set(true);
    this.generalBrandApiService.createGeneralBrand(request).subscribe({
      next: (response) => {
        this.applyBrandResponse(response);
        this.showMessage('success', response.message ?? this.copy().brandSaved);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          // AC11: Handle duplicate creation by re-fetching and switching to Update Mode
          this.showMessage('info', this.copy().conflict);
          this.loadData();
          return;
        }
        this.handleApiError(error);
      },
      complete: () => this.saving.set(false),
    });
  }

  private executeUpdate(): void {
    const request: UpdateGeneralBrandRequest = {
      ...this.buildRequestPayload(),
      rowVersion: this.rowVersion() ?? undefined,
    };

    this.saving.set(true);
    this.generalBrandApiService.updateGeneralBrand(request).subscribe({
      next: (response) => {
        this.applyBrandResponse(response);
        this.showMessage('success', response.message ?? this.copy().brandSaved);
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 409) {
          // AC12: Handle stale RowVersion by re-fetching current data
          this.showMessage('error', this.copy().conflict);
          this.loadData();
          return;
        }
        if (error.status === 404) {
          this.showMessage('error', this.copy().notConfiguredNotice);
          this.loadData();
          return;
        }
        this.handleApiError(error);
      },
      complete: () => this.saving.set(false),
    });
  }

  private buildRequestPayload(): CreateGeneralBrandRequest {
    return {
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
    };
  }

  private loadData(): void {
    this.loading.set(true);
    this.generalBrandApiService.getGeneralBrand().subscribe({
      next: (brand) => this.applyBrandResponse(brand),
      error: (error: HttpErrorResponse) => this.handleApiError(error),
      complete: () => this.loading.set(false),
    });
  }

  private applyBrandResponse(brand: GeneralBrandResponse): void {
    this.generalBrand.set(brand);
    this.themeForm.reset({
      mainColor: brand.mainColor ?? '',
      secondaryColor: brand.secondaryColor ?? '',
      backgroundColor: brand.backgroundColor ?? '',
      headerColor: brand.headerColor ?? '',
      footerColor: brand.footerColor ?? '',
      mainTextColor: brand.mainTextColor ?? '',

      showLanguagePage: brand.showLanguagePage ?? false,
      defaultLanguageIsArabic: brand.defaultLanguageIsArabic ?? false,
      alwaysRequireUserInput: brand.alwaysRequireUserInput ?? false,
      showServiceNavigationPath: brand.showServiceNavigationPath ?? false,
      allowOperatorSelection: brand.allowOperatorSelection ?? false,
      allowRequestMoreServices: brand.allowRequestMoreServices ?? false,

      languageButtonBackgroundColor: brand.languageButtonBackgroundColor ?? '',
      languageButtonTextColor: brand.languageButtonTextColor ?? '',
      languageButtonWidth: brand.languageButtonWidth ?? null,
      languageButtonHeight: brand.languageButtonHeight ?? null,
      languageButtonText: brand.languageButtonText ?? '',

      serviceButtonBackgroundColor: brand.serviceButtonBackgroundColor ?? '',
      serviceButtonTextColor: brand.serviceButtonTextColor ?? '',
      serviceButtonWidth: brand.serviceButtonWidth ?? null,
      serviceButtonHeight: brand.serviceButtonHeight ?? null,
      serviceButtonSpace: brand.serviceButtonSpace ?? null,
      serviceButtonFontSize: brand.serviceButtonFontSize ?? null,
      serviceButtonText: brand.serviceButtonText ?? '',

      keypadButtonBackgroundColor: brand.keypadButtonBackgroundColor ?? '',
      keypadButtonTextColor: brand.keypadButtonTextColor ?? '',
      keypadButtonWidth: brand.keypadButtonWidth ?? null,
      keypadButtonHeight: brand.keypadButtonHeight ?? null,
      keypadButtonText: brand.keypadButtonText ?? '',

      footerButtonBackgroundColor: brand.footerButtonBackgroundColor ?? '',
      footerButtonTextColor: brand.footerButtonTextColor ?? '',
      footerButtonWidth: brand.footerButtonWidth ?? null,
      footerButtonHeight: brand.footerButtonHeight ?? null,
      footerButtonText: brand.footerButtonText ?? '',
    });
    this.themeForm.markAsPristine();
    this.themeRevision.update((v) => v + 1);
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

  private handleApiError(error: HttpErrorResponse): void {
    if (this.authSessionService.shouldClearSessionForHttpStatus(error.status)) {
      this.authSessionService.clearSession();
      void this.router.navigateByUrl('/login');
      return;
    }

    this.showMessage('error', formatApiError(error, this.copy().genericError));
  }

  protected clearMessage(): void {
    this.message.set(null);
    if (this.messageTimeoutId) {
      clearTimeout(this.messageTimeoutId);
      this.messageTimeoutId = null;
    }
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
}
