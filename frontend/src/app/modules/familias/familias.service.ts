import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { buildApiUrl } from '../shared/api-url.util';

export interface FamiliaMembroPayload {
  nomeCompleto: string;
  cpf: string;
  dataNascimento: string | null;
  profissao: string | null;
  parentesco: string;
  responsavelPrincipal: boolean;
  probabilidadeVoto: string;
  telefone: string | null;
}

export interface FamiliaPayload {
  cep: string | null;
  rua: string;
  numero: string;
  cidadeId: number;
  bairroId: number | null;
  novoBairro: string | null;
  novaRegiao: string | null;
  membros: FamiliaMembroPayload[];
}

export interface EnderecoFamiliaResponse {
  id: number;
  rua: string;
  numero: string;
  cep: string | null;
  bairro: string | null;
  regiao: string | null;
  cidade: string;
  uf: string;
  latitude: number | null;
  longitude: number | null;
}

export interface FamiliaMembroResponse {
  id: number;
  nomeCompleto: string;
  cpf: string;
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
  enderecoDetalhado: EnderecoFamiliaResponse;
  membros: FamiliaMembroResponse[];
}

@Injectable({ providedIn: 'root' })
export class FamiliasService {
  private readonly apiUrl = buildApiUrl('familias');

  constructor(private readonly http: HttpClient) {}

  listarFamilias(): Observable<FamiliaResponse[]> {
    return this.http.get<FamiliaResponse[]>(this.apiUrl);
  }

  criarFamilia(payload: FamiliaPayload): Observable<FamiliaResponse> {
    return this.http.post<FamiliaResponse>(this.apiUrl, payload);
  }
}
