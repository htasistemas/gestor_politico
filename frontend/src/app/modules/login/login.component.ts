import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

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

  constructor(private http: HttpClient, private router: Router) {}

  togglePassword() {
    this.verSenha = !this.verSenha;
  }

  login() {
    if (this.carregando) return;
    this.erro = '';
    this.carregando = true;
    this.http.post<{ success: boolean; message?: string; user?: { nome: string; usuario: string } }>(
      'http://localhost:3000/api/login',
      { usuario: this.usuario, senha: this.senha }
    ).subscribe({
      next: (res) => {
        this.carregando = false;
        if (res.success) {
          if (res.user) {
            localStorage.setItem('usuarioLogado', JSON.stringify(res.user));
          }
          this.router.navigate(['/dashboard']);
        } else {
          this.erro = res.message || 'Credenciais inválidas';
        }
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err.error?.message || 'Credenciais inválidas';
      }
    });
  }
}
