import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { OrderService } from '../../../services/order.service';
import { PaymentService } from '../../../services/payment.service';

@Component({
  selector: 'app-cards',
  standalone: true,
  imports: [],
  templateUrl: './cards.html',
  styleUrl: './cards.css',
})
export class Cards implements OnInit {
  stats = [
    { label: 'Total Today $', value: 0, color: '#d9e7ff' },
    { label: 'Total Monthly $', value: 0, color: '#ffe2e2' },
    { label: 'Total Years', value: 0, color: '#e6e2ff' },
    { label: 'Total Orders', value: 0, color: '#ffeecc' },
    { label: 'Order Confirmed', value: 0, color: '#e6e2ff' },
    { label: 'Order Failed', value: 0, color: '#e6e2ff' },
  ];

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    forkJoin({
      orders: this.orderService.getAll().pipe(catchError(() => of([]))),
      payments: this.paymentService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ orders, payments }) => {
        const list = orders ?? [];
        const paymentMap = new Map<string, any>();

        (payments ?? []).forEach((payment: any) => {
          const orderId = payment?.order?._id ?? payment?.order;
          if (orderId) {
            paymentMap.set(String(orderId), payment);
          }
        });

        const now = new Date();
        const todayKey = now.toISOString().slice(0, 10);
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const year = now.getFullYear();

        const totalToday = list.reduce((sum: number, o: any) => {
          const dateKey = o?.createdAt ? String(o.createdAt).slice(0, 10) : '';
          return dateKey === todayKey ? sum + (o?.totalAmount ?? 0) : sum;
        }, 0);

        const totalMonthly = list.reduce((sum: number, o: any) => {
          const dateKey = o?.createdAt ? String(o.createdAt).slice(0, 7) : '';
          return dateKey === monthKey ? sum + (o?.totalAmount ?? 0) : sum;
        }, 0);

        const totalYear = list.reduce((sum: number, o: any) => {
          const date = o?.createdAt ? new Date(o.createdAt) : null;
          if (date && date.getFullYear() === year) {
            return sum + (o?.totalAmount ?? 0);
          }
          return sum;
        }, 0);

        const totalOrders = list.length;
        const confirmed = list.filter((o: any) => (o?.orderStatus ?? '').toLowerCase() === 'confirmed').length;
        const failed = list.filter((o: any) => {
          const orderStatus = String(o?.orderStatus ?? '').toLowerCase().trim();
          const payment = paymentMap.get(String(o?._id));
          const paymentStatus = String(payment?.paymentStatus ?? '').toLowerCase().trim();
          return orderStatus === 'failed' || paymentStatus === 'failed';
        }).length;

        const totalCash = list.reduce((sum: number, o: any) => {
          const payment = paymentMap.get(String(o?._id));
          const method = String(payment?.paymentMethod ?? '').toLowerCase().trim();

          if (method === 'cash' || method === 'riel' || method.includes('\u17db')) {
            return sum + (payment?.amount ?? o?.totalAmount ?? 0);
          }

          return sum;
        }, 0);

        const totalQrBank = list.reduce((sum: number, o: any) => {
          const payment = paymentMap.get(String(o?._id));
          const method = String(payment?.paymentMethod ?? '').toLowerCase().trim();

          if (method.includes('qr') || method.includes('bank')) {
            return sum + (payment?.amount ?? o?.totalAmount ?? 0);
          }

          return sum;
        }, 0);

        this.stats = [
          { label: 'Total Cash \u17db', value: totalCash, color: '#e6e2ff' },
          { label: 'Total QR BANK $', value: totalQrBank, color: '#e6e2ff' },
          { label: 'Total Today $', value: totalToday, color: '#d9e7ff' },
          { label: 'Total Monthly $', value: totalMonthly, color: '#ffe2e2' },
          { label: 'Total Year $', value: totalYear, color: '#e6e2ff' },
          { label: 'Total Orders', value: totalOrders, color: '#ffeecc' },
          { label: 'Order Confirmed', value: confirmed, color: '#e6e2ff' },
          { label: 'Order Failed', value: failed, color: '#e6e2ff' },
        ];

        this.cdr.detectChanges();
      }
    });
  }
}
