import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import {
  FormArray,
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { BranchServicesTranslations } from '../../i18n/branch-services.translations';
import {
  CreateBranchServiceTreeNodeRequest,
  CreateBranchServiceTreeRequest,
} from '../../models/branch-services.model';

export type CreateBranchServiceTreeMode = 'root' | 'subtree';

type NodeForm = FormGroup<{
  arabicName: FormControl<string>;
  englishName: FormControl<string>;
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
  private readonly formBuilder = inject(NonNullableFormBuilder);

  readonly open = input.required<boolean>();
  readonly saving = input.required<boolean>();
  readonly resetKey = input(0);
  readonly translations = input.required<BranchServicesTranslations>();
  readonly mode = input<CreateBranchServiceTreeMode>('root');
  readonly parentLabel = input<string | null>(null);

  readonly closed = output<void>();
  readonly created = output<CreateBranchServiceTreeRequest>();

  readonly validationError = signal<string | null>(null);
  readonly root = this.createNodeForm();

  protected readonly dialogTitle = computed(() =>
    this.mode() === 'subtree' ? this.translations().createSubtreeTitle : this.translations().createTreeTitle,
  );
  protected readonly dialogDescription = computed(() =>
    this.mode() === 'subtree'
      ? this.translations().createSubtreeDescription
      : this.translations().createTreeDescription,
  );
  protected readonly dialogActionLabel = computed(() =>
    this.mode() === 'subtree' ? this.translations().addChild : this.translations().createBranchTree,
  );

  private readonly resetOnKeyChange = effect(() => {
    this.resetKey();
    this.reset();
  });

  protected childrenControls(group: NodeForm): FormArray<NodeForm> {
    return group.controls.children;
  }

  protected addChild(group: NodeForm): void {
    group.controls.isTicketIssuable.setValue(false);
    this.childrenControls(group).push(this.createNodeForm());
  }

  protected removeChild(parent: NodeForm, index: number): void {
    this.childrenControls(parent).removeAt(index);
  }

  protected submit(): void {
    this.validationError.set(null);
    this.root.markAllAsTouched();

    const error = this.validateNode(this.root);

    if (error) {
      this.validationError.set(error);
      return;
    }

    this.created.emit({ root: this.mapNode(this.root) });
  }

  protected close(): void {
    if (!this.saving()) {
      this.reset();
      this.closed.emit();
    }
  }

  private createNodeForm(): NodeForm {
    return this.formBuilder.group({
      arabicName: ['', [Validators.required, Validators.maxLength(100)]],
      englishName: ['', [Validators.required, Validators.maxLength(100)]],
      arabicUserMessage: ['', [Validators.maxLength(500)]],
      englishUserMessage: ['', [Validators.maxLength(500)]],
      isTicketIssuable: [false],
      isClientInputRequired: [false],
      hasReservation: [false],
      orderNo: [1, [Validators.required, Validators.min(0)]],
      priority: [0, [Validators.required, Validators.min(0)]],
      rangePrefix: [''],
      rangeStartNumber: new FormControl<number | null>(null),
      rangeEndNumber: new FormControl<number | null>(null),
      waitingDuration: new FormControl<number | null>(null),
      noOfTicketCopies: new FormControl<number | null>(null),
      children: this.formBuilder.array<NodeForm>([]),
    });
  }

  private validateNode(group: NodeForm): string | null {
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

      if ((arabicName && arabicNames.has(arabicName)) || (englishName && englishNames.has(englishName))) {
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
    this.root.reset({
      arabicName: '',
      englishName: '',
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
