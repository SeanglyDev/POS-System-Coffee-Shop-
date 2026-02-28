import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { importProvidersFrom } from '@angular/core';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { provideRouter, withRouterConfig } from '@angular/router';
import {
  Boxes,
  ChartColumn,
  CreditCard,
  HardDrive,
  LayoutDashboard,
  LogOut,
  LucideAngularModule,
  ReceiptText,
  Settings,
  ShoppingBasket,
  SlidersHorizontal,
  Tags,
  Users
} from 'lucide-angular';

import { routes } from './app.routes';
import { AuthInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    importProvidersFrom(
      LucideAngularModule.pick({
        LayoutDashboard,
        ReceiptText,
        ShoppingBasket,
        Tags,
        Boxes,
        CreditCard,
        Users,
        Settings,
        ChartColumn,
        SlidersHorizontal,
        HardDrive,
        LogOut
      })
    ),
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: 'reload' }))
  ]
};
