import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrsStudentList } from './drs-student-list';

describe('DrsStudentList', () => {
  let component: DrsStudentList;
  let fixture: ComponentFixture<DrsStudentList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrsStudentList],
    }).compileComponents();

    fixture = TestBed.createComponent(DrsStudentList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
