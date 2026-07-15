import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDirection, AppLanguage } from '../../../../shared/models/app-language.model';
import { AppLanguageStore } from '../../../../shared/store/app-language.store';
import { OrganizationShellStore } from '../../store/organization-shell.store';
import { OrganizationStore } from '../../store/organization.store';
import { TicketCallingManagementComponent } from './ticket-calling-management.component';

describe('TicketCallingManagementComponent', () => {
  let fixture: ComponentFixture<TicketCallingManagementComponent>;
  let store: OrganizationStore;

  beforeEach(async () => {
    const language = signal<AppLanguage>('en');
    await TestBed.configureTestingModule({
      imports: [TicketCallingManagementComponent],
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
    fixture = TestBed.createComponent(TicketCallingManagementComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('increments queue timing and saves calling rules', () => {
    const noShowInput = fixture.nativeElement.querySelector(
      '[aria-label="No-show time in seconds"]',
    ) as HTMLInputElement;
    const increment = noShowInput.parentElement?.querySelector('button:last-child') as HTMLButtonElement;
    increment.click();
    (fixture.nativeElement.querySelector('.primary-action') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(store.ticketCallingConfiguration().noShowSeconds).toBe(1);
    expect(store.savedSection()).toBe('Ticket Calling Management');
  });
});
