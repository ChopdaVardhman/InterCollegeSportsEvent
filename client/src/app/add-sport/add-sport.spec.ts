import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddSport } from './add-sport';

describe('AddSport', () => {
  let component: AddSport;
  let fixture: ComponentFixture<AddSport>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddSport],
    }).compileComponents();

    fixture = TestBed.createComponent(AddSport);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
