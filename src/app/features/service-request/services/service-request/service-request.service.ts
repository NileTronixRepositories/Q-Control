import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { AuthSessionService } from '../../../auth/services/auth-session/auth-session.service';
import { AppLanguageStore } from '../../../../core/i18n/app-language.store';
import { LocalizedText } from '../../models/language/language.model';
import {
  BranchServiceNodeDto,
  MappedServiceRequestData,
  TicketIssuableServicesResponse,
} from '../../models/service-request-api/service-request-api.model';
import { ServiceRequestCardTone, ServiceType } from '../../models/service-type/service-type.model';
import { Specialty } from '../../models/specialty/specialty.model';

const TONES: readonly ServiceRequestCardTone[] = ['blue', 'cyan', 'green', 'orange', 'red', 'purple'];
const BRANCHES_PATH = 'api/branches';

@Injectable({
  providedIn: 'root',
})
export class ServiceRequestService {
  private readonly httpClient = inject(HttpClient);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly appLanguageStore = inject(AppLanguageStore);
  private readonly branchesEndpoint = new URL(BRANCHES_PATH, environment.apiBaseUrl).toString().replace(/\/$/, '');

  loadBranchServices(branchId: number): Observable<MappedServiceRequestData> {
    const url = `${this.branchesEndpoint}/${branchId}/ticket-issuable-services`;
    return this.httpClient
      .get<TicketIssuableServicesResponse>(url, { headers: this.createPublicHeaders() })
      .pipe(map((response) => this.mapApiResponse(response)));
  }

  private createPublicHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Accept-Language': this.appLanguageStore.language(),
      'Content-Type': 'application/json',
    });
  }

  private mapApiResponse(response: TicketIssuableServicesResponse): MappedServiceRequestData {
    const serviceTypes: ServiceType[] = [];
    const specialtiesMap = new Map<string, readonly Specialty[]>();

    const services = response.services ?? [];

    for (let index = 0; index < services.length; index++) {
      const node = services[index];
      const { serviceType, specialties } = this.mapToServiceType(node, index);
      serviceTypes.push(serviceType);
      specialtiesMap.set(serviceType.id, specialties);
    }

    const branchBranding = response.branchBranding ?? null;
    const resolvedLogo = this.resolveMediaUrl(branchBranding?.logoUrl ?? null);
    const theme = branchBranding?.theme ?? null;

    return {
      branchId: response.branchId,
      branchBranding,
      logoUrl: resolvedLogo,
      theme,
      serviceTypes,
      specialtiesMap,
    };
  }

  private mapToServiceType(
    node: BranchServiceNodeDto,
    index: number,
  ): { readonly serviceType: ServiceType; readonly specialties: readonly Specialty[] } {
    const id = String(node.serviceId);
    const code = node.rangePrefix ?? `SRV-${node.serviceId}`;
    const ticketPrefix = node.rangePrefix ?? (String(node.serviceId).charAt(0).toUpperCase() || 'Q');
    const name: LocalizedText = {
      ar: node.arabicName ?? node.englishName ?? `خدمة ${node.serviceId}`,
      en: node.englishName ?? node.arabicName ?? `Service ${node.serviceId}`,
    };
    const description: LocalizedText = {
      ar: node.arabicUserMessage ?? '',
      en: node.englishUserMessage ?? '',
    };
    const tone = TONES[index % TONES.length];
    const icon = this.resolveServiceIcon(name.en, name.ar, index);
    const estimatedWaitingMinutes = 0;

    const childNodes = node.children ?? [];
    const specialties = childNodes.map((child, childIdx) => this.mapToSpecialty(child, childIdx, tone));
    const specialtyIds = specialties.map((s) => s.id);
    const customInputs = node.customInputs ? [...node.customInputs].sort((a, b) => a.order - b.order) : [];

    const serviceType: ServiceType = {
      id,
      code,
      ticketPrefix,
      name,
      description,
      icon,
      tone,
      estimatedWaitingMinutes,
      specialtyIds,
      isTicketIssuable: node.isTicketIssuable,
      isClientInputRequired: node.isClientInputRequired,
      customInputs,
    };

    return { serviceType, specialties };
  }

  private mapToSpecialty(
    node: BranchServiceNodeDto,
    index: number,
    parentTone: ServiceRequestCardTone,
  ): Specialty {
    const id = String(node.serviceId);
    const code = node.rangePrefix ?? `SPEC-${node.serviceId}`;
    const name: LocalizedText = {
      ar: node.arabicName ?? node.englishName ?? `تخصص ${node.serviceId}`,
      en: node.englishName ?? node.arabicName ?? `Specialty ${node.serviceId}`,
    };
    const description: LocalizedText = {
      ar: node.arabicUserMessage ?? '',
      en: node.englishUserMessage ?? '',
    };
    const parentToneIdx = TONES.indexOf(parentTone);
    const tone = TONES[(parentToneIdx + index + 1) % TONES.length];
    const icon = this.resolveServiceIcon(name.en, name.ar, index + 2);
    const estimatedWaitingMinutes = 0;
    const childNodes = node.children ?? [];
    const subSpecialties = childNodes.map((child, childIdx) => this.mapToSpecialty(child, childIdx, tone));
    const customInputs = node.customInputs ? [...node.customInputs].sort((a, b) => a.order - b.order) : [];

    return {
      id,
      code,
      name,
      description,
      icon,
      tone,
      estimatedWaitingMinutes,
      subSpecialties,
      ticketPrefix: node.rangePrefix ?? undefined,
      isTicketIssuable: node.isTicketIssuable,
      isClientInputRequired: node.isClientInputRequired,
      customInputs,
    };
  }

  private resolveServiceIcon(enName: string, arName: string, fallbackIdx: number): string {
    const text = `${enName} ${arName}`.toLowerCase();
    if (text.includes('outpatient') || text.includes('consult') || text.includes('كشف') || text.includes('عياد')) {
      return 'bi-clipboard2-pulse';
    }
    if (text.includes('internal') || text.includes('medicine') || text.includes('باطن')) {
      return 'bi-heart-pulse';
    }
    if (text.includes('pediatr') || text.includes('child') || text.includes('أطفال') || text.includes('طفل')) {
      return 'bi-emoji-smile';
    }
    if (text.includes('emergenc') || text.includes('triage') || text.includes('طوارئ') || text.includes('عاجل')) {
      return 'bi-exclamation-triangle';
    }
    if (text.includes('lab') || text.includes('patho') || text.includes('معمل') || text.includes('تحاليل') || text.includes('عين')) {
      return 'bi-beaker';
    }
    if (text.includes('radio') || text.includes('ray') || text.includes('sonar') || text.includes('أشعة') || text.includes('سونار')) {
      return 'bi-camera-fill';
    }
    if (text.includes('ortho') || text.includes('bone') || text.includes('عظام') || text.includes('مفاصل')) {
      return 'bi-bandaid';
    }
    if (text.includes('derma') || text.includes('skin') || text.includes('جلد') || text.includes('ليزر')) {
      return 'bi-stars';
    }
    if (text.includes('cardio') || text.includes('heart') || text.includes('قلب') || text.includes('ضغط')) {
      return 'bi-heart';
    }
    if (text.includes('gastro') || text.includes('stomach') || text.includes('liver') || text.includes('هضمي') || text.includes('كبد') || text.includes('معدة')) {
      return 'bi-capsule';
    }
    if (text.includes('recep') || text.includes('inquir') || text.includes('استقبال') || text.includes('تسجيل')) {
      return 'bi-person-lines-fill';
    }
    const FALLBACK_ICONS = ['bi-clipboard2-pulse', 'bi-hospital', 'bi-activity', 'bi-shield-check', 'bi-building-fill', 'bi-person-check'];
    return FALLBACK_ICONS[fallbackIdx % FALLBACK_ICONS.length];
  }

  private resolveMediaUrl(mediaPath: string | null): string | null {
    if (!mediaPath) {
      return null;
    }

    try {
      const mediaUrl = mediaPath.startsWith('http://') || mediaPath.startsWith('https://')
        ? new URL(mediaPath)
        : new URL(mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`, this.resolveMediaOrigin(environment.apiBaseUrl));

      mediaUrl.searchParams.set('t', String(Date.now()));
      return mediaUrl.toString();
    } catch {
      return mediaPath;
    }
  }

  private resolveMediaOrigin(apiBaseUrl: string): string {
    try {
      const apiUrl = new URL(apiBaseUrl);
      const normalizedPath = apiUrl.pathname.replace(/\/$/, '');
      if (normalizedPath.toLowerCase().endsWith('/api')) {
        apiUrl.pathname = `${normalizedPath.slice(0, -4)}/`;
        apiUrl.search = '';
        apiUrl.hash = '';
        return apiUrl.toString().replace(/\/$/, '');
      }
      return apiUrl.origin;
    } catch {
      return apiBaseUrl;
    }
  }
}
