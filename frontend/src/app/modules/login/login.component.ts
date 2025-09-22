import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../shared/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent implements OnInit {
  username = '';
  password = '';
  showPassword = false;
  isLoading = false;
  errorMessage = '';
  usernameError = '';
  passwordError = '';

  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    if (this.authService.estaAutenticado()) {
      this.router.navigate(['/dashboard']);
    }
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onUsernameInput(): void {
    if (this.usernameError) {
      this.usernameError = '';
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
    const trimmedUsername = this.username.trim();
    const trimmedPassword = this.password.trim();

    this.isLoading = true;

    this.authService
      .login(trimmedUsername, trimmedPassword)
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
          this.isLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          if (error.status === 401) {
            this.errorMessage =
              error.error?.detail || error.error?.message || 'Usuário ou senha incorretos';
          } else if (error.error?.message) {
            this.errorMessage = error.error.message;
          } else if (error.error?.detail) {
            this.errorMessage = error.error.detail;
          } else {
            this.errorMessage = 'Não foi possível acessar a plataforma. Tente novamente mais tarde.';
          }
          this.isLoading = false;
        }
      });
  }

  private validateForm(): boolean {
    const trimmedUsername = this.username.trim();
    const trimmedPassword = this.password.trim();
    let isValid = true;

    this.errorMessage = '';
    this.usernameError = '';
    this.passwordError = '';

    if (!trimmedUsername) {
      this.usernameError = 'Usuário é obrigatório';
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
}
