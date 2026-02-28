import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(includeContentType = false) {
    const storedToken = sessionStorage.getItem('token');
    const token = storedToken?.startsWith('Bearer ') ? storedToken.slice(7) : storedToken;

    const headerData: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` })
    };

    if (includeContentType) {
      headerData['Content-Type'] = 'application/json';
    }

    return { headers: new HttpHeaders(headerData) };
  }

  get<T>(url: string) {
    return this.http.get<T>(
      `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`,
      this.getHeaders()
    );
  }

  post<T>(url: string, body: any) {
    return this.http.post<T>(
      `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`,
      body,
      this.getHeaders(true)
    );
  }

  put<T>(url: string, body: any) {
    return this.http.put<T>(
      `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`,
      body,
      this.getHeaders(true)
    );
  }

  delete<T>(url: string) {
    return this.http.delete<T>(
      `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`,
      this.getHeaders()
    );
  }
}
