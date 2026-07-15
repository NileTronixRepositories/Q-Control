import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';
import { OrganizationStore } from '../../store/organization.store';
import { GlobalConfigurationsComponent } from './global-configurations.component';

describe('GlobalConfigurationsComponent', () => {
  let fixture: ComponentFixture<GlobalConfigurationsComponent>;
  let store: OrganizationStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GlobalConfigurationsComponent],
      providers: [OrganizationStore, OrganizationShellStore, languageProvider()],
    }).compileComponents();
    store = TestBed.inject(OrganizationStore);
    fixture = TestBed.createComponent(GlobalConfigurationsComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('updates organization identity and marks the section saved', () => {
    const name = fixture.nativeElement.querySelector('#organizationName') as HTMLInputElement;
    name.value = 'Nile Clinic';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(store.globalConfiguration().organizationName).toBe('Nile Clinic');
    expect(store.savedSection()).toBe('Global Configurations');
    expect(fixture.nativeElement.textContent).toContain('Saved Successfully');
  });

  it('switches to upload mode without changing the current logo', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.logo-tab') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[type="file"]')).not.toBeNull();
    expect(store.globalConfiguration().logoUrl).toBe('/images/nile.png');
  });
});

function languageProvider(): { provide: typeof AppLanguageStore; useValue: Pick<AppLanguageStore, 'language' | 'direction' | 'toggleLanguage'> } {
  const language = signal<AppLanguage>('en');
  return {
    provide: AppLanguageStore,
    useValue: {
      language: language.asReadonly(),
      direction: computed<AppDirection>(() => 'ltr'),
      toggleLanguage: vi.fn(),
    },
  };
}
