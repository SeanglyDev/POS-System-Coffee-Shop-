import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ProductService } from '../service/product.service';
import { AuthService } from '../service/auth.service';
import { CartService } from '../service/cart.service';
@Component({
  selector: 'app-item',
  imports: [CommonModule],
  templateUrl: './item.html',
  styleUrl: './item.css',
})
export class Item implements OnInit {
  isAdmin = false;
  errorMessage = '';
  products: any[] = [];
  loading = false;
  selectedCategory = 'All';
  searchQuery = '';

  pageSize = 10;
  currentPage = 1;

  showAddModal = false;
  isClosing = false;
  saving = false;
  editingId: string | null = null;
  form = {
    image_URL: '',
    productName: '',
    categories: '',
    price: 0,
    stock: 0,
    description: '',
    status: true
  };
  statusMessage = '';
  private hideTimer?: ReturnType<typeof setTimeout>;
  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private cartService: CartService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin = this.authService.hasRole('admin');
  }

  ngOnInit(): void {
    this.fetchProducts();
  }

  fetchProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getAll().subscribe({
      next: (res) => {
        if (Array.isArray(res)) {
          this.products = res;
        } else if (Array.isArray(res?.product)) {
          this.products = res.product;
        } else if (res && 'products' in res && Array.isArray(res.products)) {
          this.products = res.products;
        } else if (Array.isArray(res?.data)) {
          this.products = res.data;
        } else {
          this.products = [];
        }
        this.currentPage = 1;
        this.selectedCategory = 'All';
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
  handleAction(action: 'buy' | 'cart' | 'wishlist', name: string) {
    let message = '';
    if (action === 'buy') {
      message = `Buying ${name} now...`;
    } else if (action === 'cart') {
      message = `${name} added to cart.`;
    } else {
      message = `${name} saved to wishlist.`;
    }
    this.showStatus(message);
  }

  addCard(name: string) {
    this.handleAction('cart', name);
  }

  addToCart(product: any) {
    this.cartService.addItem(product);
    this.handleAction('cart', product?.productName || 'Item');
  }

  get categoryNames(): string[] {
    const names = new Set<string>();
    for (const item of this.products) {
      const name = this.getCategoryName(item);
      if (name) {
        names.add(name);
      }
    }
    return ['All', ...Array.from(names)];
  }

  get filteredProducts(): any[] {
    const search = this.searchQuery.trim().toLowerCase();
    return this.products.filter((item) => {
      const inCategory =
        this.selectedCategory === 'All' ||
        this.getCategoryName(item).toLowerCase() === this.selectedCategory.toLowerCase();
      if (!inCategory) {
        return false;
      }
      if (!search) {
        return true;
      }
      const name = String(item?.productName ?? '').toLowerCase();
      return name.includes(search);
    });
  }

  selectCategory(categoryName: string): void {
    this.selectedCategory = categoryName;
  }

  updateSearch(value: string): void {
    this.searchQuery = value || '';
  }

  getCategoryName(item: any): string {
    const raw = item?.categories?.categoriesName ?? item?.categories ?? 'Other';
    return String(raw).trim() || 'Other';
  }

  isSelectedCategory(categoryName: string): boolean {
    return this.selectedCategory.toLowerCase() === categoryName.toLowerCase();
  }

  private showStatus(message: string) {
    this.statusMessage = message;
    if (this.hideTimer) {
      clearTimeout(this.hideTimer);
    }
    this.hideTimer = setTimeout(() => {
      this.statusMessage = '';
    }, 2200);
  }
}
