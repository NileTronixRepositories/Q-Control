import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
} from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl';

@Component({
  selector: 'app-modal',
  standalone: true,
  templateUrl: './app-modal.component.html',
  styleUrl: './app-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly title = input<string>('');
  readonly subtitle = input<string>('');
  readonly icon = input<string>('');
  readonly size = input<ModalSize>('md');
  readonly direction = input<'rtl' | 'ltr'>('rtl');
  readonly closeOnBackdrop = input<boolean>(true);
  readonly closeOnEsc = input<boolean>(true);
  readonly showCloseButton = input<boolean>(true);
  readonly loading = input<boolean>(false);
  readonly closeLabel = input<string>('Close');

  readonly closed = output<void>();
  readonly close = output<void>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen() && this.closeOnEsc()) {
      this.closeModal();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdrop() && event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal(): void {
    this.closed.emit();
    this.close.emit();
  }
}
