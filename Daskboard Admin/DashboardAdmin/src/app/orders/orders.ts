import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './orders.html',
  styleUrl: './orders.css',
})
export class Orders implements OnInit {
  isAdmin = false;
  orders: any[] = [];
  paymentsByOrderId = new Map<string, any>();
  loading = false;
  errorMessage = '';
  pageSize = 5;
  currentPage = 1;
  searchTerm = '';

  showEditModal = false;
  isClosing = false;
  saving = false;
  editingId: string | null = null;
  form = {
    orderStatus: 'Pending'
  };

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin = this.authService.getRole() === 'admin';
  }

  ngOnInit(): void {
    this.fetchOrders();
  }

  get totalOrders(): number {
    return this.orders.length;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredOrders.length / this.pageSize);
  }

  get filteredOrders(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.orders;
    return this.orders.filter((order) =>
      String(order?.invoiceNumber ?? '').toLowerCase().includes(term)
    );
  }

  get pagedOrders() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOrders.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
  }

  get productOrders(): number {
    return this.orders.reduce((total, order) => {
      const items = order?.items ?? [];
      const qty = items.reduce((sum: number, item: any) => sum + (item?.qty ?? 0), 0);
      return total + qty;
    }, 0);
  }

  get totalCashAmount(): number {
    return this.orders.reduce((total, order) => {
      const payment = this.paymentsByOrderId.get(String(order?._id ?? ''));
      const method = this.normalizePaymentMethod(payment?.paymentMethod);
      return method === 'cash' ? total + (payment?.amount ?? order?.totalAmount ?? 0) : total;
    }, 0);
  }

  get totalQrBankAmount(): number {
    return this.orders.reduce((total, order) => {
      const payment = this.paymentsByOrderId.get(String(order?._id ?? ''));
      const method = this.normalizePaymentMethod(payment?.paymentMethod);
      return method === 'qr_bank' ? total + (payment?.amount ?? order?.totalAmount ?? 0) : total;
    }, 0);
  }

  get failedOrders(): number {
    return this.orders.filter((order) => (order?.orderStatus ?? '').toLowerCase() === 'failed').length;
  }

  get topProductName(): string {
    const counts = new Map<string, number>();
    this.orders.forEach((order) => {
      (order?.items ?? []).forEach((item: any) => {
        const name = item?.productName ?? 'Unknown';
        const qty = item?.qty ?? 0;
        counts.set(name, (counts.get(name) ?? 0) + qty);
      });
    });

    let topName = '—';
    let topQty = 0;
    counts.forEach((qty, name) => {
      if (qty > topQty) {
        topQty = qty;
        topName = name;
      }
    });

    return topName;
  }

  get ordersPerDay(): number {
    if (!this.orders.length) return 0;
    const days = new Set<string>();
    this.orders.forEach((order) => {
      const date = order?.createdAt ? String(order.createdAt).slice(0, 10) : null;
      if (date) days.add(date);
    });
    const dayCount = days.size || 1;
    return Math.round((this.totalOrders / dayCount) * 10) / 10;
  }

  fetchOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    forkJoin({
      orders: this.orderService.getAll().pipe(catchError(() => of([]))),
      payments: this.paymentService.getAll().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ orders, payments }) => {
        this.orders = orders ?? [];
        this.paymentsByOrderId.clear();
        (payments ?? []).forEach((payment: any) => {
          const orderId = payment?.order?._id ?? payment?.order;
          if (orderId) {
            this.paymentsByOrderId.set(String(orderId), payment);
          }
        });
        this.currentPage = 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unauthorized';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private normalizePaymentMethod(method: any): 'cash' | 'qr_bank' | 'other' {
    const raw = String(method ?? '').toLowerCase().trim();
    if (raw === 'cash') return 'cash';
    if (
      raw === 'qr bank' ||
      raw === 'qr_bank' ||
      raw === 'qrbank' ||
      raw === 'aba' ||
      raw === 'wing' ||
      raw === 'visa' ||
      raw === 'card'
    ) {
      return 'qr_bank';
    }
    return 'other';
  }

  statusClass(status: string | undefined): string {
    const normalized = (status ?? '').toLowerCase();
    if (normalized === 'pending') return 'pending';
    if (normalized === 'cancelled' || normalized === 'failed') return 'failed';
    return 'paid';
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  next(): void {
    this.goTo(this.currentPage + 1);
  }

  prev(): void {
    this.goTo(this.currentPage - 1);
  }

  openEditModal(order: any): void {
    this.editingId = order?._id ?? null;
    this.form = {
      orderStatus: order?.orderStatus ?? 'Pending'
    };
    this.showEditModal = true;
    this.isClosing = false;
  }

  closeEditModal(): void {
    if (this.isClosing) return;
    this.isClosing = true;
  }

  onModalAnimationEnd(name: string): void {
    if (this.isClosing && name === 'fadeOut') {
      this.showEditModal = false;
      this.isClosing = false;
    }
  }

  saveOrder(): void {
    if (!this.editingId) return;
    this.saving = true;

    this.orderService.updateStatus(this.editingId, {
      orderStatus: this.form.orderStatus
    }).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.fetchOrders();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to update order';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  async deleteOrder(id: string): Promise<void> {
    if (!this.isAdmin || !id) return;
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this order?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;

    this.orderService.delete(id).subscribe({
      next: () => {
        this.fetchOrders();
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Order deleted successfully.',
          timer: 1200,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete order';
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Delete failed',
          text: this.errorMessage
        });
      }
    });
  }
}
