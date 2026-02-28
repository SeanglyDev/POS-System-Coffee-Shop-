import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, throwError } from 'rxjs';

export interface AuthUser {
  image_Url?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  gender?: string;
  phoneNumber?: string;
  dob?: string;
  address?: string;
  role?: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  constructor(private http: HttpClient) {}

  login(data: any) {
    return this.http.post(
    'http://localhost:3000/api/user/login',
    data
  );
  }

  register(data: any) {
    return this.http.post(
      'http://localhost:3000/api/user/register',
      data
    ).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status !== 404) {
          return throwError(() => err);
        }

        return this.http.post(
          'http://localhost:3000/api/users/register',
          data
        ).pipe(
          catchError((secondErr: HttpErrorResponse) => {
            if (secondErr.status !== 404) {
              return throwError(() => secondErr);
            }

            return this.http.post(
              'http://localhost:3000/api/auth/register',
              data
            );
          })
        );
      })
    );
  }

  resetPassword(data: { email: string; newPassword: string }) {
    return this.http.post(
      'http://localhost:3000/api/auth/reset-password',
      data
    );
  }

  saveToken(token: string) {
    if (!token) return;
    const cleaned = token.startsWith('Bearer ') ? token.slice(7) : token;
    sessionStorage.setItem('token', cleaned);
  }

  getToken(): string | null {
    return sessionStorage.getItem('token');
  }

  saveRole(role: string) {
    if (!role) {
      sessionStorage.removeItem('role');
      return;
    }
    sessionStorage.setItem('role', role);
  }

  getRole(): string | null {
    return sessionStorage.getItem('role');
  }

  saveUser(user: AuthUser | null | undefined) {
    if (!user) {
      sessionStorage.removeItem('user');
      return;
    }
    sessionStorage.setItem('user', JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    const raw = sessionStorage.getItem('user');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthUser;
    } catch {
      sessionStorage.removeItem('user');
      return null;
    }
  }

  logout() {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('user');
  }
}
