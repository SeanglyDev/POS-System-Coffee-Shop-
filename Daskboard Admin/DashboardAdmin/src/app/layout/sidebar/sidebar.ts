import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink, 
    RouterLinkActive, 
    LucideAngularModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  isOpen = false;
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canView(key: string): boolean {
    const role = this.authService.getRole();
    if (role === 'admin') {
      return true;
    }
    if (role !== 'staff') {
      return false;
    }
    const staffAccess = new Set([
      'dashboard',
      'orders',
      'products',
      'categories',
      'stock',
      'staff',
      'settings',
      'addons',
      'reports'
    ]);
    return staffAccess.has(key);
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
  }

  close(): void {
    this.isOpen = false;
  }

  async logout(): Promise<void> {
    const result = await Swal.fire({
      title: 'Log out?',
      text: 'You will need to sign in again.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#c76d39'
    });

    if (!result.isConfirmed) return;

    this.authService.logout();
    this.close();
    await Swal.fire({
      position: 'top-end',
      icon: 'success',
      title: 'Logged out successfully',
      showConfirmButton: false,
      timer: 1200
    });
    this.router.navigate(['/login']);
  }
}
