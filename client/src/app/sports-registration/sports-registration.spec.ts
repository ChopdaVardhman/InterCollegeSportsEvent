import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SportsRegistration } from './sports-registration';

describe('SportsRegistration', () => {
  let component: SportsRegistration;
  let fixture: ComponentFixture<SportsRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SportsRegistration],
    }).compileComponents();

    fixture = TestBed.createComponent(SportsRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
