import { Component } from '@angular/core';
import { Cards } from './cards/cards';
import { OrdersChartComponent } from './orders-chart/orders-chart';
import { OrdersTable } from './orders-table/orders-table';  
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Cards, OrdersChartComponent, OrdersTable],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
 stats = [
    { label: 'Total', value: 17917, color: '#d9e7ff' },
    { label: 'Completed', value: 16104, color: '#ffe2e2' },
    { label: 'Pending', value: 88, color: '#ffeecc' },
    { label: 'Processing', value: 207, color: '#e6e2ff' }
  ];
}
