import { Routes } from '@angular/router';

export const DISPLAY_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'main',
  },
  {
    path: 'main',
    loadComponent: () =>
      import('./pages/main-display/main-display.component').then(
        (m) => m.MainDisplayComponent,
      ),
  },
  {
    path: 'window',
    loadComponent: () =>
      import('./pages/window-display/window-display.component').then(
        (m) => m.WindowDisplayComponent,
      ),
  },
  {
    path: 'window/:windowId',
    loadComponent: () =>
      import('./pages/window-display/window-display.component').then(
        (m) => m.WindowDisplayComponent,
      ),
  },
];
