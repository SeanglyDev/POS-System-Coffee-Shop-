import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CategoriesService } from '../services/category.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [ FormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.css',
})
export class Categories implements OnInit {
  isAdmin = false;
  errorMessage = '';
  categories: any[] = [];

  loading = false;
  pageSize = 10;
  currentPage = 1;
  showAddModal = false;
  isClosing = false;
  saving = false;
  editingId: string | null = null;
  form = {
    categoriesName: '',
    description: '',
    status: true
  };

  constructor(
    private categoriesService: CategoriesService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin = this.authService.getRole() === 'admin';
  }
  
  ngOnInit(): void {
    this.fetchCategories();
  }

  fetchCategories(): void {
    this.loading = true;
    this.errorMessage = '';

    this.categoriesService.getAll().subscribe({
      next: (res) => {
        this.categories = [...(res?.categories ?? [])].sort((a: any, b: any) => {
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

  get totalPages(): number {
    return Math.ceil(this.categories.length / this.pageSize);
  }

  get pagedCategories() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.categories.slice(start, start + this.pageSize);
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
    this.form = {
      categoriesName: '',
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

  editCategory(item: any): void {
    if (!this.isAdmin) return;
    this.editingId = item?._id ?? null;
    this.form = {
      categoriesName: item?.categoriesName ?? '',
      description: item?.description ?? '',
      status: item?.status ?? true
    };
    this.showAddModal = true;
    this.isClosing = false;
  }

  deleteCategory(id: string): void {
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
      this.categoriesService.delete(id).subscribe({
        next: () => {
          this.fetchCategories();
          void Swal.fire({
            title: 'Deleted!',
            text: 'Your file has been deleted.',
            icon: 'success'
          });
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete category';
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

  saveCategory(): void {
    if (!this.form.categoriesName || !this.form.description) return;
    this.saving = true;

    const payload = {
      categoriesName: this.form.categoriesName.trim(),
      description: this.form.description.trim(),
      status: this.form.status
    };

    const request = this.editingId
      ? this.categoriesService.update(this.editingId, payload)
      : this.categoriesService.create(payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeAddModal();
        this.fetchCategories();
        void Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: 'Your work has been saved',
          showConfirmButton: false,
          timer: 1500
        });
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to save category';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
