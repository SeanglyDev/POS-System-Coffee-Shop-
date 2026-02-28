import { DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { finalize, timeout } from 'rxjs/operators';
import { AuthService, AuthUser } from '../services/auth.service';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-staff',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './staff.html',
  styleUrls: ['./staff.css'],
})
export class Staff implements OnInit {
  users: AuthUser[] = [];
  isAdmin = false;
  loading = false;
  errorMessage = '';
  saving = false;
  showEditModal = false;
  editingId: string | null = null;

  form = {
    firstName: '',
    lastName: '',
    email: '',
    gender: 'other',
    phoneNumber: '',
    dob: '',
    address: '',
    role: 'staff',
    image_Url: ''
  };

  constructor(
    private api: ApiService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.isAdmin = this.authService.getRole() === 'admin';
  }

  ngOnInit(): void {
    this.fetchUsers();
  }

  fetchUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.get<any>('/users').subscribe({
      next: (res) => {
        this.users = res?.users ?? res?.user ?? res?.data ?? (Array.isArray(res) ? res : []);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.errorMessage = err?.error?.message || 'Failed to load users.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getUserId(user: any): string {
    return user?._id ?? user?.id ?? '';
  }

  openEdit(user: any): void {
    if (!this.isAdmin) return;
    this.editingId = this.getUserId(user);
    if (!this.editingId) return;
    this.form = {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      gender: user?.gender ?? 'other',
      phoneNumber: user?.phoneNumber ?? '',
      dob: user?.dob ? String(user.dob).slice(0, 10) : '',
      address: user?.address ?? '',
      role: user?.role ?? 'staff',
      image_Url: user?.image_Url ?? ''
    };
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.editingId = null;
  }

  saveUser(): void {
    if (!this.isAdmin || !this.editingId) return;
    this.saving = true;
    const payload = {
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      email: this.form.email.trim(),
      gender: this.form.gender,
      phoneNumber: this.form.phoneNumber.trim(),
      dob: this.form.dob,
      address: this.form.address.trim(),
      role: this.form.role,
      image_Url: this.form.image_Url.trim()
    };

    this.api.put(`/users/${this.editingId}`, payload)
      .pipe(
        timeout(10000),
        finalize(() => {
          this.saving = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.closeEdit();
          this.fetchUsers();
          void Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: 'Your work has been saved',
            showConfirmButton: false,
            timer: 1500
          });
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to update user.';
          void Swal.fire({
            title: 'Update failed',
            text: this.errorMessage,
            icon: 'error'
          });
        }
      });
  }

  deleteUser(user: any): void {
    if (!this.isAdmin) return;
    const id = this.getUserId(user);
    if (!id) return;

    void Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.api.delete(`/users/${id}`).subscribe({
        next: () => {
          this.fetchUsers();
          void Swal.fire({
            title: 'Deleted!',
            text: 'Your file has been deleted.',
            icon: 'success'
          });
        },
        error: (err) => {
          this.errorMessage = err?.error?.message || 'Failed to delete user.';
          this.cdr.detectChanges();
        }
      });
    });
  }
}
