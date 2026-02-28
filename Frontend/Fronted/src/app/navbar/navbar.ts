import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  menuOpen = false;

  readonly navLinks = [
    { label: 'Menu', href: '#' },
    { label: 'Roasts', href: '#' },
    { label: 'Subscriptions', href: '#' },
    { label: 'Brew Bar', href: '#' },
    { label: 'Locations', href: '#' },
  ];

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }
}
