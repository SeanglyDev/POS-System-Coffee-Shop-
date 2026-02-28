import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrdersChart } from './orders-chart';

describe('OrdersChart', () => {
  let component: OrdersChart;
  let fixture: ComponentFixture<OrdersChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrdersChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
