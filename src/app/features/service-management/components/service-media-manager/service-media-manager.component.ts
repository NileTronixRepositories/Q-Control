import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { finalize } from 'rxjs';

import { NiletronixLoadingStateComponent } from '../../../../shared/components/niletronix-loading-state/niletronix-loading-state.component';
import { formatTechnicalAdminApiError } from '../../../technical-admin/utils/api-error-message.util';
import { ServiceManagementTranslations } from '../../i18n/service-management.translations';
import {
  ServiceDetails,
  ServiceImageResponse,
  ServiceImageType,
  ServiceUiMessage,
} from '../../models/service-management.model';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api.service';

interface ServiceMediaState {
  readonly logo: ServiceImageResponse | null;
  readonly icon: ServiceImageResponse | null;
  readonly ads: readonly ServiceImageResponse[];
  readonly loading: boolean;
  readonly uploadingLogo: boolean;
  readonly uploadingIcon: boolean;
  readonly uploadingAds: boolean;
  readonly deletingImageIds: ReadonlySet<number>;
}

interface SelectedAdPreview {
  readonly id: number;
  readonly file: File;
  readonly previewUrl: string;
}

interface ImageDeleteConfirmState {
  readonly image: ServiceImageResponse;
  readonly title: string;
  readonly body: string;
}

const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const ACCEPTED_IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp']);
const EMPTY_MEDIA_STATE: ServiceMediaState = {
  logo: null,
  icon: null,
  ads: [],
  loading: false,
  uploadingLogo: false,
  uploadingIcon: false,
  uploadingAds: false,
  deletingImageIds: new Set<number>(),
};

@Component({
  selector: 'app-service-media-manager',
  standalone: true,
  imports: [NiletronixLoadingStateComponent],
  templateUrl: './service-media-manager.component.html',
  styleUrl: './service-media-manager.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceMediaManagerComponent implements OnDestroy {
  private readonly apiService = inject(ServiceManagementApiService);

  readonly service = input.required<ServiceDetails>();
  readonly translations = input.required<ServiceManagementTranslations>();
  readonly canManage = input(false);

  readonly serviceChange = output<ServiceDetails>();
  readonly mediaChanged = output<void>();
  readonly message = output<ServiceUiMessage>();

  protected readonly state = signal<ServiceMediaState>(EMPTY_MEDIA_STATE);
  protected readonly selectedAds = signal<readonly SelectedAdPreview[]>([]);
  protected readonly validationError = signal<string | null>(null);
  protected readonly confirmState = signal<ImageDeleteConfirmState | null>(null);
  protected readonly supportedTypes = computed(() => this.translations().allowedImageTypes);
  protected readonly canUploadAds = computed(
    () => this.canManage() && this.selectedAds().length > 0 && !this.state().uploadingAds,
  );

  private mediaRequestId = 0;
  private previewId = 0;

  constructor() {
    effect(() => {
      const service = this.service();
      untracked(() => this.initializeForService(service));
    });
  }

  ngOnDestroy(): void {
    this.mediaRequestId += 1;
    this.revokeSelectedAdPreviews();
  }

  protected resolvedUrl(image: ServiceImageResponse | null): string | null {
    return this.apiService.resolveMediaUrl(image?.imageUrl ?? null);
  }

  protected imageAlt(image: ServiceImageResponse): string {
    return `${this.imageTypeLabel(image.imageType)} ${this.serviceName()}`;
  }

  protected serviceName(): string {
    const details = this.service();
    return details.englishName || details.arabicName;
  }

  protected imageTypeLabel(type: ServiceImageType): string {
    if (type === 'Logo') return this.translations().serviceLogo;
    if (type === 'Icon') return this.translations().serviceIcon;
    return this.translations().advertisementImages;
  }

  protected deleting(image: ServiceImageResponse): boolean {
    return this.state().deletingImageIds.has(image.id);
  }

  protected onSingleImageSelected(type: Exclude<ServiceImageType, 'Ads'>, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0) ?? null;

    if (!file || !this.isValidImage(file)) {
      this.validationError.set(this.translations().invalidImageType);
      input.value = '';
      return;
    }

    if (!this.canManage()) {
      this.validationError.set(this.translations().noPermissionHint);
      input.value = '';
      return;
    }

    this.validationError.set(null);
    this.uploadSingleImage(type, file, input);
  }

  protected onAdsSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);

    if (files.length === 0) {
      this.validationError.set(this.translations().imagesRequired);
      return;
    }

    if (files.some((file) => !this.isValidImage(file))) {
      this.validationError.set(this.translations().invalidImageType);
      input.value = '';
      return;
    }

    this.validationError.set(null);
    this.replaceSelectedAds(files);
  }

  protected removeSelectedAd(id: number): void {
    const removed = this.selectedAds().find((preview) => preview.id === id);
    if (removed) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    this.selectedAds.update((current) => current.filter((preview) => preview.id !== id));
  }

  protected uploadAds(): void {
    const selected = this.selectedAds();

    if (selected.length === 0) {
      this.validationError.set(this.translations().imagesRequired);
      return;
    }

    if (!this.canManage()) {
      this.validationError.set(this.translations().noPermissionHint);
      return;
    }

    this.patchState({ uploadingAds: true });
    this.apiService
      .uploadServiceAds(
        this.service().id,
        selected.map((item) => item.file),
        this.service().rowVersion,
      )
      .pipe(finalize(() => this.patchState({ uploadingAds: false })))
      .subscribe({
        next: (response) => {
          this.showSuccess(response[0]?.message ?? this.translations().uploadSuccessful);
          this.revokeSelectedAdPreviews();
          this.selectedAds.set([]);
          this.loadImages('Ads');
          this.refreshServiceDetails();
        },
        error: (error: HttpErrorResponse) => this.handleMediaError(error, 'upload'),
      });
  }

  protected requestDelete(image: ServiceImageResponse): void {
    if (!this.canManage() || this.deleting(image)) {
      return;
    }

    this.confirmState.set({
      image,
      title: this.deleteTitle(image.imageType),
      body: this.translations().confirmImageDeletion,
    });
  }

  protected closeDeleteConfirm(): void {
    if (!this.state().deletingImageIds.size) {
      this.confirmState.set(null);
    }
  }

  protected confirmDelete(): void {
    const confirm = this.confirmState();

    if (!confirm || !this.canManage() || this.deleting(confirm.image)) {
      return;
    }

    const image = confirm.image;
    this.patchState({ deletingImageIds: new Set([...this.state().deletingImageIds, image.id]) });
    this.apiService
      .deleteServiceImage(image.serviceId, image.id, image.rowVersion)
      .pipe(finalize(() => this.removeDeletingImageId(image.id)))
      .subscribe({
        next: (response) => {
          this.confirmState.set(null);
          this.removeImageLocally(image.id);
          this.showSuccess(response.message ?? this.translations().deleteSuccessful);
          this.loadImages(image.imageType);
          this.mediaChanged.emit();
        },
        error: (error: HttpErrorResponse) => {
          this.confirmState.set(null);
          this.handleMediaError(error, 'delete', image.imageType);
        },
      });
  }

  private initializeForService(service: ServiceDetails): void {
    this.mediaRequestId += 1;
    this.revokeSelectedAdPreviews();
    this.selectedAds.set([]);
    this.validationError.set(null);
    this.confirmState.set(null);
    this.state.set({
      ...EMPTY_MEDIA_STATE,
      logo: this.imageFromDetails(service, 'Logo', service.logoUrl),
      icon: this.imageFromDetails(service, 'Icon', service.iconUrl),
      ads: [...(service.adsImages ?? [])].sort(this.compareImages),
    });
    this.loadImages();
  }

  private loadImages(imageType?: ServiceImageType): void {
    const requestId = ++this.mediaRequestId;
    const serviceId = this.service().id;
    this.patchState({ loading: true });

    this.apiService
      .getServiceImages(serviceId, imageType)
      .pipe(
        finalize(() => {
          if (requestId === this.mediaRequestId) {
            this.patchState({ loading: false });
          }
        }),
      )
      .subscribe({
        next: (images) => {
          if (requestId !== this.mediaRequestId && !imageType) {
            return;
          }
          this.mergeImages(images, imageType);
        },
        error: (error: HttpErrorResponse) => this.handleMediaError(error, 'load'),
      });
  }

  private uploadSingleImage(
    type: Exclude<ServiceImageType, 'Ads'>,
    file: File,
    input: HTMLInputElement,
  ): void {
    const uploadingKey = type === 'Logo' ? 'uploadingLogo' : 'uploadingIcon';
    const request$ = type === 'Logo'
      ? this.apiService.uploadServiceLogo(this.service().id, file, this.service().rowVersion)
      : this.apiService.uploadServiceIcon(this.service().id, file, this.service().rowVersion);

    this.patchState({ [uploadingKey]: true } as Partial<ServiceMediaState>);
    request$
      .pipe(finalize(() => this.patchState({ [uploadingKey]: false } as Partial<ServiceMediaState>)))
      .subscribe({
        next: (image) => {
          input.value = '';
          this.mergeImages([image], type);
          this.showSuccess(image.message ?? this.translations().uploadSuccessful);
          this.refreshServiceDetails();
        },
        error: (error: HttpErrorResponse) => this.handleMediaError(error, 'upload', type),
      });
  }

  private refreshServiceDetails(): void {
    this.apiService.getServiceDetails(this.service().id).subscribe({
      next: (details) => {
        this.serviceChange.emit(details);
        this.mediaChanged.emit();
      },
      error: (error: HttpErrorResponse) => this.handleMediaError(error, 'refresh'),
    });
  }

  private mergeImages(images: readonly ServiceImageResponse[], imageType?: ServiceImageType): void {
    const logo = imageType && imageType !== 'Logo'
      ? this.state().logo
      : this.firstImage(images, 'Logo') ?? (imageType ? null : this.state().logo);
    const icon = imageType && imageType !== 'Icon'
      ? this.state().icon
      : this.firstImage(images, 'Icon') ?? (imageType ? null : this.state().icon);
    const ads = imageType && imageType !== 'Ads'
      ? this.state().ads
      : images.filter((image) => image.imageType === 'Ads').sort(this.compareImages);

    this.patchState({ logo, icon, ads });
  }

  private removeImageLocally(imageId: number): void {
    const current = this.state();
    this.state.set({
      ...current,
      logo: current.logo?.id === imageId ? null : current.logo,
      icon: current.icon?.id === imageId ? null : current.icon,
      ads: current.ads.filter((image) => image.id !== imageId),
    });
  }

  private firstImage(
    images: readonly ServiceImageResponse[],
    imageType: Exclude<ServiceImageType, 'Ads'>,
  ): ServiceImageResponse | null {
    return images.find((image) => image.imageType === imageType) ?? null;
  }

  private imageFromDetails(
    service: ServiceDetails,
    imageType: Exclude<ServiceImageType, 'Ads'>,
    imageUrl: string | null | undefined,
  ): ServiceImageResponse | null {
    if (!imageUrl) {
      return null;
    }

    return {
      id: 0,
      serviceId: service.id,
      imageUrl,
      imageType,
      displayOrder: 0,
      isActive: true,
      rowVersion: '',
      message: null,
    };
  }

  private replaceSelectedAds(files: readonly File[]): void {
    this.revokeSelectedAdPreviews();
    this.selectedAds.set(
      files.map((file) => ({
        id: ++this.previewId,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    );
  }

  private revokeSelectedAdPreviews(): void {
    this.selectedAds().forEach((preview) => URL.revokeObjectURL(preview.previewUrl));
  }

  private isValidImage(file: File): boolean {
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return file.size > 0 && ACCEPTED_IMAGE_TYPES.has(file.type) && ACCEPTED_IMAGE_EXTENSIONS.has(extension);
  }

  private handleMediaError(
    error: HttpErrorResponse,
    operation: 'load' | 'upload' | 'delete' | 'refresh',
    imageType?: ServiceImageType,
  ): void {
    const message = this.isConcurrencyError(error)
      ? this.translations().imageConcurrencyConflict
      : formatTechnicalAdminApiError(error, this.translations().fallbackError);

    this.message.emit({ tone: 'error', text: message });

    if (this.isConcurrencyError(error) || error.status === 404) {
      if (operation === 'delete') {
        this.loadImages(imageType);
      } else {
        this.refreshServiceDetails();
        this.loadImages(imageType);
      }
    }
  }

  private isConcurrencyError(error: HttpErrorResponse): boolean {
    const code = typeof error.error?.code === 'string' ? error.error.code : '';
    return error.status === 409 || code.includes('ConcurrencyConflict') || code.includes('InvalidRowVersion');
  }

  private showSuccess(text: string): void {
    this.message.emit({ tone: 'success', text });
  }

  private deleteTitle(type: ServiceImageType): string {
    if (type === 'Logo') return this.translations().deleteLogo;
    if (type === 'Icon') return this.translations().deleteIcon;
    return this.translations().deleteImage;
  }

  private patchState(patch: Partial<ServiceMediaState>): void {
    this.state.update((current) => ({ ...current, ...patch }));
  }

  private removeDeletingImageId(imageId: number): void {
    const next = new Set(this.state().deletingImageIds);
    next.delete(imageId);
    this.patchState({ deletingImageIds: next });
  }

  private compareImages(left: ServiceImageResponse, right: ServiceImageResponse): number {
    return left.displayOrder - right.displayOrder || left.id - right.id;
  }
}