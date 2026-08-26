import { Injectable } from '@angular/core';

declare global {
  interface Window {
    Hls?: any;
  }
}

const HLS_CDN_URL = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js';

export interface HlsAttachOptions {
  autoplay?: boolean;
  muted?: boolean;
  onEnded?: () => void;
  onError?: (err: unknown) => void;
}

@Injectable({
  providedIn: 'root',
})
export class HlsPlayerService {
  private scriptLoadingPromise: Promise<boolean> | null = null;

  async loadHlsScript(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    if (window.Hls && window.Hls.isSupported()) {
      return true;
    }

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<boolean>((resolve) => {
      const existing = document.querySelector(`script[src="${HLS_CDN_URL}"]`);
      if (existing) {
        if (window.Hls) {
          resolve(true);
        } else {
          existing.addEventListener('load', () => resolve(true));
          existing.addEventListener('error', () => resolve(false));
        }
        return;
      }

      const script = document.createElement('script');
      script.src = HLS_CDN_URL;
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        resolve(window.Hls?.isSupported() ?? false);
      };
      script.onerror = () => {
        console.warn('Failed to load HLS.js from CDN; falling back to native video playback.');
        resolve(false);
      };
      document.head.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  async attachMedia(
    videoElement: HTMLVideoElement,
    streamUrl: string,
    options: HlsAttachOptions = {},
  ): Promise<() => void> {
    const { autoplay = true, muted, onEnded, onError } = options;

    if (muted !== undefined) {
      videoElement.muted = muted;
    }

    let hlsInstance: any = null;
    let endedHandler: (() => void) | null = null;

    if (onEnded) {
      endedHandler = () => onEnded();
      videoElement.addEventListener('ended', endedHandler);
    }

    const isNativeHlsSupported = videoElement.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (isNativeHlsSupported) {
      videoElement.src = streamUrl;
      if (autoplay) {
        videoElement.play().catch((err) => {
          console.debug('Autoplay prevented or deferred:', err);
        });
      }
    } else {
      const hlsLoaded = await this.loadHlsScript();
      if (hlsLoaded && window.Hls?.isSupported()) {
        hlsInstance = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
        });

        hlsInstance.loadSource(streamUrl);
        hlsInstance.attachMedia(videoElement);

        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
          if (autoplay) {
            videoElement.play().catch((err) => {
              console.debug('HLS autoplay prevented:', err);
            });
          }
        });

        if (onError) {
          hlsInstance.on(window.Hls.Events.ERROR, (_event: unknown, data: unknown) => {
            onError(data);
          });
        }
      } else {
        videoElement.src = streamUrl;
        if (autoplay) {
          videoElement.play().catch((err) => {
            console.debug('Native video play error:', err);
          });
        }
      }
    }

    return () => {
      if (endedHandler) {
        videoElement.removeEventListener('ended', endedHandler);
      }
      if (hlsInstance) {
        try {
          hlsInstance.destroy();
        } catch {
          // Ignore destruction errors
        }
        hlsInstance = null;
      }
      try {
        videoElement.removeAttribute('src');
        videoElement.load();
      } catch {
        // Ignore reset errors
      }
    };
  }
}
