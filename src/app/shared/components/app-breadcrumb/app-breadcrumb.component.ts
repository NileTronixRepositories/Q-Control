import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AppDirection, AppLanguage } from '../../models/app-language/app-language.model';
import { AppBreadcrumbItem } from '../../models/breadcrumb/breadcrumb.model';

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './app-breadcrumb.component.html',
  styleUrl: './app-breadcrumb.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppBreadcrumbComponent {
  readonly items = input<readonly AppBreadcrumbItem[]>([]);
  readonly direction = input<AppDirection>('ltr');
  readonly language = input<AppLanguage>('en');
  readonly ariaLabel = input('Breadcrumb');

  protected isLast(index: number): boolean {
    return index === this.items().length - 1;
  }
}
