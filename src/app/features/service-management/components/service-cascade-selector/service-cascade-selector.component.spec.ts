import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { ServiceSelectionOption } from '../../models/service-management/service-management.model';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api/service-management-api.service';
import { ServiceManagementPermissionService } from '../../services/catalog/service-management-permission/service-management-permission.service';
import { ServiceCascadeSelectorComponent } from './service-cascade-selector.component';

const ticketService: ServiceSelectionOption = {
  serviceId: 21,
  parentServiceId: null,
  arabicName: 'الدفع',
  englishName: 'Payments',
  orderNo: 1,
  priority: 1,
  isActive: true,
  effectiveIsActive: true,
  isTicketIssuable: true,
  hasChildren: false,
  canIssueTicket: true,
  hasReservation: false,
  isClientInputRequired: false,
};

describe('ServiceCascadeSelectorComponent', () => {
  let fixture: ComponentFixture<ServiceCascadeSelectorComponent>;
  let canViewAll: ReturnType<typeof signal<boolean>>;
  let api: { readonly getServiceSelectionOptions: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    canViewAll = signal(true);
    api = {
      getServiceSelectionOptions: vi.fn(() =>
        of({ parentServiceId: null, items: [ticketService] }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [ServiceCascadeSelectorComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthSessionService,
          useValue: {
            shouldClearSessionForHttpStatus: () => false,
            clearSession: vi.fn(),
          },
        },
        {
          provide: AdminI18nStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
          },
        },
        { provide: ServiceManagementApiService, useValue: api },
        {
          provide: ServiceManagementPermissionService,
          useValue: { canViewAll: canViewAll.asReadonly() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCascadeSelectorComponent);
    fixture.detectChanges();
  });

  it('loads the first level and emits a ticket-capable service selection', () => {
    const selected = vi.fn<(event: { service: { serviceId?: number }; mode: 'add' | 'replace'; stepUid: string | null }) => void>();
    fixture.componentInstance.serviceSelected.subscribe(selected);

    expect(api.getServiceSelectionOptions).toHaveBeenCalledWith(undefined);
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    select.value = '21';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(selected).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'add',
        stepUid: null,
        service: expect.objectContaining({ serviceId: 21, englishName: 'Payments' }),
      }),
    );
  });

  it('clears loaded levels and reports denial when permission is removed', () => {
    canViewAll.set(false);
    fixture.componentInstance.reset();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectionLevels()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.translations().selectionAccessDenied,
    );
  });
});
