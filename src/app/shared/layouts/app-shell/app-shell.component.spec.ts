import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AppShellComponent } from './app-shell.component';

describe('AppShellComponent responsive navigation', () => {
  let fixture: ComponentFixture<AppShellComponent>;
  const originalWidth = window.innerWidth;

  function setViewport(width: number): void {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    document.body.style.overflow = '';
    setViewport(originalWidth);
  });

  it('keeps the rail mode as the backward-compatible default', () => {
    setViewport(375);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.mobile-topbar')).toBeNull();
    expect(fixture.nativeElement.querySelector('.app-shell')?.classList.contains('mobile-navigation-overlay')).toBe(false);
  });


  it('renders breadcrumbs above projected workspace content', () => {
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('breadcrumbs', [
      { label: 'Dashboard', route: '/admin/branch-editor', icon: 'bi-speedometer2' },
      { label: 'Service Schedules', icon: 'bi-calendar-week' },
    ]);
    fixture.detectChanges();

    const breadcrumb = fixture.nativeElement.querySelector('app-breadcrumb') as HTMLElement;
    const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;

    expect(breadcrumb).not.toBeNull();
    expect(current.textContent).toContain('Service Schedules');
  });

  it('renders the current user summary when supplied', () => {
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('currentUserDisplayName', 'Nour Admin');
    fixture.componentRef.setInput('currentUserRoleLabel', 'Technical Admin');
    fixture.componentRef.setInput('currentUserLabel', 'Current user');
    fixture.detectChanges();

    const user = fixture.nativeElement.querySelector('.workspace-user') as HTMLElement;

    expect(user).not.toBeNull();
    expect(user.textContent).toContain('Current user');
    expect(user.textContent).toContain('Nour Admin');
    expect(user.textContent).toContain('Technical Admin');
  });

  it('does not render the workspace header when no breadcrumb or user is available', () => {
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.workspace-header')).toBeNull();
  });
  it('opens the mobile overlay, closes with Escape, and restores focus', async () => {
    setViewport(375);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('mobileNavigationMode', 'overlay');
    fixture.detectChanges();

    const menuButton = fixture.nativeElement.querySelector('.mobile-menu-button') as HTMLButtonElement;
    expect(menuButton).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.app-shell').classList.contains('sidebar-collapsed')).toBe(true);

    menuButton.click();
    fixture.detectChanges();
    await Promise.resolve();

    expect(fixture.nativeElement.querySelector('.sidebar-backdrop')).toBeTruthy();
    expect(document.body.style.overflow).toBe('hidden');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await Promise.resolve();

    expect(fixture.nativeElement.querySelector('.sidebar-backdrop')).toBeNull();
    expect(document.body.style.overflow).toBe('');
    expect(document.activeElement).toBe(menuButton);
  });

  it('restores the desktop sidebar preference after crossing the breakpoint', () => {
    setViewport(375);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('mobileNavigationMode', 'overlay');
    fixture.detectChanges();

    setViewport(1280);
    window.dispatchEvent(new Event('resize'));
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    expect(shell.classList.contains('is-mobile')).toBe(false);
    expect(shell.classList.contains('sidebar-expanded')).toBe(true);
  });
});
