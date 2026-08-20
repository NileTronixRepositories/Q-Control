import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DisplayStateService } from '../../services/display-state.service';
import { HlsPlayerService } from '../../../technical-admin/services/hls-player.service';

@Component({
  selector: 'app-display-media-player',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './display-media-player.component.html',
  styleUrl: './display-media-player.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisplayMediaPlayerComponent implements OnDestroy {
  protected readonly state = inject(DisplayStateService);
  private readonly hlsPlayerService = inject(HlsPlayerService);

  readonly videoPlayerRef = viewChild<ElementRef<HTMLVideoElement>>('videoPlayer');

  readonly currentMedia = this.state.currentMedia;
  readonly mediaList = this.state.mediaList;
  readonly activeIndex = this.state.activeMediaIndex;

  readonly mediaTitle = computed(() => {
    const item = this.currentMedia();
    if (!item) return '';
    return this.state.language() === 'ar' ? (item.titleAr ?? item.title) : (item.title ?? item.titleAr);
  });

  private playerTeardown: (() => void) | null = null;

  constructor() {
    effect(() => {
      const media = this.currentMedia();
      const videoEl = this.videoPlayerRef()?.nativeElement;

      if (this.playerTeardown) {
        this.playerTeardown();
        this.playerTeardown = null;
      }

      if (media && media.type === 'video' && media.url && videoEl) {
        void this.hlsPlayerService
          .attachMedia(videoEl, media.url, {
            autoplay: true,
            muted: true,
            onEnded: () => this.state.onVideoEnded(),
          })
          .then((teardown) => {
            this.playerTeardown = teardown;
          });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.playerTeardown) {
      this.playerTeardown();
      this.playerTeardown = null;
    }
  }

  selectMedia(index: number): void {
    this.state.activeMediaIndex.set(index);
  }
}
