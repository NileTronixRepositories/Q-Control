import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { BranchManagementApiService } from '@features/branch-management/public-api';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { TechnicalGlobalizationRequestsComponent } from './technical-globalization-requests.component';
import { SegmentApiService } from '../../services/segment-api/segment-api.service';
import { SegmentPermissionService } from '../../services/segment-permission/segment-permission.service';

describe('TechnicalGlobalizationRequestsComponent', () => {
  let component: TechnicalGlobalizationRequestsComponent;
  let fixture: ComponentFixture<TechnicalGlobalizationRequestsComponent>;
  let apiServiceSpy: any;

  beforeEach(async () => {
    apiServiceSpy = {
      getTechnicalGlobalizationRequests: vi.fn().mockReturnValue(
        of({ currentPage: 1, pageSize: 10, totalItems: 0, totalPages: 0, data: [] })
      ),
      approveGlobalizationRequest: vi.fn(),
    };

    const branchApiSpy = {
      getBranches: vi.fn().mockReturnValue(of({ data: [] })),
    };

    await TestBed.configureTestingModule({
      imports: [TechnicalGlobalizationRequestsComponent],
      providers: [
        { provide: SegmentApiService, useValue: apiServiceSpy },
        { provide: BranchManagementApiService, useValue: branchApiSpy },
        {
          provide: AuthSessionService,
          useValue: { currentSession: signal({ userType: 'TechnicalAdmin', token: 'token' }).asReadonly() },
        },
        {
          provide: AdminI18nStore,
          useValue: { language: signal('en').asReadonly(), direction: signal('ltr').asReadonly() },
        },
        SegmentPermissionService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TechnicalGlobalizationRequestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates the component and loads requests', () => {
    expect(component).toBeTruthy();
    expect(apiServiceSpy.getTechnicalGlobalizationRequests).toHaveBeenCalled();
  });
});
