import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrsAdmin } from './drs-admin';

describe('DrsAdmin', () => {
  let component: DrsAdmin;
  let fixture: ComponentFixture<DrsAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrsAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(DrsAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
