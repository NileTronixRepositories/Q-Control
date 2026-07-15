import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LanguageHeaderComponent } from './language-header.component';

describe('LanguageHeaderComponent', () => {
  let fixture: ComponentFixture<LanguageHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LanguageHeaderComponent] }).compileComponents();
    fixture = TestBed.createComponent(LanguageHeaderComponent);
    fixture.componentRef.setInput('language', 'en');
    fixture.componentRef.setInput('brandName', 'Q-System');
    fixture.componentRef.setInput('brandSubtitle', 'Queue management');
    fixture.componentRef.setInput('languageLabel', 'Language');
    fixture.componentRef.setInput('arabicLabel', 'Arabic');
    fixture.componentRef.setInput('englishLabel', 'English');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('marks the selected language as active', () => {
    const english = fixture.nativeElement.querySelector('[aria-label="English"]') as HTMLButtonElement;
    const arabic = fixture.nativeElement.querySelector('[aria-label="Arabic"]') as HTMLButtonElement;

    expect(english.classList.contains('active')).toBe(true);
    expect(english.getAttribute('aria-pressed')).toBe('true');
    expect(arabic.getAttribute('aria-pressed')).toBe('false');
  });

  it('emits the requested language', () => {
    const emitted = vi.fn();
    fixture.componentInstance.languageChange.subscribe(emitted);

    (fixture.nativeElement.querySelector('[aria-label="Arabic"]') as HTMLButtonElement).click();

    expect(emitted).toHaveBeenCalledWith('ar');
  });
});
