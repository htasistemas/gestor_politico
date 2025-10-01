import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../api-url.util';

export interface Cidade {
  id: number;
  nome: string;
  uf: string;
}

export interface Bairro {
  id: number;
  nome: string;
  regiao: string | null;
}

export interface Regiao {
  id: number | null;
  nome: string;
  quantidadeBairros: number;
}

@Injectable({ providedIn: 'root' })
export class LocalidadesService {
  constructor(private readonly http: HttpClient) {}

  listarCidades(): Observable<Cidade[]> {
    return this.http.get<Cidade[]>(buildApiUrl('/cidades'));
  }

  criarCidade(payload: { nome: string; uf: string }): Observable<Cidade> {
    return this.http.post<Cidade>(buildApiUrl('/cidades'), payload);
  }

  listarBairros(cidadeId: number, regiao?: string | null): Observable<Bairro[]> {
    let params = new HttpParams();
    if (regiao) {
      params = params.set('regiao', regiao);
    }
    return this.http.get<Bairro[]>(buildApiUrl(`/cidades/${cidadeId}/bairros`), { params });
  }

  listarRegioes(cidadeId: number): Observable<Regiao[]> {
    return this.http.get<Regiao[]>(buildApiUrl(`/cidades/${cidadeId}/regioes`));
  }

  criarRegiao(cidadeId: number, nome: string): Observable<Regiao> {
    return this.http.post<Regiao>(buildApiUrl(`/cidades/${cidadeId}/regioes`), { nome });
  }

  atribuirRegiao(regiaoId: number, bairrosIds: number[]): Observable<void> {
    return this.http.put<void>(buildApiUrl(`/regioes/${regiaoId}/bairros`), { bairrosIds });
  }

  atualizarRegiaoBairros(payload: {
    bairrosIds: number[];
    regiaoId?: number | null;
    nomeRegiaoLivre?: string | null;
  }): Observable<void> {
    return this.http.put<void>(buildApiUrl('/bairros/regiao'), payload);
  }

  unificarBairros(payload: { bairroPrincipalId: number; bairrosDuplicadosIds: number[] }): Observable<void> {
    return this.http.post<void>(buildApiUrl('/bairros/unificar'), payload);
  }
}
