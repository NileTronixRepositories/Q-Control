import { ChangeDetectionStrategy, Component, computed, inject, output, signal } from '@angular/core';
import { ServiceRequestStore } from '../../store/service-request.store';

@Component({
  selector: 'app-service-request-keypad-input',
  templateUrl: './keypad-input.component.html',
  styleUrl: './keypad-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KeypadInputComponent {
  protected readonly store = inject(ServiceRequestStore);

  readonly confirmed = output<string>();

  protected readonly inputValue = signal<string>('');

  protected readonly isRtl = computed(() => this.store.direction() === 'rtl');

  protected readonly confirmButtonText = computed(() => {
    return (
      this.store.keypadButton()?.text ||
      (this.isRtl() ? 'تأكيد الرقم وإصدار التذكرة' : 'Confirm & Issue Ticket')
    );
  });

  protected appendDigit(digit: string): void {
    if (this.inputValue().length < 14) {
      this.inputValue.update((v) => v + digit);
    }
  }

  protected backspace(): void {
    this.inputValue.update((v) => v.slice(0, -1));
  }

  protected clear(): void {
    this.inputValue.set('');
  }

  protected submit(): void {
    this.confirmed.emit(this.inputValue());
  }
}
