import { Routes } from '@angular/router';

import { ServiceRequestStore } from './store/service-request.store';

export const SERVICE_REQUEST_ROUTES: Routes = [
  {
    path: '',
    providers: [ServiceRequestStore],
    loadComponent: () =>
      import('./pages/service-request-home/service-request-home.component').then(
        (component) => component.ServiceRequestHomeComponent,
      ),
  },
];
