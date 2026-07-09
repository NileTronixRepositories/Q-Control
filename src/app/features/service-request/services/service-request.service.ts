import { Injectable } from '@angular/core';

import { SERVICE_REQUEST_SERVICE_TYPES } from '../mock-data/services.mock';
import { SERVICE_REQUEST_SPECIALTIES } from '../mock-data/specialties.mock';
import { ServiceType } from '../models/service-type.model';
import { Specialty } from '../models/specialty.model';

@Injectable({
  providedIn: 'root',
})
export class ServiceRequestService {
  getServiceTypes(): readonly ServiceType[] {
    return SERVICE_REQUEST_SERVICE_TYPES;
  }

  getSpecialties(): readonly Specialty[] {
    return SERVICE_REQUEST_SPECIALTIES;
  }

  getSpecialtiesForService(serviceType: ServiceType | null): readonly Specialty[] {
    if (!serviceType) {
      return [];
    }

    const specialtyIds = new Set(serviceType.specialtyIds);
    return SERVICE_REQUEST_SPECIALTIES.filter((specialty) => specialtyIds.has(specialty.id));
  }
}
