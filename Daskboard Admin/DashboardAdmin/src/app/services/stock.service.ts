import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class StockService {
  constructor(private api: ApiService) {}

  getAll() {
    return this.api.get<{ stock: any[] }>('/stock');
  }

  create(payload: { product: string; quantity: number; type: 'IN' | 'OUT'; note?: string }) {
    return this.api.post<{ message: string; stock: any; currentStock: number }>('/stock', payload);
  }

  update(id: string, payload: { quantity: number; type: 'IN' | 'OUT'; note?: string }) {
    return this.api.put<{ message: string; stock: any; currentStock: number }>(`/stock/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<{ message: string; currentStock: number }>(`/stock/${id}`);
  }
}
