import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import {
  PhysicalTicketPrintElement,
  PhysicalTicketPrintModel,
} from '../../models/ticket-print/ticket-print.model';

@Component({
  selector: 'app-ticket-print-renderer',
  templateUrl: './ticket-print-renderer.component.html',
  styleUrl: './ticket-print-renderer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TicketPrintRendererComponent {
  readonly model = input.required<PhysicalTicketPrintModel>();
  protected readonly visibleElements = computed(() =>
    this.model().elements.filter((element) => element.isVisible),
  );

  protected boxStyle(element: PhysicalTicketPrintElement): Record<string, string> {
    return {
      left: `${element.xMm ?? 0}mm`,
      top: `${element.yMm ?? 0}mm`,
      width: `${element.widthMm ?? 0}mm`,
      height: `${element.heightMm ?? 0}mm`,
    };
  }

  protected textStyle(element: PhysicalTicketPrintElement): Record<string, string> {
    const style: Record<string, string> = {
      'font-size': `${element.fontSizePt ?? 0}pt`,
      'font-weight': element.fontWeight === 'Bold' ? '700' : '400',
      'text-align': element.textAlign?.toLowerCase() ?? 'left',
      direction: element.language === 'Ar' ? 'rtl' : 'ltr',
    };
    if (
      element.elementType === 'CustomInputsOrField' &&
      element.overflowBehavior === 'TrimWithEllipsis' &&
      element.heightMm &&
      element.fontSizePt
    ) {
      style['-webkit-line-clamp'] = String(
        Math.max(1, Math.floor((element.heightMm * 2.83465) / (element.fontSizePt * 1.25))),
      );
    }
    return style;
  }
}
