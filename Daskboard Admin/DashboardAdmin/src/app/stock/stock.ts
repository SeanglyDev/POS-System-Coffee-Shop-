import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { StockService } from '../services/stock.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-stock',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './stock.html',
  styleUrl: './stock.css',
})
export class Stock implements OnInit {
  isAdmin = false;
  errorMessage = '';
  stockItems: any[] = [];
  loading = false;

  pageSize = 9;
  currentPage = 1;

  showAddModal = false;
  isClosing = false;
  saving = false;
  editingId: string | null = null;

  products: any[] = [];
  newStock = {
    product: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: 0,
    note: ''
  };

  constructor(
    private stockService: StockService,
    private authService: AuthService,
    private productService: ProductService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin = this.authService.getRole() === 'admin';
  }

  ngOnInit(): void {
    this.fetchStock();
    this.fetchProducts();
  }

  fetchStock(): void {
    this.loading = true;
    this.errorMessage = '';

    this.stockService.getAll().subscribe({
      next: (res) => {
        this.stockItems = [...(res?.stock ?? [])].sort((a: any, b: any) => {
          const aTime = new Date(a?.createdAt ?? a?.updatedAt ?? 0).getTime();
          const bTime = new Date(b?.createdAt ?? b?.updatedAt ?? 0).getTime();
          return bTime - aTime;
        });
        this.currentPage = 1;
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

  fetchProducts(): void {
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products = res?.product ?? [];
        if (!this.newStock.product && this.products.length) {
          this.newStock.product = this.products[0]?._id ?? '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.products = [];
        this.cdr.detectChanges();
      }
    });
  }

  get totalPages(): number {
    return Math.ceil(this.stockItems.length / this.pageSize);
  }

  get pagedStock() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.stockItems.slice(start, start + this.pageSize);
  }

  goTo(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
  }

  next(): void {
    this.goTo(this.currentPage + 1);
  }

  prev(): void {
    this.goTo(this.currentPage - 1);
  }

  openAddModal(): void {
    if (!this.isAdmin) return;
    this.editingId = null;
    this.newStock = {
      product: this.products[0]?._id ?? '',
      type: 'IN',
      quantity: 0,
      note: ''
    };
    this.showAddModal = true;
    this.isClosing = false;
  }

  closeAddModal(): void {
    if (this.isClosing) return;
    this.isClosing = true;
  }

  onModalAnimationEnd(name: string): void {
    if (this.isClosing && name === 'fadeOut') {
      this.showAddModal = false;
      this.isClosing = false;
    }
  }

  editStock(item: any): void {
    if (!this.isAdmin) return;
    this.editingId = item?._id ?? null;
    this.newStock = {
      product: item?.product?._id ?? item?.product ?? '',
      type: item?.type ?? 'IN',
      quantity: item?.quantity ?? 0,
      note: item?.note ?? ''
    };
    this.showAddModal = true;
    this.isClosing = false;
  }

  deleteStock(id: string): void {
    if (!this.isAdmin || !id) return;
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.stockService.delete(id).subscribe({
        next: () => {
          this.fetchStock();
          void Swal.fire({
            title: 'Deleted!',
            text: 'Your file has been deleted.',
            icon: 'success'
          });
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete stock';
          void Swal.fire({
            title: 'Delete failed',
            text: this.errorMessage,
            icon: 'error'
          });
          this.cdr.detectChanges();
        }
      });
    });
  }

  saveStock(): void {
    if (!this.newStock.product || !this.newStock.quantity) return;
    this.saving = true;

    const payload = {
      quantity: Number(this.newStock.quantity),
      type: this.newStock.type,
      note: this.newStock.note?.trim() || undefined
    };

    const request = this.editingId
      ? this.stockService.update(this.editingId, payload)
      : this.stockService.create({ product: this.newStock.product, ...payload });

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeAddModal();
        this.fetchStock();
        void Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Your work has been saved',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to add stock';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
