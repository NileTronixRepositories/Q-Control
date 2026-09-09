import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { AuthSessionService, resolveJwtPermissions } from '@core';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { PageHeroComponent } from '@shared/components/page-hero/page-hero.component';
import { formatApiError } from '@shared/utils/api-error-message.util';
import {
  SaveTicketConfigurationRequest,
  TicketConfiguration,
  TicketConfigurationProblemDetails,
  TicketFontWeight,
  TicketPrintElement,
  TicketPrintElementType,
  TicketPrintLanguage,
  TicketTextAlign,
} from '../../models/ticket-template/ticket-template.model';
import { TicketConfigurationApiService } from '../../services/ticket-configuration-api/ticket-configuration-api.service';
import {
  createDefaultTicketElements,
  createEmptyTicketElements,
  DEFAULT_TICKET_ELEMENT_LAYOUT,
  TICKET_ELEMENT_META,
  TICKET_ELEMENT_TYPES,
  TICKET_SIZE_PRESETS,
  TicketSizePreset,
} from './ticket-template-builder.data';

type DesignerMode = 'loading' | 'create' | 'edit' | 'error';
type NoticeTone = 'success' | 'danger' | 'warning' | 'info';
interface TicketDraft {
  readonly ticketWidthMm: number;
  readonly ticketHeightMm: number;
  readonly elements: readonly TicketPrintElement[];
  readonly rowVersion: string | null;
}
interface PointerOperation {
  readonly type: TicketPrintElementType;
  readonly mode: 'move' | 'resize';
  readonly startX: number;
  readonly startY: number;
  readonly original: TicketPrintElement;
  readonly pixelsPerMm: number;
}

@Component({
  selector: 'app-ticket-template-builder',
  imports: [PageHeroComponent],
  templateUrl: './ticket-template-builder.component.html',
  styleUrl: './ticket-template-builder.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketTemplateBuilderComponent {
  private readonly api = inject(TicketConfigurationApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly branchContext = inject(AdminBranchContextStore);
  protected readonly i18n = inject(AdminI18nStore);
  protected readonly elementTypes = TICKET_ELEMENT_TYPES;
  protected readonly meta = TICKET_ELEMENT_META;
  protected readonly presets = TICKET_SIZE_PRESETS;
  protected readonly fontWeights: readonly TicketFontWeight[] = ['Normal', 'Bold'];
  protected readonly textAlignments: readonly TicketTextAlign[] = ['Left', 'Center', 'Right'];
  protected readonly languages: readonly TicketPrintLanguage[] = ['Ar', 'En'];
  protected readonly mode = signal<DesignerMode>('loading');
  protected readonly draft = signal<TicketDraft>(this.emptyDraft());
  protected readonly selectedType = signal<TicketPrintElementType>('TicketNumber');
  protected readonly logoUrl = signal<string | null>(null);
  protected readonly dirty = signal(false);
  protected readonly saving = signal(false);
  protected readonly showGrid = signal(true);
  protected readonly notice = signal<{ readonly tone: NoticeTone; readonly text: string } | null>(
    null,
  );
  private readonly pointerOperation = signal<PointerOperation | null>(null);
  protected readonly isArabic = computed(() => this.i18n.language() === 'ar');
  private readonly permissions = computed(() =>
    resolveJwtPermissions(this.auth.currentSession()?.token),
  );
  private readonly activeBranchId = computed(
    () =>
      this.branchContext.selectedBranchId() ?? this.auth.currentSession()?.activeBranchId ?? null,
  );
  protected readonly canCreate = computed(() =>
    this.permissions().has('TicketConfigurations.Create'),
  );
  protected readonly canUpdate = computed(() =>
    this.permissions().has('TicketConfigurations.Update'),
  );
  protected readonly canSave = computed(() =>
    this.mode() === 'create' ? this.canCreate() : this.canUpdate(),
  );
  protected readonly selectedElement = computed(
    () =>
      this.draft().elements.find((element) => element.elementType === this.selectedType()) ?? null,
  );
  protected readonly validation = computed(() => this.validate(this.draft()));
  protected readonly hasErrors = computed(() => this.validation().size > 0);
  protected readonly activeElementsCount = computed(
    () => this.draft().elements.filter((element) => element.isVisible).length,
  );
  protected readonly branchName = computed(() => {
    const branch = this.branchContext.selectedBranch();
    const sessionBranch = this.auth
      .currentSession()
      ?.branches.find((item) => item.branchId === this.activeBranchId());
    const activeBranch = branch ?? sessionBranch;
    if (!activeBranch) return this.isArabic() ? 'الفرع الحالي' : 'Current branch';
    return (
      (this.isArabic() ? activeBranch.arabicName : activeBranch.englishName).trim() ||
      `BR-${activeBranch.branchId}`
    );
  });

  constructor() {
    effect(() => {
      const branchId = this.activeBranchId();
      if (branchId) this.load(branchId);
      else {
        this.mode.set('error');
        this.notice.set({
          tone: 'warning',
          text: this.isArabic() ? 'اختر فرعًا أولًا.' : 'Select a branch first.',
        });
      }
    });
  }

  protected select(type: TicketPrintElementType): void {
    this.selectedType.set(type);
  }
  protected toggleGrid(): void {
    this.showGrid.update((value) => !value);
  }
  protected applyPreset(preset: TicketSizePreset): void {
    this.draft.update((draft) => ({
      ...draft,
      ticketWidthMm: preset.widthMm,
      ticketHeightMm: preset.heightMm,
    }));
    this.markDirty();
  }
  protected resetToDefaultLayout(): void {
    this.draft.update((draft) => ({
      ...draft,
      ticketWidthMm: 80,
      ticketHeightMm: 120,
      elements: createDefaultTicketElements(),
    }));
    this.markDirty();
    this.notice.set({
      tone: 'info',
      text: this.isArabic()
        ? 'تم تطبيق التخطيط الافتراضي المتوازن.'
        : 'Default balanced ticket layout applied.',
    });
  }
  protected centerSelectedElement(): void {
    const element = this.selectedElement();
    if (!element || element.widthMm === null) return;
    const ticketWidth = this.draft().ticketWidthMm;
    const centeredX = this.round(Math.max(0, (ticketWidth - element.widthMm) / 2));
    this.updateNumber('xMm', centeredX);
  }
  protected label(type: TicketPrintElementType): string {
    return this.isArabic() ? this.meta[type].labelAr : this.meta[type].labelEn;
  }
  protected previewText(element: TicketPrintElement): string {
    const item = this.meta[element.elementType];
    return element.language === 'En' ? item.previewEn : item.previewAr;
  }
  protected canvasElementStyle(element: TicketPrintElement): Record<string, string> {
    const width = this.draft().ticketWidthMm || 1;
    const height = this.draft().ticketHeightMm || 1;
    return {
      left: `${((element.xMm ?? 0) / width) * 100}%`,
      top: `${((element.yMm ?? 0) / height) * 100}%`,
      width: `${((element.widthMm ?? 0) / width) * 100}%`,
      height: `${((element.heightMm ?? 0) / height) * 100}%`,
      'font-size': `${element.fontSizePt ?? 10}pt`,
      'font-weight': element.fontWeight === 'Bold' ? '700' : '400',
      'text-align': element.textAlign?.toLowerCase() ?? 'left',
      'line-height': '1.35',
      direction: element.language === 'Ar' ? 'rtl' : 'ltr',
    };
  }
  protected updateDimension(key: 'ticketWidthMm' | 'ticketHeightMm', event: Event): void {
    const value = this.numberValue(event);
    this.draft.update((draft) => ({ ...draft, [key]: value ?? 0 }));
    this.markDirty();
  }
  protected toggleVisible(type: TicketPrintElementType): void {
    const current = this.draft().elements.find((item) => item.elementType === type);
    if (current) {
      const willBeVisible = !current.isVisible;
      const defaultProps = DEFAULT_TICKET_ELEMENT_LAYOUT[type];
      const needsDefaultPosition =
        willBeVisible &&
        (current.xMm === null ||
          current.yMm === null ||
          current.widthMm === null ||
          current.heightMm === null);
      const patch: Partial<TicketPrintElement> = {
        isVisible: willBeVisible,
        ...(needsDefaultPosition ? defaultProps : {}),
      };
      this.updateElement(type, patch);
      if (willBeVisible) {
        this.selectedType.set(type);
      }
    }
  }
  protected updateNumber(
    key: 'xMm' | 'yMm' | 'widthMm' | 'heightMm' | 'fontSizePt',
    eventOrValue: Event | number | null,
  ): void {
    const value =
      typeof eventOrValue === 'number' || eventOrValue === null
        ? eventOrValue
        : this.numberValue(eventOrValue);
    this.updateElement(this.selectedType(), { [key]: value });
  }
  protected updateEnum(key: 'fontWeight' | 'textAlign' | 'language', event: Event): void {
    this.updateElement(this.selectedType(), { [key]: (event.target as HTMLSelectElement).value });
  }
  protected setFontWeight(weight: TicketFontWeight): void {
    this.updateElement(this.selectedType(), { fontWeight: weight });
  }
  protected setTextAlign(alignment: TicketTextAlign): void {
    this.updateElement(this.selectedType(), { textAlign: alignment });
  }
  protected setLanguage(language: TicketPrintLanguage): void {
    this.updateElement(this.selectedType(), { language });
  }

  protected startPointer(
    event: PointerEvent,
    element: TicketPrintElement,
    mode: 'move' | 'resize',
  ): void {
    if (!this.canSave()) return;
    event.preventDefault();
    event.stopPropagation();
    this.select(element.elementType);
    const canvas = (event.currentTarget as HTMLElement).closest(
      '.ticket-canvas',
    ) as HTMLElement | null;
    if (!canvas || this.draft().ticketWidthMm <= 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.pointerOperation.set({
      type: element.elementType,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      original: element,
      pixelsPerMm: canvas.clientWidth / this.draft().ticketWidthMm,
    });
  }
  protected movePointer(event: PointerEvent): void {
    const operation = this.pointerOperation();
    if (!operation) return;
    const dx = (event.clientX - operation.startX) / operation.pixelsPerMm;
    const dy = (event.clientY - operation.startY) / operation.pixelsPerMm;
    const patch =
      operation.mode === 'move'
        ? {
            xMm: this.round((operation.original.xMm ?? 0) + dx),
            yMm: this.round((operation.original.yMm ?? 0) + dy),
          }
        : {
            widthMm: this.round((operation.original.widthMm ?? 0) + dx),
            heightMm: this.round((operation.original.heightMm ?? 0) + dy),
          };
    this.updateElement(operation.type, patch);
  }
  protected endPointer(): void {
    this.pointerOperation.set(null);
  }
  protected errorFor(type: TicketPrintElementType): string | null {
    return this.validation().get(type)?.[0] ?? null;
  }

  protected save(): void {
    const branchId = this.activeBranchId();
    if (!branchId || !this.canSave() || this.hasErrors()) {
      if (this.hasErrors())
        this.notice.set({
          tone: 'danger',
          text: this.isArabic()
            ? 'راجع أخطاء التصميم قبل الحفظ.'
            : 'Resolve the layout errors before saving.',
        });
      return;
    }
    const request = this.toRequest();
    this.saving.set(true);
    this.notice.set(null);
    const operation =
      this.mode() === 'create'
        ? this.api.create(branchId, request)
        : this.api.update(branchId, { ...request, rowVersion: this.draft().rowVersion ?? '' });
    operation.subscribe({
      next: (configuration) => this.applyConfiguration(configuration, true),
      error: (error: HttpErrorResponse) => this.handleSaveError(error, branchId),
    });
  }
  protected reload(): void {
    const branchId = this.activeBranchId();
    if (branchId) this.load(branchId);
  }
  canDeactivate(): boolean {
    return (
      !this.dirty() ||
      window.confirm(
        this.isArabic()
          ? 'لديك تغييرات غير محفوظة. هل تريد تجاهلها؟'
          : 'You have unsaved changes. Discard them?',
      )
    );
  }

  private load(branchId: number): void {
    this.mode.set('loading');
    this.notice.set(null);
    this.dirty.set(false);
    this.api.get(branchId).subscribe({
      next: (configuration) => this.applyConfiguration(configuration, false),
      error: (error: HttpErrorResponse) => {
        const code = this.errorCode(error);
        if (error.status === 404 && code === 'TicketConfigurations.View.NotFound') {
          this.draft.set(this.emptyDraft());
          this.mode.set('create');
          this.notice.set({
            tone: 'info',
            text: this.isArabic()
              ? 'لم تتم تهيئة تصميم التذكرة لهذا الفرع بعد.'
              : 'Ticket configuration has not been initialized for this branch.',
          });
        } else {
          this.mode.set('error');
          this.notice.set({
            tone: 'danger',
            text: formatApiError(
              error,
              this.isArabic()
                ? 'تعذر تحميل إعداد التذكرة.'
                : 'Could not load ticket configuration.',
            ),
          });
        }
      },
    });
    this.api.getBranding(branchId).subscribe({
      next: (branding) => this.logoUrl.set(this.api.resolveMediaUrl(branding.logoUrl)),
      error: () => this.logoUrl.set(null),
    });
  }
  private applyConfiguration(configuration: TicketConfiguration, saved: boolean): void {
    const order = new Map(this.elementTypes.map((type, index) => [type, index]));
    this.draft.set({
      ticketWidthMm: configuration.ticketWidthMm,
      ticketHeightMm: configuration.ticketHeightMm,
      elements: [...configuration.elements].sort(
        (a, b) => (order.get(a.elementType) ?? 0) - (order.get(b.elementType) ?? 0),
      ),
      rowVersion: configuration.rowVersion,
    });
    this.mode.set('edit');
    this.saving.set(false);
    this.dirty.set(false);
    if (saved)
      this.notice.set({
        tone: 'success',
        text: this.isArabic() ? 'تم حفظ إعداد التذكرة.' : 'Ticket configuration saved.',
      });
  }
  private handleSaveError(error: HttpErrorResponse, branchId: number): void {
    this.saving.set(false);
    const code = this.errorCode(error);
    if (this.mode() === 'create' && error.status === 409) {
      this.load(branchId);
      return;
    }
    if (code === 'TicketConfigurations.Update.ConcurrencyConflict') {
      this.notice.set({
        tone: 'warning',
        text: this.isArabic()
          ? 'عدّل مستخدم آخر الإعداد. أعد تحميل أحدث نسخة قبل المتابعة.'
          : 'Another user modified this configuration. Reload the latest version before continuing.',
      });
      return;
    }
    this.notice.set({
      tone: 'danger',
      text: formatApiError(
        error,
        this.isArabic() ? 'تعذر حفظ إعداد التذكرة.' : 'Could not save ticket configuration.',
      ),
    });
  }
  private updateElement(type: TicketPrintElementType, patch: Partial<TicketPrintElement>): void {
    this.draft.update((draft) => ({
      ...draft,
      elements: draft.elements.map((element) =>
        element.elementType === type ? this.normalizeElement({ ...element, ...patch }) : element,
      ),
    }));
    this.markDirty();
  }
  private normalizeElement(element: TicketPrintElement): TicketPrintElement {
    return element.elementType === 'BranchLogo'
      ? { ...element, fontSizePt: null, fontWeight: null, textAlign: null, language: null }
      : element;
  }
  private validate(
    draft: TicketDraft,
  ): ReadonlyMap<TicketPrintElementType | 'dimensions' | 'elements', readonly string[]> {
    const errors = new Map<TicketPrintElementType | 'dimensions' | 'elements', string[]>();
    const add = (key: TicketPrintElementType | 'dimensions' | 'elements', message: string) =>
      errors.set(key, [...(errors.get(key) ?? []), message]);
    if (
      !this.validPositivePrecision(draft.ticketWidthMm) ||
      !this.validPositivePrecision(draft.ticketHeightMm)
    )
      add(
        'dimensions',
        this.isArabic()
          ? 'الأبعاد يجب أن تكون موجبة وبحد أقصى منزلتين عشريتين.'
          : 'Dimensions must be positive with at most two decimal places.',
      );
    const unique = new Set(draft.elements.map((item) => item.elementType));
    if (
      draft.elements.length !== 8 ||
      unique.size !== 8 ||
      this.elementTypes.some((type) => !unique.has(type))
    )
      add(
        'elements',
        this.isArabic()
          ? 'يجب أن يحتوي التصميم على العناصر الثمانية مرة واحدة.'
          : 'The layout must contain all eight elements exactly once.',
      );
    const visible = draft.elements.filter((element) => element.isVisible);
    for (const element of visible) {
      const layout = [element.xMm, element.yMm, element.widthMm, element.heightMm];
      if (
        layout.some((value) => value === null) ||
        (element.xMm ?? -1) < 0 ||
        (element.yMm ?? -1) < 0 ||
        (element.widthMm ?? 0) <= 0 ||
        (element.heightMm ?? 0) <= 0 ||
        layout.some((value) => value !== null && !this.hasTwoDecimals(value))
      )
        add(
          element.elementType,
          this.isArabic()
            ? 'بيانات الموضع والحجم غير مكتملة أو غير صالحة.'
            : 'Position and size are incomplete or invalid.',
        );
      else if (
        (element.xMm ?? 0) + (element.widthMm ?? 0) > draft.ticketWidthMm ||
        (element.yMm ?? 0) + (element.heightMm ?? 0) > draft.ticketHeightMm
      )
        add(
          element.elementType,
          this.isArabic() ? 'العنصر يتجاوز حدود التذكرة.' : 'Element exceeds ticket boundaries.',
        );
      if (
        this.meta[element.elementType].kind === 'text' &&
        ((element.fontSizePt ?? 0) <= 0 ||
          !element.fontWeight ||
          !element.textAlign ||
          !element.language)
      )
        add(
          element.elementType,
          this.isArabic() ? 'خصائص الخط واللغة مطلوبة.' : 'Typography and language are required.',
        );
    }
    for (let i = 0; i < visible.length; i++)
      for (let j = i + 1; j < visible.length; j++)
        if (this.overlaps(visible[i], visible[j])) {
          add(
            visible[i].elementType,
            this.isArabic()
              ? `يوجد تداخل مع ${this.label(visible[j].elementType)}.`
              : `Overlaps ${this.label(visible[j].elementType)}.`,
          );
          add(
            visible[j].elementType,
            this.isArabic()
              ? `يوجد تداخل مع ${this.label(visible[i].elementType)}.`
              : `Overlaps ${this.label(visible[i].elementType)}.`,
          );
        }
    return errors;
  }
  private overlaps(a: TicketPrintElement, b: TicketPrintElement): boolean {
    if (
      [a.xMm, a.yMm, a.widthMm, a.heightMm, b.xMm, b.yMm, b.widthMm, b.heightMm].some(
        (value) => value === null,
      )
    )
      return false;
    return (
      a.xMm! < b.xMm! + b.widthMm! &&
      a.xMm! + a.widthMm! > b.xMm! &&
      a.yMm! < b.yMm! + b.heightMm! &&
      a.yMm! + a.heightMm! > b.yMm!
    );
  }
  private toRequest(): SaveTicketConfigurationRequest {
    const draft = this.draft();
    return {
      ticketWidthMm: this.round(draft.ticketWidthMm),
      ticketHeightMm: this.round(draft.ticketHeightMm),
      elements: draft.elements.map((element) =>
        this.normalizeElement({
          ...element,
          xMm: this.roundNullable(element.xMm),
          yMm: this.roundNullable(element.yMm),
          widthMm: this.roundNullable(element.widthMm),
          heightMm: this.roundNullable(element.heightMm),
          fontSizePt: this.roundNullable(element.fontSizePt),
        }),
      ),
    };
  }
  private emptyDraft(): TicketDraft {
    return {
      ticketWidthMm: 80,
      ticketHeightMm: 120,
      elements: createEmptyTicketElements(),
      rowVersion: null,
    };
  }
  private markDirty(): void {
    this.dirty.set(true);
    this.notice.set(null);
  }
  private numberValue(event: Event): number | null {
    const raw = (event.target as HTMLInputElement).value;
    return raw === '' ? null : Number(raw);
  }
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
  private roundNullable(value: number | null): number | null {
    return value === null ? null : this.round(value);
  }
  private hasTwoDecimals(value: number): boolean {
    return Number.isFinite(value) && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8;
  }
  private validPositivePrecision(value: number): boolean {
    return value > 0 && this.hasTwoDecimals(value);
  }
  private errorCode(error: HttpErrorResponse): string {
    const body = error.error as TicketConfigurationProblemDetails | null;
    const nestedCode = body?.errors
      ?.map((item) => item.code?.trim())
      .find((code): code is string => Boolean(code));
    return nestedCode ?? body?.code?.trim() ?? '';
  }
}
