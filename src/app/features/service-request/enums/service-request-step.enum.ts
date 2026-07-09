export enum ServiceRequestStep {
  ServiceType = 'service-type',
  Specialty = 'specialty',
  SubSpecialty = 'sub-specialty',
  Ticket = 'ticket',
}

export type ServiceRequestStepStatus = 'pending' | 'active' | 'completed';
