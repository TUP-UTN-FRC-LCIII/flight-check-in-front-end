import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeatMapComponent } from './seat-map.component';

describe('SeatMapComponent', () => {
  let component: SeatMapComponent;
  let fixture: ComponentFixture<SeatMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeatMapComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeatMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
