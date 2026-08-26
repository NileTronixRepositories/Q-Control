import { Injectable, computed, inject, signal } from '@angular/core';
import { DisplayRuntimeApiService } from '../display-runtime-api/display-runtime-api.service';
import { BranchVideosApiService } from '@features/branch-management/services/branch-videos-api/branch-videos-api.service';
import {
  DisplayRuntimeConfiguration,
} from '@features/queue-management/public-api';
import {
  DisplayBranchBranding,
  DisplayMediaItem,
  DisplayQueueItem,
  DisplayTickerNews,
  WindowStatus,
} from '../../models/display/display.model';

const DEFAULT_BRANDING: DisplayBranchBranding = {
  branchId: 1,
  branchNameEn: 'NileTronix Healthcare Hospital',
  branchNameAr: 'مستشفى نايل ترونكس التخصصي',
  logoUrl: 'assets/images/logo.png',
  primaryColor: '#0b8aa8',
  secondaryColor: '#034078',
  backgroundColor: '#0a1128',
  headerColor: '#001f54',
  footerColor: '#0b8aa8',
  textColor: '#ffffff',
  tickerSpeedSeconds: 28,
};

const INITIAL_QUEUE: DisplayQueueItem[] = [
  {
    windowId: 1,
    windowNumber: '01',
    windowName: 'Clinic 01 - Internal Medicine',
    windowNameAr: 'عيادة 01 - الباطنة والجهاز الهضمي',
    category: 'Clinic',
    categoryAr: 'عيادة',
    serviceName: 'Internal Medicine',
    serviceNameAr: 'كشف باطنة عامة',
    serviceIcon: 'bi-heart-pulse-fill',
    doctorName: 'Dr. Tarek Mohamed',
    doctorNameAr: 'د. طارق محمد',
    currentTicket: 'A-108',
    status: 'serving',
    isFlashing: false,
    waitingCount: 4,
    nextTicket: 'A-109',
  },
  {
    windowId: 2,
    windowNumber: '02',
    windowName: 'Clinic 02 - Cardiology',
    windowNameAr: 'عيادة 02 - أمراض القلب والأوعية',
    category: 'Clinic',
    categoryAr: 'عيادة',
    serviceName: 'Cardiology Clinic',
    serviceNameAr: 'كشف القلب ورسم القلب',
    serviceIcon: 'bi-activity',
    doctorName: 'Dr. Mostafa Hassan',
    doctorNameAr: 'د. مصطفى حسن',
    currentTicket: 'B-204',
    status: 'calling',
    isFlashing: true,
    waitingCount: 6,
    nextTicket: 'B-205',
  },
  {
    windowId: 3,
    windowNumber: '03',
    windowName: 'Clinic 03 - Pediatrics',
    windowNameAr: 'عيادة 03 - طب الأطفال وحديثي الولادة',
    category: 'Clinic',
    categoryAr: 'عيادة',
    serviceName: 'Pediatrics Clinic',
    serviceNameAr: 'كشف الأطفال',
    serviceIcon: 'bi-emoji-smile-fill',
    doctorName: 'Dr. Sarah Ibrahim',
    doctorNameAr: 'د. سارة إبراهيم',
    currentTicket: 'C-312',
    status: 'serving',
    isFlashing: false,
    waitingCount: 3,
    nextTicket: 'C-313',
  },
  {
    windowId: 4,
    windowNumber: '04',
    windowName: 'Window 04 - Admission & Billing',
    windowNameAr: 'شباك 04 - الدخول والحسابات',
    category: 'Window',
    categoryAr: 'شباك',
    serviceName: 'Patient Admission',
    serviceNameAr: 'إجراءات الدخول والموافقة',
    serviceIcon: 'bi-credit-card-2-front-fill',
    doctorName: 'Eng. Ahmed Adel',
    doctorNameAr: 'أ. أحمد عادل',
    currentTicket: 'D-405',
    status: 'serving',
    isFlashing: false,
    waitingCount: 2,
    nextTicket: 'D-406',
  },
  {
    windowId: 5,
    windowNumber: '05',
    windowName: 'Window 05 - Main Pharmacy',
    windowNameAr: 'شباك 05 - الصيدلية الرئيسية',
    category: 'Pharmacy',
    categoryAr: 'صيدلية',
    serviceName: 'Medication Dispensing',
    serviceNameAr: 'صرف الأدوية والروشتات',
    serviceIcon: 'bi-capsule-pill',
    doctorName: 'Pharm. Dina Magdy',
    doctorNameAr: 'د. دينا مجدي',
    currentTicket: 'P-501',
    status: 'serving',
    isFlashing: false,
    waitingCount: 8,
    nextTicket: 'P-502',
  },
  {
    windowId: 6,
    windowNumber: '06',
    windowName: 'Clinic 06 - Ophthalmology',
    windowNameAr: 'عيادة 06 - طب وجراحة العيون',
    category: 'Clinic',
    categoryAr: 'عيادة',
    serviceName: 'Eye Examination',
    serviceNameAr: 'فحص البصر والعيون',
    serviceIcon: 'bi-eye-fill',
    doctorName: 'Dr. Khaled Youssef',
    doctorNameAr: 'د. خالد يوسف',
    currentTicket: 'E-602',
    status: 'available',
    isFlashing: false,
    waitingCount: 1,
    nextTicket: 'E-603',
  },
];

const INITIAL_MEDIA: DisplayMediaItem[] = [
  {
    id: 'm1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80',
    title: 'World Class Medical Care & Modern Facilities',
    titleAr: 'رعاية طبية عالمية بأحدث الأجهزة والتقنيات المتطورة',
    durationSeconds: 10,
  },
  {
    id: 'm2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    title: 'Consultations by Top Senior Consultants',
    titleAr: 'نخبة من كبار الاستشاريين في كافة التخصصات الطبية',
    durationSeconds: 10,
  },
  {
    id: 'm3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1200&q=80',
    title: 'Advanced Diagnostic & Radiology Units',
    titleAr: 'وحدات متكاملة للأشعة التشخيصية والتحاليل الفورية',
    durationSeconds: 10,
  },
];

const INITIAL_NEWS: DisplayTickerNews[] = [
  {
    id: 'n1',
    textAr: 'أهلاً بكم في صرحكم الطبي .. نسعد دائماً بخدمتكم ونتمنى لكم دوام الصحة والعافية.',
    textEn: 'Welcome to our medical facility. We are pleased to serve you and wish you speedy recovery.',
  },
  {
    id: 'n2',
    textAr: 'يرجى التوجه إلى العيادة أو الشباك الموضح على الشاشة فور ظهور رقم تذكرتكم.',
    textEn: 'Please proceed to the designated clinic or window as soon as your ticket number appears.',
  },
  {
    id: 'n3',
    textAr: 'للحصول على المساعدة أو الاستفسارات، لا تتردد في التوجه إلى مكتب خدمة العملاء الرئيسي.',
    textEn: 'For inquiries or assistance, please visit the main customer service desk.',
  },
  {
    id: 'n4',
    textAr: 'نظام حجز المواعيد والكشف الفوري متاح على مدار الساعة.',
    textEn: 'Appointment booking and urgent care services are available 24/7.',
  },
];

const DEFAULT_DISPLAY_CONFIG: DisplayRuntimeConfiguration = {
  displayBackgroundColor: '#0a1128',
  mainTitleAr: 'مستشفى نايل ترونكس التخصصي',
  mainTitleEn: 'NileTronix Healthcare Hospital',
  headerBackgroundColor: '#001f54',
  mainTitleTextColor: '#ffffff',
  mainTitleFontSize: 28,
  tableHeaderBackgroundColor: '#0b8aa8',
  tableHeaderTextColor: '#ffffff',
  tableRowBackgroundColor: '#0a1128',
  tableRowTextColor: '#ffffff',
  ticketNumberBackgroundColor: '#0b8aa8',
  ticketNumberTextColor: '#ffffff',
  ticketColumnTitleAr: 'رقم التذكرة',
  ticketColumnTitleEn: 'Ticket',
  serviceColumnTitleAr: 'الطبيب - الخدمة',
  serviceColumnTitleEn: 'Doctor-Service',
  windowColumnTitleAr: 'العيادة / الشباك',
  windowColumnTitleEn: 'Clinic',
  tickerBackgroundColor: '#0b8aa8',
  tickerTextColor: '#ffffff',
  tickerFontSize: 18,
  showClock: true,
  clockBackgroundColor: '#034078',
  clockTextColor: '#ffffff',
};

@Injectable({
  providedIn: 'root',
})
export class DisplayStateService {
  private readonly runtimeApi = inject(DisplayRuntimeApiService, { optional: true });
  private readonly branchVideosApi = inject(BranchVideosApiService, { optional: true });

  readonly branding = signal<DisplayBranchBranding>(DEFAULT_BRANDING);
  readonly queueItems = signal<DisplayQueueItem[]>(INITIAL_QUEUE);
  readonly mediaList = signal<DisplayMediaItem[]>(INITIAL_MEDIA);
  readonly activeMediaIndex = signal<number>(0);
  readonly isPlayingVideos = signal<boolean>(false);
  readonly tickerNews = signal<DisplayTickerNews[]>(INITIAL_NEWS);
  readonly language = signal<'ar' | 'en'>('ar');
  readonly isSoundEnabled = signal<boolean>(true);
  readonly selectedWindowId = signal<number>(1);
  readonly lastCalledWindow = signal<DisplayQueueItem | null>(null);

  // ─── Runtime Display Configuration ─────────────────────────────────────
  readonly runtimeConfig = signal<DisplayRuntimeConfiguration>(DEFAULT_DISPLAY_CONFIG);
  readonly runtimeLogoUrl = signal<string | null>(null);
  readonly runtimeConfigLoaded = signal<boolean>(false);

  // Computed properties
  readonly currentMedia = computed(() => {
    const list = this.mediaList();
    if (!list.length) return null;
    const idx = this.activeMediaIndex();
    return list[idx % list.length] ?? null;
  });

  readonly selectedWindow = computed(() => {
    const id = this.selectedWindowId();
    return this.queueItems().find((w) => w.windowId === id) ?? this.queueItems()[0];
  });

  private audioCtx: AudioContext | null = null;
  private flashTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private slideshowIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startMediaSlideshow();
  }

  // ─── Runtime Configuration Loading (New Public APIs) ───────────────────

  loadRuntimeConfiguration(branchId: number): void {
    if (!this.runtimeApi) return;

    this.runtimeApi.getRuntimeConfiguration(branchId).subscribe({
      next: (response) => {
        // Apply display configuration
        if (response.displayConfiguration) {
          this.runtimeConfig.set(response.displayConfiguration);
        }

        // Apply logo
        const logoUrl = response.branding?.logoUrl ?? null;
        if (logoUrl) {
          this.runtimeLogoUrl.set(this.runtimeApi!.resolveMediaUrl(logoUrl));
        } else {
          this.runtimeLogoUrl.set(null);
        }

        // Apply branding from config
        const config = response.displayConfiguration;
        if (config) {
          this.branding.update((current) => ({
            ...current,
            branchId: response.branchId,
            branchNameAr: config.mainTitleAr,
            branchNameEn: config.mainTitleEn,
          }));
        }

        // Apply active messages as ticker news
        if (response.messages && response.messages.length > 0) {
          this.tickerNews.set(
            response.messages.map((msg) => ({
              id: String(msg.id),
              textAr: msg.textAr,
              textEn: msg.textEn,
            })),
          );
        }

        this.runtimeConfigLoaded.set(true);
      },
      error: () => {
        // Fallback: keep defaults, don't crash
        this.runtimeConfigLoaded.set(true);
      },
    });
  }

  loadRuntimePlaylist(branchId: number): void {
    if (!this.runtimeApi) {
      // Fallback to old authenticated API if runtime API is not available
      this.loadBranchPlaylist(branchId);
      return;
    }

    this.runtimeApi.getRuntimePlaylist(branchId).subscribe({
      next: (response) => {
        if (response?.videos && response.videos.length > 0) {
          const videoMediaItems: DisplayMediaItem[] = response.videos.map((v) => ({
            id: `video-${v.videoId}`,
            type: 'video',
            url: this.runtimeApi!.resolveMediaUrl(v.streamUrl),
            title: `Display Video #${v.displayOrder}`,
            titleAr: `فيديو العرض #${v.displayOrder}`,
          }));

          this.stopMediaSlideshow();
          this.isPlayingVideos.set(true);
          this.mediaList.set(videoMediaItems);
          this.activeMediaIndex.set(0);
        } else {
          this.isPlayingVideos.set(false);
          this.mediaList.set(INITIAL_MEDIA);
          this.activeMediaIndex.set(0);
          this.startMediaSlideshow();
        }
      },
      error: () => {
        this.isPlayingVideos.set(false);
        this.mediaList.set(INITIAL_MEDIA);
        this.activeMediaIndex.set(0);
        this.startMediaSlideshow();
      },
    });
  }

  loadBranchPlaylist(branchId: number): void {
    if (!this.branchVideosApi) return;

    this.branchVideosApi.getBranchPlaylist(branchId).subscribe({
      next: (playlist) => {
        if (playlist && playlist.videos && playlist.videos.length > 0) {
          // Backend is the single Source of Truth for order; keep original list order without sorting
          const videoMediaItems: DisplayMediaItem[] = playlist.videos.map((v) => ({
            id: `video-${v.videoId}`,
            type: 'video',
            url: this.branchVideosApi!.resolveMediaUrl(v.streamUrl),
            title: `Display Video #${v.displayOrder}`,
            titleAr: `فيديو العرض #${v.displayOrder}`,
          }));

          this.stopMediaSlideshow();
          this.isPlayingVideos.set(true);
          this.mediaList.set(videoMediaItems);
          this.activeMediaIndex.set(0);
        } else {
          // Empty playlist: fallback to default images without throwing any error
          this.isPlayingVideos.set(false);
          this.mediaList.set(INITIAL_MEDIA);
          this.activeMediaIndex.set(0);
          this.startMediaSlideshow();
        }
      },
      error: () => {
        // Fallback gracefully to default images if API fails or is not available
        this.isPlayingVideos.set(false);
        this.mediaList.set(INITIAL_MEDIA);
        this.activeMediaIndex.set(0);
        this.startMediaSlideshow();
      },
    });
  }

  onVideoEnded(): void {
    const list = this.mediaList();
    if (!list.length) return;

    // Loop through playlist: video 1 -> video 2 -> video 3 -> video 1
    const nextIdx = (this.activeMediaIndex() + 1) % list.length;
    this.activeMediaIndex.set(nextIdx);
  }

  setLanguage(lang: 'ar' | 'en'): void {
    this.language.set(lang);
  }

  toggleLanguage(): void {
    this.language.set(this.language() === 'ar' ? 'en' : 'ar');
  }

  toggleSound(): void {
    this.isSoundEnabled.update((v) => !v);
  }

  selectWindow(windowId: number): void {
    this.selectedWindowId.set(windowId);
  }

  nextMedia(): void {
    const list = this.mediaList();
    if (!list.length) return;
    this.activeMediaIndex.update((idx) => (idx + 1) % list.length);
  }

  prevMedia(): void {
    const list = this.mediaList();
    if (!list.length) return;
    this.activeMediaIndex.update((idx) => (idx <= 0 ? list.length - 1 : idx - 1));
  }

  callNextTicket(targetWindowId?: number): void {
    const items = [...this.queueItems()];
    let targetIndex = 0;

    if (targetWindowId !== undefined) {
      targetIndex = items.findIndex((w) => w.windowId === targetWindowId);
      if (targetIndex === -1) targetIndex = 0;
    } else {
      targetIndex = Math.floor(Math.random() * items.length);
    }

    const currentItem = items[targetIndex];
    const match = currentItem.currentTicket.match(/^([A-Z]+)-?(\d+)$/);
    let nextTicketNumber = 'A-101';
    let upcomingTicket = 'A-102';

    if (match) {
      const prefix = match[1];
      const num = parseInt(match[2], 10) + 1;
      nextTicketNumber = `${prefix}-${num}`;
      upcomingTicket = `${prefix}-${num + 1}`;
    }

    const updatedItem: DisplayQueueItem = {
      ...currentItem,
      currentTicket: nextTicketNumber,
      nextTicket: upcomingTicket,
      status: 'calling',
      isFlashing: true,
      lastCalledAt: new Date(),
    };

    const newItems = items.map((w, idx) =>
      idx === targetIndex ? updatedItem : { ...w, isFlashing: false },
    );

    this.queueItems.set(newItems);
    this.lastCalledWindow.set(updatedItem);

    if (this.isSoundEnabled()) {
      this.playChime();
    }

    if (this.flashTimeoutId) {
      clearTimeout(this.flashTimeoutId);
    }
    this.flashTimeoutId = setTimeout(() => {
      this.queueItems.update((list) =>
        list.map((item) =>
          item.windowId === updatedItem.windowId
            ? { ...item, isFlashing: false, status: 'serving' }
            : item,
        ),
      );
    }, 8000);
  }

  playChime(): void {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContextClass();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      // First Tone
      const osc1 = this.audioCtx.createOscillator();
      const gain1 = this.audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc1.connect(gain1);
      gain1.connect(this.audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.85);

      // Second Tone
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1046.5, now + 0.28);
      gain2.gain.setValueAtTime(0, now + 0.28);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.33);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(this.audioCtx.destination);
      osc2.start(now + 0.28);
      osc2.stop(now + 1.25);
    } catch {
      // AudioContext fallback
    }
  }

  private startMediaSlideshow(): void {
    if (this.slideshowIntervalId) return;
    this.slideshowIntervalId = setInterval(() => {
      if (!this.isPlayingVideos()) {
        this.nextMedia();
      }
    }, 12000);
  }

  private stopMediaSlideshow(): void {
    if (this.slideshowIntervalId) {
      clearInterval(this.slideshowIntervalId);
      this.slideshowIntervalId = null;
    }
  }
}
