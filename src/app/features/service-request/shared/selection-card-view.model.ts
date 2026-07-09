import { ServiceRequestCardTone } from '../models/service-type.model';

export interface SelectionCardViewModel {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: string;
  readonly tone: ServiceRequestCardTone;
  readonly meta: string;
}

export interface StepIndicatorItem {
  readonly id: string;
  readonly label: string;
  readonly status: 'pending' | 'active' | 'completed';
}
