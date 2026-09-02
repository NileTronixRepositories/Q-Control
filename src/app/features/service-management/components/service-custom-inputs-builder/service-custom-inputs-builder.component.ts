import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import {
  CustomInputType,
  ServiceCustomInput,
} from '../../models/service-management/service-management.model';
import {
  integerRestrictionsValidator,
  stringRestrictionsValidator,
} from '../../utils/service-custom-inputs-validation.util';

export type CustomInputFormGroup = FormGroup<{
  customInputId: FormControl<number | null>;
  name: FormControl<string>;
  labelAr: FormControl<string>;
  labelEn: FormControl<string>;
  type: FormControl<CustomInputType>;
  isRequired: FormControl<boolean>;
  order: FormControl<number>;
  minLength: FormControl<number | null>;
  maxLength: FormControl<number | null>;
  startWith: FormControl<string>;
  minValue: FormControl<number | null>;
  maxValue: FormControl<number | null>;
}>;

export function createCustomInputFormGroup(
  initial?: Partial<ServiceCustomInput> | null,
): CustomInputFormGroup {
  const raw = (initial ?? {}) as Record<string, unknown>;

  const resolveNumber = (...keys: string[]): number | null => {
    for (const key of keys) {
      const val = raw[key];
      if (val !== undefined && val !== null && val !== '') {
        const parsed = Number(val);
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    return null;
  };

  const resolveString = (...keys: string[]): string => {
    for (const key of keys) {
      const val = raw[key];
      if (val !== undefined && val !== null) {
        return String(val);
      }
    }
    return '';
  };

  const rawType = resolveString('type', 'Type', 'typeName', 'TypeName') || 'String';
  const type: CustomInputType = rawType.toLowerCase() === 'integer' ? 'Integer' : 'String';

  const minLength = resolveNumber(
    'minLength',
    'MinLength',
    'minimumLength',
    'MinimumLength',
    'min_length',
  );
  const maxLength = resolveNumber(
    'maxLength',
    'MaxLength',
    'maximumLength',
    'MaximumLength',
    'max_length',
  );
  const startWith = resolveString(
    'startWith',
    'StartWith',
    'startsWith',
    'StartsWith',
    'start_with',
  );
  const minValue = resolveNumber(
    'minValue',
    'MinValue',
    'minimumValue',
    'MinimumValue',
    'min_value',
    'min',
    'Min',
  );
  const maxValue = resolveNumber(
    'maxValue',
    'MaxValue',
    'maximumValue',
    'MaximumValue',
    'max_value',
    'max',
    'Max',
  );
  const customInputId = resolveNumber('customInputId', 'CustomInputId', 'id', 'Id');
  const order = resolveNumber('order', 'Order', 'orderNo', 'OrderNo', 'displayOrder') ?? 1;

  const isRequiredRaw =
    raw['isRequired'] ?? raw['IsRequired'] ?? raw['required'] ?? raw['Required'];
  const isRequired =
    isRequiredRaw !== undefined && isRequiredRaw !== null ? Boolean(isRequiredRaw) : true;

  return new FormGroup(
    {
      customInputId: new FormControl<number | null>(customInputId),
      name: new FormControl<string>(resolveString('name', 'Name'), {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      labelAr: new FormControl<string>(
        resolveString('labelAr', 'LabelAr', 'arabicLabel', 'ArabicLabel'),
        {
          nonNullable: true,
          validators: [Validators.maxLength(200)],
        },
      ),
      labelEn: new FormControl<string>(
        resolveString('labelEn', 'LabelEn', 'englishLabel', 'EnglishLabel'),
        {
          nonNullable: true,
          validators: [Validators.maxLength(200)],
        },
      ),
      type: new FormControl<CustomInputType>(type, {
        nonNullable: true,
        validators: [Validators.required],
      }),
      isRequired: new FormControl<boolean>(isRequired, {
        nonNullable: true,
      }),
      order: new FormControl<number>(order, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      minLength: new FormControl<number | null>(minLength),
      maxLength: new FormControl<number | null>(maxLength),
      startWith: new FormControl<string>(startWith, {
        nonNullable: true,
      }),
      minValue: new FormControl<number | null>(minValue),
      maxValue: new FormControl<number | null>(maxValue),
    },
    {
      validators: [stringRestrictionsValidator(), integerRestrictionsValidator()],
    },
  );
}

@Component({
  selector: 'app-service-custom-inputs-builder',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './service-custom-inputs-builder.component.html',
  styleUrls: ['./service-custom-inputs-builder.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCustomInputsBuilderComponent {
  private readonly i18nStore = inject(AdminI18nStore);

  public readonly customInputs = input.required<FormArray<CustomInputFormGroup>>();
  public readonly disabled = input<boolean>(false);

  public readonly translations = computed(
    () => SERVICE_MANAGEMENT_TRANSLATIONS[this.i18nStore.language()],
  );
  public readonly language = this.i18nStore.language;
  public readonly direction = this.i18nStore.direction;

  public addInput(): void {
    const array = this.customInputs();
    let nextOrder = 1;
    for (let i = 0; i < array.length; i++) {
      const ord = Number(array.at(i).get('order')?.value);
      if (!Number.isNaN(ord) && ord >= nextOrder) {
        nextOrder = ord + 1;
      }
    }

    const group = createCustomInputFormGroup({ order: nextOrder });
    array.push(group);
    array.markAsDirty();
  }

  public removeInput(index: number): void {
    const array = this.customInputs();
    if (index >= 0 && index < array.length) {
      array.removeAt(index);
      array.markAsDirty();
    }
  }

  public onTypeChange(group: CustomInputFormGroup, newType: CustomInputType): void {
    group.patchValue({ type: newType });
    if (newType === 'String') {
      group.patchValue({
        minValue: null,
        maxValue: null,
      });
    } else {
      group.patchValue({
        minLength: null,
        maxLength: null,
        startWith: '',
      });
    }
    group.updateValueAndValidity();
    this.customInputs().markAsDirty();
  }

  public isNameDuplicate(index: number): boolean {
    const array = this.customInputs();
    const currentGroup = array.at(index);
    const rawName = currentGroup.get('name')?.value?.trim().toLowerCase();
    if (!rawName) {
      return false;
    }

    for (let i = 0; i < array.length; i++) {
      if (i !== index) {
        const otherName = array.at(i).get('name')?.value?.trim().toLowerCase();
        if (otherName === rawName) {
          return true;
        }
      }
    }
    return false;
  }

  public isOrderDuplicate(index: number): boolean {
    const array = this.customInputs();
    const currentGroup = array.at(index);
    const rawOrder = Number(currentGroup.get('order')?.value);
    if (!rawOrder || rawOrder <= 0) {
      return false;
    }

    for (let i = 0; i < array.length; i++) {
      if (i !== index) {
        const otherOrder = Number(array.at(i).get('order')?.value);
        if (otherOrder === rawOrder) {
          return true;
        }
      }
    }
    return false;
  }

  public hasGroupError(group: CustomInputFormGroup, errorCode: string): boolean {
    return group.touched && group.hasError(errorCode);
  }

  public hasControlError(
    group: CustomInputFormGroup,
    controlName: keyof CustomInputFormGroup['controls'],
    errorCode?: string,
  ): boolean {
    const control = group.get(controlName as string);
    if (!control || !control.touched) {
      return false;
    }
    return errorCode ? control.hasError(errorCode) : control.invalid;
  }
}
