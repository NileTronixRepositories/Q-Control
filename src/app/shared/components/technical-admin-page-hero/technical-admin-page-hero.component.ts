import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-technical-admin-page-hero',
  standalone: true,
  templateUrl: './technical-admin-page-hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TechnicalAdminPageHeroComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input.required<string>();
}
