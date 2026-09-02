import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceCustomInput } from '../../../service-management/models/service-management/service-management.model';
import { SERVICE_REQUEST_TRANSLATIONS } from '../../models/language/language.model';
import { ServiceRequestStore } from '../../store/service-request.store';
import { CustomerInputFormComponent } from './customer-input-form.component';

describe('CustomerInputFormComponent', () => {
  let component: CustomerInputFormComponent;
  let fixture: ComponentFixture<CustomerInputFormComponent>;

  const mockCustomInputs: readonly ServiceCustomInput[] = [
    {
      customInputId: 1,
      name: 'NationalId',
      labelAr: 'الرقم القومي',
      labelEn: 'National ID',
      type: 'String',
      isRequired: true,
      minLength: 14,
      maxLength: 14,
      startWith: '2',
      order: 1,
    },
    {
      customInputId: 2,
      name: 'Age',
      labelAr: 'العمر',
      labelEn: 'Age',
      type: 'Integer',
      isRequired: false,
      minValue: 18,
      maxValue: 100,
      order: 2,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerInputFormComponent],
      providers: [
        {
          provide: ServiceRequestStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
            translations: signal(SERVICE_REQUEST_TRANSLATIONS.en).asReadonly(),
            keypadButton: signal(null).asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerInputFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customInputs', mockCustomInputs);
    fixture.detectChanges();
  });

  it('should create component and initialize dynamic form controls', () => {
    expect(component).toBeTruthy();
    expect(component.form.get('NationalId')).toBeTruthy();
    expect(component.form.get('Age')).toBeTruthy();
  });

  it('should validate string requirements (required, length, startWith)', () => {
    const nationalIdControl = component.form.get('NationalId')!;

    // Empty when required
    nationalIdControl.setValue('');
    expect(nationalIdControl.valid).toBe(false);

    // Wrong length
    nationalIdControl.setValue('212345');
    expect(nationalIdControl.valid).toBe(false);

    // Does not start with '2'
    nationalIdControl.setValue('31234567890123');
    expect(nationalIdControl.hasError('startWithMismatch')).toBe(true);

    // Valid 14 chars starting with '2'
    nationalIdControl.setValue('21234567890123');
    expect(nationalIdControl.valid).toBe(true);
  });

  it('should validate integer requirements (range, integerOnly)', () => {
    const ageControl = component.form.get('Age')!;

    // Non integer
    ageControl.setValue('abc');
    expect(ageControl.hasError('integerOnly')).toBe(true);

    // Less than min
    ageControl.setValue('15');
    expect(ageControl.hasError('min')).toBe(true);

    // Greater than max
    ageControl.setValue('120');
    expect(ageControl.hasError('max')).toBe(true);

    // Valid age
    ageControl.setValue('25');
    expect(ageControl.valid).toBe(true);
  });

  it('should handle on-screen touch keypad interactions', () => {
    component.setActiveField('NationalId');
    component.appendDigit('2');
    component.appendDigit('9');
    expect(component.getFieldValue('NationalId')).toBe('29');

    component.backspace();
    expect(component.getFieldValue('NationalId')).toBe('2');

    component.clearActiveField();
    expect(component.getFieldValue('NationalId')).toBe('');
  });

  it('should emit confirmed event with properly typed values when valid', () => {
    const emitSpy = vi.fn();
    component.confirmed.subscribe(emitSpy);

    component.form.get('NationalId')!.setValue('21234567890123');
    component.form.get('Age')!.setValue('28');

    component.onSubmit();

    expect(emitSpy).toHaveBeenCalledWith({
      NationalId: '21234567890123',
      Age: 28,
    });
  });
});
