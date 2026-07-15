import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';
import { OrganizationStore } from '../../store/organization.store';
import { AudioAnnouncementComponent } from './audio-announcement.component';

describe('AudioAnnouncementComponent', () => {
  let fixture: ComponentFixture<AudioAnnouncementComponent>;
  let store: OrganizationStore;

  beforeEach(async () => {
    const language = signal<AppLanguage>('en');
    await TestBed.configureTestingModule({
      imports: [AudioAnnouncementComponent],
      providers: [
        OrganizationStore,
        OrganizationShellStore,
        {
          provide: AppLanguageStore,
          useValue: {
            language: language.asReadonly(),
            direction: computed<AppDirection>(() => 'ltr'),
            toggleLanguage: vi.fn(),
          } satisfies Pick<AppLanguageStore, 'language' | 'direction' | 'toggleLanguage'>,
        },
      ],
    }).compileComponents();
    store = TestBed.inject(OrganizationStore);
    fixture = TestBed.createComponent(AudioAnnouncementComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('updates audio rules and marks them saved', () => {
    const languageSelect = fixture.nativeElement.querySelector('#voiceLanguage') as HTMLSelectElement;
    languageSelect.value = 'English';
    languageSelect.dispatchEvent(new Event('change'));
    (fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(store.audioAnnouncementConfiguration().voiceLanguage).toBe('English');
    expect(store.savedSection()).toBe('Audio Announcement');
    expect(fixture.nativeElement.textContent).toContain('Saved');
  });
});
