import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone:true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  @Output() loggedIn = new EventEmitter<void>();

  email = '';
  password = '';
  rememberMe = false;
  showPassword = false;
  loading = false;
  errorMessage = '';
  showResetForm = false;
  resetEmail = '';
  newPassword = '';
  resetLoading = false;
  resetErrorMessage = '';
  resetSuccessMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        const token = res?.token ?? res?.accessToken ?? res?.data?.token ?? res?.data?.accessToken;
        const user = res?.user ?? res?.data?.user;
        const role = res?.user?.role ?? res?.data?.user?.role;
        if (token) {
          this.authService.saveToken(token);
          this.authService.saveRole(role ?? 'staff');
          this.authService.saveUser(
            user ?? {
              email: this.email,
              role: role ?? 'staff'
            }
          );
          this.loggedIn.emit();
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage = 'Login succeeded but no token returned.';
        }
        this.loading = false;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  toggleResetForm(): void {
    this.showResetForm = !this.showResetForm;
    this.resetErrorMessage = '';
    this.resetSuccessMessage = '';
    if (this.showResetForm) {
      this.resetEmail = this.email;
      this.newPassword = '';
    }
  }

  onResetPassword(): void {
    if (!this.resetEmail || !this.newPassword) {
      this.resetErrorMessage = 'Email and new password are required.';
      this.resetSuccessMessage = '';
      return;
    }

    this.resetLoading = true;
    this.resetErrorMessage = '';
    this.resetSuccessMessage = '';

    this.authService.resetPassword({
      email: this.resetEmail,
      newPassword: this.newPassword
    }).subscribe({
      next: (res: any) => {
        this.resetSuccessMessage = res?.message ?? 'Password reset successful. You can sign in now.';
        this.resetLoading = false;
        this.password = '';
      },
      error: (err) => {
        this.resetErrorMessage = err?.error?.message ?? 'Reset password failed. Please try again.';
        this.resetLoading = false;
      }
    });
  }
}
