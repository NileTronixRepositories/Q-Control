import { TestBed } from '@angular/core/testing';
import { RedirectFunction, Router, UrlSegment, UrlTree, provideRouter } from '@angular/router';

import { routes } from './app.routes';

describe('app routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });

  it('redirects legacy technical-admin URLs to the canonical admin route', () => {
    const legacyRoute = routes.find((route) => route.path === 'technical-admin/**');
    const redirectTo = legacyRoute?.redirectTo as RedirectFunction | undefined;

    expect(redirectTo).toBeTypeOf('function');

    const result = TestBed.runInInjectionContext(() =>
      redirectTo?.({
        url: [
          new UrlSegment('technical-admin', {}),
          new UrlSegment('services', {}),
          new UrlSegment('workflows', {}),
        ],
        queryParams: { tab: 'active' },
        fragment: 'list',
      } as never),
    ) as UrlTree;

    expect(TestBed.inject(Router).serializeUrl(result)).toBe(
      '/admin/services/workflows?tab=active#list',
    );
  });
});