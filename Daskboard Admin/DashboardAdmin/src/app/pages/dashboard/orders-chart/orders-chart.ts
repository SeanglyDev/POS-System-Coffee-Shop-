import { Component, AfterViewInit, OnDestroy, ViewChild, ElementRef, OnInit } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { OrderService } from '../../../services/order.service';

Chart.register(...registerables);
@Component({
  selector: 'app-orders-chart',
  standalone: true,
  imports: [],
  templateUrl: './orders-chart.html',
  styleUrl: './orders-chart.css',
})
export class OrdersChartComponent implements OnInit, AfterViewInit, OnDestroy {

  
  @ViewChild('ordersChart') chartRef!: ElementRef<HTMLCanvasElement>;
  chart!: Chart;
  private viewReady = false;
  private monthlyCounts = new Array(12).fill(0);
  private monthlyAmounts = new Array(12).fill(0);

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.fetchOrders();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    requestAnimationFrame(() => this.initChart());
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private fetchOrders(): void {
    this.orderService.getAll().subscribe({
      next: (orders) => {
        this.computeMonthly(orders ?? []);
        this.initChart();
      }
    });
  }

  private computeMonthly(orders: any[]): void {
    this.monthlyCounts = new Array(12).fill(0);
    this.monthlyAmounts = new Array(12).fill(0);

    orders.forEach((order) => {
      const date = order?.createdAt ? new Date(order.createdAt) : null;
      if (!date || Number.isNaN(date.getTime())) return;
      const month = date.getMonth();
      this.monthlyCounts[month] += 1;
      this.monthlyAmounts[month] += order?.totalAmount ?? 0;
    });
  }

  private initChart(): void {
    if (!this.viewReady) {
      return;
    }
    const ctx = this.chartRef?.nativeElement?.getContext('2d');
    if (!ctx) {
      return;
    }

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Order Count',
            data: this.monthlyCounts,
            backgroundColor: 'rgba(242, 106, 75, 0.5)',
            borderColor: '#f26a4b',
            yAxisID: 'y'
          },
          {
            label: 'Amount ($)',
            data: this.monthlyAmounts,
            backgroundColor: 'rgba(47, 143, 131, 0.5)',
            borderColor: '#2f8f83',
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(18, 21, 30, 0.08)' },
            ticks: { color: '#54596c' }
          },
          y1: {
            beginAtZero: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#54596c' }
          }
        },
        plugins: {
          legend: {
            labels: { color: '#303444' }
          }
        }
      }
    });
  }
}
