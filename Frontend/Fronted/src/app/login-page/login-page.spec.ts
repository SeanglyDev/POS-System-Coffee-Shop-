import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import Swal from 'sweetalert2';
import { LoginPage } from './login-page';
import { ApiService } from '../service/api.service';
import { AuthService } from '../service/auth.service';

class ApiServiceMock {
  post() {
    return of({ token: 'fake-token' });
  }
}

class AuthServiceMock {
  setToken(_: string): void {}
}

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let apiService: ApiServiceMock;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        { provide: ApiService, useClass: ApiServiceMock },
        { provide: AuthService, useClass: AuthServiceMock },
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    apiService = TestBed.inject(ApiService) as unknown as ApiServiceMock;
    spyOn(Swal, 'fire').and.returnValue(Promise.resolve({} as any));
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should mark controls touched when invalid form is submitted', () => {
    component.onSubmit();
    expect(component.form.touched).toBeTrue();
  });

  it('should show error message when login request fails', () => {
    spyOn(apiService, 'post').and.returnValue(throwError(() => ({ error: { message: 'Invalid creds' } })));

    component.form.setValue({ email: 'user@mail.com', password: '123456', rememberMe: true });
    component.onSubmit();

    expect(component.errorMessage).toContain('Invalid creds');
  });
});
