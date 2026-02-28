import { Component } from '@angular/core';
import { Item } from '../item/item';
import { Cart } from '../cart/cart';
@Component({
  selector: 'app-home',
  imports: [Item, Cart],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
