import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TechnicalAdminMobileRecordCardComponent } from './technical-admin-mobile-record-card.component';

@Component({
  standalone: true,
  imports: [TechnicalAdminMobileRecordCardComponent],
  template: `
    <app-technical-admin-mobile-record-card eyebrow="Branch" title="Main branch" icon="bi bi-building" recordId="BR-1">
      <span record-badges>Active</span>
      <div record-fields>Field value</div>
      <button record-actions type="button">View</button>
    </app-technical-admin-mobile-record-card>
  `,
})
class TestHostComponent {}

describe('TechnicalAdminMobileRecordCardComponent', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  it('renders the record identity and semantic icon', () => {
    const card = fixture.nativeElement.querySelector('[data-testid="technical-admin-mobile-record-card"]');

    expect(card.textContent).toContain('Branch');
    expect(card.textContent).toContain('Main branch');
    expect(card.textContent).toContain('BR-1');
    expect(card.querySelector('.bi-building')).toBeTruthy();
  });

  it('projects badges, fields, and actions into their sections', () => {
    const card = fixture.nativeElement.querySelector('[data-testid="technical-admin-mobile-record-card"]');

    expect(card.querySelector('header').textContent).toContain('Active');
    expect(card.querySelector('dl').textContent).toContain('Field value');
    expect(card.querySelector('footer button').textContent).toContain('View');
  });
});
