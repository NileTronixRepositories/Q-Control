import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';

import { BranchServicesTranslations } from '../../i18n/branch-services.translations';
import {
  CreateBranchServiceTreeNodeRequest,
  CreateBranchServiceTreeRequest,
} from '../../models/branch-services/branch-services.model';

export type CreateBranchServiceTreeMode = 'root' | 'subtree';

type NodeForm = FormGroup<{
  arabicName: FormControl<string>;
  englishName: FormControl<string>;
  isServiceCodeRequired: FormControl<boolean>;
  serviceCode: FormControl<string>;
  arabicUserMessage: FormControl<string>;
  englishUserMessage: FormControl<string>;
  isTicketIssuable: FormControl<boolean>;
  isClientInputRequired: FormControl<boolean>;
  hasReservation: FormControl<boolean>;
  orderNo: FormControl<number>;
  priority: FormControl<number>;
  rangePrefix: FormControl<string>;
  rangeStartNumber: FormControl<number | null>;
  rangeEndNumber: FormControl<number | null>;
  waitingDuration: FormControl<number | null>;
  noOfTicketCopies: FormControl<number | null>;
  children: FormArray<NodeForm>;
}>;

@Component({
  selector: 'app-create-branch-service-tree-dialog',
  standalone: true,
  imports: [NgTemplateOutlet, ReactiveFormsModule],
  templateUrl: './create-branch-service-tree-dialog.component.html',
  styleUrl: './create-branch-service-tree-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateBranchServiceTreeDialogComponent {

  readonly open = input.required<boolean>();
  readonly saving = input.required<boolean>();
  readonly resetKey = input(0);
  readonly translations = input.required<BranchServicesTranslations>();
  readonly mode = input<CreateBranchServiceTreeMode>('root');
  readonly parentLabel = input<string | null>(null);
  readonly leafOnly = input(false);

  readonly closed = output<void>();
  readonly created = output<CreateBranchServiceTreeRequest>();

  readonly validationError = signal<string | null>(null);

  private currentResetKey = this.resetKey();
  private readonly duplicateServiceCodeControls = new Set<FormControl<string>>();

  readonly root = this.createNodeForm();

  protected readonly dialogTitle = computed(() =>
    this.leafOnly()
      ? this.translations().createLeafTitle
      : this.mode() === 'subtree'
        ? this.translations().createSubtreeTitle
        : this.translations().createTreeTitle,
  );
  protected readonly dialogDescription = computed(() =>
    this.leafOnly()
      ? this.translations().createLeafDescription
      : this.mode() === 'subtree'
        ? this.translations().createSubtreeDescription
        : this.translations().createTreeDescription,
  );
  protected readonly dialogActionLabel = computed(() =>
    this.mode() === 'subtree' ? this.translations().addChild : this.translations().createBranchTree,
  );

  private readonly resetOnKeyChange = effect(() => {
    const resetKey = this.resetKey();

    if (resetKey === this.currentResetKey) {
      return;
    }

    this.currentResetKey = resetKey;
    this.reset();
  });

  protected childrenControls(group: NodeForm): FormArray<NodeForm> {
    return group.controls.children;
  }

  protected addChild(group: NodeForm): void {
    if (this.leafOnly()) return;
    group.controls.isTicketIssuable.setValue(false);
    this.childrenControls(group).push(this.createNodeForm());
  }

  protected removeChild(parent: NodeForm, index: number): void {
    this.clearDuplicateServiceCodeErrors(this.childrenControls(parent).at(index));
    this.childrenControls(parent).removeAt(index);
  }

  protected nodeServiceCodeError(group: NodeForm): string {
    const control = group.controls.serviceCode;

    if (control.hasError('duplicateServiceCode')) {
      return this.translations().duplicateServiceCodeInTree;
    }

    if (control.hasError('maxlength')) {
      return this.translations().serviceCodeMaxLength;
    }

    if (control.hasError('serviceCodeMustBeEmpty')) {
      return this.translations().serviceCodeMustBeEmpty;
    }

    return this.translations().serviceCodeRequiredError;
  }

  protected onNodeServiceCodeRequiredChange(group: NodeForm, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;

    if (!checked) {
      group.controls.serviceCode.setValue('', { emitEvent: false });
      group.controls.serviceCode.markAsPristine();
    }

    this.clearServiceCodeError(group, 'duplicateServiceCode');
    this.applyNodeServiceCodeValidation(group);
  }

  protected onNodeServiceCodeInput(group: NodeForm): void {
    this.clearServiceCodeError(group, 'duplicateServiceCode');
    this.applyNodeServiceCodeValidation(group);
  }

  protected submit(): void {
    this.validationError.set(null);
    this.root.markAllAsTouched();
    this.clearDuplicateServiceCodeErrors(this.root);

    if (this.hasDuplicateServiceCodes()) {
      this.validationError.set(this.translations().duplicateServiceCodeInTree);
      return;
    }

    const error = this.validateNode(this.root);

    if (error) {
      this.validationError.set(error);
      return;
    }

    if (this.leafOnly()) this.root.controls.children.clear();
    this.created.emit({ root: this.mapNode(this.root) });
  }

  protected close(): void {
    if (!this.saving()) {
      this.reset();
      this.closed.emit();
    }
  }

  private createNodeForm(): NodeForm {
    return new FormGroup({
      arabicName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      englishName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      isServiceCodeRequired: new FormControl(false, { nonNullable: true }),
      serviceCode: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.maxLength(100),
          (control: AbstractControl<string>) => this.nodeServiceCodeValidator(control),
        ],
      }),
      arabicUserMessage: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(500)],
      }),
      englishUserMessage: new FormControl('', {
        nonNullable: true,
        validators: [Validators.maxLength(500)],
      }),
      isTicketIssuable: new FormControl(false, { nonNullable: true }),
      isClientInputRequired: new FormControl(false, { nonNullable: true }),
      hasReservation: new FormControl(false, { nonNullable: true }),
      orderNo: new FormControl(1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      priority: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
      rangePrefix: new FormControl('', { nonNullable: true }),
      rangeStartNumber: new FormControl<number | null>(null),
      rangeEndNumber: new FormControl<number | null>(null),
      waitingDuration: new FormControl<number | null>(null),
      noOfTicketCopies: new FormControl<number | null>(null),
      children: new FormArray<NodeForm>([]),
    });
  }

  private validateNode(group: NodeForm): string | null {
    this.applyNodeServiceCodeValidation(group);

    if (group.controls.serviceCode.touched && group.controls.serviceCode.invalid) {
      return this.nodeServiceCodeError(group);
    }

    if (group.invalid) {
      return this.translations().requiredField;
    }

    const children = this.childrenControls(group).controls;
    const value = group.getRawValue();

    if (children.length > 0 && value.isTicketIssuable) {
      return this.translations().ticketParentError;
    }

    if (value.isTicketIssuable && !this.hasTicketSettings(value)) {
      return this.translations().ticketSettingsRequired;
    }

    const arabicNames = new Set<string>();
    const englishNames = new Set<string>();

    for (const child of children) {
      const childValue = child.getRawValue();
      const arabicName = childValue.arabicName.trim().toLocaleLowerCase();
      const englishName = childValue.englishName.trim().toLocaleLowerCase();

      if (
        (arabicName && arabicNames.has(arabicName)) ||
        (englishName && englishNames.has(englishName))
      ) {
        return this.translations().duplicateSiblingName;
      }

      arabicNames.add(arabicName);
      englishNames.add(englishName);

      const childError = this.validateNode(child);

      if (childError) {
        return childError;
      }
    }

    return null;
  }

  private hasDuplicateServiceCodes(): boolean {
    const byCode = new Map<string, NodeForm[]>();

    for (const node of this.collectNodes(this.root)) {
      const value = node.getRawValue();
      const code = value.isServiceCodeRequired ? value.serviceCode.trim() : '';

      if (!code) {
        continue;
      }

      byCode.set(code, [...(byCode.get(code) ?? []), node]);
    }

    let hasDuplicates = false;

    byCode.forEach((nodes) => {
      if (nodes.length <= 1) {
        return;
      }

      hasDuplicates = true;
      nodes.forEach((node) => this.setServiceCodeError(node, 'duplicateServiceCode'));
    });

    return hasDuplicates;
  }

  private collectNodes(group: NodeForm): NodeForm[] {
    return [
      group,
      ...this.childrenControls(group).controls.flatMap((child) => this.collectNodes(child)),
    ];
  }

  private applyNodeServiceCodeValidation(group: NodeForm): void {
    group.controls.serviceCode.updateValueAndValidity({ emitEvent: false });
  }

  private clearDuplicateServiceCodeErrors(group: NodeForm): void {
    this.clearServiceCodeError(group, 'duplicateServiceCode');
    this.childrenControls(group).controls.forEach((child) =>
      this.clearDuplicateServiceCodeErrors(child),
    );
  }

  private setServiceCodeError(group: NodeForm, key: string): void {
    const control = group.controls.serviceCode;

    if (key === 'duplicateServiceCode') {
      this.duplicateServiceCodeControls.add(control);
    }

    control.updateValueAndValidity({ emitEvent: false });
    control.markAsTouched();
  }

  private clearServiceCodeError(group: NodeForm, key: string): void {
    const control = group.controls.serviceCode;

    if (key === 'duplicateServiceCode') {
      this.duplicateServiceCodeControls.delete(control);
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private nodeServiceCodeValidator(control: AbstractControl<string>): ValidationErrors | null {
    const group = control.parent as NodeForm | null;
    const errors: ValidationErrors = {};
    const normalizedCode = control.value.trim();

    if (this.duplicateServiceCodeControls.has(control as FormControl<string>)) {
      errors['duplicateServiceCode'] = true;
    }

    if (group?.controls.isServiceCodeRequired.value) {
      if (!normalizedCode) {
        errors['serviceCodeRequired'] = true;
      }
    } else if (normalizedCode) {
      errors['serviceCodeMustBeEmpty'] = true;
    }

    return Object.keys(errors).length > 0 ? errors : null;
  }

  private hasTicketSettings(value: ReturnType<NodeForm['getRawValue']>): boolean {
    return (
      value.rangePrefix.trim().length > 0 &&
      value.rangeStartNumber !== null &&
      value.rangeEndNumber !== null &&
      value.waitingDuration !== null &&
      value.noOfTicketCopies !== null &&
      value.rangeEndNumber >= value.rangeStartNumber &&
      value.noOfTicketCopies > 0
    );
  }

  private mapNode(group: NodeForm): CreateBranchServiceTreeNodeRequest {
    const value = group.getRawValue();
    const isTicketIssuable = value.isTicketIssuable;

    return {
      arabicName: value.arabicName.trim(),
      englishName: value.englishName.trim(),
      serviceCode: value.isServiceCodeRequired ? this.toOptionalString(value.serviceCode) : null,
      isServiceCodeRequired: value.isServiceCodeRequired,
      arabicUserMessage: this.toOptionalString(value.arabicUserMessage),
      englishUserMessage: this.toOptionalString(value.englishUserMessage),
      isTicketIssuable,
      isClientInputRequired: value.isClientInputRequired,
      hasReservation: value.hasReservation,
      orderNo: Number(value.orderNo),
      priority: Number(value.priority),
      rangePrefix: isTicketIssuable ? this.toOptionalString(value.rangePrefix) : null,
      rangeStartNumber: isTicketIssuable ? value.rangeStartNumber : null,
      rangeEndNumber: isTicketIssuable ? value.rangeEndNumber : null,
      waitingDuration: isTicketIssuable ? value.waitingDuration : null,
      noOfTicketCopies: isTicketIssuable ? value.noOfTicketCopies : null,
      children: this.childrenControls(group).controls.map((child) => this.mapNode(child)),
    };
  }

  private toOptionalString(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private reset(): void {
    this.validationError.set(null);
    this.duplicateServiceCodeControls.clear();
    this.root.reset({
      arabicName: '',
      englishName: '',
      isServiceCodeRequired: false,
      serviceCode: '',
      arabicUserMessage: '',
      englishUserMessage: '',
      isTicketIssuable: false,
      isClientInputRequired: false,
      hasReservation: false,
      orderNo: 1,
      priority: 0,
      rangePrefix: '',
      rangeStartNumber: null,
      rangeEndNumber: null,
      waitingDuration: null,
      noOfTicketCopies: null,
      children: [],
    });
    this.root.controls.children.clear();
  }
}
