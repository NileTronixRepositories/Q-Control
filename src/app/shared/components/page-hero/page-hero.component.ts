import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-hero',
  standalone: true,
  templateUrl: './page-hero.component.html',
  styleUrl: './page-hero.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageHeroComponent {
  readonly eyebrow = input.required<string>();
  readonly title = input.required<string>();
  readonly description = input('');
  readonly icon = input.required<string>();
}
