import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { buildApiUrl } from '../api-url.util';
import { NotificationService } from './notification.service';

export type PerfilUsuario = 'ADMINISTRADOR' | 'USUARIO';

export interface UsuarioAutenticado {
  id: number;
  usuario: string;
  nome: string;
  perfil: PerfilUsuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'gestor-politico-auth';
  private readonly usuarioSubject = new BehaviorSubject<UsuarioAutenticado | null>(this.carregarUsuario());

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly notificationService: NotificationService
  ) {}

  get usuario$(): Observable<UsuarioAutenticado | null> {
    return this.usuarioSubject.asObservable();
  }

  get usuarioAtual(): UsuarioAutenticado | null {
    return this.usuarioSubject.value;
  }

  login(usuario: string, senha: string): Observable<UsuarioAutenticado> {
    return this.http
      .post<UsuarioAutenticado>(buildApiUrl('login'), { usuario, senha })
      .pipe(tap(resposta => this.definirUsuario(resposta)));
  }

  definirUsuario(usuario: UsuarioAutenticado | null): void {
    this.usuarioSubject.next(usuario);
    if (usuario) {
      localStorage.setItem(this.storageKey, JSON.stringify(usuario));
    } else {
      localStorage.removeItem(this.storageKey);
    }
  }

  atualizarUsuarioLocal(parcial: Partial<UsuarioAutenticado>): void {
    const atual = this.usuarioSubject.value;
    if (!atual) {
      return;
    }
    const atualizado: UsuarioAutenticado = { ...atual, ...parcial } as UsuarioAutenticado;
    this.definirUsuario(atualizado);
  }

  logout(): void {
    this.definirUsuario(null);
    this.router.navigate(['/login']);
  }

  estaAutenticado(): boolean {
    return !!this.usuarioSubject.value;
  }

  ehAdministrador(): boolean {
    return this.usuarioSubject.value?.perfil === 'ADMINISTRADOR';
  }

  private carregarUsuario(): UsuarioAutenticado | null {
    const armazenado = localStorage.getItem(this.storageKey);
    if (!armazenado) {
      return null;
    }
    try {
      const usuario = JSON.parse(armazenado) as UsuarioAutenticado;
      if (usuario && usuario.id && usuario.usuario && usuario.perfil) {
        return usuario;
      }
    } catch (erro) {
      this.notificationService.showError(
        'Erro ao restaurar sessão',
        'Não foi possível restaurar as informações do usuário autenticado.'
      );
    }
    localStorage.removeItem(this.storageKey);
    return null;
  }
}
