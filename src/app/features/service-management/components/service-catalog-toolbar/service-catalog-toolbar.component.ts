import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ServiceManagementTranslations } from '../../i18n/service-management.translations';

@Component({
  selector: 'app-service-catalog-toolbar',
  standalone: true,
  templateUrl: './service-catalog-toolbar.component.html',
  styleUrl: './service-catalog-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceCatalogToolbarComponent {
  readonly searchText = input('');
  readonly includeInactive = input(false);
  readonly includeDeleted = input(false);
  readonly canCreate = input(false);
  readonly createRootLabel = input('');
  readonly searchPlaceholder = input('');
  readonly searchHelp = input('');
  readonly translations = input.required<ServiceManagementTranslations>();

  readonly searchTextChange = output<string>();
  readonly includeInactiveChange = output<boolean>();
  readonly includeDeletedChange = output<boolean>();
  readonly createRoot = output<void>();

  protected onSearchInput(event: Event): void {
    this.searchTextChange.emit((event.target as HTMLInputElement).value.slice(0, 200));
  }

  protected clearSearch(): void {
    if (this.searchText()) {
      this.searchTextChange.emit('');
    }
  }

  protected onIncludeInactiveChange(event: Event): void {
    this.includeInactiveChange.emit((event.target as HTMLInputElement).checked);
  }

  protected onIncludeDeletedChange(event: Event): void {
    this.includeDeletedChange.emit((event.target as HTMLInputElement).checked);
  }
}
