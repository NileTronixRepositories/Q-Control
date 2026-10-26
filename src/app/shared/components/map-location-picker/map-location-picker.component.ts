import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';

export interface MapLocationCoords {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  governorate?: string;
}

@Component({
  selector: 'app-map-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './map-location-picker.component.html',
  styleUrl: './map-location-picker.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapLocationPickerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() latitude: number | string | null | undefined = null;
  @Input() longitude: number | string | null | undefined = null;
  @Input() height = '270px';
  @Input() readOnly = false;
  @Input() zoom = 13;
  @Input() direction: 'rtl' | 'ltr' = 'rtl';
  @Input() placeholderSearch = 'ابحث عن مكان، مدينة أو عنوان على الخريطة...';
  @Input() helperText = 'انقر على الخريطة أو اسحب العلامة لتحديد خط الطول والعرض تلقائياً.';

  @Output() locationChange = new EventEmitter<MapLocationCoords>();

  readonly mapContainerRef = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private readonly defaultCenter: [number, number] = [30.0444, 31.2357]; // Cairo default

  readonly searchQuery = signal('');
  readonly isSearching = signal(false);
  readonly isLocating = signal(false);
  readonly currentLat = signal<number | null>(null);
  readonly currentLng = signal<number | null>(null);
  readonly searchError = signal<string | null>(null);

  private readonly markerIcon = L.divIcon({
    className: 'niletronix-custom-pin',
    html: `
      <div class="pin-anchor">
        <div class="pin-pulse"></div>
        <div class="pin-body">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="34" viewBox="0 0 24 24" fill="#0b8aa8" stroke="#ffffff" stroke-width="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="#ffffff"></circle>
          </svg>
        </div>
      </div>
    `,
    iconSize: [28, 34],
    iconAnchor: [14, 34],
  });

  ngAfterViewInit(): void {
    this.initMap();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['latitude'] || changes['longitude']) && this.map) {
      this.syncCoordinatesFromInputs();
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }
  }

  private initMap(): void {
    const el = this.mapContainerRef()?.nativeElement;
    if (!el || this.map) {
      return;
    }

    const initialCoords = this.parseCoordinates();
    const center: [number, number] = initialCoords ?? this.defaultCenter;
    const initialZoom = initialCoords ? this.zoom : 11;

    this.map = L.map(el, {
      center,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    if (initialCoords) {
      this.setMarker(initialCoords[0], initialCoords[1], false);
      this.currentLat.set(initialCoords[0]);
      this.currentLng.set(initialCoords[1]);
    }

    if (!this.readOnly) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        this.onMapClick(e.latlng.lat, e.latlng.lng);
      });
    }

    // Invalidate size after modal render and observe resizes
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 250);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.map?.invalidateSize();
      });
      this.resizeObserver.observe(el);
    }
  }

  private parseCoordinates(): [number, number] | null {
    if (
      this.latitude === null ||
      this.latitude === undefined ||
      this.latitude === '' ||
      this.longitude === null ||
      this.longitude === undefined ||
      this.longitude === ''
    ) {
      return null;
    }
    const lat = Number(this.latitude);
    const lng = Number(this.longitude);
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return [lat, lng];
    }
    return null;
  }

  private syncCoordinatesFromInputs(): void {
    const coords = this.parseCoordinates();
    if (!coords || !this.map) {
      return;
    }

    const [lat, lng] = coords;
    this.currentLat.set(lat);
    this.currentLng.set(lng);

    if (this.marker) {
      const currentPos = this.marker.getLatLng();
      if (Math.abs(currentPos.lat - lat) > 0.00001 || Math.abs(currentPos.lng - lng) > 0.00001) {
        this.marker.setLatLng([lat, lng]);
        this.map.panTo([lat, lng]);
      }
    } else {
      this.setMarker(lat, lng, false);
      this.map.setView([lat, lng], this.zoom);
    }
  }

  private setMarker(lat: number, lng: number, emit = true): void {
    if (!this.map) return;

    if (!this.marker) {
      this.marker = L.marker([lat, lng], {
        icon: this.markerIcon,
        draggable: !this.readOnly,
      }).addTo(this.map);

      if (!this.readOnly) {
        this.marker.on('dragend', () => {
          if (!this.marker) return;
          const pos = this.marker.getLatLng();
          this.applyCoordinates(pos.lat, pos.lng);
        });
      }
    } else {
      this.marker.setLatLng([lat, lng]);
    }

    this.currentLat.set(Number(lat.toFixed(6)));
    this.currentLng.set(Number(lng.toFixed(6)));

    if (emit) {
      this.locationChange.emit({
        latitude: Number(lat.toFixed(6)),
        longitude: Number(lng.toFixed(6)),
      });
      this.reverseGeocode(lat, lng);
    }
  }

  private onMapClick(lat: number, lng: number): void {
    this.setMarker(lat, lng, true);
    this.searchError.set(null);
  }

  private applyCoordinates(lat: number, lng: number): void {
    const fixedLat = Number(lat.toFixed(6));
    const fixedLng = Number(lng.toFixed(6));
    this.currentLat.set(fixedLat);
    this.currentLng.set(fixedLng);
    this.locationChange.emit({
      latitude: fixedLat,
      longitude: fixedLng,
    });
    this.reverseGeocode(fixedLat, fixedLng);
  }

  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
    fetch(url, {
      headers: {
        'Accept-Language': this.direction === 'rtl' ? 'ar,en' : 'en,ar',
      },
    })
      .then((res) => res.json())
      .then((data: any) => {
        if (!data || !data.address) return;
        const addr = data.address;
        const city =
          addr.city || addr.town || addr.municipality || addr.village || addr.county || '';
        const governorate = addr.state || addr.governorate || addr.region || '';
        const address =
          [addr.road, addr.neighbourhood || addr.suburb].filter(Boolean).join(', ') ||
          data.display_name?.split(',').slice(0, 2).join(',') ||
          '';

        this.locationChange.emit({
          latitude: Number(lat.toFixed(6)),
          longitude: Number(lng.toFixed(6)),
          address,
          city,
          governorate,
        });
      })
      .catch(() => {
        // Silently ignore reverse geocode failures
      });
  }

  searchLocation(): void {
    const query = this.searchQuery().trim();
    if (!query) return;

    this.isSearching.set(true);
    this.searchError.set(null);

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

    fetch(url, {
      headers: {
        'Accept-Language': this.direction === 'rtl' ? 'ar,en' : 'en,ar',
      },
    })
      .then((res) => res.json())
      .then((data: Array<{ lat: string; lon: string; display_name: string }>) => {
        this.isSearching.set(false);
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          if (this.map) {
            this.map.flyTo([lat, lng], 15, { duration: 1.2 });
            this.setMarker(lat, lng, true);
          }
        } else {
          this.searchError.set(
            this.direction === 'rtl'
              ? 'لم يتم العثور على نتائج للموقع المحدد.'
              : 'No results found for this location.',
          );
        }
      })
      .catch(() => {
        this.isSearching.set(false);
        this.searchError.set(
          this.direction === 'rtl'
            ? 'تعذر البحث عن الموقع حالياً.'
            : 'Could not search for location at this time.',
        );
      });
  }

  locateCurrentPosition(): void {
    if (!navigator.geolocation) {
      this.searchError.set(
        this.direction === 'rtl'
          ? 'تحديد الموقع غير مدعوم في متصفحك.'
          : 'Geolocation is not supported by your browser.',
      );
      return;
    }

    this.isLocating.set(true);
    this.searchError.set(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.isLocating.set(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (this.map) {
          this.map.flyTo([lat, lng], 16, { duration: 1.2 });
          this.setMarker(lat, lng, true);
        }
      },
      () => {
        this.isLocating.set(false);
        this.searchError.set(
          this.direction === 'rtl'
            ? 'تعذر الوصول إلى موقعك الحالي. يرجى تفعيل إذن الموقع أو النقر يدوياً على الخريطة.'
            : 'Unable to access current location. Please grant permission or click the map directly.',
        );
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }

  resetToCoordinates(lat: number, lng: number): void {
    if (this.map) {
      this.map.setView([lat, lng], this.zoom);
      this.setMarker(lat, lng, true);
    }
  }
}
