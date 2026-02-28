import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  createOrder(
    items: { product: string; qty: number }[],
    orderStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Failed' = 'Pending'
  ) {
    return this.api.post<any>('/order', { items, orderStatus });
  }

  updateOrderStatus(
    orderId: string,
    orderStatus: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled' | 'Failed'
  ) {
    return this.api.patch<any>(`/order/${orderId}`, { orderStatus });
  }
}
