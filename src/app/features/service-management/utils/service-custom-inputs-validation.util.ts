import { AbstractControl, FormArray, FormGroup, ValidationErrors, ValidatorFn } from '@angular/forms';
import { CustomInputType } from '../models/service-management/service-management.model';

export function stringRestrictionsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const type = group.get('type')?.value as CustomInputType;
    if (type !== 'String') {
      return null;
    }

    const minLengthVal = group.get('minLength')?.value;
    const maxLengthVal = group.get('maxLength')?.value;
    const startWithVal = group.get('startWith')?.value;

    const errors: ValidationErrors = {};

    if (minLengthVal !== null && minLengthVal !== undefined && minLengthVal !== '') {
      const min = Number(minLengthVal);
      if (Number.isNaN(min) || min < 0) {
        errors['invalidMinLength'] = true;
      }
    }

    if (maxLengthVal !== null && maxLengthVal !== undefined && maxLengthVal !== '') {
      const max = Number(maxLengthVal);
      if (Number.isNaN(max) || max <= 0 || max > 3000) {
        errors['invalidMaxLength'] = true;
      }
    }

    if (
      minLengthVal !== null &&
      minLengthVal !== undefined &&
      minLengthVal !== '' &&
      maxLengthVal !== null &&
      maxLengthVal !== undefined &&
      maxLengthVal !== ''
    ) {
      const min = Number(minLengthVal);
      const max = Number(maxLengthVal);
      if (!Number.isNaN(min) && !Number.isNaN(max) && max < min) {
        errors['invalidLengthRange'] = true;
      }
    }

    if (startWithVal !== null && startWithVal !== undefined && typeof startWithVal === 'string') {
      if (startWithVal.length > 100) {
        errors['startWithMaxLength'] = true;
      }
      if (startWithVal.length > 0 && startWithVal.trim().length === 0) {
        errors['startWithEmpty'] = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function integerRestrictionsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const group = control as FormGroup;
    const type = group.get('type')?.value as CustomInputType;
    if (type !== 'Integer') {
      return null;
    }

    const minValueVal = group.get('minValue')?.value;
    const maxValueVal = group.get('maxValue')?.value;

    const errors: ValidationErrors = {};

    if (
      minValueVal !== null &&
      minValueVal !== undefined &&
      minValueVal !== '' &&
      maxValueVal !== null &&
      maxValueVal !== undefined &&
      maxValueVal !== ''
    ) {
      const min = Number(minValueVal);
      const max = Number(maxValueVal);
      if (!Number.isNaN(min) && !Number.isNaN(max) && max < min) {
        errors['invalidValueRange'] = true;
      }
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}

export function customInputsArrayValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const array = control as FormArray;
    if (!array || array.length === 0) {
      return null;
    }

    const names = new Set<string>();
    const duplicateNames = new Set<string>();
    const orders = new Set<number>();
    const duplicateOrders = new Set<number>();

    for (let i = 0; i < array.length; i++) {
      const group = array.at(i) as FormGroup;
      const rawName = group.get('name')?.value;
      const rawOrder = group.get('order')?.value;

      if (rawName && typeof rawName === 'string') {
        const normalized = rawName.trim().toLowerCase();
        if (normalized.length > 0) {
          if (names.has(normalized)) {
            duplicateNames.add(normalized);
          } else {
            names.add(normalized);
          }
        }
      }

      if (rawOrder !== null && rawOrder !== undefined && rawOrder !== '') {
        const orderNum = Number(rawOrder);
        if (!Number.isNaN(orderNum) && orderNum > 0) {
          if (orders.has(orderNum)) {
            duplicateOrders.add(orderNum);
          } else {
            orders.add(orderNum);
          }
        }
      }
    }

    const errors: ValidationErrors = {};
    if (duplicateNames.size > 0) {
      errors['duplicateCustomInputNames'] = Array.from(duplicateNames);
    }
    if (duplicateOrders.size > 0) {
      errors['duplicateCustomInputOrders'] = Array.from(duplicateOrders);
    }

    return Object.keys(errors).length > 0 ? errors : null;
  };
}
