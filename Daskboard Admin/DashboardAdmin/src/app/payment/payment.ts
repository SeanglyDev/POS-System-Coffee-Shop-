import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import Swal from 'sweetalert2';
import { AuthService } from '../services/auth.service';
import { OrderService } from '../services/order.service';
import { PaymentService } from '../services/payment.service';
import { StockService } from '../services/stock.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './payment.html',
  styleUrl: './payment.css',
})
export class Payment implements OnInit {
  isAdmin = false;
  payments: any[] = [];
  loading = false;
  errorMessage = '';
  pageSize = 8;
  currentPage = 1;

  showEditModal = false;
  isClosing = false;
  saving = false;
  editingId: string | null = null;
  editingPayment: any | null = null;
  form = {
    paymentStatus: 'Pending'
  };

  constructor(
    private paymentService: PaymentService,
    private orderService: OrderService,
    private stockService: StockService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin = this.authService.getRole() === 'admin';
  }

  ngOnInit(): void {
    this.fetchPayments();
  }

  get totalPayments(): number {
    return this.payments.length;
  }

  get totalPages(): number {
    return Math.ceil(this.payments.length / this.pageSize);
  }

  get pagedPayments() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.payments.slice(start, start + this.pageSize);
  }

  get totalAmount(): number {
    return this.payments.reduce((total, payment) => total + (payment?.amount ?? 0), 0);
  }

  get totalCashAmount(): number {
    return this.payments.reduce((total, payment) => {
      const method = this.normalizePaymentMethod(payment?.paymentMethod);
      return method === 'cash' ? total + (payment?.amount ?? 0) : total;
    }, 0);
  }

  get totalQrBankAmount(): number {
    return this.payments.reduce((total, payment) => {
      const method = this.normalizePaymentMethod(payment?.paymentMethod);
      return method === 'qr_bank' ? total + (payment?.amount ?? 0) : total;
    }, 0);
  }

  get paidCount(): number {
    return this.payments.filter((p) => this.normalizeStatus(p?.paymentStatus) === 'paid').length;
  }

  get failedCount(): number {
    return this.payments.filter((p) => this.normalizeStatus(p?.paymentStatus) === 'failed').length;
  }

  fetchPayments(): void {
    this.loading = true;
    this.errorMessage = '';

    this.paymentService.getAll().subscribe({
      next: (res) => {
        this.payments = [...(res ?? [])].sort((a: any, b: any) => {
          const aTime = new Date(a?.createdAt ?? a?.paidAt ?? a?.updatedAt ?? 0).getTime();
          const bTime = new Date(b?.createdAt ?? b?.paidAt ?? b?.updatedAt ?? 0).getTime();
          return bTime - aTime;
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

  statusClass(status: string | undefined): string {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'paid') return 'paid';
    if (normalized === 'failed') return 'failed';
    return 'pending';
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

  openEditModal(payment: any): void {
    this.editingId = payment?._id ?? null;
    this.editingPayment = payment ?? null;
    this.form = {
      paymentStatus: this.toApiPaymentStatus(payment?.paymentStatus)
    };
    this.showEditModal = true;
    this.isClosing = false;
  }

  closeEditModal(): void {
    if (this.isClosing) return;
    this.isClosing = true;
    this.editingPayment = null;
  }

  onModalAnimationEnd(name: string): void {
    if (this.isClosing && name === 'fadeOut') {
      this.showEditModal = false;
      this.isClosing = false;
    }
  }

  savePayment(): void {
    if (!this.editingId) return;
    this.saving = true;
    const previousStatus = this.normalizeStatus(this.editingPayment?.paymentStatus);
    const nextStatus = this.normalizeStatus(this.form.paymentStatus);
    const shouldRestock = nextStatus === 'failed' && previousStatus !== 'failed';

    this.paymentService.updateStatus(this.editingId, {
      paymentStatus: this.toApiPaymentStatus(this.form.paymentStatus)
    }).pipe(
      switchMap(() => shouldRestock ? this.restockFailedOrder(this.editingPayment) : of(null))
    ).subscribe({
      next: () => {
        this.saving = false;
        this.closeEditModal();
        this.fetchPayments();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to update payment';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  private restockFailedOrder(payment: any) {
    return this.getOrderFromPayment(payment).pipe(
      switchMap((order) => {
        const items = order?.items ?? [];
        const orderId = order?._id ?? payment?.order?._id ?? payment?.order ?? 'unknown-order';
        const invoice = order?.invoiceNumber ?? payment?.invoiceNumber ?? payment?.order?.invoiceNumber ?? '';

        const stockRequests = items
          .map((item: any) => {
            const productId = String(item?.product?._id ?? item?.productId ?? item?.product ?? '');
            const quantity = Number(item?.qty ?? item?.quantity ?? 0);

            if (!productId || quantity <= 0) {
              return null;
            }

            return this.stockService.create({
              product: productId,
              quantity,
              type: 'IN',
              note: `Auto restock for failed payment (${invoice || orderId})`
            }).pipe(catchError(() => of(null)));
          })
          .filter((request: any) => !!request);

        if (!stockRequests.length) {
          return of(null);
        }

        return forkJoin(stockRequests);
      }),
      catchError(() => of(null))
    );
  }

  private getOrderFromPayment(payment: any) {
    const paymentOrder = payment?.order;
    if (paymentOrder && typeof paymentOrder === 'object') {
      return of(paymentOrder);
    }

    const orderId = String(paymentOrder?._id ?? paymentOrder ?? '');
    if (!orderId) {
      return of(null);
    }

    return this.orderService.getAll().pipe(
      map((orders: any[]) => (orders ?? []).find((order: any) => String(order?._id ?? '') === orderId) ?? null),
      catchError(() => of(null))
    );
  }

  async deletePayment(id: string): Promise<void> {
    if (!this.isAdmin || !id) return;
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Delete this payment?',
      text: 'This action cannot be undone.',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });
    if (!result.isConfirmed) return;

    this.paymentService.delete(id).subscribe({
      next: () => {
        this.fetchPayments();
        Swal.fire({
          icon: 'success',
          title: 'Deleted',
          text: 'Payment deleted successfully.',
          timer: 1200,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to delete payment';
        this.cdr.detectChanges();
        Swal.fire({
          icon: 'error',
          title: 'Delete failed',
          text: this.errorMessage
        });
      }
    });
  }

  private normalizeStatus(status: any): 'paid' | 'failed' | 'pending' {
    const raw = String(status ?? '').toLowerCase().trim();
    if (raw === 'paid') return 'paid';
    if (raw === 'fail' || raw === 'failed') return 'failed';
    return 'pending';
  }

  private toApiPaymentStatus(status: any): 'Pending' | 'Paid' | 'Failed' {
    const normalized = this.normalizeStatus(status);
    if (normalized === 'paid') return 'Paid';
    if (normalized === 'failed') return 'Failed';
    return 'Pending';
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
}
