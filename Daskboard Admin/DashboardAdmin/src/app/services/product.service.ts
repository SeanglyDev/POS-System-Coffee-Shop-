import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
declare const axios: any;
@Injectable({
  providedIn: 'root',
})
export class ProductService {
   constructor(private api: ApiService) {}

  getAll() {
    return this.api.get<{ product: any[] }>('/product');
  }

  create(payload: {
    image_URL: string;
    productName: string;
    categories: string;
    price: number;
    stock: number;
    description?: string;
    status?: boolean;
  }) {
    return this.api.post<{ message: string; product: any }>('/product', payload);
  }

  update(id: string, payload: {
    image_URL?: string;
    productName?: string;
    categories?: string;
    price?: number;
    stock?: number;
    description?: string;
    status?: boolean;
  }) {
    return this.api.put<{ message: string; product: any }>(`/product/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<{ message: string }>(`/product/${id}`);
  }
}
