import { Routes } from '@angular/router';
import { Home } from './home/home';
import { LoginPage } from './login-page/login-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginPage },
  { path: 'home', component: Home },
  { path: '**', redirectTo: 'login' },
];
