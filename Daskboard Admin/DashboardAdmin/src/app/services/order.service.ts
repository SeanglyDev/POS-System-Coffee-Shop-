import { Injectable } from '@angular/core';
import { map } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private api: ApiService) {}

  getAll() {
    return this.api.get<any>('/order').pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return res;
        }
        if (Array.isArray(res?.orders)) {
          return res.orders;
        }
        if (Array.isArray(res?.order)) {
          return res.order;
        }
        if (Array.isArray(res?.data)) {
          return res.data;
        }
        return [];
      })
    );
  }

  updateStatus(id: string, payload: { orderStatus: string }) {
    return this.api.put<{ message: string; order: any }>(`/order/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<{ message: string }>(`/order/${id}`);
  }
}
