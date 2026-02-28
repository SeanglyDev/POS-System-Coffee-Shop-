import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
@Injectable({
  providedIn: 'root',
})
export class ProductService{
    constructor(private api:ApiService){}
    getAll(){
        return this.api.get<any>('/product');
    }
}
