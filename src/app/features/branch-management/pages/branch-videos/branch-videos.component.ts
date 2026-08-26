import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { PageHeroComponent } from '../../../../shared/components/page-hero/page-hero.component';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AppLanguage } from '../../../../shared/models/app-language/app-language.model';
import {
  BranchDisplayPlaylistResponse,
  BranchVideo,
  BranchVideoResponse,
  BranchVideoStateResponse,
  ReorderBranchVideosRequest,
  VideoProcessingStatus,
} from '@features/branch-management/models/branch-video/branch-video.model';
import { BranchListItem, PagedBranchResponse } from '@features/branch-management/models/branch-management/branch-management.model';
import { BranchManagementApiService } from '@features/branch-management/services/branch-management-api/branch-management-api.service';
import { BranchPermissionService } from '@features/branch-management/services/branch-permission/branch-permission.service';
import { BranchVideosApiService } from '@features/branch-management/services/branch-videos-api/branch-videos-api.service';
import { HlsPlayerService } from '@features/branch-management/services/hls-player/hls-player.service';
import { AdminBranchContextStore } from '@layout/admin-shell/store/admin-branch-context.store';
import { AdminI18nStore } from '@layout/admin-shell/store/admin-i18n.store';
import { formatApiError } from '@shared/utils/api-error-message.util';

type VideoFilter = 'all' | 'active' | 'inactive';
type ToastTone = 'success' | 'error' | 'info';

interface UiToastMessage {
  readonly text: string;
  readonly tone: ToastTone;
}

@Component({
  selector: 'app-branch-videos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    PageHeroComponent,
    NiletronixLoadingStateComponent,
  ],
  templateUrl: './branch-videos.component.html',
  styleUrls: ['./branch-videos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BranchVideosComponent implements OnInit, OnDestroy {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly branchVideosApi = inject(BranchVideosApiService);
  private readonly branchManagementApi = inject(BranchManagementApiService);
  private readonly branchContextStore = inject(AdminBranchContextStore);
  private readonly permissionService = inject(BranchPermissionService);
  private readonly hlsPlayerService = inject(HlsPlayerService);
  private readonly i18nStore = inject(AdminI18nStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authSessionService = inject(AuthSessionService);

  readonly isTechnicalAdmin = computed(
    () => this.authSessionService.currentSession()?.userType === 'TechnicalAdmin',
  );

  readonly singleVideoPlayerRef = viewChild<ElementRef<HTMLVideoElement>>('singleVideoPlayer');
  readonly playlistVideoPlayerRef = viewChild<ElementRef<HTMLVideoElement>>('playlistVideoPlayer');

  // Branch Selection State
  readonly branches = signal<readonly BranchListItem[]>([]);
  readonly branchesLoading = signal<boolean>(false);
  readonly selectedBranchId = signal<number | null>(null);

  // Video Management State
  readonly videos = signal<readonly BranchVideo[]>([]);
  readonly videosLoading = signal<boolean>(false);
  readonly activeFilter = signal<VideoFilter>('all');
  readonly message = signal<UiToastMessage | null>(null);
  readonly isSubmitting = signal<boolean>(false);

  // Upload Modal State
  readonly isUploadModalOpen = signal<boolean>(false);
  readonly selectedUploadFile = signal<File | null>(null);
  readonly uploadForm = this.formBuilder.group({
    displayOrder: [1, [Validators.required, Validators.min(1)]],
  });

  // Single Video Preview State
  readonly previewVideo = signal<BranchVideo | null>(null);

  // Playlist Preview State
  readonly isPlaylistModalOpen = signal<boolean>(false);
  readonly playlistData = signal<BranchDisplayPlaylistResponse | null>(null);
  readonly playlistLoading = signal<boolean>(false);
  readonly currentPlaylistIndex = signal<number>(0);

  // Delete Confirmation State
  readonly videoToDelete = signal<BranchVideo | null>(null);

  // Subscriptions & Teardowns
  private pollingIntervalId: ReturnType<typeof setInterval> | null = null;
  private routeSubscription: Subscription | null = null;
  private singlePlayerTeardown: (() => void) | null = null;
  private playlistPlayerTeardown: (() => void) | null = null;

  // Permissions & Language Computations
  readonly canUpdate = computed(() => this.permissionService.canUpdate());
  readonly language = computed<AppLanguage>(() => this.i18nStore.language());
  readonly isAr = computed(() => this.language() === 'ar');

  readonly selectedBranchLabel = computed(() => {
    const branchId = this.selectedBranchId();
    if (!branchId) return '';
    const branch = this.branches().find((b) => b.branchId === branchId);
    if (!branch) return `BR-${branchId}`;
    return this.isAr() ? branch.arabicName : branch.englishName;
  });

  readonly filteredVideos = computed<readonly BranchVideo[]>(() => {
    const list = this.videos();
    const filter = this.activeFilter();
    if (filter === 'active') return list.filter((v) => v.isActive);
    if (filter === 'inactive') return list.filter((v) => !v.isActive);
    return list;
  });

  readonly hasProcessingVideos = computed(() =>
    this.videos().some((v) => v.processingStatus === 'Processing'),
  );

  readonly currentPlayingPlaylistVideo = computed(() => {
    const playlist = this.playlistData();
    if (!playlist || !playlist.videos.length) return null;
    const idx = this.currentPlaylistIndex();
    return playlist.videos[idx % playlist.videos.length] ?? null;
  });

  readonly currentPlayingVideoName = computed(() => {
    const current = this.currentPlayingPlaylistVideo();
    if (!current) return '';
    const managementMatch = this.videos().find((v) => v.id === current.videoId);
    return managementMatch ? managementMatch.originalFileName : `Video #${current.videoId}`;
  });

  constructor() {
    // Effect for Single Video Preview playback
    effect(() => {
      const video = this.previewVideo();
      const playerRef = this.singleVideoPlayerRef();

      if (this.singlePlayerTeardown) {
        this.singlePlayerTeardown();
        this.singlePlayerTeardown = null;
      }

      if (video && video.streamUrl && playerRef?.nativeElement) {
        const streamUrl = this.resolveStreamUrl(video.streamUrl);
        void this.hlsPlayerService
          .attachMedia(playerRef.nativeElement, streamUrl, { autoplay: true })
          .then((teardown) => {
            this.singlePlayerTeardown = teardown;
          });
      }
    });

    // Effect for Playlist Preview playback
    effect(() => {
      const currentVideo = this.currentPlayingPlaylistVideo();
      const playerRef = this.playlistVideoPlayerRef();

      if (this.playlistPlayerTeardown) {
        this.playlistPlayerTeardown();
        this.playlistPlayerTeardown = null;
      }

      if (currentVideo && currentVideo.streamUrl && playerRef?.nativeElement) {
        const streamUrl = this.resolveStreamUrl(currentVideo.streamUrl);
        void this.hlsPlayerService
          .attachMedia(playerRef.nativeElement, streamUrl, {
            autoplay: true,
            onEnded: () => this.onPlaylistVideoEnded(),
          })
          .then((teardown) => {
            this.playlistPlayerTeardown = teardown;
          });
      }
    });
  }

  ngOnInit(): void {
    this.loadBranches();
    this.routeSubscription = this.route.queryParams.subscribe((params) => {
      const branchIdParam = params['branchId'];
      if (branchIdParam) {
        const branchId = parseInt(branchIdParam, 10);
        if (!isNaN(branchId) && branchId !== this.selectedBranchId()) {
          this.setSelectedBranch(branchId);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.routeSubscription?.unsubscribe();
    if (this.singlePlayerTeardown) {
      this.singlePlayerTeardown();
      this.singlePlayerTeardown = null;
    }
    if (this.playlistPlayerTeardown) {
      this.playlistPlayerTeardown();
      this.playlistPlayerTeardown = null;
    }
  }

  loadBranches(): void {
    const currentSession = this.authSessionService.currentSession();
    const activeBranchId = currentSession?.activeBranchId ? Number(currentSession.activeBranchId) : null;
    const isTechAdmin = currentSession?.userType === 'TechnicalAdmin';

    if (!isTechAdmin && activeBranchId) {
      this.setSelectedBranch(activeBranchId);
      return;
    }

    this.branchesLoading.set(true);
    this.branchManagementApi
      .getBranches({
        pageNumber: 1,
        pageSize: 100,
        searchText: '',
        orderSort: 'Newest',
        isActive: null,
      })
      .subscribe({
        next: (paged: PagedBranchResponse<BranchListItem>) => {
          this.branches.set(paged.data);
          this.branchesLoading.set(false);

          const currentContextId = this.branchContextStore.selectedBranchId();
          if (currentContextId && paged.data.some((b) => b.branchId === currentContextId)) {
            this.setSelectedBranch(currentContextId);
          } else if (paged.data.length > 0 && this.selectedBranchId() === null) {
            this.setSelectedBranch(paged.data[0].branchId);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.branchesLoading.set(false);
          if (activeBranchId) {
            this.setSelectedBranch(activeBranchId);
          } else {
            this.showMessage(
              formatApiError(
                err,
                this.isAr() ? 'فشل تحميل قائمة الفروع' : 'Failed to load branches',
              ),
              'error',
            );
          }
        },
      });
  }

  onBranchSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const branchId = parseInt(select.value, 10);
    if (!isNaN(branchId)) {
      this.setSelectedBranch(branchId);
    }
  }

  setSelectedBranch(branchId: number): void {
    this.selectedBranchId.set(branchId);
    this.branchContextStore.activate(branchId);
    this.loadVideos(branchId);
  }

  loadVideos(branchId: number, silent = false): void {
    if (!silent) {
      this.videosLoading.set(true);
    }

    this.branchVideosApi.getBranchVideos(branchId).subscribe({
      next: (videos) => {
        const sorted = [...videos].sort((a, b) => a.displayOrder - b.displayOrder);
        this.videos.set(sorted);
        this.videosLoading.set(false);

        if (this.hasProcessingVideos()) {
          this.startPolling(branchId);
        } else {
          this.stopPolling();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.videosLoading.set(false);
        this.stopPolling();
        if (!silent) {
          this.showMessage(
            formatApiError(
              err,
              this.isAr() ? 'فشل تحميل الفيديوهات' : 'Failed to load videos',
            ),
            'error',
          );
        }
      },
    });
  }

  setFilter(filter: VideoFilter): void {
    this.activeFilter.set(filter);
  }

  private startPolling(branchId: number): void {
    if (this.pollingIntervalId) return;

    this.pollingIntervalId = setInterval(() => {
      const currentBranchId = this.selectedBranchId();
      if (currentBranchId !== branchId) {
        this.stopPolling();
        return;
      }

      this.loadVideos(branchId, true);
    }, 3500);
  }

  private stopPolling(): void {
    if (this.pollingIntervalId) {
      clearInterval(this.pollingIntervalId);
      this.pollingIntervalId = null;
    }
  }

  openUploadModal(): void {
    const nextOrder =
      this.videos().length > 0 ? Math.max(...this.videos().map((v) => v.displayOrder)) + 1 : 1;

    this.uploadForm.reset({ displayOrder: nextOrder });
    this.selectedUploadFile.set(null);
    this.isUploadModalOpen.set(true);
  }

  closeUploadModal(): void {
    this.isUploadModalOpen.set(false);
    this.selectedUploadFile.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedUploadFile.set(input.files[0]);
    }
  }

  submitUpload(): void {
    const branchId = this.selectedBranchId();
    const file = this.selectedUploadFile();
    const displayOrder = this.uploadForm.get('displayOrder')?.value ?? 1;

    if (!branchId || !file) {
      this.showMessage(
        this.isAr() ? 'يرجى اختيار ملف فيديو صالح.' : 'Please select a valid video file.',
        'error',
      );
      return;
    }

    if (displayOrder <= 0) {
      this.showMessage(
        this.isAr()
          ? 'ترتيب العرض يجب أن يكون أكبر من 0.'
          : 'Display order must be greater than 0.',
        'error',
      );
      return;
    }

    this.isSubmitting.set(true);
    this.branchVideosApi.uploadBranchVideo(branchId, file, displayOrder).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeUploadModal();
        this.showMessage(
          this.isAr()
            ? 'تم رفع الفيديو بنجاح وجاري المعالجة.'
            : 'Video uploaded successfully and is being processed.',
          'success',
        );
        this.loadVideos(branchId);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.showMessage(
          formatApiError(
            err,
            this.isAr() ? 'فشل رفع الفيديو' : 'Failed to upload video',
          ),
          'error',
        );
        if (err.status === 409) {
          this.loadVideos(branchId);
        }
      },
    });
  }

  moveVideo(index: number, direction: 'up' | 'down'): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !this.canUpdate()) return;

    const list = [...this.videos()];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= list.length) return;

    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    // Validate reorder criteria
    const items = list.map((item, idx) => ({
      videoId: item.id,
      displayOrder: idx + 1,
      rowVersion: item.rowVersion,
    }));

    if (
      items.length === 0 ||
      items.some((i) => i.videoId <= 0 || i.displayOrder <= 0 || !i.rowVersion)
    ) {
      this.showMessage(
        this.isAr() ? 'بيانات إعادة الترتيب غير صالحة.' : 'Invalid reorder parameters.',
        'error',
      );
      return;
    }

    const reorderPayload: ReorderBranchVideosRequest = { items };

    this.isSubmitting.set(true);
    this.branchVideosApi.reorderBranchVideos(branchId, reorderPayload).subscribe({
      next: (updatedList) => {
        this.isSubmitting.set(false);
        this.videos.set([...updatedList].sort((a, b) => a.displayOrder - b.displayOrder));
        this.showMessage(
          this.isAr() ? 'تم تحديث ترتيب الفيديوهات بنجاح.' : 'Video order updated successfully.',
          'success',
        );
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.showMessage(
          formatApiError(
            err,
            this.isAr() ? 'فشل إعادة الترتيب' : 'Failed to reorder videos',
          ),
          'error',
        );
        this.loadVideos(branchId);
      },
    });
  }

  toggleActive(video: BranchVideo): void {
    const branchId = this.selectedBranchId();
    if (!branchId || !this.canUpdate()) return;

    this.isSubmitting.set(true);

    if (video.isActive) {
      this.branchVideosApi.deactivateBranchVideo(branchId, video.id, video.rowVersion).subscribe({
        next: (state) => {
          this.isSubmitting.set(false);
          this.updateLocalVideoState(state);
          this.showMessage(this.isAr() ? 'تم إلغاء تفعيل الفيديو.' : 'Video deactivated.', 'info');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.showMessage(
            formatApiError(
              err,
              this.isAr() ? 'فشل إلغاء التفعيل' : 'Failed to deactivate video',
            ),
            'error',
          );
          if (err.status === 409 || err.status === 412) {
            this.loadVideos(branchId);
          }
        },
      });
    } else {
      this.branchVideosApi.reactivateBranchVideo(branchId, video.id, video.rowVersion).subscribe({
        next: (state) => {
          this.isSubmitting.set(false);
          this.updateLocalVideoState(state);
          this.showMessage(
            this.isAr() ? 'تم تفعيل الفيديو بنجاح.' : 'Video reactivated.',
            'success',
          );
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.showMessage(
            formatApiError(
              err,
              this.isAr() ? 'فشل تفعيل الفيديو' : 'Failed to reactivate video',
            ),
            'error',
          );
          if (err.status === 409 || err.status === 412) {
            this.loadVideos(branchId);
          }
        },
      });
    }
  }

  private updateLocalVideoState(state: BranchVideoStateResponse): void {
    this.videos.update((list) =>
      list.map((v) =>
        v.id === state.videoId
          ? {
              ...v,
              isActive: state.isActive,
              rowVersion: state.rowVersion,
              processingStatus: state.processingStatus ?? v.processingStatus,
              displayOrder: state.displayOrder ?? v.displayOrder,
            }
          : v,
      ),
    );
  }

  confirmDelete(video: BranchVideo): void {
    if (video.isActive) {
      this.showMessage(
        this.isAr()
          ? 'يجب إلغاء تفعيل الفيديو أولاً قبل حذفه نهائياً.'
          : 'Deactivate the video before permanently deleting it.',
        'error',
      );
      return;
    }
    this.videoToDelete.set(video);
  }

  cancelDelete(): void {
    this.videoToDelete.set(null);
  }

  executeDelete(): void {
    const branchId = this.selectedBranchId();
    const video = this.videoToDelete();
    if (!branchId || !video) return;

    this.isSubmitting.set(true);
    this.branchVideosApi
      .deleteBranchVideoPermanently(branchId, video.id, video.rowVersion)
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.videoToDelete.set(null);
          this.videos.update((list) => list.filter((v) => v.id !== video.id));
          this.showMessage(
            this.isAr() ? 'تم حذف الفيديو نهائياً.' : 'Video permanently deleted.',
            'success',
          );
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.videoToDelete.set(null);
          this.showMessage(
            formatApiError(
              err,
              this.isAr() ? 'فشل الحذف النهائي' : 'Failed to delete video',
            ),
            'error',
          );
          this.loadVideos(branchId);
        },
      });
  }

  openSinglePreview(video: BranchVideo): void {
    if (video.processingStatus !== 'Ready' || !video.streamUrl) {
      return;
    }
    this.previewVideo.set(video);
  }

  closeSinglePreview(): void {
    if (this.singlePlayerTeardown) {
      this.singlePlayerTeardown();
      this.singlePlayerTeardown = null;
    }
    this.previewVideo.set(null);
  }

  openPlaylistPreview(): void {
    const branchId = this.selectedBranchId();
    if (!branchId) return;

    this.isPlaylistModalOpen.set(true);
    this.playlistLoading.set(true);
    this.currentPlaylistIndex.set(0);

    this.branchVideosApi.getBranchPlaylist(branchId).subscribe({
      next: (data) => {
        this.playlistData.set(data);
        this.playlistLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.playlistLoading.set(false);
        this.showMessage(
          formatApiError(
            err,
            this.isAr() ? 'فشل تحميل قائمة التشغيل' : 'Failed to load playlist',
          ),
          'error',
        );
      },
    });
  }

  closePlaylistPreview(): void {
    if (this.playlistPlayerTeardown) {
      this.playlistPlayerTeardown();
      this.playlistPlayerTeardown = null;
    }
    this.isPlaylistModalOpen.set(false);
    this.playlistData.set(null);
  }

  onPlaylistVideoEnded(): void {
    const playlist = this.playlistData();
    if (!playlist || !playlist.videos.length) return;

    const nextIdx = (this.currentPlaylistIndex() + 1) % playlist.videos.length;
    this.currentPlaylistIndex.set(nextIdx);
  }

  resolveStreamUrl(url: string | null): string {
    return this.branchVideosApi.resolveMediaUrl(url);
  }

  showMessage(text: string, tone: ToastTone = 'info'): void {
    this.message.set({ text, tone });
  }

  clearMessage(): void {
    this.message.set(null);
  }
}
