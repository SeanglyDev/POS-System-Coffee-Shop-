import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CategoriesService } from '../services/category.service';
import { ProductService } from '../services/product.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './product.html',
  styleUrl: './product.css'
})
export class Product implements OnInit {
  isAdmin = false;
  errorMessage = '';
  products: any[] = [];
  loading = false;
  searchTerm = '';

  pageSize = 7;
  currentPage = 1;

  showAddModal = false;
  isClosing = false;
  saving = false;
  editingId: string | null = null;
  categories: any[] = [];

  form = {
    image_URL: '',
    productName: '',
    categories: '',
    price: 0,
    stock: 0,
    description: '',
    status: true
  };

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private categoriesService: CategoriesService,
    private cdr: ChangeDetectorRef // ✅ ADD THIS
  ) {
    this.isAdmin = this.authService.getRole() === 'admin';
  }

  ngOnInit(): void {
    this.fetchProducts();
    this.fetchCategories();
  }

  fetchProducts(): void {
    this.loading = true;
    this.errorMessage = '';

    this.productService.getAll().subscribe({
      next: (res) => {
        this.products = [...(res?.product ?? [])].sort((a: any, b: any) => {
          const aTime = new Date(a?.createdAt ?? a?.updatedAt ?? 0).getTime();
          const bTime = new Date(b?.createdAt ?? b?.updatedAt ?? 0).getTime();
          return bTime - aTime;
        });
        this.currentPage = 1;

        this.loading = false;

        // ✅ FORCE UI UPDATE
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Unauthorized';
        this.loading = false;

        // ✅ FORCE UI UPDATE
        this.cdr.detectChanges();
      }
    });
  }

  fetchCategories(): void {
    this.categoriesService.getAll().subscribe({
      next: (res) => {
        this.categories = res?.categories ?? [];
        if (!this.form.categories && this.categories.length) {
          this.form.categories = this.categories[0]?._id ?? '';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.categories = [];
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- PAGINATION ----------

  get totalPages(): number {
    return Math.ceil(this.filteredProducts.length / this.pageSize);
  }

  get filteredProducts(): any[] {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) return this.products;
    return this.products.filter((product) =>
      (product?.productName ?? '').toLowerCase().includes(term)
    );
  }

  get pagedProducts() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProducts.slice(start, start + this.pageSize);
  }

  onSearchChange(): void {
    this.currentPage = 1;
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

  // ---------- MODAL ----------

  openAddModal(): void {
    if (!this.isAdmin) return;
    this.editingId = null;
    this.form = {
      image_URL: '',
      productName: '',
      categories: this.categories[0]?._id ?? '',
      price: 0,
      stock: 0,
      description: '',
      status: true
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

  editProduct(item: any): void {
    if (!this.isAdmin) return;
    this.editingId = item?._id ?? null;
    this.form = {
      image_URL: item?.image_URL ?? '',
      productName: item?.productName ?? '',
      categories: item?.categories?._id ?? item?.categories ?? this.categories[0]?._id ?? '',
      price: item?.price ?? 0,
      stock: item?.stock ?? 0,
      description: item?.description ?? '',
      status: item?.status ?? true
    };
    this.showAddModal = true;
    this.isClosing = false;
  }

  deleteProduct(id: string): void {
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

      this.productService.delete(id).subscribe({
        next: () => {
          this.fetchProducts();
          void Swal.fire({
            title: 'Deleted!',
            text: 'Your file has been deleted.',
            icon: 'success'
          });
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete product';
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

  saveProduct(): void {
    if (!this.form.productName || !this.form.categories) return;
    this.saving = true;

    const payload = {
      image_URL: this.form.image_URL.trim(),
      productName: this.form.productName.trim(),
      categories: this.form.categories,
      price: Number(this.form.price),
      stock: Number(this.form.stock),
      description: this.form.description?.trim() || undefined,
      status: this.form.status
    };

    const request = this.editingId
      ? this.productService.update(this.editingId, payload)
      : this.productService.create(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeAddModal();
        this.fetchProducts();
        void Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Your work has been saved',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to save product';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
