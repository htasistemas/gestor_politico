import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

interface LoginResponse {
  success: boolean;
  user?: {
    id: number;
    usuario: string;
    nome: string;
  };
  message?: string;
}

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  emailError = '';
  passwordError = '';

  constructor(private router: Router, private http: HttpClient) {}

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onEmailInput(): void {
    if (this.emailError) {
      this.emailError = '';
    }
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  onPasswordInput(): void {
    if (this.passwordError) {
      this.passwordError = '';
    }
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  login(): void {
    if (this.isLoading) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.errorMessage = '';
    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();

    this.isLoading = true;

    this.http
      .post<LoginResponse>('http://localhost:3000/api/login', {
        usuario: trimmedEmail,
        senha: trimmedPassword
      })
      .subscribe({
        next: response => {
          if (response?.success) {
            this.router.navigate(['/dashboard']);
            this.isLoading = false;
            return;
          }

          this.errorMessage = response?.message ?? 'Não foi possível acessar a plataforma.';
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.errorMessage = 'Email ou senha incorretos';
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else {
            this.errorMessage = 'Não foi possível acessar a plataforma. Tente novamente mais tarde.';
          }
          this.isLoading = false;
        }
      });
  }

  private validateForm(): boolean {
    const trimmedEmail = this.email.trim();
    const trimmedPassword = this.password.trim();
    let isValid = true;

    this.errorMessage = '';
    this.emailError = '';
    this.passwordError = '';

    if (!trimmedEmail) {
      this.emailError = 'Email é obrigatório';
      isValid = false;
    } else if (!this.isValidEmail(trimmedEmail)) {
      this.emailError = 'Email inválido';
      isValid = false;
    }

    if (!trimmedPassword) {
      this.passwordError = 'Senha é obrigatória';
      isValid = false;
    } else if (trimmedPassword.length < 6) {
      this.passwordError = 'Senha deve ter pelo menos 6 caracteres';
      isValid = false;
    }

    return isValid;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  }
}
