import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FamiliaMembroPayload {
  nomeCompleto: string;
  dataNascimento: string | null;
  profissao: string | null;
  parentesco: string;
  responsavelPrincipal: boolean;
  probabilidadeVoto: string;
  telefone: string | null;
}

export interface FamiliaPayload {
  endereco: string;
  bairro: string;
  telefone: string;
  membros: FamiliaMembroPayload[];
}

export interface FamiliaMembroResponse {
  id: number;
  nomeCompleto: string;
  dataNascimento: string | null;
  profissao: string | null;
  parentesco: string;
  responsavelPrincipal: boolean;
  probabilidadeVoto: string;
  telefone: string | null;
  criadoEm: string;
}

export interface FamiliaResponse {
  id: number;
  endereco: string;
  bairro: string;
  telefone: string;
  criadoEm: string;
  membros: FamiliaMembroResponse[];
}

@Injectable({ providedIn: 'root' })
export class FamiliasService {
  private readonly apiUrl = 'http://localhost:8080/api/familias';

  constructor(private readonly http: HttpClient) {}

  listarFamilias(): Observable<FamiliaResponse[]> {
    return this.http.get<FamiliaResponse[]>(this.apiUrl);
  }

  criarFamilia(payload: FamiliaPayload): Observable<FamiliaResponse> {
    return this.http.post<FamiliaResponse>(this.apiUrl, payload);
  }
}
