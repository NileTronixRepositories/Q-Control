import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { Subject } from 'rxjs';

import { TechnicalAdminI18nStore } from '../../../technical-admin/store/technical-admin-i18n.store';
import { PagedServiceGlobalizationRequestsResponse } from '../../models/service-globalization.model';
import { ServiceDataInvalidationService } from '../../services/service-data-invalidation.service';
import { ServiceGlobalizationApiService } from '../../services/service-globalization-api.service';
import { BranchGlobalizationRequestsComponent } from './branch-globalization-requests.component';

describe('BranchGlobalizationRequestsComponent request triggers', () => {
  let fixture: ComponentFixture<BranchGlobalizationRequestsComponent>;
  let api: { readonly getBranchRequests: ReturnType<typeof vi.fn> };
  let invalidation: WritableSignal<{ readonly branchId: number; readonly revision: number } | null>;
  let requests: Subject<PagedServiceGlobalizationRequestsResponse>[];

  beforeEach(async () => {
    vi.useFakeTimers();
    requests = [];
    api = {
      getBranchRequests: vi.fn(() => {
        const request = new Subject<PagedServiceGlobalizationRequestsResponse>();
        requests.push(request);
        return request;
      }),
    };
    invalidation = signal(null);

    await TestBed.configureTestingModule({
      imports: [BranchGlobalizationRequestsComponent],
      providers: [
        { provide: ServiceGlobalizationApiService, useValue: api },
        {
          provide: ServiceDataInvalidationService,
          useValue: { branchRequestsInvalidation: invalidation.asReadonly() },
        },
        {
          provide: TechnicalAdminI18nStore,
          useValue: {
            language: signal<'ar' | 'en'>('en').asReadonly(),
            direction: signal<'rtl' | 'ltr'>('ltr').asReadonly(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchGlobalizationRequestsComponent);
    fixture.componentRef.setInput('branchId', 5);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (!fixture.componentRef.hostView.destroyed) {
      fixture.destroy();
    }
    vi.useRealTimers();
  });

  it('does not load while closed, then sends one request when opened', () => {
    expect(api.getBranchRequests).not.toHaveBeenCalled();

    openPopup();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);

    requests[0].next(emptyPage(5));
    requests[0].complete();
    fixture.detectChanges();

    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);
  });

  it('reloads once for the active branch and ignores another branch invalidation', () => {
    openPopup();
    requests[0].next(emptyPage(0));
    requests[0].complete();

    invalidation.set({ branchId: 5, revision: 1 });
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);

    invalidation.set({ branchId: 7, revision: 2 });
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
  });

  it('does not let an older branch response overwrite the current branch page', () => {
    openPopup();
    fixture.componentRef.setInput('branchId', 6);
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);

    requests[0].next(emptyPage(99));
    requests[0].complete();
    requests[1].next(emptyPage(6));
    requests[1].complete();
    fixture.detectChanges();

    const state = fixture.componentInstance as unknown as {
      readonly page: WritableSignal<PagedServiceGlobalizationRequestsResponse>;
    };
    expect(state.page().totalItems).toBe(6);
  });

  it('does not request on close and reloads once when reopened', () => {
    openPopup();
    const state = fixture.componentInstance as unknown as {
      readonly status: WritableSignal<'Pending' | 'Approved' | 'Rejected' | null>;
    };
    state.status.set('Approved');
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);

    openPopup();
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
    expect(api.getBranchRequests.mock.calls[1][1].status).toBe('Approved');
  });

  it('polls the open list every 15 seconds without overlapping requests', () => {
    openPopup();

    vi.advanceTimersByTime(15_000);
    expect(api.getBranchRequests).toHaveBeenCalledTimes(1);

    requests[0].next(emptyPage(1));
    requests[0].complete();
    fixture.detectChanges();

    vi.advanceTimersByTime(15_000);
    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);

    requests[1].next(emptyPage(1));
    requests[1].complete();
    fixture.destroy();
    vi.advanceTimersByTime(15_000);

    expect(api.getBranchRequests).toHaveBeenCalledTimes(2);
  });

  it('uses distinct enterprise badge colors for every request status', () => {
    const component = fixture.componentInstance as unknown as {
      statusClasses(status: 'Pending' | 'Approved' | 'Rejected'): string;
    };

    expect(component.statusClasses('Pending')).toContain('amber');
    expect(component.statusClasses('Approved')).toContain('emerald');
    expect(component.statusClasses('Rejected')).toContain('rose');
  });

  function openPopup(): void {
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  }
});

function emptyPage(totalItems: number): PagedServiceGlobalizationRequestsResponse {
  return { currentPage: 1, pageSize: 10, totalItems, data: [] };
}
