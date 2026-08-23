import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { DisplayHeaderComponent } from '../../components/display-header/display-header.component';
import { DisplayMediaPlayerComponent } from '../../components/display-media-player/display-media-player.component';
import { DisplayQueueBoardComponent } from '../../components/display-queue-board/display-queue-board.component';
import { DisplayTickerBarComponent } from '../../components/display-ticker-bar/display-ticker-bar.component';
import { DisplayStateService } from '../../services/display-state.service';
import { AuthSessionService } from '../../../auth/services/auth-session.service';
import { TechnicalAdminBranchContextStore } from '../../../technical-admin/store/technical-admin-branch-context.store';

@Component({
  selector: 'app-main-display',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DisplayHeaderComponent,
    DisplayMediaPlayerComponent,
    DisplayQueueBoardComponent,
    DisplayTickerBarComponent,
  ],
  templateUrl: './main-display.component.html',
  styleUrl: './main-display.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainDisplayComponent implements OnInit, OnDestroy {
  protected readonly state = inject(DisplayStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly branchContextStore = inject(TechnicalAdminBranchContextStore, { optional: true });

  private routeSubscription: Subscription | null = null;

  readonly isAr = computed(() => this.state.language() === 'ar');
  readonly isAuthenticated = computed(() => !!this.authSessionService.activeSession());
  readonly displayBgColor = computed(() => this.state.runtimeConfig().displayBackgroundColor);

  // Kiosk / Display Activation Modal State
  readonly isAuthModalOpen = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly authError = signal<string | null>(null);
  readonly passwordVisible = signal<boolean>(false);

  readonly loginForm = this.formBuilder.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.routeSubscription = this.route.queryParams.subscribe((params) => {
      const branchIdParam = params['branchId'];
      let branchId = branchIdParam ? parseInt(branchIdParam, 10) : null;
      if (!branchId || isNaN(branchId)) {
        branchId = this.branchContextStore?.selectedBranchId() ?? this.state.branding().branchId ?? 1;
      }

      // Load runtime data immediately using anonymous (public) APIs — no login required
      this.state.loadRuntimeConfiguration(branchId);
      this.state.loadRuntimePlaylist(branchId);

      // Don't force login modal; display works without authentication
      this.isAuthModalOpen.set(false);
    });
  }

  ngOnDestroy(): void {
    this.routeSubscription?.unsubscribe();
  }

  submitDisplayLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.authError.set(null);

    const { username, password } = this.loginForm.getRawValue();

    this.authSessionService
      .submitLogin({
        username: username.trim(),
        password,
        rememberSession: true, // Always persist across tabs & kiosk displays
      })
      .subscribe({
        next: (result) => {
          this.isSubmitting.set(false);
          if (result.accepted) {
            this.isAuthModalOpen.set(false);
            const branchIdParam = this.route.snapshot.queryParams['branchId'];
            const branchId = branchIdParam ? parseInt(branchIdParam, 10) : (this.state.branding().branchId ?? 1);
            this.state.loadBranchPlaylist(branchId);
          } else {
            this.authError.set(
              result.message ||
                (this.isAr()
                  ? 'فشل تسجيل الدخول. يرجى التحقق من اسم المستخدم وكلمة المرور.'
                  : 'Login failed. Please check your credentials.'),
            );
          }
        },
        error: () => {
          this.isSubmitting.set(false);
          this.authError.set(
            this.isAr()
              ? 'حدث خطأ أثناء الاتصال بالخادم.'
              : 'An error occurred while connecting to the server.',
          );
        },
      });
  }

  togglePasswordVisibility(): void {
    this.passwordVisible.update((v) => !v);
  }

  dismissAuthModal(): void {
    this.isAuthModalOpen.set(false);
  }

  @HostListener('click', ['$event'])
  onDisplayClick(event: MouseEvent): void {
    // Only toggle fullscreen if not clicking inside the login modal
    const target = event.target as HTMLElement;
    if (target.closest('.display-auth-dialog')) {
      return;
    }

    if (!this.isAuthModalOpen()) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  }
}
