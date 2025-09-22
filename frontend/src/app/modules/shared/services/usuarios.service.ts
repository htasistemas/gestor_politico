import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../api-url.util';
import { PerfilUsuario } from './auth.service';

export interface UsuarioSistema {
  id: number;
  usuario: string;
  nome: string;
  perfil: PerfilUsuario;
}

export interface CriarUsuarioPayload {
  usuario: string;
  nome: string;
  senha: string;
  perfil: PerfilUsuario;
}

export interface AtualizarUsuarioPayload {
  usuario: string;
  nome: string;
  senha?: string | null;
  perfil?: PerfilUsuario | null;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  constructor(private readonly http: HttpClient) {}

  listar(): Observable<UsuarioSistema[]> {
    return this.http.get<UsuarioSistema[]>(buildApiUrl('usuarios'));
  }

  buscarPorId(id: number): Observable<UsuarioSistema> {
    return this.http.get<UsuarioSistema>(buildApiUrl(`usuarios/${id}`));
  }

  criar(payload: CriarUsuarioPayload): Observable<UsuarioSistema> {
    return this.http.post<UsuarioSistema>(buildApiUrl('usuarios'), payload);
  }

  atualizar(id: number, payload: AtualizarUsuarioPayload): Observable<UsuarioSistema> {
    return this.http.put<UsuarioSistema>(buildApiUrl(`usuarios/${id}`), payload);
  }

  remover(id: number): Observable<void> {
    return this.http.delete<void>(buildApiUrl(`usuarios/${id}`));
  }
}
