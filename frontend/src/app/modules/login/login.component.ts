import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  usuario = '';
  senha = '';
  verSenha = false;
  erro = '';
  carregando = false;

  constructor(private http: HttpClient) {}

  togglePassword() {
    this.verSenha = !this.verSenha;
  }

  login() {
    if (this.carregando) return;
    this.erro = '';
    this.carregando = true;
    this.http.post<{ success: boolean; message?: string }>(
      'http://localhost:3000/api/login',
      { usuario: this.usuario, senha: this.senha }
    ).subscribe({
      next: () => {
        this.carregando = false;
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.message || 'Credenciais inválidas';
      }
    });
  }
}
