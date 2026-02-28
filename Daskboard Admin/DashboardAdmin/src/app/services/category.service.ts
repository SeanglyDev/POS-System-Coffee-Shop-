// DashboardAdmin/src/app/services/categories.service.ts
import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CategoriesService {
  constructor(private api: ApiService) {}

  getAll() {
    return this.api.get<{ categories: any[] }>('/categories');
  }

  create(payload: { categoriesName: string; description: string; status?: boolean }) {
    return this.api.post<{ message: string; category: any }>('/categories', payload);
  }

  update(id: string, payload: { categoriesName: string; description: string; status?: boolean }) {
    return this.api.put<{ message: string; category: any }>(`/categories/${id}`, payload);
  }

  delete(id: string) {
    return this.api.delete<{ message: string; category?: any }>(`/categories/${id}`);
  }
}
