import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuthenticatedSession, AuthSessionService } from '@core';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { TicketConfiguration } from '../../models/ticket-template/ticket-template.model';
import { TicketConfigurationApiService } from '../../services/ticket-configuration-api/ticket-configuration-api.service';
import { createEmptyTicketElements } from './ticket-template-builder.data';
import { TicketTemplateBuilderComponent } from './ticket-template-builder.component';

describe('TicketTemplateBuilderComponent', () => {
  const selectedBranchId = signal<number | null>(7);
  const selectedBranch = signal<{
    readonly branchId: number;
    readonly arabicName: string;
    readonly englishName: string;
  } | null>({
    branchId: 7,
    arabicName: 'فرع القاهرة',
    englishName: 'Cairo Branch',
  });
  const authSession = signal<AuthenticatedSession | null>(null);
  const configuration: TicketConfiguration = {
    id: 1,
    branchId: 7,
    ticketWidthMm: 80,
    ticketHeightMm: 120,
    rowVersion: 'row-version',
    elements: createEmptyTicketElements().map((element) =>
      element.elementType === 'TicketNumber'
        ? {
            ...element,
            isVisible: true,
            xMm: 5,
            yMm: 10,
            widthMm: 70,
            heightMm: 15,
            fontSizePt: 22,
            fontWeight: 'Bold',
            textAlign: 'Center',
            language: 'Ar',
          }
        : element,
    ),
  };
  const getConfiguration = vi.fn(() => of(configuration));

  beforeEach(() => {
    vi.clearAllMocks();
    selectedBranchId.set(7);
    selectedBranch.set({
      branchId: 7,
      arabicName: 'فرع القاهرة',
      englishName: 'Cairo Branch',
    });
    authSession.set(null);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TicketConfigurationApiService,
          useValue: {
            get: getConfiguration,
            getBranding: () => of({ logoUrl: null, rowVersion: null }),
            resolveMediaUrl: () => null,
          },
        },
        {
          provide: AdminBranchContextStore,
          useValue: {
            selectedBranchId: selectedBranchId.asReadonly(),
            selectedBranch: selectedBranch.asReadonly(),
          },
        },
        { provide: AdminI18nStore, useValue: { language: signal('en').asReadonly() } },
        { provide: AuthSessionService, useValue: { currentSession: authSession.asReadonly() } },
      ],
    });
  });

  it('renders the fixed eight-element registry and the configured canvas element', async () => {
    const fixture = TestBed.createComponent(TicketTemplateBuilderComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('.element-row')).toHaveLength(8);
    expect(host.querySelectorAll('.canvas-element')).toHaveLength(1);
    expect(host.textContent).toContain('رقم التذكرة: A105');
  });

  it('uses the active session branch for a Branch Admin without selected branch context', async () => {
    selectedBranchId.set(null);
    selectedBranch.set(null);
    authSession.set({
      token: 'token',
      userType: 'BranchAdmin',
      displayName: 'Branch Admin',
      requiresBranchSelection: false,
      activeBranchId: 11,
      branches: [
        {
          branchId: 11,
          arabicName: 'فرع مدينة نصر',
          englishName: 'Nasr City Branch',
          isActive: true,
        },
      ],
      firstLoginFlag: false,
      passwordExpiredFlag: false,
      passwordChangedOnUtc: null,
      passwordExpiresOnUtc: null,
    });

    const fixture = TestBed.createComponent(TicketTemplateBuilderComponent);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Nasr City Branch');
    expect(fixture.nativeElement.textContent).not.toContain('Select a branch first');
    expect(getConfiguration).toHaveBeenCalledWith(11);
  });

  it('enters initialization mode only for TicketConfigurations.View.NotFound', async () => {
    getConfiguration.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: {
              status: 404,
              detail: 'لم يتم العثور على إعداد طباعة التذكرة.',
              errors: [
                {
                  code: 'TicketConfigurations.View.NotFound',
                  type: 'NotFound',
                },
              ],
            },
          }),
      ),
    );

    const fixture = TestBed.createComponent(TicketTemplateBuilderComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('.element-row')).toHaveLength(8);
    expect(host.textContent).toContain('Initialize configuration');
    expect(host.textContent).not.toContain('لم يتم العثور على إعداد طباعة التذكرة.');
  });

  it('keeps BranchNotFound as a real error instead of initialization mode', async () => {
    getConfiguration.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 404,
            error: {
              detail: 'Branch not found.',
              errors: [{ code: 'TicketConfigurations.View.BranchNotFound' }],
            },
          }),
      ),
    );

    const fixture = TestBed.createComponent(TicketTemplateBuilderComponent);
    await fixture.whenStable();
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.textContent).toContain('Branch not found.');
    expect(host.querySelectorAll('.element-row')).toHaveLength(0);
  });
});
