import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private api: ApiService) {}

  getAll() {
    return this.api.get<any>('/payment').pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return res;
        }
        if (Array.isArray(res?.payments)) {
          return res.payments;
        }
        if (Array.isArray(res?.payment)) {
          return res.payment;
        }
        if (Array.isArray(res?.data)) {
          return res.data;
        }
        return [];
      })
    );
  }

  updateStatus(id: string, payload: { paymentStatus: string }) {
    return this.api.put<{ message: string; payment: any }>(`/payment/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<{ message: string }>(`/payment/${id}`);
  }
}
