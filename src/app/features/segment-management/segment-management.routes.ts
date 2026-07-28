import { Routes } from '@angular/router';

export const SEGMENT_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/segment-list/segment-list.component').then(
        (m) => m.SegmentListComponent,
      ),
  },
  {
    path: 'globalization-requests',
    loadComponent: () =>
      import('./pages/technical-globalization-requests/technical-globalization-requests.component').then(
        (m) => m.TechnicalGlobalizationRequestsComponent,
      ),
  },
  {
    path: 'branch-requests',
    loadComponent: () =>
      import('./pages/branch-segment-requests/branch-segment-requests.component').then(
        (m) => m.BranchSegmentRequestsComponent,
      ),
  },
];
