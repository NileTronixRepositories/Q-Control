import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppBreadcrumbItem } from '../../models/breadcrumb.model';
import { AppBreadcrumbComponent } from './app-breadcrumb.component';

@Component({
  standalone: true,
  imports: [AppBreadcrumbComponent],
  template: `
    <app-breadcrumb
      [items]="items"
      [direction]="direction"
      [language]="language"
      ariaLabel="Admin path"
    />
  `,
})
class TestHostComponent {
  items: readonly AppBreadcrumbItem[] = [
    { label: 'Dashboard', route: '/admin/branch-editor', icon: 'bi-speedometer2' },
    {
      label: 'Services',
      route: '/admin/services/catalog',
      queryParams: { branchId: 7 },
      icon: 'bi-ui-checks-grid',
    },
    { label: 'Service Schedules', icon: 'bi-calendar-week' },
  ];
  direction: 'ltr' | 'rtl' = 'ltr';
  language: 'en' | 'ar' = 'en';
}

describe('AppBreadcrumbComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('renders previous items as links and marks the last item as current', () => {
    const links = fixture.nativeElement.querySelectorAll('a.app-breadcrumb-link');
    const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;

    expect(links).toHaveLength(2);
    expect(links[0].textContent).toContain('Dashboard');
    expect(links[1].textContent).toContain('Services');
    expect(links[1].getAttribute('href')).toContain('branchId=7');
    expect(current.textContent).toContain('Service Schedules');
  });

  it('passes RTL direction to the breadcrumb navigation', () => {
    fixture.destroy();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.componentInstance.direction = 'rtl';
    fixture.componentInstance.language = 'ar';
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav.app-breadcrumb') as HTMLElement;

    expect(nav.getAttribute('dir')).toBe('rtl');
    expect(nav.getAttribute('lang')).toBe('ar');
  });
});
