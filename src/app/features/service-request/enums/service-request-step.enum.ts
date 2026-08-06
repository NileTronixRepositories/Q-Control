export enum ServiceRequestStep {
  ServiceType = 'service-type',
  Specialty = 'specialty',
  SubSpecialty = 'sub-specialty',
  UserInput = 'user-input',
  Ticket = 'ticket',
}

export type ServiceRequestStepStatus = 'pending' | 'active' | 'completed';
