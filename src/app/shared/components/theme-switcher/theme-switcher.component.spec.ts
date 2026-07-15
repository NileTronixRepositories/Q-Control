import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ADMIN_THEME_OPTIONS } from '../../models/admin-theme.model';
import { AdminThemeStore } from '../../store/admin-theme.store';
import { ThemeSwitcherComponent } from './theme-switcher.component';

describe('ThemeSwitcherComponent', () => {
  let fixture: ComponentFixture<ThemeSwitcherComponent>;
  const selectedTheme = signal<'niletronix-admin' | 'beach-sunset' | 'niletronix-brand'>(
    'niletronix-admin',
  );
  const setTheme = vi.fn<AdminThemeStore['setTheme']>((theme) => selectedTheme.set(theme));

  beforeEach(async () => {
    vi.clearAllMocks();
    selectedTheme.set('niletronix-admin');
    await TestBed.configureTestingModule({
      imports: [ThemeSwitcherComponent],
      providers: [
        {
          provide: AdminThemeStore,
          useValue: {
            themes: ADMIN_THEME_OPTIONS,
            selectedTheme: selectedTheme.asReadonly(),
            setTheme,
          } satisfies Pick<AdminThemeStore, 'themes' | 'selectedTheme' | 'setTheme'>,
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ThemeSwitcherComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('opens and closes the theme panel with trigger and Escape', () => {
    (fixture.nativeElement.querySelector('.theme-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('selects a theme and closes the panel', () => {
    (fixture.nativeElement.querySelector('.theme-trigger') as HTMLButtonElement).click();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[title="Beach Sunset"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(setTheme).toHaveBeenCalledWith('beach-sunset');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });
});
