import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface CartItem {
  product: any;
  qty: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly itemsSubject = new BehaviorSubject<CartItem[]>([]);
  readonly items$ = this.itemsSubject.asObservable();

  getItems(): CartItem[] {
    return this.itemsSubject.value;
  }

  addItem(product: any): void {
    if (!product) {
      return;
    }
    const items = [...this.itemsSubject.value];
    const productId = this.getProductId(product);
    const existing = items.find(
      (item) => this.getProductId(item.product) === productId
    );
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ product, qty: 1 });
    }
    this.itemsSubject.next(items);
  }

  updateQty(product: any, delta: number): void {
    const items = [...this.itemsSubject.value];
    const productId = this.getProductId(product);
    const existing = items.find(
      (item) => this.getProductId(item.product) === productId
    );
    if (!existing) {
      return;
    }
    existing.qty += delta;
    if (existing.qty <= 0) {
      this.itemsSubject.next(
        items.filter((item) => this.getProductId(item.product) !== productId)
      );
      return;
    }
    this.itemsSubject.next(items);
  }

  removeItem(product: any): void {
    const productId = this.getProductId(product);
    this.itemsSubject.next(
      this.itemsSubject.value.filter(
        (item) => this.getProductId(item.product) !== productId
      )
    );
  }

  clear(): void {
    this.itemsSubject.next([]);
  }

  private getProductId(product: any): string {
    return String(product?._id ?? product?.id ?? '');
  }
}
