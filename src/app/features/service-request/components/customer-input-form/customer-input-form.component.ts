import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
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

  public readonly customInputs = input.required<readonly ServiceCustomInput[]>();
  public readonly serviceTitle = input<string>('');

  public readonly confirmed = output<Record<string, string | number>>();
  public readonly cancelled = output<void>();

  public readonly sortedInputs = computed(() => {
    return [...this.customInputs()].sort((a, b) => a.order - b.order);
  });

  public readonly form = new FormGroup<{ [key: string]: AbstractControl<any> }>({});

  public readonly isRtl = computed(() => this.store.direction() === 'rtl');
  public readonly translations = this.store.translations;

  constructor() {
    effect(() => {
      const inputs = this.sortedInputs();
      this.rebuildForm(inputs);
    });
  }

  public getFieldLabel(item: ServiceCustomInput): string {
    const lang = this.store.language();
    if (lang === 'ar') {
      return item.labelAr?.trim() || item.labelEn?.trim() || item.name;
    }
    return item.labelEn?.trim() || item.labelAr?.trim() || item.name;
  }

  public getControl(name: string): FormControl | null {
    return (this.form.get(name) as FormControl) ?? null;
  }

  public hasError(name: string, errorKey?: string): boolean {
    const control = this.getControl(name);
    if (!control || (!control.touched && !control.dirty)) {
      return false;
    }
    return errorKey ? control.hasError(errorKey) : control.invalid;
  }

  public clearField(name: string): void {
    const control = this.getControl(name);
    if (control) {
      control.setValue('');
      control.markAsDirty();
    }
  }

  public onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const rawValues = this.form.getRawValue();
    const result: Record<string, string | number> = {};

    for (const item of this.sortedInputs()) {
      const val = rawValues[item.name];
      if (val !== undefined && val !== null && val !== '') {
        if (item.type === 'Integer') {
          result[item.name] = Number(val);
        } else {
          result[item.name] = String(val).trim();
        }
      }
    }

    this.confirmed.emit(result);
  }

  private rebuildForm(inputs: readonly ServiceCustomInput[]): void {
    const existingControlKeys = Object.keys(this.form.controls);
    for (const key of existingControlKeys) {
      this.form.removeControl(key, { emitEvent: false });
    }

    for (const item of inputs) {
      const validators: ValidatorFn[] = [];

      if (item.isRequired) {
        validators.push(Validators.required);
      }

      if (item.type === 'String') {
        if (item.minLength !== null && item.minLength !== undefined && item.minLength > 0) {
          validators.push(Validators.minLength(item.minLength));
        }
        if (item.maxLength !== null && item.maxLength !== undefined && item.maxLength > 0) {
          validators.push(Validators.maxLength(item.maxLength));
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

      this.form.addControl(item.name, new FormControl('', { nonNullable: true, validators }));
    }

    this.form.updateValueAndValidity();
  }
}
