import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GroupEventUpdate } from './group-event-update';

describe('GroupEventUpdate', () => {
  let component: GroupEventUpdate;
  let fixture: ComponentFixture<GroupEventUpdate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GroupEventUpdate],
    }).compileComponents();

    fixture = TestBed.createComponent(GroupEventUpdate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
