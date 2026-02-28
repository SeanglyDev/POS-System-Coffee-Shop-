import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { OrderService } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-orders-table',
  imports: [DatePipe],
  templateUrl: './orders-table.html',
  styleUrl: './orders-table.css',
})
export class OrdersTable implements OnInit {
  rows: Array<{
    id: string;
    invoiceNumber: string;
    createdAt: string | null;
    itemCount: number;
    amount: number;
    payMethod: string;
    payStatus: string;
  }> = [];

  pageSize = 3;
  currentPage = 1;

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  private normalizePayStatus(paymentStatus: unknown, orderStatus: unknown): 'Paid' | 'Pending' | 'Failed' {
    const rawPaymentStatus = String(paymentStatus ?? '').trim().toLowerCase();
    if (rawPaymentStatus === 'paid') {
      return 'Paid';
    }
    if (rawPaymentStatus === 'failed') {
      return 'Failed';
    }
    if (rawPaymentStatus === 'pending') {
      return 'Pending';
    }

    const rawOrderStatus = String(orderStatus ?? '').trim().toLowerCase();
    if (rawOrderStatus === 'failed') {
      return 'Failed';
    }
    if (rawOrderStatus === 'confirmed' || rawOrderStatus === 'completed') {
      return 'Paid';
    }
    return 'Pending';
  }

  private fetchData(): void {
    forkJoin({
      orders: this.orderService.getAll().pipe(catchError(() => of([]))),
      payments: this.paymentService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ orders, payments }) => {
        const paymentMap = new Map<string, any>();
        (payments ?? []).forEach((payment: any) => {
          const orderId = payment?.order?._id ?? payment?.order;
          if (orderId) {
            paymentMap.set(String(orderId), payment);
          }
        });

        this.rows = (orders ?? []).map((order: any) => {
          const payment = paymentMap.get(String(order?._id));
          return {
            id: order?._id ?? '',
            invoiceNumber: order?.invoiceNumber ?? '-',
            createdAt: order?.createdAt ?? null,
            itemCount: order?.items?.length ?? 0,
            amount: order?.totalAmount ?? payment?.amount ?? 0,
            payMethod: payment?.paymentMethod ?? '-',
            payStatus: this.normalizePayStatus(payment?.paymentStatus, order?.orderStatus)
          };
        });
        this.currentPage = 1;
        this.cdr.detectChanges();
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.rows.length / this.pageSize);
  }

  get pagedOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.rows.slice(start, start + this.pageSize);
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
  }

  next(): void {
    this.goTo(this.currentPage + 1);
  }

  prev(): void {
    this.goTo(this.currentPage - 1);
  }
}
