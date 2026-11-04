import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ListOfParticipentDetailes } from './list-of-participent-detailes';

describe('ListOfParticipentDetailes', () => {
  let component: ListOfParticipentDetailes;
  let fixture: ComponentFixture<ListOfParticipentDetailes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListOfParticipentDetailes],
    }).compileComponents();

    fixture = TestBed.createComponent(ListOfParticipentDetailes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
