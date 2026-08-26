import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';
import { OrganizationStore } from '../../store/organization.store';
import { TicketStatusManagementComponent } from './ticket-status-management.component';

describe('TicketStatusManagementComponent', () => {
  let fixture: ComponentFixture<TicketStatusManagementComponent>;
  let store: OrganizationStore;

  beforeEach(async () => {
    const language = signal<AppLanguage>('en');
    await TestBed.configureTestingModule({
      imports: [TicketStatusManagementComponent],
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
    fixture = TestBed.createComponent(TicketStatusManagementComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('creates, edits, and saves a ticket status', () => {
    (fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement).click();
    fixture.detectChanges();
    const name = fixture.nativeElement.querySelector('[aria-label="Status name"]') as HTMLInputElement;
    name.value = 'Completed';
    name.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.status-list .primary-action') as HTMLButtonElement).click();

    expect(store.ticketStatuses()[0].name).toBe('Completed');
    expect(store.savedSection()).toBe('Ticket-Status Management');
  });
});
