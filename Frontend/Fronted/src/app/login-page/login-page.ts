import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { ApiService } from '../service/api.service';
import { AuthService } from '../service/auth.service';

interface LoginResponse {
  token?: string;
  accessToken?: string;
  data?: {
    token?: string;
    accessToken?: string;
  };
}

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login-page.html',
  styleUrl: './login-page.css',
})
export class LoginPage {
  isSubmitting = false;
  errorMessage = '';

  readonly form;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(0)]],
      rememberMe: [true],
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) {
      this.form.markAllAsTouched();
      Swal.fire({
        icon: 'warning',
        title: 'Invalid form',
        text: 'Please check your email and password.',
      });
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { email, password } = this.form.getRawValue();

    this.apiService.post<LoginResponse>('/auth/login', { email, password }).subscribe({
      next: (response) => {
        const token =
          response?.token ??
          response?.accessToken ??
          response?.data?.token ??
          response?.data?.accessToken;

        if (!token) {
          this.errorMessage = 'Login succeeded but no token was returned.';
          this.isSubmitting = false;
          Swal.fire({
            icon: 'error',
            title: 'Missing token',
            text: this.errorMessage,
          });
          return;
        }

        this.authService.setToken(token);
        this.isSubmitting = false;
        this.router.navigateByUrl('/home').then(() => {
          Swal.fire({
            icon: 'success',
            title: 'Login successful',
            timer: 1200,
            showConfirmButton: false,
          });
        });
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Login failed. Please try again.';
        this.isSubmitting = false;
        Swal.fire({
          icon: 'error',
          title: 'Login failed',
          text: this.errorMessage,
        });
      },
    });
  }

  get emailControl() {
    return this.form.controls.email;
  }

  get passwordControl() {
    return this.form.controls.password;
  }
}
