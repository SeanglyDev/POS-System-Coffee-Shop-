import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule,  RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  image_Url = '';
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  gender: 'male' | 'female' | 'other' = 'male';
  phoneNumber = '';
  dob = '';
  address = '';
  role: 'staff' | 'admin' = 'staff';
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onSubmit(): void {
    if (
      !this.image_Url ||
      !this.firstName ||
      !this.lastName ||
      !this.email ||
      !this.password ||
      !this.gender ||
      !this.phoneNumber ||
      !this.dob ||
      !this.address
    ) {
      this.errorMessage = 'Please fill all required fields.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.register({
      image_Url: this.image_Url,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      password: this.password,
      gender: this.gender,
      phoneNumber: this.phoneNumber,
      dob: new Date(this.dob).toISOString(),
      address: this.address,
      role: this.role
    }).subscribe({
      next: () => {
        this.successMessage = 'Account created successfully. Redirecting to login...';
        this.loading = false;
        setTimeout(() => this.router.navigate(['/login']), 900);
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }
}
