import { DOCUMENT, NgIf } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Navbar } from './layout/navbar/navbar';
import { Sidebar } from './layout/sidebar/sidebar';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Navbar, Sidebar, NgIf],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('DashboardAdmin');
  isLoggedIn = !!sessionStorage.getItem('token');
  isAuthRoute = false;

  constructor(
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {
    const storedTheme = localStorage.getItem('theme');
    const isDark = storedTheme === 'dark';
    this.document.body.classList.toggle('dark', isDark);

    if (this.router.url === '/' || this.router.url === '') {
      this.router.navigate([this.isLoggedIn ? '/dashboard' : '/login']);
    }
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.isLoggedIn = !!sessionStorage.getItem('token');
        this.isAuthRoute = this.router.url.startsWith('/login') || this.router.url.startsWith('/register');
        if (!this.isLoggedIn && !this.isAuthRoute) {
          this.router.navigate(['/login']);
          return;
        }
        if (this.isLoggedIn && this.isAuthRoute) {
          this.router.navigate(['/dashboard']);
        }
      });
    this.isAuthRoute = this.router.url.startsWith('/login') || this.router.url.startsWith('/register');
    if (!this.isLoggedIn && !this.isAuthRoute) {
      this.router.navigate(['/login']);
    } else if (this.isLoggedIn && this.isAuthRoute) {
      this.router.navigate(['/dashboard']);
    }
  }

  handleLoggedIn(): void {
    this.isLoggedIn = true;
    this.router.navigate(['/dashboard']);
  }

  handleLoggedOut(): void {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
