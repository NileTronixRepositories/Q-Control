import { CanDeactivateFn } from '@angular/router';

import { ServiceSchedulePendingChanges } from '../models/service-schedule/service-schedule.model';

export const serviceSchedulePendingChangesGuard: CanDeactivateFn<
  ServiceSchedulePendingChanges
> = (component) => component.canDeactivatePendingChanges();
