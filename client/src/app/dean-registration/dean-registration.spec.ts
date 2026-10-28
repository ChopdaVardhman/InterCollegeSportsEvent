import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeanRegistration } from './dean-registration';

describe('DeanRegistration', () => {
  let component: DeanRegistration;
  let fixture: ComponentFixture<DeanRegistration>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeanRegistration],
    }).compileComponents();

    fixture = TestBed.createComponent(DeanRegistration);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
