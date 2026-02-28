import { DOCUMENT, DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [DatePipe, DecimalPipe],
  templateUrl: './reports.html',
  styleUrl: './reports.css',
})
export class Reports implements OnInit {
  isDark = false;
  loading = false;
  errorMessage = '';
  generatedAt = new Date();
  roleLabel = 'Staff';

  totalOrdersToday = 0;
  totalAmountToday = 0;
  totalProductsSoldToday = 0;
  paidAmountToday = 0;

  topProductsToday: Array<{ name: string; quantity: number; revenue: number }> = [];
  todayOrders: Array<{
    invoiceNumber: string;
    createdAt: string | null;
    itemCount: number;
    amount: number;
    orderStatus: string;
    paymentMethod: string;
  }> = [];
  pageSize = 7;
  currentPage = 1;
  viewMode: 'products' | 'orders' = 'orders';

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {
    const role = this.authService.getRole();
    this.roleLabel = role === 'admin' ? 'Admin' : 'Staff';
    const storedTheme = localStorage.getItem('theme');
    this.isDark = storedTheme
      ? storedTheme === 'dark'
      : this.document.body.classList.contains('dark');
  }

  ngOnInit(): void {
    this.fetchReport();
  }

  fetchReport(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      orders: this.orderService.getAll().pipe(catchError(() => of([]))),
      payments: this.paymentService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ orders, payments }) => {
        const orderList = orders ?? [];
        const paymentList = payments ?? [];
        const todayKey = this.toDateKey(new Date());

        const paymentMap = new Map<string, any>();
        paymentList.forEach((payment: any) => {
          const orderId = payment?.order?._id ?? payment?.order;
          if (orderId) {
            paymentMap.set(String(orderId), payment);
          }
        });

        const todayOrders = orderList.filter((order: any) => this.toDateKey(order?.createdAt) === todayKey);

        const productSales = new Map<string, { quantity: number; revenue: number }>();

        this.totalOrdersToday = todayOrders.length;
        this.totalAmountToday = todayOrders.reduce((sum: number, order: any) => sum + Number(order?.totalAmount ?? 0), 0);
        this.totalProductsSoldToday = todayOrders.reduce((sum: number, order: any) => {
          const items = order?.items ?? [];
          const qty = items.reduce((itemSum: number, item: any) => itemSum + Number(item?.qty ?? item?.quantity ?? 0), 0);
          return sum + qty;
        }, 0);

        this.todayOrders = todayOrders
          .map((order: any) => {
            const payment = paymentMap.get(String(order?._id));
            const items = order?.items ?? [];
            items.forEach((item: any) => {
              const name = String(item?.productName ?? item?.name ?? 'Unknown Product');
              const quantity = Number(item?.qty ?? item?.quantity ?? 0);
              const price = Number(item?.price ?? item?.unitPrice ?? 0);
              const revenue = Number(item?.totalPrice ?? item?.subtotal ?? (quantity * price));

              const previous = productSales.get(name) ?? { quantity: 0, revenue: 0 };
              productSales.set(name, {
                quantity: previous.quantity + quantity,
                revenue: previous.revenue + revenue
              });
            });

            return {
              invoiceNumber: String(order?.invoiceNumber ?? '-'),
              createdAt: order?.createdAt ?? null,
              itemCount: items.length,
              amount: Number(order?.totalAmount ?? payment?.amount ?? 0),
              orderStatus: String(order?.orderStatus ?? 'Pending'),
              paymentMethod: String(payment?.paymentMethod ?? '-')
            };
          })
          .sort(
            (
              a: { createdAt: string | null },
              b: { createdAt: string | null }
            ) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
          );

        this.topProductsToday = Array.from(productSales.entries())
          .map(([name, value]) => ({ name, quantity: value.quantity, revenue: value.revenue }))
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 10);

        this.paidAmountToday = paymentList.reduce((sum: number, payment: any) => {
          const paidDateKey = this.toDateKey(payment?.paidAt ?? payment?.createdAt);
          const status = this.normalizePaymentStatus(payment?.paymentStatus);
          if ((status === 'paid' || status === 'pending') && paidDateKey === todayKey) {
            return sum + Number(payment?.amount ?? 0);
          }
          return sum;
        }, 0);

        this.generatedAt = new Date();
        this.currentPage = 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load reports data';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  printReport(): void {
    window.print();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.todayOrders.length / this.pageSize));
  }

  get pagedTodayOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.todayOrders.slice(start, start + this.pageSize);
  }

  next(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  prev(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  setView(mode: 'products' | 'orders'): void {
    this.viewMode = mode;
    if (mode === 'orders') {
      this.currentPage = 1;
    }
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    this.document.body.classList.toggle('dark', this.isDark);
    localStorage.setItem('theme', this.isDark ? 'dark' : 'light');
  }

  private toDateKey(value: any): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private normalizePaymentStatus(status: any): 'paid' | 'failed' | 'pending' {
    const raw = String(status ?? '').toLowerCase().trim();
    if (raw === 'paid') return 'paid';
    if (raw === 'fail' || raw === 'failed') return 'failed';
    return 'pending';
  }
}
