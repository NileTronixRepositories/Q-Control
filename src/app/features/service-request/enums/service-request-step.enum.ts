export enum ServiceRequestStep {
  ServiceType = 'service-type',
  Specialty = 'specialty',
  SubSpecialty = 'sub-specialty',
  FlowChoice = 'flow-choice',
  ReservationSearch = 'reservation-search',
  ReservationResults = 'reservation-results',
  UserInput = 'user-input',
  Ticket = 'ticket',
}

export type ServiceRequestStepStatus = 'pending' | 'active' | 'completed';
