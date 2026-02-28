import { Injectable } from '@angular/core';

interface JwtPayload {
  roles?: string[];
  role?: string | string[];
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'token';

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  hasRole(role: string): boolean {
    const roles = this.getRoles();
    return roles.includes(role);
  }

  getRoles(): string[] {
    const payload = this.getPayload();
    if (!payload) {
      return [];
    }
    if (Array.isArray(payload.roles)) {
      return payload.roles.map((item) => String(item));
    }
    if (Array.isArray(payload.role)) {
      return payload.role.map((item) => String(item));
    }
    if (payload.role) {
      return [String(payload.role)];
    }
    return [];
  }

  private getPayload(): JwtPayload | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }
    const rawToken = token.startsWith('Bearer ') ? token.slice(7) : token;
    const parts = rawToken.split('.');
    if (parts.length < 2) {
      return null;
    }
    try {
      const payloadJson = atob(parts[1]);
      return JSON.parse(payloadJson) as JwtPayload;
    } catch {
      return null;
    }
  }
}
