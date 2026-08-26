import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SERVICE_REQUEST_LANGUAGES } from '../../models/language/language.model';
import { LanguageSelectorComponent } from './language-selector.component';

describe('LanguageSelectorComponent', () => {
  let fixture: ComponentFixture<LanguageSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LanguageSelectorComponent] }).compileComponents();
    fixture = TestBed.createComponent(LanguageSelectorComponent);
    fixture.componentRef.setInput('label', 'Language');
    fixture.componentRef.setInput('languages', SERVICE_REQUEST_LANGUAGES);
    fixture.componentRef.setInput('selectedLanguage', 'en');
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('emits only when a different language is selected', () => {
    const emitted = vi.fn();
    fixture.componentInstance.languageChange.subscribe(emitted);
    const buttons = fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>;

    buttons[1].click();
    buttons[0].click();

    expect(emitted).toHaveBeenCalledOnce();
    expect(emitted).toHaveBeenCalledWith('ar');
  });
});
