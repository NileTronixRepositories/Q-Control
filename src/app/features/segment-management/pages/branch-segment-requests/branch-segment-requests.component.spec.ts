import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { BranchSegmentRequestsComponent } from './branch-segment-requests.component';
import { SegmentApiService } from '../../services/segment-api/segment-api.service';

describe('BranchSegmentRequestsComponent', () => {
  let component: BranchSegmentRequestsComponent;
  let fixture: ComponentFixture<BranchSegmentRequestsComponent>;
  let apiServiceSpy: any;

  beforeEach(async () => {
    apiServiceSpy = {
      getBranchGlobalizationRequests: vi.fn().mockReturnValue(
        of({ currentPage: 1, pageSize: 10, totalItems: 0, totalPages: 0, data: [] })
      ),
    };

    await TestBed.configureTestingModule({
      imports: [BranchSegmentRequestsComponent],
      providers: [
        { provide: SegmentApiService, useValue: apiServiceSpy },
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal({ userType: 'BranchAdmin', activeBranchId: 7, token: 'token' }).asReadonly() },
        },
        {
          provide: AdminI18nStore,
          useValue: { language: signal('en').asReadonly(), direction: signal('ltr').asReadonly() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BranchSegmentRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component and loads branch requests', () => {
    expect(component).toBeTruthy();
    expect(apiServiceSpy.getBranchGlobalizationRequests).toHaveBeenCalledWith(7, expect.any(Object));
  });
});
