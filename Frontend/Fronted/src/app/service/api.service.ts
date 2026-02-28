import { HttpClient,HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "./auth.service";

@Injectable({providedIn:'root'})
export class ApiService {
    private readonly BASE_URL = 'http://localhost:3000/api';
    constructor (
        private http:HttpClient,
        private authService: AuthService
    ){}

    private getHeaders(){
        const token = this.authService.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
        }
        return {
        headers: new HttpHeaders(headers)
        };
    }

     get<T>(url: string) {
        return this.http.get<T>(
            `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`,
            this.getHeaders()
        );
    }

    post<T>(url: string, body: unknown) {
        return this.http.post<T>(
            `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`,
            body,
            this.getHeaders()
        );
    }

    patch<T>(url: string, body: unknown) {
        return this.http.patch<T>(
            `${this.BASE_URL}${url.startsWith('/') ? url : '/' + url}`,
            body,
            this.getHeaders()
        );
    }

}
