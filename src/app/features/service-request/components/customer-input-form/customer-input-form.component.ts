import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ServiceCustomInput } from '../../../service-management/models/service-management/service-management.model';
import { ServiceRequestStore } from '../../store/service-request.store';

@Component({
  selector: 'app-service-request-customer-input-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './customer-input-form.component.html',
  styleUrl: './customer-input-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerInputFormComponent {
  protected readonly store = inject(ServiceRequestStore);
  private readonly cdr = inject(ChangeDetectorRef);

  public readonly customInputs = input.required<readonly ServiceCustomInput[]>();
  public readonly serviceTitle = input<string>('');
  public readonly mode = input<'create' | 'search'>('create');

  public readonly confirmed = output<Record<string, string | number>>();
  public readonly cancelled = output<void>();

  public readonly sortedInputs = computed(() => {
    return [...this.customInputs()].sort((a, b) => a.order - b.order);
  });

  public readonly activeFieldName = signal<string>('');
  public readonly formVersion = signal<number>(0);
  public readonly searchValidationError = signal<string | null>(null);

  public readonly hasAtLeastOneValue = computed(() => {
    this.formVersion();
    const raw = this.form.getRawValue();
    return Object.values(raw).some(
      (val) => val !== null && val !== undefined && String(val).trim().length > 0,
    );
  });

  public readonly activeField = computed(() => {
    const active = this.activeFieldName();
    const list = this.sortedInputs();
    return list.find((i) => i.name === active) ?? list[0] ?? null;
  });

  public readonly activeFieldIndex = computed(() => {
    const active = this.activeField();
    if (!active) return -1;
    return this.sortedInputs().findIndex((i) => i.name === active.name);
  });

  public readonly hasMultipleFields = computed(() => this.sortedInputs().length > 1);

  public readonly isFirstFieldActive = computed(() => this.activeFieldIndex() <= 0);

  public readonly isLastFieldActive = computed(() => {
    const idx = this.activeFieldIndex();
    return idx >= 0 && idx === this.sortedInputs().length - 1;
  });

  public readonly form = new FormGroup<{ [key: string]: AbstractControl<any> }>({});

  public readonly isRtl = computed(() => this.store.direction() === 'rtl');
  public readonly translations = this.store.translations;

  constructor() {
    effect(() => {
      const inputs = this.sortedInputs();
      this.rebuildForm(inputs);
      const currentActive = untracked(this.activeFieldName);
      if (inputs.length > 0 && (!currentActive || !inputs.some((i) => i.name === currentActive))) {
        this.activeFieldName.set(inputs[0].name);
      }
    });

    this.form.valueChanges.subscribe(() => {
      this.formVersion.update((v) => v + 1);
      this.cdr.markForCheck();
    });
  }

  public setActiveField(name: string): void {
    this.activeFieldName.set(name);
    const control = this.getControl(name);
    if (control) {
      control.markAsTouched();
    }
    this.cdr.markForCheck();
  }

  public selectNextField(): void {
    const list = this.sortedInputs();
    const currIdx = this.activeFieldIndex();
    if (currIdx >= 0 && currIdx < list.length - 1) {
      this.setActiveField(list[currIdx + 1].name);
    }
  }

  public selectPrevField(): void {
    const list = this.sortedInputs();
    const currIdx = this.activeFieldIndex();
    if (currIdx > 0) {
      this.setActiveField(list[currIdx - 1].name);
    }
  }

  public appendDigit(digit: string): void {
    const active = this.activeField();
    if (!active) return;

    const control = this.getControl(active.name);
    if (!control) return;

    const currentVal = String(control.value ?? '');

    // Max length check
    if (active.maxLength && currentVal.length >= active.maxLength) {
      // If full and there's a next field, switch to next and append
      const nextIdx = this.activeFieldIndex() + 1;
      const list = this.sortedInputs();
      if (nextIdx < list.length) {
        this.setActiveField(list[nextIdx].name);
        this.appendDigit(digit);
      }
      return;
    }

    const newVal = currentVal + digit;
    control.setValue(newVal);
    control.markAsDirty();
    control.markAsTouched();
    this.formVersion.update((v) => v + 1);
    this.cdr.markForCheck();

    // Auto-advance if reached maxLength and has next field
    if (active.maxLength && newVal.length === active.maxLength) {
      const nextIdx = this.activeFieldIndex() + 1;
      const list = this.sortedInputs();
      if (nextIdx < list.length) {
        this.setActiveField(list[nextIdx].name);
      }
    }
  }

  public backspace(): void {
    const active = this.activeField();
    if (!active) return;

    const control = this.getControl(active.name);
    if (!control) return;

    const currentVal = String(control.value ?? '');
    if (currentVal.length > 0) {
      control.setValue(currentVal.slice(0, -1));
      control.markAsDirty();
      control.markAsTouched();
    } else {
      // If empty, jump to previous field if any
      this.selectPrevField();
    }
    this.formVersion.update((v) => v + 1);
    this.cdr.markForCheck();
  }

  public clearActiveField(): void {
    const active = this.activeField();
    if (active) {
      this.clearField(active.name);
    }
  }

  public clearField(name: string): void {
    const control = this.getControl(name);
    if (control) {
      control.setValue('');
      control.markAsDirty();
      control.markAsTouched();
      this.formVersion.update((v) => v + 1);
      this.cdr.markForCheck();
    }
  }

  public onFieldInput(name: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const item = this.sortedInputs().find((i) => i.name === name);
    this.formVersion.update((v) => v + 1);
    this.cdr.markForCheck();

    if (item && item.maxLength && input.value.length === item.maxLength) {
      const nextIdx = this.activeFieldIndex() + 1;
      const list = this.sortedInputs();
      if (nextIdx < list.length) {
        this.setActiveField(list[nextIdx].name);
      }
    }
  }

  public getFieldLabel(item: ServiceCustomInput): string {
    const lang = this.store.language();
    if (lang === 'ar') {
      return item.labelAr?.trim() || item.labelEn?.trim() || item.name;
    }
    return item.labelEn?.trim() || item.labelAr?.trim() || item.name;
  }

  public getFieldIcon(item: ServiceCustomInput): string {
    const key = `${item.name} ${item.labelAr ?? ''} ${item.labelEn ?? ''}`.toLowerCase();
    if (
      key.includes('national') ||
      key.includes('قومي') ||
      key.includes('هوية') ||
      key.includes('id') ||
      key.includes('nid')
    ) {
      return 'bi-person-vcard';
    }
    if (
      key.includes('phone') ||
      key.includes('mobile') ||
      key.includes('هاتف') ||
      key.includes('موبايل') ||
      key.includes('جوال') ||
      key.includes('tel')
    ) {
      return 'bi-phone';
    }
    if (
      key.includes('mrn') ||
      key.includes('file') ||
      key.includes('ملف') ||
      key.includes('تأمين') ||
      key.includes('record')
    ) {
      return 'bi-folder2-open';
    }
    if (
      key.includes('age') ||
      key.includes('عمر') ||
      key.includes('سن') ||
      key.includes('birth') ||
      key.includes('ميلاد')
    ) {
      return 'bi-calendar3';
    }
    if (
      key.includes('complaint') ||
      key.includes('reason') ||
      key.includes('شكوى') ||
      key.includes('سبب') ||
      key.includes('استشارة')
    ) {
      return 'bi-chat-heart';
    }
    return 'bi-input-cursor-text';
  }

  public getControl(name: string): FormControl | null {
    return (this.form.get(name) as FormControl) ?? null;
  }

  public getFieldValue(name: string): string {
    this.formVersion();
    const control = this.getControl(name);
    return control ? String(control.value ?? '') : '';
  }

  public isFieldActive(name: string): boolean {
    return this.activeFieldName() === name;
  }

  public isFieldValid(name: string): boolean {
    this.formVersion();
    const control = this.getControl(name);
    if (!control) return false;
    return control.valid && Boolean(control.value);
  }

  public hasError(name: string, errorKey?: string): boolean {
    this.formVersion();
    const control = this.getControl(name);
    if (!control || (!control.touched && !control.dirty)) {
      return false;
    }
    return errorKey ? control.hasError(errorKey) : control.invalid;
  }

  public onSubmit(): void {
    this.searchValidationError.set(null);

    if (this.mode() === 'search') {
      if (!this.hasAtLeastOneValue()) {
        this.searchValidationError.set(this.translations().atLeastOneInputRequired);
        this.cdr.markForCheck();
        return;
      }
    } else {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        this.formVersion.update((v) => v + 1);
        this.cdr.markForCheck();
        // focus the first invalid field
        const firstInvalid = this.sortedInputs().find((item) => this.getControl(item.name)?.invalid);
        if (firstInvalid) {
          this.setActiveField(firstInvalid.name);
        }
        return;
      }
    }

    const rawValues = this.form.getRawValue();
    const result: Record<string, string | number> = {};

    for (const item of this.sortedInputs()) {
      const val = rawValues[item.name];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        if (item.type === 'Integer') {
          result[item.name] = Number(val);
        } else {
          result[item.name] = String(val).trim();
        }
      }
    }

    this.confirmed.emit(result);
  }

  private buildValidators(item: ServiceCustomInput): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    const isSearch = this.mode() === 'search';

    if (item.isRequired && !isSearch) {
      validators.push(Validators.required);
    }

    if (item.type === 'String') {
      if (item.minLength !== null && item.minLength !== undefined && item.minLength > 0) {
        validators.push((control: AbstractControl): ValidationErrors | null => {
          const val = control.value;
          if (!val || typeof val !== 'string') return null;
          return val.length < item.minLength! ? { minlength: { requiredLength: item.minLength, actualLength: val.length } } : null;
        });
      }
      if (item.maxLength !== null && item.maxLength !== undefined && item.maxLength > 0) {
        validators.push((control: AbstractControl): ValidationErrors | null => {
          const val = control.value;
          if (!val || typeof val !== 'string') return null;
          return val.length > item.maxLength! ? { maxlength: { requiredLength: item.maxLength, actualLength: val.length } } : null;
        });
      }
      if (item.startWith && item.startWith.trim().length > 0) {
        const prefix = item.startWith.trim();
        validators.push((control: AbstractControl): ValidationErrors | null => {
          const val = control.value;
          if (!val || typeof val !== 'string') {
            return null;
          }
          return val.startsWith(prefix) ? null : { startWithMismatch: { expected: prefix } };
        });
      }
    } else if (item.type === 'Integer') {
      validators.push((control: AbstractControl): ValidationErrors | null => {
        const val = control.value;
        if (val === null || val === undefined || val === '') {
          return null;
        }
        const isInt = /^-?\d+$/.test(String(val).trim());
        return isInt ? null : { integerOnly: true };
      });

      if (item.minValue !== null && item.minValue !== undefined) {
        validators.push(Validators.min(item.minValue));
      }
      if (item.maxValue !== null && item.maxValue !== undefined) {
        validators.push(Validators.max(item.maxValue));
      }
    }

    return validators;
  }

  private rebuildForm(inputs: readonly ServiceCustomInput[]): void {
    const existingValues = this.form.getRawValue();
    const existingKeys = new Set(Object.keys(this.form.controls));
    const newKeys = new Set(inputs.map((i) => i.name));

    for (const key of existingKeys) {
      if (!newKeys.has(key)) {
        this.form.removeControl(key, { emitEvent: false });
      }
    }

    for (const item of inputs) {
      const validators = this.buildValidators(item);
      const existingControl = this.form.get(item.name);

      if (existingControl) {
        existingControl.setValidators(validators);
        existingControl.updateValueAndValidity({ emitEvent: false });
      } else {
        const initialVal = existingValues[item.name] ?? '';
        this.form.addControl(
          item.name,
          new FormControl(initialVal, { nonNullable: true, validators }),
        );
      }
    }

    this.form.updateValueAndValidity({ emitEvent: false });
  }
}
