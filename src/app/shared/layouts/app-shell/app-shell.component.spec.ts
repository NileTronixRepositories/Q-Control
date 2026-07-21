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

  it('uses direction-aware shell and workspace header layout on desktop', () => {
    setViewport(1280);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.componentRef.setInput('language', 'ar');
    fixture.componentRef.setInput('breadcrumbs', [
      { label: 'Dashboard', route: '/admin/branch-editor', icon: 'bi-speedometer2' },
      { label: 'Branch Editor', icon: 'bi-building' },
    ]);
    fixture.componentRef.setInput('currentUserDisplayName', 'technicaladmin');
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    const header = fixture.nativeElement.querySelector('.workspace-header') as HTMLElement;
    const breadcrumb = fixture.nativeElement.querySelector('nav.app-breadcrumb') as HTMLElement;
    const sidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;

    expect(shell.getAttribute('dir')).toBe('rtl');
    expect(shell.getAttribute('lang')).toBe('ar');
    expect(shell.classList.contains('app-shell-rtl')).toBe(true);
    expect(shell.classList.contains('flex-row')).toBe(false);
    expect(header.classList.contains('gap-3')).toBe(true);
    expect(getComputedStyle(shell).flexDirection).toBe('row');
    expect(breadcrumb.getAttribute('dir')).toBe('rtl');
    expect(sidebar.getAttribute('dir')).toBe('rtl');
  });

  it('keeps the English shell layout left-to-right on desktop', () => {
    setViewport(1280);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('direction', 'ltr');
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('breadcrumbs', [
      { label: 'Operations Dashboard', route: '/admin/branch-editor', icon: 'bi-speedometer2' },
      { label: 'Branch Editor', icon: 'bi-building' },
    ]);
    fixture.componentRef.setInput('currentUserDisplayName', 'technicaladmin');
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;

    expect(shell.getAttribute('dir')).toBe('ltr');
    expect(shell.getAttribute('lang')).toBe('en');
    expect(shell.classList.contains('app-shell-ltr')).toBe(true);
    expect(getComputedStyle(shell).flexDirection).toBe('row');
  });

  it('renders the breadcrumb and current user inside one unified workspace header', () => {
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('breadcrumbs', [
      { label: 'Dashboard', route: '/admin/branch-editor', icon: 'bi-speedometer2' },
      { label: 'Branch Editor', icon: 'bi-building' },
    ]);
    fixture.componentRef.setInput('currentUserDisplayName', 'Nour Admin');
    fixture.componentRef.setInput('currentUserRoleLabel', 'Technical Admin');
    fixture.componentRef.setInput('currentUserLabel', 'Current user');
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.workspace-header') as HTMLElement;
    const user = header.querySelector('.workspace-user') as HTMLElement;

    expect(header.querySelector('app-breadcrumb')).not.toBeNull();
    expect(user.textContent).toContain('Current user');
    expect(user.textContent).toContain('Nour Admin');
    expect(user.textContent).toContain('Technical Admin');
  });

  it('keeps the breadcrumb in the mobile workspace header without duplicating the user chip', () => {
    setViewport(375);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('mobileNavigationMode', 'overlay');
    fixture.componentRef.setInput('breadcrumbs', [
      { label: 'Dashboard', route: '/admin/branch-editor' },
      { label: 'Branch Editor' },
    ]);
    fixture.componentRef.setInput('currentUserDisplayName', 'Nour Admin');
    fixture.detectChanges();

    const header = fixture.nativeElement.querySelector('.workspace-header') as HTMLElement;
    const mobileTopbar = fixture.nativeElement.querySelector('.mobile-topbar') as HTMLElement;

    expect(header.querySelector('app-breadcrumb')).not.toBeNull();
    expect(header.querySelector('.workspace-user')).toBeNull();
    expect(mobileTopbar.textContent).toContain('Nour Admin');
  });

  it('does not render the workspace header when no breadcrumb or user is available', () => {
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.workspace-header')).toBeNull();
  });

  it('keeps the mobile overlay sidebar tied to the active language direction', () => {
    setViewport(375);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('mobileNavigationMode', 'overlay');
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.componentRef.setInput('language', 'ar');
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    const sidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;

    expect(shell.getAttribute('dir')).toBe('rtl');
    expect(sidebar.getAttribute('dir')).toBe('rtl');
    expect(shell.classList.contains('mobile-navigation-overlay')).toBe(true);
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

  it('renders the branch context rail between the main sidebar and workspace on desktop', () => {
    setViewport(1280);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.componentRef.setInput('contextNavigationTitle', 'فرع القاهرة');
    fixture.componentRef.setInput('contextNavigationItems', [
      {
        label: 'مناطق الانتظار',
        route: '/admin/waiting-areas',
        queryParams: { branchId: 7 },
        icon: 'bi-hourglass-split',
      },
    ]);
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    const children = Array.from(shell.children);
    const mainSidebar = fixture.nativeElement.querySelector('.sidebar') as HTMLElement;
    const contextSidebar = fixture.nativeElement.querySelector('.context-sidebar') as HTMLElement;
    const workspace = fixture.nativeElement.querySelector('.workspace') as HTMLElement;

    expect(children.indexOf(contextSidebar)).toBe(children.indexOf(mainSidebar) + 1);
    expect(children.indexOf(workspace)).toBe(children.indexOf(contextSidebar) + 1);
    expect(contextSidebar.getAttribute('dir')).toBe('rtl');
    expect(contextSidebar.querySelector('a')?.getAttribute('href')).toContain('branchId=7');
  });

  it('collapses the branch context without exiting and reopens it from the directional handle', async () => {
    setViewport(1280);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('direction', 'rtl');
    fixture.componentRef.setInput('contextNavigationTitle', 'Cairo Branch');
    fixture.componentRef.setInput('contextNavigationItems', [
      { label: 'Waiting Areas', route: '/admin/waiting-areas', queryParams: { branchId: 7 } },
    ]);
    const exitSpy = vi.fn();
    fixture.componentInstance.contextNavigationClose.subscribe(exitSpy);
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    const contextSidebar = fixture.nativeElement.querySelector('.context-sidebar') as HTMLElement;
    const closeButton = fixture.nativeElement.querySelector('.context-sidebar-close') as HTMLButtonElement;

    closeButton.click();
    fixture.detectChanges();
    await Promise.resolve();

    const reopenButton = fixture.nativeElement.querySelector('.context-reopen-edge') as HTMLButtonElement;

    expect(shell.classList.contains('context-navigation-open')).toBe(false);
    expect(contextSidebar.getAttribute('aria-hidden')).toBe('true');
    expect(reopenButton.querySelector('.bi-chevron-left')).not.toBeNull();
    expect(document.activeElement).toBe(reopenButton);
    expect(exitSpy).not.toHaveBeenCalled();

    reopenButton.click();
    fixture.detectChanges();
    await Promise.resolve();

    expect(shell.classList.contains('context-navigation-open')).toBe(true);
    expect(fixture.nativeElement.querySelector('.context-reopen-edge')).toBeNull();
    expect(document.activeElement).toBe(fixture.nativeElement.querySelector('.context-sidebar-close'));

    const backButton = fixture.nativeElement.querySelector('.context-back-button') as HTMLButtonElement;
    backButton.click();
    expect(exitSpy).toHaveBeenCalledOnce();
  });
  it('uses an offcanvas branch context with backdrop below the desktop breakpoint', async () => {
    setViewport(1024);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('contextNavigationTitle', 'Cairo Branch');
    fixture.componentRef.setInput('contextNavigationItems', [
      { label: 'Waiting Areas', route: '/admin/waiting-areas', queryParams: { branchId: 7 } },
    ]);
    fixture.detectChanges();

    const shell = fixture.nativeElement.querySelector('.app-shell') as HTMLElement;
    const backdrop = fixture.nativeElement.querySelector(
      '.context-sidebar-backdrop',
    ) as HTMLButtonElement;

    expect(shell.classList.contains('context-navigation-open')).toBe(true);
    expect(backdrop).not.toBeNull();
    expect(document.body.style.overflow).toBe('hidden');

    backdrop.click();
    fixture.detectChanges();
    await Promise.resolve();

    expect(shell.classList.contains('context-navigation-open')).toBe(false);
    expect(fixture.nativeElement.querySelector('.context-sidebar-backdrop')).toBeNull();
    expect(document.body.style.overflow).toBe('');
  });

  it('shows a mobile topbar trigger and restores focus after Escape', async () => {
    setViewport(375);
    fixture = TestBed.createComponent(AppShellComponent);
    fixture.componentRef.setInput('navigationItems', []);
    fixture.componentRef.setInput('mobileNavigationMode', 'overlay');
    fixture.componentRef.setInput('contextNavigationTitle', 'Cairo Branch');
    fixture.componentRef.setInput('contextNavigationItems', [
      { label: 'Waiting Areas', route: '/admin/waiting-areas', queryParams: { branchId: 7 } },
    ]);
    fixture.detectChanges();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    await Promise.resolve();

    const contextTrigger = fixture.nativeElement.querySelector(
      '[aria-controls="branch-context-sidebar"]',
    ) as HTMLButtonElement;

    expect(contextTrigger.closest('.mobile-topbar')).not.toBeNull();
    expect(contextTrigger.querySelector('.bi-chevron-right')).not.toBeNull();
    expect(document.activeElement).toBe(contextTrigger);
  });
});
