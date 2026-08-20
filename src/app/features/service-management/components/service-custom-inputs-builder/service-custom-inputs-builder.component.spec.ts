import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormArray } from '@angular/forms';
import { describe, it, expect, beforeEach } from 'vitest';
import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import {
  createCustomInputFormGroup,
  CustomInputFormGroup,
  ServiceCustomInputsBuilderComponent,
} from './service-custom-inputs-builder.component';

describe('ServiceCustomInputsBuilderComponent', () => {
  let component: ServiceCustomInputsBuilderComponent;
  let fixture: ComponentFixture<ServiceCustomInputsBuilderComponent>;
  let formArray: FormArray<CustomInputFormGroup>;

  beforeEach(async () => {
    formArray = new FormArray<CustomInputFormGroup>([]);

    await TestBed.configureTestingModule({
      imports: [ServiceCustomInputsBuilderComponent],
      providers: [TechnicalAdminI18nStore],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCustomInputsBuilderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('customInputs', formArray);
    fixture.detectChanges();
  });

  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should add input item with incremental order', () => {
    component.addInput();
    expect(formArray.length).toBe(1);
    expect(formArray.at(0).get('order')?.value).toBe(1);
    expect(formArray.at(0).get('type')?.value).toBe('String');

    component.addInput();
    expect(formArray.length).toBe(2);
    expect(formArray.at(1).get('order')?.value).toBe(2);
  });

  it('should remove input item by index', () => {
    component.addInput();
    component.addInput();
    expect(formArray.length).toBe(2);

    component.removeInput(0);
    expect(formArray.length).toBe(1);
  });

  it('should clear Integer restrictions when switched to String', () => {
    const group = createCustomInputFormGroup({
      type: 'Integer',
      minValue: 10,
      maxValue: 50,
    });
    formArray.push(group);

    component.onTypeChange(group, 'String');
    expect(group.get('type')?.value).toBe('String');
    expect(group.get('minValue')?.value).toBeNull();
    expect(group.get('maxValue')?.value).toBeNull();
  });

  it('should clear String restrictions when switched to Integer', () => {
    const group = createCustomInputFormGroup({
      type: 'String',
      minLength: 5,
      maxLength: 20,
      startWith: 'ABC',
    });
    formArray.push(group);

    component.onTypeChange(group, 'Integer');
    expect(group.get('type')?.value).toBe('Integer');
    expect(group.get('minLength')?.value).toBeNull();
    expect(group.get('maxLength')?.value).toBeNull();
    expect(group.get('startWith')?.value).toBe('');
  });

  it('should detect duplicate names case-insensitively', () => {
    formArray.push(createCustomInputFormGroup({ name: 'NationalId' }));
    formArray.push(createCustomInputFormGroup({ name: 'nationalid' }));

    expect(component.isNameDuplicate(0)).toBe(true);
    expect(component.isNameDuplicate(1)).toBe(true);
  });

  it('should detect duplicate orders', () => {
    formArray.push(createCustomInputFormGroup({ name: 'First', order: 1 }));
    formArray.push(createCustomInputFormGroup({ name: 'Second', order: 1 }));

    expect(component.isOrderDuplicate(0)).toBe(true);
    expect(component.isOrderDuplicate(1)).toBe(true);
  });
});
