import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { BranchAdminsApiService } from '@features/branch-management/services/branch-admins-api/branch-admins-api.service';
import { CreateBranchAdminDialogComponent } from './create-branch-admin-dialog.component';

describe('CreateBranchAdminDialogComponent', () => {
  let fixture: ComponentFixture<CreateBranchAdminDialogComponent>;
  const createBranchAdmin = vi.fn<BranchAdminsApiService['createBranchAdmin']>(() =>
    of({
      applicationUserId: 'user-1',
      branchAdminId: 'admin-1',
      branchId: 5,
      userName: 'branch.admin',
      email: 'admin@example.com',
      nameEn: 'Branch Admin',
      nameAr: null,
      phoneNumber: null,
      userType: 'BranchAdmin',
      roleName: 'Branch Administrator',
      isActive: true,
      isFirstLogin: true,
      createdByApplicationUserId: 'technical-admin',
      createdOnUtc: '2026-07-14T08:00:00Z',
      message: 'Administrator created',
    }),
  );

  beforeEach(async () => {
    vi.clearAllMocks();
    await TestBed.configureTestingModule({
      imports: [CreateBranchAdminDialogComponent],
      providers: [
        { provide: BranchAdminsApiService, useValue: { createBranchAdmin } },
        {
          provide: AuthSessionService,
          useValue: {
            shouldClearSessionForHttpStatus: () => false,
            clearSession: vi.fn(),
          } satisfies Pick<AuthSessionService, 'shouldClearSessionForHttpStatus' | 'clearSession'>,
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl: vi.fn<Router['navigateByUrl']>().mockResolvedValue(true),
          } satisfies Pick<Router, 'navigateByUrl'>,
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CreateBranchAdminDialogComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('branchId', 5);
    fixture.componentRef.setInput('branchLabel', 'Main Branch');
    fixture.componentRef.setInput('language', 'en');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('keeps invalid forms local and emits a successful creation', async () => {
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    expect(createBranchAdmin).not.toHaveBeenCalled();

    setControl('userName', 'branch.admin');
    setControl('email', 'admin@example.com');
    setControl('nameEn', 'Branch Admin');
    setControl('temporaryPassword', 'secret1');
    setControl('confirmTemporaryPassword', 'secret1');
    const created = vi.fn();
    fixture.componentInstance.created.subscribe(created);
    form.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await Promise.resolve();

    expect(createBranchAdmin).toHaveBeenCalledWith(
      5,
      expect.objectContaining({ userName: 'branch.admin', email: 'admin@example.com' }),
    );
    expect(created).toHaveBeenCalledWith('Administrator created');
  });

  it('resets and emits close from the cancel action', () => {
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    (fixture.nativeElement.querySelector('.q-btn--secondary') as HTMLButtonElement).click();
    expect(closed).toHaveBeenCalledOnce();
  });

  function setControl(name: string, value: string): void {
    const input = fixture.nativeElement.querySelector(`[formControlName="${name}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  }
});
