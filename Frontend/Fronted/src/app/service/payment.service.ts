import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private api: ApiService) {}

  createPayment(orderId: string, paymentMethod: string) {
    return this.api.post<any>('/payment', { orderId, paymentMethod });
  }
}
