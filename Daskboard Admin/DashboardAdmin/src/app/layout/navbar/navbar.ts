import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  roleLabel = 'Staff';

  constructor(private authService: AuthService) {
    const role = this.authService.getRole();
    this.roleLabel = role === 'admin' ? 'Admin' : 'Staff';
  }
}
