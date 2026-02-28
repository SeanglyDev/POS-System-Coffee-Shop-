import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { CartItem, CartService } from '../service/cart.service';
import { OrderService } from '../service/order.service';
import { PaymentService } from '../service/payment.service';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-cart',
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart implements OnInit, OnDestroy {
  showPayment = false;
  cartItems: CartItem[] = [];
  totalUsd = 0;
  totalKhr = 0;
  totalItems = 0;
  orderStatusMessage = '';
  isSubmitting = false;
  paymentChannel: 'Cash' | 'Bank' = 'Cash';
  paymentMethod = 'ABA';
  orderStatus: 'Pending' | 'Confirmed' | 'Failed' | 'Cancelled' = 'Failed';
  private readonly khrRate = 4100;
  private subscription?: Subscription;

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private authService: AuthService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscription = this.cartService.items$.subscribe((items) => {
      this.cartItems = items;
      this.recalculateTotals();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  openPayment() {
    this.showPayment = true;
    this.orderStatusMessage = '';
    this.orderStatus = 'Failed';
  }

  closePayment() {
    this.showPayment = false;
  }

  increaseQty(item: CartItem) {
    this.cartService.updateQty(item.product, 1);
  }

  decreaseQty(item: CartItem) {
    this.cartService.updateQty(item.product, -1);
  }

  async removeItem(item: CartItem) {
    const productName = item.product?.productName || 'this item';
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Remove item?',
      text: `Remove ${productName} from your cart?`,
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#b42318',
    });

    if (!result.isConfirmed) {
      return;
    }

    this.ngZone.run(() => {
      this.cartService.removeItem(item.product);
      this.cartItems = this.cartService.getItems();
      this.recalculateTotals();
      this.cdr.detectChanges();
    });
    await Swal.fire({
      icon: 'success',
      title: 'Removed',
      text: `${productName} was removed from cart.`,
      timer: 1100,
      showConfirmButton: false,
    });
  }

  updatePaymentMethod(value: string) {
    this.paymentMethod = value || 'ABA';
  }

  updatePaymentChannel(value: string) {
    this.paymentChannel = value === 'Bank' ? 'Bank' : 'Cash';
    if (this.paymentChannel === 'Cash') {
      this.paymentMethod = 'ABA';
    }
  }

  updateOrderStatus(value: string) {
    if (value === 'Failed' || value === 'Confirmed') {
      this.orderStatus = value;
      return;
    }
    this.orderStatus = 'Failed';
  }

  canPayCurrentStatus(): boolean {
    return this.orderStatus === 'Pending' || this.orderStatus === 'Confirmed';
  }

  confirmOrder() {
    if (!this.cartItems.length || this.isSubmitting) {
      return;
    }
    if (this.orderStatus === 'Failed') {
      if (!this.authService.getToken()) {
        this.orderStatusMessage = 'Please login to place an order.';
        return;
      }
      const itemsPayload = this.cartItems.map((item) => ({
        product: String(item.product?._id ?? item.product?.id ?? ''),
        qty: item.qty
      })).filter((item) => item.product);
      if (!itemsPayload.length) {
        this.orderStatusMessage = 'Missing product id for order items.';
        return;
      }
      this.isSubmitting = true;
      this.orderService.createOrder(itemsPayload, 'Failed').subscribe({
        next: () => {
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Payment failed',
            text: 'Status is Failed. Cannot buy this order.',
            timer: 1500,
            showConfirmButton: false,
          }).then(() => {
            this.ngZone.run(() => {
              this.showPayment = false;
              this.cartService.clear();
              this.orderStatusMessage = '';
              this.cdr.detectChanges();
            });
          });
        },
        error: (err) => {
          this.isSubmitting = false;
          const message = this.getErrorMessage(err, 'Failed to create failed order.');
          Swal.fire({
            icon: 'error',
            title: 'Order failed',
            text: message,
          });
        }
      });
      return;
    }
    if (!this.canPayCurrentStatus()) {
      this.orderStatusMessage = `Cannot pay when order status is ${this.orderStatus}.`;
      return;
    }
    if (!this.authService.getToken()) {
      this.orderStatusMessage = 'Please login to place an order.';
      return;
    }
    const insufficient = this.cartItems.find((item) => {
      const stock = Number(item.product?.stock);
      return Number.isFinite(stock) && item.qty > stock;
    });
    if (insufficient) {
      const name = insufficient.product?.productName || 'Item';
      const stock = Number(insufficient.product?.stock || 0);
      this.orderStatusMessage = `Only ${stock} in stock for ${name}.`;
      return;
    }
    this.isSubmitting = true;
    this.orderStatusMessage = 'Creating order...';

    const itemsPayload = this.cartItems.map((item) => ({
      product: String(item.product?._id ?? item.product?.id ?? ''),
      qty: item.qty
    })).filter((item) => item.product);
    if (!itemsPayload.length) {
      this.orderStatusMessage = 'Missing product id for order items.';
      this.isSubmitting = false;
      return;
    }

    this.orderService.createOrder(itemsPayload, this.orderStatus).subscribe({
      next: (res) => {
        const orderId = res?.order?._id ?? res?.order?.id ?? res?._id ?? res?.data?._id;
        if (!orderId) {
          this.orderStatusMessage = 'Order created, but missing order id.';
          this.isSubmitting = false;
          return;
        }
        this.orderStatusMessage = 'Processing payment...';
        const finalPaymentMethod =
          this.paymentChannel === 'Cash' ? 'Cash' : (this.paymentMethod || 'ABA');
        this.paymentService.createPayment(orderId, finalPaymentMethod).subscribe({
          next: () => {
            const receiptItems = this.cartItems.map((item) => ({
              name: item.product?.productName || 'Item',
              qty: Number(item.qty || 0),
              price: Number(item.product?.price || 0),
            }));
            const receiptUsd = this.totalUsd;
            const receiptKhr = this.totalKhr;
            this.orderService.updateOrderStatus(String(orderId), 'Confirmed').subscribe({
              next: () => {},
              error: () => {},
            });
            this.ngZone.run(() => {
              this.orderStatus = 'Confirmed';
              this.orderStatusMessage = 'Payment successful.';
              this.printReceipt(String(orderId), finalPaymentMethod, receiptItems, receiptUsd, receiptKhr);
              this.cartService.clear();
              this.isSubmitting = false;
              this.showPayment = false;
              this.cdr.detectChanges();
            });
            Swal.fire({
              icon: 'success',
              title: 'Payment successful',
              timer: 1200,
              showConfirmButton: false,
            });
          },
          error: (err) => {
            const message = this.getErrorMessage(err, 'Payment failed. Server error.');
            this.orderService.updateOrderStatus(String(orderId), 'Failed').subscribe({
              next: () => {},
              error: () => {},
            });
            this.ngZone.run(() => {
              this.orderStatus = 'Failed';
              this.orderStatusMessage = message;
              this.isSubmitting = false;
              this.cdr.detectChanges();
            });
            Swal.fire({
              icon: 'error',
              title: 'Payment failed',
              text: `${message} Order status set to Failed.`,
            }).then(() => {
              this.ngZone.run(() => {
                this.showPayment = false;
                this.cartService.clear();
                this.orderStatusMessage = '';
                this.cdr.detectChanges();
              });
            });
            if (message.toLowerCase().includes('already')) {
              this.ngZone.run(() => {
                this.showPayment = false;
                this.cdr.detectChanges();
              });
            }
          }
        });
      },
      error: (err) => {
        const message = this.getErrorMessage(err, 'Order failed. Server error.');
        this.orderStatusMessage = message;
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Order failed',
          text: message,
        });
      }
    });
  }

  private recalculateTotals() {
    let usd = 0;
    let items = 0;
    for (const item of this.cartItems) {
      const price = Number(item.product?.price || 0);
      const qty = Number(item.qty || 0);
      usd += price * qty;
      items += qty;
    }
    this.totalUsd = Number(usd.toFixed(2));
    this.totalKhr = Math.round(usd * this.khrRate);
    this.totalItems = items;
  }

  private getErrorMessage(error: any, fallback: string): string {
    return (
      error?.error?.message ||
      error?.error?.error ||
      error?.message ||
      (typeof error?.error === 'string' ? error.error : '') ||
      fallback
    );
  }

  private printReceipt(
    orderId: string,
    paymentMethod: string,
    items: { name: string; qty: number; price: number }[],
    totalUsd: number,
    totalKhr: number
  ) {
    const receiptWindow = window.open('', '_blank', 'width=420,height=700');
    if (!receiptWindow) {
      return;
    }

    const now = new Date();
    const rows = items
      .map((item) => {
        const lineTotal = item.qty * item.price;
        return `<tr><td>${item.name}</td><td style="text-align:center;">${item.qty}</td><td style="text-align:right;">$${lineTotal.toFixed(2)}</td></tr>`;
      })
      .join('');

    receiptWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Receipt</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 16px; color: #1f1f1f; }
          h2 { margin: 0 0 8px; }
          .muted { color: #666; font-size: 12px; margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border-bottom: 1px solid #ddd; padding: 8px 4px; font-size: 13px; }
          th { text-align: left; }
          .totals { margin-top: 12px; font-size: 13px; }
          .totals div { display: flex; justify-content: space-between; margin: 4px 0; }
          .strong { font-weight: bold; }
          .center { text-align: center; margin-top: 14px; font-size: 12px; color: #555; }
        </style>
      </head>
      <body>
        <h2>Payment Receipt</h2>
        <p class="muted">Order: ${orderId}</p>
        <p class="muted">Date: ${now.toLocaleString()}</p>
        <p class="muted">Payment: ${paymentMethod}</p>
        <table>
          <thead>
            <tr><th>Item</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Total</th></tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="totals">
          <div><span>Total USD</span><span>$${totalUsd.toFixed(2)}</span></div>
          <div><span>Total KHR</span><span>KHR ${Math.round(totalKhr)}</span></div>
          <div class="strong"><span>Amount Paid</span><span>$${totalUsd.toFixed(2)}</span></div>
        </div>
        <p class="center">Thank you. Please come again.</p>
      </body>
      </html>
    `);
    receiptWindow.document.close();
    receiptWindow.focus();
    receiptWindow.print();
    receiptWindow.close();
  }
}
