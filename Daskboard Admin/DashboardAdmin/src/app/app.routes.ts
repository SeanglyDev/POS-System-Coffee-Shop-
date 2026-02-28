import { Routes } from '@angular/router';
import { Product } from './product/product';
import { Dashboard } from './pages/dashboard/dashboard';
import { Orders } from './orders/orders';
import { Categories } from './categories/categories';
import { Login } from './login/login';
import { Register } from './register/register';
import { Stock } from './stock/stock';
import { Payment } from './payment/payment';
import { Staff } from './staff/staff';
import { Setting } from './setting/setting';
import { Reports } from './reports/reports';


export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'dashboard', component: Dashboard,  },
  { path: 'product', component: Product,  },
  { path: 'orders', component: Orders,  },
  { path: 'categories', component: Categories,  },
  { path: 'stock', component: Stock,  },
  { path: 'payments', component: Payment,  },
  { path: 'staff', component: Staff,  },
  { path: 'reports', component: Reports,  },
  { path: 'settings', component: Setting,  },
  
];
