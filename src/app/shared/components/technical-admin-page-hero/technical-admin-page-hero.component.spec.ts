import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalAdminPageHeroComponent } from './technical-admin-page-hero.component';

@Component({
  standalone: true,
  imports: [TechnicalAdminPageHeroComponent],
  template: `
    <app-technical-admin-page-hero
      eyebrow="Technical administration"
      title="Windows"
      description="Manage service windows."
      icon="bi bi-window-stack"
    >
      <button hero-actions type="button">Create window</button>
    </app-technical-admin-page-hero>
  `,
})
class TestHostComponent {}

describe('TechnicalAdminPageHeroComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('renders the page identity and semantic icon', () => {
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Windows');
    expect(fixture.nativeElement.querySelector('.bi-window-stack')).not.toBeNull();
  });

  it('projects page actions without changing their behavior', () => {
    const action = fixture.nativeElement.querySelector('[hero-actions]') as HTMLButtonElement;
    expect(action).not.toBeNull();
    expect(action.textContent).toContain('Create window');
  });
});
