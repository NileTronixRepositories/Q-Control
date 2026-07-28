import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { SERVICE_MANAGEMENT_TRANSLATIONS } from '../../i18n/service-management.translations';
import { ServiceDetails, ServiceImageResponse } from '../../models/service-management.model';
import { ServiceManagementApiService } from '../../services/catalog/service-management-api.service';
import { ServiceMediaManagerComponent } from './service-media-manager.component';

describe('ServiceMediaManagerComponent', () => {
  let fixture: ComponentFixture<ServiceMediaManagerComponent>;
  let api: {
    readonly getServiceImages: ReturnType<typeof vi.fn>;
    readonly getServiceDetails: ReturnType<typeof vi.fn>;
    readonly uploadServiceAds: ReturnType<typeof vi.fn>;
    readonly uploadServiceLogo: ReturnType<typeof vi.fn>;
    readonly uploadServiceIcon: ReturnType<typeof vi.fn>;
    readonly deleteServiceImage: ReturnType<typeof vi.fn>;
    readonly resolveMediaUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    });

    api = {
      getServiceImages: vi.fn(() => of([createImage(1, 'Logo'), createImage(2, 'Icon')])),
      getServiceDetails: vi.fn(() => of(createDetails())),
      uploadServiceAds: vi.fn(() => of([createImage(3, 'Ads')])),
      uploadServiceLogo: vi.fn(() => of(createImage(4, 'Logo'))),
      uploadServiceIcon: vi.fn(() => of(createImage(5, 'Icon'))),
      deleteServiceImage: vi.fn(),
      resolveMediaUrl: vi.fn((url: string | null) => url),
    };

    await TestBed.configureTestingModule({
      imports: [ServiceMediaManagerComponent],
      providers: [{ provide: ServiceManagementApiService, useValue: api }],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceMediaManagerComponent);
    fixture.componentRef.setInput('service', createDetails());
    fixture.componentRef.setInput('translations', SERVICE_MANAGEMENT_TRANSLATIONS.en);
    fixture.componentRef.setInput('canManage', true);
    fixture.detectChanges();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('loads and renders service images in the responsive media layout', () => {
    const grid = fixture.nativeElement.querySelector('.service-media-grid') as HTMLElement | null;
    const singleCards = fixture.nativeElement.querySelectorAll('.service-media-card--single');
    const logoCard = fixture.nativeElement.querySelector('.service-media-card--logo');
    const iconCard = fixture.nativeElement.querySelector('.service-media-card--icon');
    const adsCard = fixture.nativeElement.querySelector('.service-media-card--ads') as HTMLElement | null;

    expect(api.getServiceImages).toHaveBeenCalledWith(101, undefined);
    expect(fixture.nativeElement.textContent).toContain('Service Media');
    expect(fixture.nativeElement.querySelectorAll('img').length).toBe(2);
    expect(grid).not.toBeNull();
    expect(singleCards.length).toBe(2);
    expect(logoCard).not.toBeNull();
    expect(iconCard).not.toBeNull();
    expect(adsCard).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.service-media-empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('input[type="file"]').length).toBe(3);
  });

  it('renders a compact read-only state without upload controls', () => {
    fixture.componentRef.setInput('canManage', false);
    fixture.detectChanges();

    const media = fixture.nativeElement.querySelector('.service-media') as HTMLElement | null;

    expect(media?.classList).toContain('is-read-only');
    expect(fixture.nativeElement.querySelectorAll('input[type="file"]').length).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.service-media-btn').length).toBe(0);
  });

  it('rejects unsupported advertisement files before upload', () => {
    const invalid = new File(['x'], 'bad.gif', { type: 'image/gif' });
    const event = { target: { files: [invalid], value: 'bad.gif' } } as unknown as Event;

    (fixture.componentInstance as unknown as { onAdsSelected: (event: Event) => void }).onAdsSelected(event);
    fixture.detectChanges();

    expect(api.uploadServiceAds).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Only PNG, JPG, JPEG, and WEBP');
  });

  it('uploads selected advertisement files with the current service row version', () => {
    const first = new File(['a'], 'ad-1.jpg', { type: 'image/jpeg' });
    const second = new File(['b'], 'ad-2.webp', { type: 'image/webp' });
    const event = { target: { files: [first, second] } } as unknown as Event;

    (fixture.componentInstance as unknown as { onAdsSelected: (event: Event) => void }).onAdsSelected(event);
    (fixture.componentInstance as unknown as { uploadAds: () => void }).uploadAds();

    expect(api.uploadServiceAds).toHaveBeenCalledWith(101, [first, second], 'service-rv');
    expect(api.getServiceDetails).toHaveBeenCalledWith(101);
  });
});

function createDetails(): ServiceDetails {
  return {
    id: 101,
    parentServiceId: null,
    scope: 'Global',
    ownerBranchId: null,
    ownerBranchArabicName: null,
    ownerBranchEnglishName: null,
    isOwnedByCurrentBranch: false,
    isAssignedToCurrentBranch: null,
    canEditDefinition: true,
    arabicName: '????',
    englishName: 'Service',
    parentServiceNameAr: null,
    parentServiceNameEn: null,
    logoUrl: null,
    iconUrl: null,
    serviceCode: null,
    isServiceCodeRequired: false,
    isActive: true,
    effectiveIsActive: true,
    isTicketIssuable: true,
    hasChildren: false,
    canIssueTicket: true,
    isDeleted: false,
    orderNo: 1,
    priority: 1,
    weight: 1,
    rowVersion: 'service-rv',
    arabicUserMessage: null,
    englishUserMessage: null,
    isClientInputRequired: false,
    hasReservation: false,
    rangePrefix: 'S',
    rangeStartNumber: 1,
    rangeEndNumber: 999,
    waitingDuration: 0,
    noOfTicketCopies: 1,
    adsImages: [],
  };
}

function createImage(id: number, imageType: 'Logo' | 'Icon' | 'Ads'): ServiceImageResponse {
  return {
    id,
    serviceId: 101,
    imageUrl: `/Media/Services/101/${imageType}/${id}.webp`,
    imageType,
    displayOrder: id,
    isActive: true,
    rowVersion: `image-rv-${id}`,
    message: null,
  };
}
